"""
JobSpy search configuration matrix.

Defines all search queries, platforms, and parameters for batch collection.
Phase 2.6 - Coverage Expansion.
"""

# All supported platforms (from JobSpy)
ALL_PLATFORMS = [
    "linkedin",
    "indeed", 
    "zip_recruiter",
    "glassdoor",
    "google",
    # Additional platforms (if supported by JobSpy)
    # "bayt",      # Middle East jobs
    # "naukri",    # India jobs
    # "bdjobs",    # Bangladesh jobs
]

# Primary platforms (proven stable)
PRIMARY_PLATFORMS = ["linkedin", "indeed", "zip_recruiter", "glassdoor"]

# Search query matrix
SEARCH_QUERIES = {
    # Software Engineering (all levels)
    "software_engineer": {
        "base_term": "Software Engineer",
        "variants": [
            "Software Engineer",
            "Software Developer",
            "Backend Engineer",
            "Frontend Engineer",
            "Full Stack Engineer",
            "Full Stack Developer",
        ],
        "levels": ["", "Senior ", "Junior ", "Staff ", "Principal "],
    },
    
    # New Grad specific
    "new_grad": {
        "base_term": "New Grad Software Engineer",
        "variants": [
            "New Grad Software Engineer",
            "Entry Level Software Engineer",
            "Graduate Software Engineer",
            "Junior Software Engineer",
            "Associate Software Engineer",
        ],
        "levels": None,  # Already level-specific
    },
    
    # Internships
    "internships": {
        "base_term": "Software Engineering Intern",
        "variants": [
            "Software Engineering Intern",
            "Software Developer Intern",
            "SWE Intern",
            "Engineering Intern",
            "Computer Science Intern",
        ],
        "levels": None,
    },
    
    # Data Science / ML / AI
    "data_science": {
        "base_term": "Data Scientist",
        "variants": [
            "Data Scientist",
            "Machine Learning Engineer",
            "ML Engineer",
            "AI Engineer",
            "Data Engineer",
            "Analytics Engineer",
        ],
        "levels": ["", "Senior ", "Junior ", "Staff "],
    },
    
    # Specialized roles
    "specialized": {
        "base_term": "Software Engineer",
        "variants": [
            "DevOps Engineer",
            "Site Reliability Engineer",
            "Security Engineer",
            "Mobile Engineer",
            "iOS Engineer",
            "Android Engineer",
            "Cloud Engineer",
            "Infrastructure Engineer",
        ],
        "levels": ["", "Senior "],
    },
}

# Location configurations
LOCATIONS = {
    "us_national": "United States",
    "remote_us": "Remote, United States",
    "major_cities": [
        "San Francisco, CA",
        "New York, NY",
        "Seattle, WA",
        "Austin, TX",
        "Boston, MA",
    ],
}

# Time windows for job freshness
TIME_WINDOWS = {
    "today": 24,        # Last 24 hours
    "recent": 72,       # Last 3 days
    "week": 168,        # Last 7 days
}

# Results per query
RESULTS_PER_QUERY = {
    "quick": 20,
    "standard": 50,
    "thorough": 100,
    "maximum": 200,
}


def generate_search_matrix(
    categories=None,
    platforms=None,
    location="us_national",
    time_window="recent",
    results_wanted="standard"
):
    """
    Generate search matrix for batch collection.
    
    Args:
        categories: List of categories to include (default: all)
        platforms: List of platforms (default: PRIMARY_PLATFORMS)
        location: Location key from LOCATIONS
        time_window: Time window key from TIME_WINDOWS
        results_wanted: Results level from RESULTS_PER_QUERY
    
    Returns:
        List of search job configs
    """
    if categories is None:
        categories = list(SEARCH_QUERIES.keys())
    
    if platforms is None:
        platforms = PRIMARY_PLATFORMS
    
    location_str = LOCATIONS.get(location, LOCATIONS["us_national"])
    hours = TIME_WINDOWS.get(time_window, TIME_WINDOWS["recent"])
    results = RESULTS_PER_QUERY.get(results_wanted, RESULTS_PER_QUERY["standard"])
    
    search_jobs = []
    
    for category in categories:
        query_config = SEARCH_QUERIES[category]
        variants = query_config["variants"]
        levels = query_config.get("levels")
        
        # Generate search terms
        search_terms = []
        if levels:
            for variant in variants:
                for level in levels:
                    search_terms.append(f"{level}{variant}".strip())
        else:
            search_terms = variants
        
        # Create job configs
        for term in search_terms:
            search_jobs.append({
                "search_term": term,
                "location": location_str,
                "sites": platforms,
                "hours_old": hours,
                "results_wanted": results,
                "category": category,
            })
    
    return search_jobs


# Preset configurations
PRESET_QUICK = {
    "categories": ["software_engineer", "new_grad"],
    "platforms": ["linkedin", "indeed"],
    "location": "us_national",
    "time_window": "today",
    "results_wanted": "quick",
}

PRESET_DAILY = {
    "categories": ["software_engineer", "new_grad", "internships"],
    "platforms": PRIMARY_PLATFORMS,
    "location": "us_national",
    "time_window": "today",
    "results_wanted": "standard",
}

PRESET_THOROUGH = {
    "categories": list(SEARCH_QUERIES.keys()),
    "platforms": PRIMARY_PLATFORMS,
    "location": "us_national",
    "time_window": "week",
    "results_wanted": "thorough",
}

