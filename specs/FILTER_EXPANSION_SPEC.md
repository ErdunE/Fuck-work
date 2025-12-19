# Filter Expansion Specification

**Objective:** Add comprehensive filters to Job Search API

**Principle:** Data layer should support ALL possible filters, even if frontend doesn't use them immediately.

---

## Current Filters (9)

Already implemented in `api/models.py`:
- min_score, max_score
- job_level
- employment_type
- work_mode
- visa_signal
- states, country
- min_salary, max_salary
- platforms
- posted_days_ago

---

## New Filters to Add (15)

### Category 1: Platform Features (from platform_metadata)

**1. easy_apply (Boolean)**
```python
easy_apply: Optional[bool] = Field(None, description="Filter for Easy Apply jobs only")
```
**Implementation:**
```python
if filters.easy_apply is not None:
    query = query.filter(
        Job.platform_metadata['easy_apply'].astext.cast(Boolean) == filters.easy_apply
    )
```

**2. actively_hiring (Boolean)**
```python
actively_hiring: Optional[bool] = Field(None, description="Filter for actively hiring jobs")
```
**Implementation:**
```python
if filters.actively_hiring is not None:
    query = query.filter(
        Job.platform_metadata['actively_hiring_tag'].astext.cast(Boolean) == filters.actively_hiring
    )
```

**3. max_applicants (Int) - Competition filter**
```python
max_applicants: Optional[int] = Field(None, ge=0, description="Max number of applicants (lower = less competition)")
```
**Implementation:**
```python
if filters.max_applicants is not None:
    query = query.filter(
        Job.platform_metadata['applicants_count'].astext.cast(Integer) <= filters.max_applicants
    )
```

**4. min_applicants (Int)**
```python
min_applicants: Optional[int] = Field(None, ge=0, description="Min number of applicants")
```

### Category 2: Experience Requirements (from derived_signals)

**5. min_experience_years (Int)**
```python
min_experience_years: Optional[int] = Field(None, ge=0, le=30, description="Minimum years of experience required")
```
**Implementation:**
```python
if filters.min_experience_years is not None:
    query = query.filter(
        Job.derived_signals['experience_years']['min'].astext.cast(Integer) >= filters.min_experience_years
    )
```

**6. max_experience_years (Int)**
```python
max_experience_years: Optional[int] = Field(None, ge=0, le=30, description="Maximum years of experience required")
```
**Use case:** Filter for entry-level jobs (max_experience_years <= 2)

### Category 3: Salary & Compensation

**7. has_salary_info (Boolean)**
```python
has_salary_info: Optional[bool] = Field(None, description="Filter for jobs that disclose salary")
```
**Implementation:**
```python
if filters.has_salary_info:
    query = query.filter(
        Job.platform_metadata['salary_min'].astext != 'null'
    )
elif filters.has_salary_info == False:
    query = query.filter(
        Job.platform_metadata['salary_min'].astext == 'null'
    )
```

**8. salary_interval (List[String])**
```python
salary_interval: Optional[List[str]] = Field(None, description="Salary intervals: yearly, monthly, hourly")
```
**Use case:** Prefer yearly salary jobs (more stable)

### Category 4: Computed/Derived Filters

**9. is_recent (Boolean) - Posted within 3 days**
```python
is_recent: Optional[bool] = Field(None, description="Posted within last 3 days")
```
**Implementation:**
```python
if filters.is_recent:
    from datetime import datetime, timedelta
    cutoff = datetime.utcnow() - timedelta(days=3)
    query = query.filter(Job.posted_date >= cutoff)
```

**10. competition_level (Enum)**
```python
competition_level: Optional[List[str]] = Field(None, description="Competition: low, medium, high")
```
**Logic:**
- low: applicants_count < 50
- medium: 50-200
- high: >200

**11. has_red_flags (Boolean)**
```python
has_red_flags: Optional[bool] = Field(None, description="Filter jobs with/without red flags")
```
**Implementation:**
```python
if filters.has_red_flags == False:
    # Only jobs with no red flags
    query = query.filter(
        or_(
            Job.red_flags == None,
            func.jsonb_array_length(Job.red_flags) == 0
        )
    )
```

**12. max_red_flags (Int)**
```python
max_red_flags: Optional[int] = Field(None, ge=0, description="Max number of red flags acceptable")
```
**Use case:** Only show jobs with ≤2 red flags

**13. min_positive_signals (Int)**
```python
min_positive_signals: Optional[int] = Field(None, ge=0, description="Min number of positive signals")
```

**14. confidence_level (List[String])**
```python
confidence_level: Optional[List[str]] = Field(None, description="Confidence: Low, Medium, High")
```
**Currently:** Stored in Job.confidence

**15. has_description (Boolean)**
```python
has_description: Optional[bool] = Field(None, description="Filter for jobs with full description")
```
**Implementation:**
```python
if filters.has_description:
    query = query.filter(func.length(Job.jd_text) > 100)
```

---

## Bonus: Advanced Filters (Future)

**16. exclude_companies (List[String])**
```python
exclude_companies: Optional[List[str]] = Field(None, description="Company blacklist")
```

**17. include_companies_only (List[String])**
```python
include_companies_only: Optional[List[str]] = Field(None, description="Company whitelist")
```

**18. keywords_in_description (List[String])**
```python
keywords_in_description: Optional[List[str]] = Field(None, description="Required keywords in JD")
```

**19. exclude_keywords (List[String])**
```python
exclude_keywords: Optional[List[str]] = Field(None, description="Blacklisted keywords")
```

---

## Implementation Plan

### Step 1: Update JobSearchFilters model
**File:** `apps/backend/api/models.py`

Add all 15 new filter fields to `JobSearchFilters` class.

### Step 2: Update JobService.search_jobs()
**File:** `apps/backend/api/services/job_service.py`

Add filter logic for each new field.

### Step 3: Test each filter
**File:** `apps/backend/test_filters.py` (create new)

Test each filter with sample queries.

---

## Estimated Effort

- **Step 1:** 10 minutes (add fields)
- **Step 2:** 30-40 minutes (implement each filter logic)
- **Step 3:** 20 minutes (testing)

**Total:** ~1 hour

---

## Priority Tiers

### Tier 1 (Must Have - 用户最需要):
- easy_apply ⭐⭐⭐
- max_applicants ⭐⭐⭐
- has_salary_info ⭐⭐
- is_recent ⭐⭐
- max_red_flags ⭐⭐

### Tier 2 (Should Have - 很有用):
- competition_level ⭐
- confidence_level ⭐
- min_experience_years ⭐
- max_experience_years ⭐

### Tier 3 (Nice to Have - 锦上添花):
- actively_hiring
- has_description
- min_positive_signals
- salary_interval

### Tier 4 (Future - 高级功能):
- exclude_companies
- include_companies_only
- keywords_in_description
- exclude_keywords

---

## Acceptance Criteria

**After implementation:**

1. ✅ All 15 new filters added to JobSearchFilters
2. ✅ All filters have SQL query logic
3. ✅ Test each filter returns expected results
4. ✅ API documentation updated (auto-generated by FastAPI)
5. ✅ No breaking changes to existing filters

**Test queries:**
```bash
# Test easy_apply
curl -X POST http://localhost:8000/jobs/search \
  -H "Content-Type: application/json" \
  -d '{"filters": {"easy_apply": true, "min_score": 70}, "limit": 5}'

# Test max_applicants
curl -X POST http://localhost:8000/jobs/search \
  -H "Content-Type: application/json" \
  -d '{"filters": {"max_applicants": 50, "min_score": 75}, "limit": 5}'

# Test is_recent
curl -X POST http://localhost:8000/jobs/search \
  -H "Content-Type: application/json" \
  -d '{"filters": {"is_recent": true, "min_score": 80}, "limit": 10}'
```

---

**END OF SPEC**
