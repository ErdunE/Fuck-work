"""
Data enrichment module for structured field derivation.
"""

from .job_enricher import JobEnricher
from .run_enrichment import run_job_enrichment

__all__ = ['JobEnricher', 'run_job_enrichment']

