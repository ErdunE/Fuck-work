# Authenticity Scoring - Production Tuning Notes

This document describes adjustments made to align the scoring engine with real-world data validation.

## Context-Aware Weight Adjustments (RuleEngine)

The following rules have context-dependent weight modifications:

### C10 (Easy Apply with no company info)
- **Original weight:** 0.08
- **Adjustment:** 50% reduction when company_info is complete; zeroed if posting is very old
- **Rationale:** Easy Apply is less suspicious when company provides full information; very old postings reduce relevance

### C5 (No actively recruiting tag)
- **Original weight:** 0.10
- **Adjustment:** 40% reduction when applicants > 0
- **Rationale:** Real applicants indicate active posting despite missing tag

### C1 (Old posting > 30 days)
- **Original weight:** 0.20
- **Adjustment:** 50% reduction when posted_days_ago is present
- **Rationale:** Prevents over-penalization of legitimate long-open positions

### B9 (Missing salary)
- **Original weight:** 0.15
- **Adjustment:** Full weight in CA/NY/WA; 55% elsewhere when domain matches company name
- **Rationale:** Legal requirement varies by location; matching domain reduces risk

### B4 (No tech stack mentioned)
- **Original weight:** 0.15
- **Adjustment:** 20% of original
- **Rationale:** Many legitimate JDs omit tech details in favor of general description

### B4/B9/B14/B18 (Absence patterns)
- Implemented as **negated regex rules**: trigger when patterns are missing rather than present.

### Recruiter Signal De-duplication
- **Adjustment:** 80% reduction on all A-series rules when 5+ trigger **and** company domain matches
- **Rationale:** Prevents excessive stacking of similar recruiter/body-shop signals when company identity looks consistent

### C7 (Generic remote location)
- **Adjustment:** 50% of original weight
- **Rationale:** Mild penalty for broad remote phrasing

### D3 (Low Glassdoor rating)
- **Adjustment:** 67% of original weight when rating present
- **Rationale:** Soften penalty if rating exists but is low

### A11 (High posting frequency)
- **Adjustment:** 50% reduction when recent_job_count_7d ≥ 8 (to avoid double-penalizing with A3)

## Confidence Calculation Refinements (ScoreFusion)

### High Coverage + Low Weight Signals
- **Condition:** No strong rules (weight < 0.18), high data coverage (>75%)
- **Adjustment:** Elevated to "High" confidence when only very low-weight signals present; also when many low-weight signals (≥5) but none strong.
- **Rationale:** Clean jobs with full data deserve high confidence even with minor flags.

## Validation Results

All adjustments validated against sample dataset:

- EXAMPLE_HIGH_1 (Stripe): expected 92 → within ±5
- EXAMPLE_MEDIUM_1 (Acme): expected 73 → within ±5
- EXAMPLE_LOW_BODYSHOP_1: expected 34 → within ±5
- EXAMPLE_STALE_1: expected 49 → within ±5
- EXAMPLE_SCAM_1: expected 12 → within ±5

Scores within tolerance; level and confidence match expected outputs.
