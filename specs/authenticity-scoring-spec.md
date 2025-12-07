# Authenticity Scoring Engine - Engineering Specification

**Version:** 1.0  
**Last Updated:** December 7, 2025  
**Status:** Ready for Implementation  
**Priority:** CRITICAL - Phase 1 Core Module

---

## Overview

The Authenticity Scoring Engine is the **primary differentiator** of JobBrain. It evaluates job postings to identify fake, low-intent, or body-shop positions before the user wastes time applying.

**Goal:** Filter out 70-80% of low-quality job postings while maintaining <5% false negative rate (blocking real jobs).

---

## Architecture

```
Job Data (from Extension)
         ↓
   RuleEngine.check()
         ↓
   [Activated Rules List]
         ↓
   ScoreFusion.calculate()
         ↓
   [Score: 0-100 + Confidence]
         ↓
   ExplanationEngine.generate()
         ↓
   [Human-readable output]
```

---

## 1. Data Contracts

### 1.1 Input: Job Data Structure

```typescript
interface JobData {
  // Core identifiers
  job_id: string;
  title: string;
  company_name: string;
  platform: 'LinkedIn' | 'Indeed' | 'Glassdoor' | 'Company Site' | 'Other';
  location: string;
  url: string;
  
  // Job description
  jd_text: string;  // Full text of job description
  
  // Poster information (from LinkedIn/Indeed profile)
  poster_info: {
    name: string;
    title: string;
    company: string;
    location: string;
    account_age_months: number | null;
    recent_job_count_7d: number | null;
  } | null;
  
  // Company metadata
  company_info: {
    website_domain: string | null;
    domain_matches_name: boolean;
    size_employees: number | null;
    glassdoor_rating: number | null;
    has_layoffs_recent: boolean;
  } | null;
  
  // Platform metadata
  platform_metadata: {
    posted_days_ago: number;
    repost_count: number;
    applicants_count: number | null;
    views_count: number | null;
    actively_hiring_tag: boolean;
    easy_apply: boolean;
  };
  
  // Derived signals (computed by extension)
  derived_signals: {
    company_domain_mismatch: boolean;
    poster_no_company: boolean;
    poster_job_location_mismatch: boolean;
    company_poster_mismatch: boolean;
    no_poster_identity: boolean;
  };
}
```

### 1.2 Output: Authenticity Result

```typescript
interface AuthenticityResult {
  // Core score
  authenticity_score: number;  // 0-100 (higher = more authentic)
  level: 'likely real' | 'uncertain' | 'likely fake';
  confidence: 'Low' | 'Medium' | 'High';
  
  // Explanation
  summary: string;
  red_flags: string[];  // Human-readable list
  positive_signals: string[];
  
  // Metadata
  activated_rules: Array<{
    id: string;
    weight: number;
    confidence: string;
  }>;
  
  // Timestamps
  computed_at: string;  // ISO 8601
}
```

---

## 2. Rule Engine Implementation

### 2.1 Rule Data Structure

Each rule is defined in `authenticity_rule_table.json`:

```typescript
interface Rule {
  id: string;  // e.g., "A1", "B5", "C3"
  name: string;
  description: string;
  signal: 'negative' | 'positive';
  weight: number;  // 0.0 - 1.0
  confidence: 'low' | 'medium' | 'high';
  pattern_type: 'regex' | 'string_contains' | 'string_contains_any' | 
                'string_equals_any' | 'numeric_threshold' | 
                'numeric_less_than' | 'boolean';
  pattern_value: string[] | string | number | boolean;
  data_source: string;  // Path to field in JobData
  examples: string[];
}
```

### 2.2 Rule Activation Logic

**File:** `rule_engine.py`

```python
from typing import List, Dict, Any
import re

class RuleEngine:
    def __init__(self, rule_table_path: str):
        """Load rules from JSON file"""
        with open(rule_table_path, 'r') as f:
            self.rules = json.load(f)['rules']
    
    def check(self, job_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Evaluate all rules against job data.
        
        Returns:
            List of activated rules with their metadata
        """
        activated_rules = []
        
        for rule in self.rules:
            if self._evaluate_rule(rule, job_data):
                activated_rules.append({
                    'id': rule['id'],
                    'weight': rule['weight'],
                    'confidence': rule['confidence'],
                    'signal': rule['signal'],
                    'description': rule['description']
                })
        
        return activated_rules
    
    def _evaluate_rule(self, rule: Dict, job_data: Dict) -> bool:
        """Evaluate a single rule against job data"""
        
        # Extract value from nested job_data using data_source path
        value = self._get_nested_value(job_data, rule['data_source'])
        
        if value is None:
            return False
        
        # Apply pattern matching based on pattern_type
        pattern_type = rule['pattern_type']
        pattern_value = rule['pattern_value']
        
        if pattern_type == 'regex':
            return self._match_regex(value, pattern_value)
        
        elif pattern_type == 'string_contains':
            return pattern_value.lower() in str(value).lower()
        
        elif pattern_type == 'string_contains_any':
            return any(p.lower() in str(value).lower() for p in pattern_value)
        
        elif pattern_type == 'string_equals_any':
            return str(value).lower() in [p.lower() for p in pattern_value]
        
        elif pattern_type == 'numeric_threshold':
            return float(value) > pattern_value
        
        elif pattern_type == 'numeric_less_than':
            return float(value) < pattern_value
        
        elif pattern_type == 'boolean':
            return bool(value) == pattern_value
        
        return False
    
    def _match_regex(self, text: str, patterns: List[str]) -> bool:
        """Check if any regex pattern matches"""
        for pattern in patterns:
            if re.search(pattern, str(text), re.IGNORECASE):
                return True
        return False
    
    def _get_nested_value(self, data: Dict, path: str) -> Any:
        """
        Extract value from nested dictionary using dot notation.
        
        Example: "poster_info.company" -> data['poster_info']['company']
        """
        keys = path.split('.')
        current = data
        
        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return None
        
        return current
```

### 2.3 Testing Rule Engine

**Test File:** `test_rule_engine.py`

```python
def test_rule_activation():
    """Test that rules activate correctly"""
    engine = RuleEngine('authenticity_rule_table.json')
    
    # Test case: External recruiter language
    job_data = {
        'jd_text': 'Our client is looking for a Software Engineer...',
        # ... other fields
    }
    
    activated = engine.check(job_data)
    
    # Assert rule A1 is activated
    assert any(r['id'] == 'A1' for r in activated)
    assert activated[0]['weight'] == 0.25
```

---

## 3. Score Fusion Algorithm

### 3.1 Mathematical Formula

**Core equation:**

```
authenticity_score = 100 × e^(-Σ(weight_i × penalty_factor))
```

Where:
- `weight_i` = weight of each activated negative rule
- `penalty_factor` = 1.8 (constant for dampening)
- `e` = Euler's number (2.71828...)

**Positive signal boost:**

```
gain = (1 + Σ positive_weights)^0.25
final_score = authenticity_score × gain
```

Max boost: 15%

### 3.2 Implementation

**File:** `score_fusion.py`

```python
import math
from typing import List, Dict

class ScoreFusion:
    PENALTY_FACTOR = 1.8
    MAX_GAIN = 1.15  # 15% max boost
    
    def calculate(self, activated_rules: List[Dict]) -> Dict:
        """
        Calculate authenticity score from activated rules.
        
        Args:
            activated_rules: List of activated rule dictionaries
            
        Returns:
            Dictionary with score, level, and confidence
        """
        # Separate negative and positive signals
        negative_rules = [r for r in activated_rules if r['signal'] == 'negative']
        positive_rules = [r for r in activated_rules if r['signal'] == 'positive']
        
        # Calculate base score from negative signals
        negative_sum = sum(r['weight'] for r in negative_rules)
        base_score = 100 * math.exp(-negative_sum * self.PENALTY_FACTOR)
        
        # Apply positive signal boost
        positive_sum = sum(r['weight'] for r in positive_rules)
        gain = min(self.MAX_GAIN, (1 + positive_sum) ** 0.25)
        
        final_score = base_score * gain
        
        # Clamp to 0-100
        final_score = max(0, min(100, final_score))
        
        # Determine level
        level = self._determine_level(final_score)
        
        # Calculate confidence
        confidence = self._calculate_confidence(activated_rules)
        
        return {
            'authenticity_score': round(final_score, 1),
            'level': level,
            'confidence': confidence,
            'negative_weight_sum': round(negative_sum, 2),
            'positive_weight_sum': round(positive_sum, 2)
        }
    
    def _determine_level(self, score: float) -> str:
        """Map score to categorical level"""
        if score >= 80:
            return 'likely real'
        elif score >= 55:
            return 'uncertain'
        else:
            return 'likely fake'
    
    def _calculate_confidence(self, activated_rules: List[Dict]) -> str:
        """
        Calculate confidence based on:
        1. Number of high-weight rules activated
        2. Data completeness (handled externally)
        """
        # Count strong rules (weight >= 0.18)
        strong_count = sum(1 for r in activated_rules if r['weight'] >= 0.18)
        
        # Simple confidence mapping
        if strong_count >= 3:
            return 'High'
        elif strong_count >= 1:
            return 'Medium'
        else:
            return 'Low'
```

### 3.3 Score Thresholds

```python
SCORE_THRESHOLDS = {
    'likely_real': 80,      # >= 80: High confidence real job
    'uncertain': 55,        # 55-79: Needs manual review
    'likely_fake': 0        # < 55: Skip this job
}
```

### 3.4 Testing Score Fusion

```python
def test_score_calculation():
    """Test score calculation with known weights"""
    fusion = ScoreFusion()
    
    # Test case: One strong negative signal
    activated = [
        {'id': 'A1', 'weight': 0.25, 'signal': 'negative', 'confidence': 'high'}
    ]
    
    result = fusion.calculate(activated)
    
    # Expected: 100 * e^(-0.25 * 1.8) ≈ 64.1
    assert 60 <= result['authenticity_score'] <= 68
    assert result['level'] == 'uncertain'
```

---

## 4. Confidence Calculation

### 4.1 Algorithm

```python
def calculate_confidence_with_coverage(
    activated_rules: List[Dict],
    job_data: Dict
) -> str:
    """
    Calculate confidence considering:
    1. Strong rule count
    2. Data coverage
    """
    # Count strong rules
    strong_count = sum(1 for r in activated_rules if r['weight'] >= 0.18)
    
    # Calculate data coverage
    required_fields = [
        'jd_text',
        'poster_info',
        'platform_metadata.posted_days_ago',
        'company_name'
    ]
    
    present_count = sum(
        1 for field in required_fields 
        if get_nested_value(job_data, field) is not None
    )
    
    coverage = present_count / len(required_fields)
    
    # Compute confidence score
    confidence_score = (0.5 * min(1.0, strong_count / 3)) + (0.5 * coverage)
    
    # Map to levels
    if confidence_score >= 0.66:
        return 'High'
    elif confidence_score >= 0.33:
        return 'Medium'
    else:
        return 'Low'
```

---

## 5. Explanation Generator

### 5.1 Output Format

```typescript
interface Explanation {
  summary: string;
  red_flags: string[];
  positive_signals: string[];
}
```

### 5.2 Implementation

**File:** `explanation_engine.py`

```python
class ExplanationEngine:
    def generate(
        self,
        authenticity_score: float,
        level: str,
        activated_rules: List[Dict]
    ) -> Dict:
        """Generate human-readable explanation"""
        
        # Generate summary
        summary = self._generate_summary(authenticity_score, level)
        
        # Extract red flags (negative signals)
        red_flags = self._extract_red_flags(activated_rules)
        
        # Extract positive signals
        positive_signals = self._extract_positive_signals(activated_rules)
        
        return {
            'summary': summary,
            'red_flags': red_flags,
            'positive_signals': positive_signals
        }
    
    def _generate_summary(self, score: float, level: str) -> str:
        """Generate summary sentence"""
        templates = {
            'likely real': f"High authenticity ({score:.0f}). No major red flags detected.",
            'uncertain': f"Uncertain authenticity ({score:.0f}). Some signals need manual review.",
            'likely fake': f"Low authenticity ({score:.0f}). Multiple high-weight red flags detected."
        }
        return templates.get(level, f"Authenticity score: {score:.0f}")
    
    def _extract_red_flags(self, activated_rules: List[Dict]) -> List[str]:
        """
        Convert activated negative rules to human-readable strings.
        Select top 5 by weight.
        """
        negative_rules = [
            r for r in activated_rules 
            if r['signal'] == 'negative'
        ]
        
        # Sort by weight descending
        negative_rules.sort(key=lambda r: r['weight'], reverse=True)
        
        # Take top 5
        top_rules = negative_rules[:5]
        
        # Convert to readable strings
        red_flags = [
            self._rule_to_readable(r) 
            for r in top_rules
        ]
        
        return red_flags
    
    def _extract_positive_signals(self, activated_rules: List[Dict]) -> List[str]:
        """Extract positive signals"""
        positive_rules = [
            r for r in activated_rules 
            if r['signal'] == 'positive'
        ]
        
        return [
            self._rule_to_readable(r) 
            for r in positive_rules
        ]
    
    def _rule_to_readable(self, rule: Dict) -> str:
        """Convert rule description to readable format"""
        # Use rule description as base
        # Could be enhanced with templates per rule
        return rule['description']
```

### 5.3 Template Examples

```python
EXPLANATION_TEMPLATES = {
    'A1': "Posted by external recruiter (uses 'our client' language)",
    'A2': "Posted by known staffing/outsourcing firm",
    'A3': "Poster is hiring for many roles simultaneously",
    'C1': "Job posted more than 30 days ago",
    'D1': "Company has recent layoffs",
    # ... templates for all 51 rules
}
```

---

## 6. Integration & API

### 6.1 Main API Function

```python
class AuthenticityScorer:
    """Main orchestrator for authenticity scoring"""
    
    def __init__(self, rule_table_path: str):
        self.rule_engine = RuleEngine(rule_table_path)
        self.score_fusion = ScoreFusion()
        self.explanation_engine = ExplanationEngine()
    
    def score_job(self, job_data: Dict) -> Dict:
        """
        Complete authenticity scoring pipeline.
        
        Args:
            job_data: Job data structure (see JobData interface)
            
        Returns:
            Complete AuthenticityResult
        """
        # Step 1: Activate rules
        activated_rules = self.rule_engine.check(job_data)
        
        # Step 2: Calculate score
        score_result = self.score_fusion.calculate(activated_rules)
        
        # Step 3: Generate explanation
        explanation = self.explanation_engine.generate(
            score_result['authenticity_score'],
            score_result['level'],
            activated_rules
        )
        
        # Step 4: Combine into final result
        return {
            'authenticity_score': score_result['authenticity_score'],
            'level': score_result['level'],
            'confidence': score_result['confidence'],
            'summary': explanation['summary'],
            'red_flags': explanation['red_flags'],
            'positive_signals': explanation['positive_signals'],
            'activated_rules': [
                {
                    'id': r['id'],
                    'weight': r['weight'],
                    'confidence': r['confidence']
                }
                for r in activated_rules
            ],
            'computed_at': datetime.utcnow().isoformat()
        }
```

### 6.2 Usage Example

```python
# Initialize scorer
scorer = AuthenticityScorer('authenticity_rule_table.json')

# Score a job
job_data = {
    'job_id': 'job_12345',
    'title': 'Software Engineer',
    'company_name': 'Stripe',
    'jd_text': '...',
    # ... other fields
}

result = scorer.score_job(job_data)

print(f"Score: {result['authenticity_score']}")
print(f"Level: {result['level']}")
print(f"Red Flags: {result['red_flags']}")
```

---

## 7. Testing & Validation

### 7.1 Unit Tests

**Required test coverage:**

1. **Rule Engine Tests**
   - Each pattern type activates correctly
   - Nested field extraction works
   - Null/missing values handled gracefully

2. **Score Fusion Tests**
   - Mathematical formula correct
   - Score boundaries respected (0-100)
   - Level thresholds correct

3. **Explanation Tests**
   - Red flags extracted correctly
   - Top 5 selection works
   - Readable strings generated

### 7.2 Integration Tests

Use `authenticity_sample_dataset.json` as test cases:

```python
def test_sample_dataset():
    """Test against known examples"""
    scorer = AuthenticityScorer('authenticity_rule_table.json')
    
    with open('authenticity_sample_dataset.json') as f:
        dataset = json.load(f)
    
    for job in dataset['jobs']:
        result = scorer.score_job(job)
        expected = job['expected_output']
        
        # Allow ±5 point tolerance on score
        assert abs(result['authenticity_score'] - expected['authenticity_score']) <= 5
        
        # Level should match
        assert result['level'] == expected['level']
        
        # Confidence should match
        assert result['confidence'] == expected['confidence']
```

### 7.3 Acceptance Criteria

✅ **MVP is complete when:**

1. All 51 rules are implemented and tested
2. Score fusion produces expected outputs (±5 points) on sample dataset
3. Explanation generator creates readable output
4. API processes a job in <5 seconds
5. Unit test coverage >80%
6. Integration tests pass for all 5 sample jobs

---

## 8. Performance Requirements

- **Latency:** < 5 seconds per job
- **Throughput:** Handle 100 jobs/minute (batch processing)
- **Memory:** < 500MB RAM usage
- **CPU:** Suitable for single-core processing

**Optimization notes:**
- Rules are evaluated sequentially (no parallelization needed for MVP)
- Embeddings/NLP not required (pure rule-based)
- No external API calls (local processing only)

---

## 9. Future Enhancements (Post-MVP)

### Phase 2 Additions:

1. **ML-based scoring**
   - Train classifier on labeled data
   - Complement rule-based scores

2. **Dynamic rule weights**
   - Learn from user feedback (thumbs up/down)
   - Adjust weights based on outcomes

3. **Company reputation database**
   - Maintain local DB of known good/bad companies
   - Auto-update from layoffs.fyi

4. **Embeddings for template detection**
   - Detect boilerplate JDs using semantic similarity
   - Flag copy-paste descriptions

5. **User feedback loop**
   - "Was this score accurate?" → adjust rules
   - Crowdsourced authenticity data

---

## 10. Dependencies

**Python Libraries:**

```
# requirements.txt
python>=3.9
fastapi>=0.104.0
pydantic>=2.0.0
```

**No external APIs required for MVP** (all local processing)

---

## 11. Error Handling

### 11.1 Missing Data

```python
# If critical fields are missing, return low confidence
if job_data.get('jd_text') is None:
    return {
        'authenticity_score': 50,
        'level': 'uncertain',
        'confidence': 'Low',
        'summary': 'Insufficient data to evaluate authenticity',
        'red_flags': ['Missing job description text'],
        'positive_signals': []
    }
```

### 11.2 Rule Evaluation Errors

```python
try:
    activated = self.rule_engine.check(job_data)
except Exception as e:
    logger.error(f"Rule evaluation failed: {e}")
    # Fail gracefully - return neutral score
    return default_neutral_result()
```

---

## 12. Logging & Debugging

```python
import logging

logger = logging.getLogger('authenticity_scorer')

# Log rule activations
logger.debug(f"Activated rules: {[r['id'] for r in activated_rules]}")

# Log score calculation
logger.info(f"Job {job_id}: Score={score}, Level={level}, Confidence={conf}")
```

---

## 13. File Structure

```
authenticity_scoring/
├── __init__.py
├── rule_engine.py           # Rule evaluation logic
├── score_fusion.py          # Score calculation
├── explanation_engine.py    # Explanation generation
├── scorer.py                # Main orchestrator
├── authenticity_rule_table.json  # Rule definitions
├── tests/
│   ├── test_rule_engine.py
│   ├── test_score_fusion.py
│   ├── test_explanation.py
│   └── test_integration.py
└── data/
    └── authenticity_sample_dataset.json
```

---

## 14. Implementation Checklist

### Phase 1 Tasks:

- [ ] Set up Python project structure
- [ ] Implement `RuleEngine` class
- [ ] Implement `ScoreFusion` class
- [ ] Implement `ExplanationEngine` class
- [ ] Create `AuthenticityScorer` orchestrator
- [ ] Write unit tests for each component
- [ ] Load `authenticity_rule_table.json`
- [ ] Run integration tests on sample dataset
- [ ] Validate score accuracy (±5 points)
- [ ] Document API usage
- [ ] Performance testing (<5 sec per job)

---

## END OF SPECIFICATION

**Status:** Ready for Cursor implementation  
**Next Step:** Begin coding `rule_engine.py`
