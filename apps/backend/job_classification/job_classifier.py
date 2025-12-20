"""
Hybrid job classifier: Rules + LLM fallback.

Strategy:
1. Try rule-based classification (fast, deterministic)
2. If rules fail or low confidence, use LLM (slower, smarter)

Uses deepseek-r1:7b via Ollama for local inference.
"""

import logging
from typing import Dict, List, Optional, Any
from .classification_rules import (
    find_category_by_keywords,
    find_industry_by_keywords,
    find_specialties_by_keywords,
    get_category_display_name,
    get_industry_display_name,
    get_specialty_display_names,
    validate_classification
)
from .classification_prompt import build_classification_prompt, parse_llm_classification
from ai_answer.ollama_client import call_ollama

logger = logging.getLogger(__name__)


class JobClassifier:
    """
    Hybrid job classifier with rules + LLM fallback.
    
    Usage:
        classifier = JobClassifier()
        result = classifier.classify(job_dict)
        
        # Result:
        {
            'category': 'software_backend',
            'category_display': 'Backend Engineering',
            'industry': 'fintech',
            'industry_display': 'Financial Technology',
            'specialties': ['python', 'aws', 'sql'],
            'specialty_displays': ['Python', 'Amazon Web Services', 'SQL & Databases'],
            'classification_method': 'rules',  # or 'llm'
            'confidence': 'high'
        }
    """
    
    def __init__(self, 
                 use_llm_fallback: bool = True,
                 llm_model: str = "deepseek-r1:7b",
                 llm_timeout: int = 30):
        """
        Initialize classifier.
        
        Args:
            use_llm_fallback: Use LLM when rules fail (default True)
            llm_model: Ollama model name
            llm_timeout: LLM request timeout in seconds
        """
        self.use_llm_fallback = use_llm_fallback
        self.llm_model = llm_model
        self.llm_timeout = llm_timeout
        
        logger.info(f"JobClassifier initialized (LLM fallback: {use_llm_fallback})")
    
    
    def classify(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """
        Classify a job using hybrid approach.
        
        Args:
            job: Job dict with title, company_name, description, etc.
            
        Returns:
            Classification result dict
        """
        # Extract fields
        title = job.get('title', '')
        company_name = job.get('company_name', '')
        description = job.get('jd_text', '')[:1000]  # First 1000 chars
        
        # From JobSpy fields
        company_info = job.get('company_info') or {}
        derived_signals = job.get('derived_signals') or {}
        
        company_industry = company_info.get('industry', '')
        job_function = derived_signals.get('job_function', '')
        skills = derived_signals.get('skills', [])
        
        # Step 1: Try rule-based classification
        logger.debug(f"Classifying job: {title[:50]}...")
        
        category = find_category_by_keywords(title, description, job_function)
        industry = find_industry_by_keywords(company_industry, company_name)
        specialties = find_specialties_by_keywords(title, description, skills)
        
        # Assess rule confidence
        confidence = self._assess_rule_confidence(
            category, industry, specialties, title, company_industry
        )
        
        classification_method = "rules"
        
        # Step 2: If low confidence and LLM enabled, use LLM
        if confidence == "low" and self.use_llm_fallback:
            logger.info(f"Low confidence from rules, trying LLM for: {title[:50]}")
            
            try:
                llm_result = self._classify_with_llm(
                    title=title,
                    company_name=company_name,
                    company_industry=company_industry,
                    job_function=job_function,
                    description_snippet=description[:500],
                    skills=skills if isinstance(skills, list) else []
                )
                
                if llm_result:
                    category = llm_result['category']
                    industry = llm_result['industry']
                    specialties = llm_result['specialties']
                    confidence = llm_result.get('confidence', 'medium')
                    classification_method = "llm"
                    logger.info(f"LLM classification successful: {category}")
                
            except Exception as e:
                logger.warning(f"LLM classification failed, using rules: {e}")
        
        # Build result
        result = {
            'category': category,
            'category_display': get_category_display_name(category),
            'industry': industry,
            'industry_display': get_industry_display_name(industry),
            'specialties': specialties,
            'specialty_displays': get_specialty_display_names(specialties),
            'classification_method': classification_method,
            'confidence': confidence
        }
        
        return result
    
    
    def _assess_rule_confidence(
        self,
        category: str,
        industry: str,
        specialties: List[str],
        title: str,
        company_industry: str
    ) -> str:
        """
        Assess confidence level of rule-based classification.
        
        Returns:
            'high', 'medium', or 'low'
        """
        # High confidence indicators
        high_confidence_keywords = [
            'backend', 'frontend', 'data scientist', 'ml engineer',
            'devops', 'product manager', 'ios', 'android'
        ]
        
        title_lower = title.lower()
        
        # High: Specific keywords in title
        if any(kw in title_lower for kw in high_confidence_keywords):
            return "high"
        
        # High: Rich company_industry + specific specialties
        if company_industry and len(specialties) >= 2:
            return "high"
        
        # Medium: Generic title but has specialties
        if len(specialties) >= 1 and category != "other":
            return "medium"
        
        # Low: Generic "Software Engineer" with no context
        if category == "software_general" and not specialties:
            return "low"
        
        return "medium"
    
    
    def _classify_with_llm(
        self,
        title: str,
        company_name: str,
        company_industry: str,
        job_function: str,
        description_snippet: str,
        skills: List[str]
    ) -> Optional[Dict[str, Any]]:
        """
        Use LLM to classify job (fallback method).
        
        Returns:
            Classification dict or None if LLM fails
        """
        try:
            # Build prompt
            prompt = build_classification_prompt(
                title=title,
                company_name=company_name,
                company_industry=company_industry,
                job_function=job_function,
                description_snippet=description_snippet,
                skills=skills
            )
            
            # Call LLM
            response = call_ollama(
                prompt=prompt,
                model=self.llm_model,
                temperature=0.1,  # Low temp for determinism
                timeout=self.llm_timeout
            )
            
            # Parse response
            result = parse_llm_classification(response)
            
            logger.info(f"LLM classified as: {result['category']} ({result['confidence']})")
            
            return result
            
        except Exception as e:
            logger.error(f"LLM classification failed: {e}")
            return None
    
    
    def batch_classify(self, jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Classify multiple jobs efficiently.
        
        Uses rules for all jobs first, then LLM only for low-confidence cases.
        
        Args:
            jobs: List of job dicts
            
        Returns:
            List of classification results
        """
        results = []
        llm_needed = []
        
        # First pass: Rules only
        for i, job in enumerate(jobs):
            result = self.classify(job)
            results.append(result)
            
            # Track low-confidence cases
            if result['confidence'] == 'low' and self.use_llm_fallback:
                llm_needed.append(i)
        
        # Second pass: LLM for low-confidence (if enabled)
        if llm_needed:
            logger.info(f"Re-classifying {len(llm_needed)} low-confidence jobs with LLM...")
            
            for idx in llm_needed:
                job = jobs[idx]
                
                try:
                    llm_result = self._classify_with_llm(
                        title=job.get('title', ''),
                        company_name=job.get('company_name', ''),
                        company_industry=job.get('company_info', {}).get('industry', ''),
                        job_function=job.get('derived_signals', {}).get('job_function', ''),
                        description_snippet=job.get('jd_text', '')[:500],
                        skills=job.get('derived_signals', {}).get('skills', [])
                    )
                    
                    if llm_result:
                        # Update with LLM result
                        results[idx].update({
                            'category': llm_result['category'],
                            'category_display': get_category_display_name(llm_result['category']),
                            'industry': llm_result['industry'],
                            'industry_display': get_industry_display_name(llm_result['industry']),
                            'specialties': llm_result['specialties'],
                            'specialty_displays': get_specialty_display_names(llm_result['specialties']),
                            'classification_method': 'llm',
                            'confidence': llm_result.get('confidence', 'medium')
                        })
                
                except Exception as e:
                    logger.warning(f"LLM failed for job {idx}, keeping rule-based result: {e}")
        
        return results


# ============================================================================
# INTEGRATION FUNCTIONS
# ============================================================================

def add_classification_to_job(job: Dict[str, Any], classifier: JobClassifier = None) -> Dict[str, Any]:
    """
    Add classification to job's derived_signals.
    
    Modifies job dict in-place by adding 'classification' to derived_signals.
    
    Args:
        job: Job dict (will be modified)
        classifier: JobClassifier instance (creates new if None)
        
    Returns:
        Modified job dict
        
    Example:
        >>> job = {...}
        >>> add_classification_to_job(job)
        >>> print(job['derived_signals']['classification'])
        {
            'category': 'software_backend',
            'category_display': 'Backend Engineering',
            'industry': 'fintech',
            ...
        }
    """
    if classifier is None:
        classifier = JobClassifier()
    
    # Classify
    classification = classifier.classify(job)
    
    # Add to derived_signals
    if 'derived_signals' not in job:
        job['derived_signals'] = {}
    
    job['derived_signals']['classification'] = classification
    
    return job


def classify_jobs_batch(jobs: List[Dict[str, Any]], use_llm: bool = True) -> List[Dict[str, Any]]:
    """
    Classify a batch of jobs and add to their derived_signals.
    
    Args:
        jobs: List of job dicts (will be modified in-place)
        use_llm: Enable LLM fallback for low-confidence cases
        
    Returns:
        Modified job list
        
    Example:
        >>> jobs = [job1, job2, job3]
        >>> classified_jobs = classify_jobs_batch(jobs)
        >>> # All jobs now have derived_signals.classification
    """
    classifier = JobClassifier(use_llm_fallback=use_llm)
    
    logger.info(f"Classifying {len(jobs)} jobs (LLM fallback: {use_llm})...")
    
    for job in jobs:
        add_classification_to_job(job, classifier)
    
    logger.info(f"✓ Classified {len(jobs)} jobs")
    
    return jobs


# ============================================================================
# DATABASE INTEGRATION
# ============================================================================

def classify_unclassified_jobs(db_session, batch_size: int = 100, use_llm: bool = True) -> Dict[str, int]:
    """
    Classify all jobs in database that don't have classification yet.
    
    Args:
        db_session: SQLAlchemy session
        batch_size: Process jobs in batches
        use_llm: Enable LLM fallback
        
    Returns:
        Stats dict with counts
    """
    from database.models import Job
    from sqlalchemy.orm.attributes import flag_modified
    
    classifier = JobClassifier(use_llm_fallback=use_llm)
    
    # Find unclassified jobs
    unclassified = db_session.query(Job).filter(
        ~Job.derived_signals.has_key('classification')
    ).all()
    
    total = len(unclassified)
    logger.info(f"Found {total} unclassified jobs")
    
    stats = {
        'total': total,
        'classified': 0,
        'rules': 0,
        'llm': 0,
        'errors': 0
    }
    
    # Process in batches
    for i in range(0, total, batch_size):
        batch = unclassified[i:i+batch_size]
        logger.info(f"Processing batch {i//batch_size + 1} ({len(batch)} jobs)...")
        
        for job in batch:
            try:
                job_dict = {
                    'title': job.title,
                    'company_name': job.company_name,
                    'jd_text': job.jd_text,
                    'company_info': job.company_info,
                    'derived_signals': job.derived_signals or {}
                }
                
                classification = classifier.classify(job_dict)
                
                # Add to derived_signals
                if not job.derived_signals:
                    job.derived_signals = {}
                
                job.derived_signals['classification'] = classification
                
                # Mark as modified (important for JSONB update)
                flag_modified(job, 'derived_signals')
                
                stats['classified'] += 1
                
                if classification['classification_method'] == 'rules':
                    stats['rules'] += 1
                else:
                    stats['llm'] += 1
                
            except Exception as e:
                logger.error(f"Failed to classify job {job.job_id}: {e}")
                stats['errors'] += 1
        
        # Commit batch
        db_session.commit()
        logger.info(f"Batch committed ({stats['classified']}/{total})")
    
    logger.info(f"✓ Classification complete: {stats['classified']} jobs")
    logger.info(f"  Rules: {stats['rules']}, LLM: {stats['llm']}, Errors: {stats['errors']}")
    
    return stats


# ============================================================================
# STANDALONE SCRIPT
# ============================================================================

if __name__ == "__main__":
    """
    Run classification on all unclassified jobs.
    
    Usage:
        python -m job_classification.job_classifier
        
        # Or without LLM (rules only, faster):
        python -m job_classification.job_classifier --no-llm
    """
    import sys
    from database import SessionLocal
    
    use_llm = '--no-llm' not in sys.argv
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    logger.info("=" * 70)
    logger.info("Job Classification Pipeline")
    logger.info("=" * 70)
    logger.info(f"LLM Fallback: {'Enabled' if use_llm else 'Disabled (rules only)'}")
    logger.info("=" * 70)
    
    db = SessionLocal()
    
    try:
        stats = classify_unclassified_jobs(db, batch_size=100, use_llm=use_llm)
        
        logger.info("=" * 70)
        logger.info("Classification Complete")
        logger.info("=" * 70)
        logger.info(f"Total: {stats['total']}")
        logger.info(f"Classified: {stats['classified']}")
        logger.info(f"  - By Rules: {stats['rules']}")
        logger.info(f"  - By LLM: {stats['llm']}")
        logger.info(f"Errors: {stats['errors']}")
        
    except Exception as e:
        logger.error(f"Classification pipeline failed: {e}")
        sys.exit(1)
    finally:
        db.close()
    
    sys.exit(0)
