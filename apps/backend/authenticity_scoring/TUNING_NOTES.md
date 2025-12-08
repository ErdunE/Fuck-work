# Authenticity Scoring - Production Tuning Notes

**Last Updated:** 2025-12-08  
**Phase:** 1 - Manual Validation & Rule Redesign  
**Version:** 1.1

---

## Overview

This document describes production tuning applied to the authenticity scoring engine based on automated testing, manual validation, and real-world job data alignment.

---

## Rule Redesigns (Not Weight Adjustments)

The following rules were completely rewritten during Phase 1 development.

### B18: Action Verb Check (Redesigned 2025-12-08)

**Original Implementation:**
- Pattern: `regex` matching literal word "responsibilit"
- Problem: Triggered false positives on FAANG jobs using phrases like "You'll work on building..."
- Impact: Google job scored 69.8 instead of 85-95

**Root Cause:**
Legitimate job descriptions often describe responsibilities without using the exact word "Responsibilities:". They use natural language like:
- "You will build and maintain..."
- "You'll work on designing systems..."
- "In this role, you'll collaborate..."

**New Implementation:**
- **Pattern Type:** `action_verb_check` (custom logic)
- **Logic:** Checks for 50+ action verbs (build, develop, work, design, implement, etc.) AND responsibility indicators ("you will", "your role", "in this role")
- **Triggers:** ONLY when BOTH are absent (truly generic JD with no work description)

**Action Verbs List:**
build, develop, create, design, implement, architect, construct, code, write, program, work, collaborate, partner, coordinate, contribute, participate, engage, join, support, lead, manage, direct, oversee, supervise, guide, mentor, coach, drive, own, improve, optimize, enhance, refine, streamline, scale, upgrade, modernize, analyze, solve, troubleshoot, debug, investigate, research, evaluate, assess, maintain, operate, monitor, ensure, deploy, run, execute, perform, communicate, document, present, report, share, explain, demonstrate

**Responsibility Indicators:**
"responsibilities", "you will", "you'll", "your role", "what you'll do", "day-to-day", "in this role"

**Validation:**
- ✓ FAANG-style JDs do not trigger (89.2 score, was 69.8)
- ✓ "You will..." phrasing does not trigger
- ✓ Generic template JDs DO trigger correctly
- ✓ Added 4 dedicated unit tests

---

### B20: Extreme Formatting Check (Redesigned 2025-12-08)

**Original Implementation:**
- Patterns: `\s{4,}` (4+ spaces), `\t{2,}` (2+ tabs), `•{2,}` (2+ bullets)
- Problem: Too sensitive - triggered on normal indentation and structured JDs
- Impact: Contributed to Google job false positive

**Root Cause:**
Many legitimate JDs use:
- 4-space indentation for bullet points (standard)
- Structured formatting from LinkedIn/Indeed (normal)
- Multiple newlines for section separation (expected)

These should NOT be flagged as "formatting artifacts." 

**New Implementation:**
- **Pattern Type:** `extreme_formatting_check` (custom logic)
- **Logic:** Counts 6 types of extreme formatting issues, triggers when suspect count ≥1

**Extreme Patterns Checked:**
1. 10+ consecutive spaces (not 4)
2. 5+ consecutive tabs (not 2)
3. 3+ consecutive bullet characters (•••)
4. 5+ consecutive newlines
5. Tab followed by 6+ spaces (mixed extreme whitespace)
6. 10+ consecutive separators (====, ----, ____)

**Trigger Threshold:** ≥1 extreme pattern (previously ≥2 in spec, tuned to ≥1 for better sensitivity while maintaining specificity)

**Validation:**
- ✓ Normal 4-space indentation does not trigger
- ✓ LinkedIn/Indeed copy-paste formatting does not trigger
- ✓ FAANG-style structured JDs do not trigger (89.2 score)
- ✓ Truly messy copy-paste artifacts DO trigger correctly
- ✓ Added 7 dedicated unit tests

---

## Context-Aware Weight Adjustments

The following rules have dynamic weight adjustments based on job context.

### C10 (Easy Apply with no company info)
- **Base weight:** 0.08
- **Adjustment:** 50% reduction when company_info is complete; 0% when company info complete AND job posted >60 days
- **Rationale:** Easy Apply is less suspicious when company provides full information; very old postings reduce relevance

### C5 (No actively recruiting tag)
- **Base weight:** 0.10
- **Adjustment:** 60% reduction when applicants_count > 0
- **Rationale:** Real applicants indicate active posting despite missing tag

### C1 (Old posting > 30 days)
- **Base weight:** 0.20
- **Adjustment:** 50% reduction across the board
- **Rationale:** Prevents over-penalization of legitimate long-open positions (senior roles, niche skills)

### B9 (Missing salary)
- **Base weight:** 0.15
- **Adjustments:**
  - 100% weight in CA/NY/WA (legal requirement)
  - 67% weight for large companies (10k+ employees) with matching domain
  - 55% weight for companies with matching domain
  - 33% weight for mid-size companies (1k+ employees) with matching domain
- **Rationale:** Salary transparency requirements vary by location; large established companies more likely to comply

### B4 (No tech stack mentioned)
- **Base weight:** 0.15
- **Adjustment:** 67% reduction (33% of original)
- **Rationale:** Many legitimate JDs omit technical details in favor of general description

### A11 (High posting frequency)
- **Base weight:** 0.10
- **Adjustment:** 50% reduction when recent_job_count_7d ≥ 8
- **Rationale:** Prevents double-counting with A3 (same signal, similar threshold)

### C7 (Generic remote location)
- **Base weight:** 0.12
- **Adjustment:** 50% reduction
- **Rationale:** "United States (Remote)" is common for legitimate remote roles

### D3 (Low Glassdoor rating)
- **Base weight:** 0.15
- **Adjustment:** 33% reduction (67% of original)
- **Rationale:** Some companies have controversial but legitimate hiring practices

### D1 (Recent layoffs)
- **Base weight:** 0.18
- **Adjustment:** 60% reduction (40% of original)
- **Rationale:** Companies may hire strategically even during layoffs (backfill, new roles)

---

## Recruiter Signal De-duplication

**Condition:** When 5+ A-series rules trigger AND company domain matches

**Adjustment:** 90% weight reduction (10% of original) on all A-series rules

**Rationale:**
- Prevents excessive penalty stacking from similar recruiter signals
- Domain matching suggests posting is less suspicious despite recruiter language
- Balanced approach: still penalizes recruiter patterns, but not excessively

**Affected Rules:** A1-A14 (all recruiter/poster signals)

---

## Confidence Calculation Refinements

### Special Case: High Coverage + Low Weights

**Condition:** No strong rules (weight <0.18), high data coverage (>75%), very low weights (max <0.05) or ≥5 weak rules (max <0.2)

**Adjustment:** Elevate to "High" confidence

**Rationale:**
- Clean jobs with full data deserve high confidence even with minor cosmetic flags
- Prevents underconfidence on legitimate postings with trivial issues

---

## Negated Regex Rules

Rules that trigger on **absence** of pattern (not presence):
- **B4** (no tech stack) - triggers when NO tech terms found
- **B9** (no salary) - triggers when NO salary information found
- **B14** (no team/product) - triggers when NO team/product/project mentioned
- **B18** (no action verbs) - triggers when NO action verbs or responsibility indicators found

**Implementation:** Checked in `_evaluate_rule()` via `negated_regex_rules` set.

---

## Validation Results

### Sample Dataset Validation (All 5 Jobs)
- ✅ EXAMPLE_HIGH_1 (Stripe): 92 (within ±5)
- ✅ EXAMPLE_MEDIUM_1 (Acme): 73 (within ±5)
- ✅ EXAMPLE_LOW_BODYSHOP_1: 34 (within ±5)
- ✅ EXAMPLE_STALE_1: 49 (within ±5)
- ✅ EXAMPLE_SCAM_1: 12 (within ±5)

All scores within ±5 tolerance, levels and confidence exact match.

### Manual Validation (FAANG Job)
- ✅ Google Cloud Infrastructure job: 89.2 (was 69.8 before fix)
- ✅ Level: "likely real" (was "uncertain")
- ✅ Confidence: High (was "Medium")
- ✅ Red flags: 0 (was 2: B18, B20)
- ✅ No false positives

### Test Suite
- **Total tests:** 51 (was 39)
- **Coverage:** >85%
- **All tests passing:** ✅

---

## Performance Metrics

- **Single job scoring:** <2 seconds average
- **Performance test:** <5 seconds (requirement met)
- **Memory usage:** <100MB
- **No performance degradation observed**

---

## Future Enhancements (Post-MVP)

### Considered but not yet implemented:

1. **Machine learning scoring**
   - Train classifier on labeled dataset
   - Complement rule-based scores

2. **Dynamic weight learning**
   - Adjust weights based on user feedback
   - Collective intelligence from multiple users

3. **Company reputation database**
   - Maintain local DB of known good/bad companies
   - Auto-update from layoffs.fyi and other sources

4. **Semantic template detection**
   - Use embeddings to detect boilerplate more accurately
   - Replace regex-based B3 rule

---

## Maintenance Guidelines

### Adding New Rules
1. Add to `authenticity_rule_table.json`
2. Follow existing schema (id, name, description, signal, weight, confidence, pattern_type, pattern_value, data_source)
3. Add corresponding unit test
4. Validate against sample dataset
5. Document in this file if context-aware

### Adjusting Weights
1. Modify in `_effective_weight()` method
2. Document rationale in this file
3. Re-run sample dataset validation
4. Ensure all tests still pass

### Debugging Scoring Issues
1. Check activated rules list
2. Examine weight adjustments applied
3. Verify confidence calculation
4. Review explanation output

---

**Version History:**
- v1.0 (2025-12-07): Initial tuning during integration testing
- v1.1 (2025-12-08): B18/B20 redesign, manual validation fixes

---

**Status:** ✅ Production-Ready  
**Next Phase:** Phase 2 - Browser Extension Integration
