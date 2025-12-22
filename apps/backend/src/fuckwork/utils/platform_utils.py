"""
Soft heuristics for platform capabilities.

These are NOT hard truths. They can change anytime without schema migration.
This module provides flexible, adjustable functions to determine what data
is expected from different job platforms.

Design Philosophy:
- Soft heuristics over hard-coded constants
- Easy to adjust without breaking schema
- No configuration files to maintain
"""


def poster_expected(platform: str, collection_method: str = "jobspy_batch") -> bool:
    """
    Soft expectation: Does this platform + method likely have poster info?

    This is a heuristic, not a constant.
    Can be adjusted anytime without breaking schema.

    LinkedIn typically shows who posted the job (recruiter, hiring manager, etc.)
    Most other platforms don't show poster information.

    Args:
        platform: LinkedIn, Indeed, Glassdoor, ZipRecruiter, etc.
        collection_method: jobspy_batch, extension_manual, api_direct

    Returns:
        bool: True if poster info is expected

    Examples:
        >>> poster_expected("LinkedIn", "jobspy_batch")
        True
        >>> poster_expected("Indeed", "jobspy_batch")
        False
        >>> poster_expected("LinkedIn", "extension_manual")
        True
    """
    platform = platform.lower()

    # LinkedIn usually has poster information
    if platform == "linkedin":
        # Extension/API more reliable than JobSpy batch scraping
        if collection_method in ["extension_manual", "api_direct"]:
            return True
        # JobSpy batch: depends on upstream library, assume True for now
        # Can be adjusted if JobSpy changes
        return True

    # Other platforms typically don't show poster
    # Indeed: No poster info
    # Glassdoor: No poster info
    # ZipRecruiter: No poster info
    # Google Jobs: Aggregator, no poster info
    return False


def company_info_expected(platform: str) -> bool:
    """
    Does this platform typically provide company information?

    Most job platforms have company info (name, website, size, etc.)
    except for aggregators and job boards that list raw postings.

    Args:
        platform: LinkedIn, Indeed, Glassdoor, ZipRecruiter, etc.

    Returns:
        bool: True if company info is expected

    Examples:
        >>> company_info_expected("LinkedIn")
        True
        >>> company_info_expected("Google")
        False
        >>> company_info_expected("GitHub")
        False
    """
    platform = platform.lower()

    # Google Jobs is an aggregator, often lacks detailed company info
    if platform == "google":
        return False

    # GitHub job lists may have minimal company info
    # (just markdown tables with company name and link)
    if platform == "github":
        return False

    # LinkedIn, Indeed, Glassdoor, ZipRecruiter all have company pages
    # with detailed information (website, size, industry, ratings, etc.)
    return True


def should_use_recruiter_rules(collection_meta: dict) -> bool:
    """
    Should A-series (recruiter) rules be applied?

    Only apply recruiter rules if:
    1. Poster is expected on this platform (e.g., LinkedIn)
    2. Poster data is actually present in the job record

    This prevents false positives on platforms like Indeed where
    poster information doesn't exist by design.

    Args:
        collection_meta: The collection_metadata dict from job
            Must contain: poster_expected, poster_present

    Returns:
        bool: True if recruiter rules should be used

    Examples:
        >>> # LinkedIn job with poster info
        >>> should_use_recruiter_rules({
        ...     "platform": "LinkedIn",
        ...     "collection_method": "jobspy_batch",
        ...     "poster_expected": True,
        ...     "poster_present": True
        ... })
        True

        >>> # Indeed job (no poster by design)
        >>> should_use_recruiter_rules({
        ...     "platform": "Indeed",
        ...     "collection_method": "jobspy_batch",
        ...     "poster_expected": False,
        ...     "poster_present": False
        ... })
        False

        >>> # LinkedIn job but extraction failed
        >>> should_use_recruiter_rules({
        ...     "platform": "LinkedIn",
        ...     "collection_method": "jobspy_batch",
        ...     "poster_expected": True,
        ...     "poster_present": False
        ... })
        False
    """
    poster_exp = collection_meta.get("poster_expected", False)
    poster_pres = collection_meta.get("poster_present", False)

    # Only use recruiter rules if BOTH expected AND present
    # This is a conservative approach to avoid false positives
    return poster_exp and poster_pres


def get_platform_display_name(platform: str) -> str:
    """
    Get standardized display name for platform.

    Normalizes platform names to consistent capitalization.

    Args:
        platform: Raw platform name (any case)

    Returns:
        str: Standardized display name

    Examples:
        >>> get_platform_display_name("linkedin")
        'LinkedIn'
        >>> get_platform_display_name("INDEED")
        'Indeed'
    """
    platform_lower = platform.lower()

    # Mapping for consistent capitalization
    mapping = {
        "linkedin": "LinkedIn",
        "indeed": "Indeed",
        "glassdoor": "Glassdoor",
        "ziprecruiter": "ZipRecruiter",
        "zip_recruiter": "ZipRecruiter",
        "google": "Google",
        "github": "GitHub",
        "wellfound": "Wellfound",
        "angellist": "Wellfound",  # Rebranded
        "ycombinator": "YC Jobs",
        "yc": "YC Jobs",
    }

    return mapping.get(platform_lower, platform.capitalize())
