# Authenticity Scoring Module - Acceptance Criteria

**Version:** 1.0  
**Last Updated:** December 7, 2025  
**Module:** Phase 1 - Core Authenticity Scoring Engine  
**Status:** Implementation Requirements

---

## Purpose

This document defines the **specific, measurable criteria** that must be met before the Authenticity Scoring module can be considered complete and ready for integration with the browser extension and desktop app.

---

## 1. Functional Requirements

### 1.1 Core API Must Work

**Requirement:** The `AuthenticityScorer.score_job()` function must accept a JobData structure and return a complete AuthenticityResult.

**Test:**
```python
scorer = AuthenticityScorer('authenticity_rule_table.json')
result = scorer.score_job(sample_job_data)

assert 'authenticity_score' in result
assert 'level' in result
assert 'confidence' in result
assert 'summary' in result
assert 'red_flags' in result
assert 'positive_signals' in result
```

**Success Criteria:**
- ✅ API accepts all fields in JobData interface
- ✅ API returns all fields in AuthenticityResult interface
- ✅ API handles missing/null fields gracefully (no crashes)
- ✅ API completes in <5 seconds for typical job

---

### 1.2 All 51 Rules Must Be Implemented

**Requirement:** Every rule defined in `authenticity_rule_table.json` must be correctly evaluated.

**Test:** For each rule, create a minimal test case that triggers only that rule.

**Success Criteria:**
- ✅ All 51 rules (A1-A14, B1-B20, C1-C10, D1-D7) have passing unit tests
- ✅ Each rule can be triggered independently
- ✅ Each rule correctly identifies its pattern
- ✅ Rule weights are applied correctly in scoring

**Example Test Structure:**
```python
def test_rule_A1_external_recruiter():
    """Test that A1 activates on 'our client' language"""
    job = create_minimal_job(jd_text="Our client is looking for...")
    activated = rule_engine.check(job)
    assert any(r['id'] == 'A1' for r in activated)
```

---

### 1.3 Score Calculation Must Be Accurate

**Requirement:** Score fusion algorithm must produce expected results within ±5 points.

**Test:** Run all 5 samples from `authenticity_sample_dataset.json`

**Success Criteria:**

| Job ID | Expected Score | Level | Confidence | Actual Must Be |
|--------|---------------|-------|------------|----------------|
| EXAMPLE_HIGH_1 | 92 | likely real | High | 87-97, correct level & confidence |
| EXAMPLE_MEDIUM_1 | 73 | uncertain | Medium | 68-78, correct level & confidence |
| EXAMPLE_LOW_BODYSHOP_1 | 34 | likely fake | High | 29-39, correct level & confidence |
| EXAMPLE_STALE_1 | 49 | likely fake | High | 44-54, correct level & confidence |
| EXAMPLE_SCAM_1 | 12 | likely fake | High | 7-17, correct level & confidence |

**Validation:**
```python
def test_sample_dataset():
    scorer = AuthenticityScorer('authenticity_rule_table.json')
    
    for job in load_sample_dataset():
        result = scorer.score_job(job)
        expected = job['expected_output']
        
        # Score within tolerance
        assert abs(result['authenticity_score'] - expected['authenticity_score']) <= 5
        
        # Level matches
        assert result['level'] == expected['level']
        
        # Confidence matches
        assert result['confidence'] == expected['confidence']
```

---

### 1.4 Explanations Must Be Readable

**Requirement:** Generated explanations must be human-readable and contain relevant red flags.

**Test:**
```python
result = scorer.score_job(low_quality_job)

# Summary exists and is formatted correctly
assert len(result['summary']) > 20
assert result['authenticity_score'] in result['summary']

# Red flags are present and make sense
assert len(result['red_flags']) > 0
assert len(result['red_flags']) <= 5  # Top 5 only

# Each red flag is a readable string
for flag in result['red_flags']:
    assert isinstance(flag, str)
    assert len(flag) > 10  # Not just codes
```

**Success Criteria:**
- ✅ Summary sentence includes score and level
- ✅ Red flags list contains 1-5 items (sorted by weight)
- ✅ Each red flag is a complete, readable sentence
- ✅ Positive signals are listed when present
- ✅ No technical jargon (rule IDs, internal codes) in user-facing text

---

### 1.5 Edge Cases Must Be Handled

**Requirement:** System must handle incomplete or malformed data gracefully.

**Test Cases:**

1. **Missing JD text**
   ```python
   job = {'company_name': 'Test', 'jd_text': None}
   result = scorer.score_job(job)
   assert result['confidence'] == 'Low'
   assert 'Insufficient data' in result['summary']
   ```

2. **All optional fields null**
   ```python
   job = minimal_job_with_only_required_fields()
   result = scorer.score_job(job)
   # Should not crash
   assert 'authenticity_score' in result
   ```

3. **Extreme values**
   ```python
   job = create_job(posted_days_ago=9999)
   result = scorer.score_job(job)
   assert 0 <= result['authenticity_score'] <= 100
   ```

**Success Criteria:**
- ✅ No crashes on null/missing fields
- ✅ Returns low confidence when data is sparse
- ✅ Score always stays within 0-100 range
- ✅ Handles unexpected string formats (unicode, emoji, etc.)
- ✅ Returns meaningful error message (not stack trace) if critical data missing

---

## 2. Performance Requirements

### 2.1 Latency

**Requirement:** Score calculation must complete quickly for real-time use.

**Test:**
```python
import time

start = time.time()
result = scorer.score_job(typical_job)
elapsed = time.time() - start

assert elapsed < 5.0  # seconds
```

**Success Criteria:**
- ✅ Single job scores in <5 seconds (99th percentile)
- ✅ Single job scores in <2 seconds (median)
- ✅ No memory leaks over 1000 consecutive jobs

---

### 2.2 Throughput

**Requirement:** System can handle batch processing for daily job queue.

**Test:**
```python
jobs = [create_random_job() for _ in range(100)]

start = time.time()
results = [scorer.score_job(job) for job in jobs]
elapsed = time.time() - start

throughput = len(jobs) / elapsed
assert throughput >= 20  # jobs per second
```

**Success Criteria:**
- ✅ Process 100 jobs in <5 seconds
- ✅ Throughput ≥20 jobs/second
- ✅ Memory usage stays <500MB for 100-job batch

---

## 3. Code Quality Requirements

### 3.1 Test Coverage

**Requirement:** Comprehensive test coverage across all components.

**Metrics:**
- Line coverage: ≥80%
- Branch coverage: ≥75%
- All public functions have tests

**Success Criteria:**
- ✅ `rule_engine.py`: ≥85% coverage
- ✅ `score_fusion.py`: ≥90% coverage
- ✅ `explanation_engine.py`: ≥80% coverage
- ✅ `scorer.py`: ≥85% coverage
- ✅ All 51 rules have dedicated tests
- ✅ Integration tests pass for all sample jobs

---

### 3.2 Code Structure

**Requirement:** Code is maintainable and follows best practices.

**Checklist:**
- ✅ Type hints on all public functions
- ✅ Docstrings on all classes and public methods
- ✅ No hardcoded magic numbers (use constants)
- ✅ Error handling with try/except where appropriate
- ✅ Logging statements at key decision points
- ✅ No code duplication (DRY principle)

**Example:**
```python
# Good
def calculate_score(activated_rules: List[Dict]) -> float:
    """
    Calculate authenticity score from activated rules.
    
    Args:
        activated_rules: List of activated rule dictionaries
        
    Returns:
        Score between 0 and 100
        
    Raises:
        ValueError: If activated_rules is empty or malformed
    """
    if not activated_rules:
        logger.warning("No rules activated, returning neutral score")
        return NEUTRAL_SCORE
    
    # ...
```

---

### 3.3 Documentation

**Requirement:** Code must be documented for future developers.

**Deliverables:**
- ✅ README.md with setup instructions
- ✅ API documentation (function signatures + examples)
- ✅ Comments explaining complex logic (especially score fusion math)
- ✅ Example usage in `/examples` folder
- ✅ Troubleshooting guide for common issues

---

## 4. Integration Requirements

### 4.1 File Locations

**Requirement:** Files must be in correct locations for desktop app integration.

**Structure:**
```
authenticity_scoring/
├── __init__.py               ✅ Exports main API
├── rule_engine.py            ✅ Implemented
├── score_fusion.py           ✅ Implemented
├── explanation_engine.py     ✅ Implemented
├── scorer.py                 ✅ Main orchestrator
├── authenticity_rule_table.json  ✅ 51 rules defined
├── tests/
│   ├── test_rule_engine.py   ✅ All rules tested
│   ├── test_score_fusion.py  ✅ Math validated
│   ├── test_explanation.py   ✅ Output validated
│   └── test_integration.py   ✅ End-to-end tests
└── data/
    └── authenticity_sample_dataset.json  ✅ Test data
```

---

### 4.2 API Contract

**Requirement:** API must match the interface expected by desktop app.

**Input Contract:**
```typescript
interface JobData {
  job_id: string;
  title: string;
  company_name: string;
  platform: string;
  location: string;
  url: string;
  jd_text: string;
  poster_info: {...} | null;
  company_info: {...} | null;
  platform_metadata: {...};
  derived_signals: {...};
}
```

**Output Contract:**
```typescript
interface AuthenticityResult {
  authenticity_score: number;
  level: 'likely real' | 'uncertain' | 'likely fake';
  confidence: 'Low' | 'Medium' | 'High';
  summary: string;
  red_flags: string[];
  positive_signals: string[];
  activated_rules: Array<{id: string; weight: number; confidence: string}>;
  computed_at: string;
}
```

**Success Criteria:**
- ✅ Input/output schemas match exactly
- ✅ JSON serialization works (no datetime/numpy issues)
- ✅ Desktop app can import and call the module
- ✅ FastAPI endpoint wraps the scorer correctly

---

## 5. User Acceptance

### 5.1 Manual Testing

**Requirement:** Real-world testing with actual job postings.

**Test Plan:**
1. Collect 20 real job postings (10 good, 10 suspicious)
2. Score each manually (human judgment)
3. Compare with system scores
4. Calculate agreement rate

**Success Criteria:**
- ✅ Agreement rate ≥75% (system matches human judgment)
- ✅ False positive rate <10% (real jobs marked fake)
- ✅ False negative rate <15% (fake jobs marked real)
- ✅ Users can understand explanations without technical knowledge

---

### 5.2 Feedback Loop

**Requirement:** System supports iterative improvement.

**Features:**
- ✅ Logging infrastructure captures all scoring decisions
- ✅ Easy to add new rules to JSON file
- ✅ Easy to adjust rule weights
- ✅ Test suite automatically validates changes

---

## 6. Deployment Readiness

### 6.1 Packaging

**Requirement:** Module can be installed and imported.

**Checklist:**
- ✅ `requirements.txt` lists all dependencies
- ✅ `setup.py` or `pyproject.toml` configured
- ✅ Module can be pip-installed locally
- ✅ No hardcoded file paths (use relative paths)
- ✅ Works on macOS (target platform)

**Test:**
```bash
pip install -e .
python -c "from authenticity_scoring import AuthenticityScorer; print('Success')"
```

---

### 6.2 Error Messages

**Requirement:** All errors are user-friendly.

**Examples:**

❌ **Bad:**
```
KeyError: 'jd_text'
```

✅ **Good:**
```
AuthenticityError: Missing required field 'jd_text'. Job description text is required for scoring.
```

**Success Criteria:**
- ✅ No raw Python tracebacks exposed to user
- ✅ Error messages explain what went wrong
- ✅ Error messages suggest how to fix the issue
- ✅ Errors are logged for debugging

---

## 7. Final Acceptance

### MVP Is Complete When:

#### All Tests Pass
- ✅ 51 rule unit tests pass
- ✅ Score fusion tests pass (±5 tolerance)
- ✅ Integration tests pass for all 5 sample jobs
- ✅ Edge case tests pass
- ✅ Performance tests meet latency/throughput requirements

#### Code Quality
- ✅ Test coverage ≥80%
- ✅ No linter warnings
- ✅ Type hints on all public APIs
- ✅ Documentation complete

#### Integration
- ✅ Desktop app can import module
- ✅ API contract matches specification
- ✅ No hardcoded paths or dependencies on specific environments

#### User Validation
- ✅ Manual testing shows ≥75% agreement with human judgment
- ✅ Explanations are readable by non-technical users
- ✅ False positive rate <10%

---

## 8. Success Metrics (Post-Launch)

### Week 1 Metrics
- System processes ≥100 jobs without errors
- User reports <5% scoring disagreements
- No crashes or data loss

### Month 1 Metrics
- Processes ≥1000 jobs successfully
- User saves ≥30 hours (vs. manual evaluation)
- Identifies ≥70% of fake jobs correctly

---

## 9. Known Limitations (Acceptable for MVP)

The following are **NOT** required for Phase 1 acceptance:

- ❌ Machine learning-based scoring (pure rules only)
- ❌ Dynamic weight adjustment based on feedback
- ❌ Company reputation database (beyond Glassdoor)
- ❌ Real-time layoffs.fyi integration (manual updates OK)
- ❌ Multi-language support (English only)
- ❌ Advanced NLP for template detection (regex sufficient)

These can be added in Phase 2+.

---

## 10. Sign-Off Checklist

Before marking Phase 1 complete, verify:

- [ ] All functional requirements met
- [ ] All performance requirements met
- [ ] All code quality requirements met
- [ ] All integration requirements met
- [ ] Manual testing completed with ≥75% agreement
- [ ] Documentation reviewed and approved
- [ ] No critical bugs remaining
- [ ] Desktop app integration tested end-to-end
- [ ] Code reviewed by at least one other person (if applicable)
- [ ] Ready for extension integration (Phase 2)

---

## 11. Post-Completion Deliverables

After acceptance, deliver:

1. **Source code** in `/authenticity_scoring` folder
2. **Test suite** with all tests passing
3. **Documentation**:
   - API reference
   - Setup guide
   - Troubleshooting guide
4. **Sample data** and test results
5. **Performance benchmark** report
6. **Manual testing** results and agreement metrics

---

**Approved By:** [Developer Name]  
**Date:** [Completion Date]  
**Status:** [ ] In Progress / [ ] Complete / [ ] Blocked

---

## END OF ACCEPTANCE CRITERIA

**Next Module:** Phase 2 - Browser Extension Data Capture
