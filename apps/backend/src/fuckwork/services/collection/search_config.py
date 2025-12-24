"""
JobSpy search configuration matrix.

Defines all search queries, platforms, and parameters for batch collection.
Phase 2.6 - Coverage Expansion.

EXPANDED: Now covers 22 industries with 200+ search terms.
"""

# All supported platforms (from JobSpy)
ALL_PLATFORMS = [
    "linkedin",
    "indeed",
    "zip_recruiter",
    "glassdoor",
    "google",
]

# Primary platforms (proven stable)
PRIMARY_PLATFORMS = ["linkedin", "indeed", "zip_recruiter", "glassdoor"]

# Search query matrix - EXPANDED VERSION
SEARCH_QUERIES = {
    # ==================== TECHNOLOGY & SOFTWARE ====================
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
    # Specialized tech roles
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
    # ==================== FINANCE & BANKING ====================
    "finance": {
        "base_term": "Financial Analyst",
        "variants": [
            "Financial Analyst",
            "Investment Banking Analyst",
            "Accountant",
            "Financial Advisor",
            "Risk Analyst",
            "Compliance Officer",
            "Treasury Analyst",
            "Credit Analyst",
        ],
        "levels": ["", "Senior ", "Junior "],
    },
    # ==================== HEALTHCARE & MEDICAL ====================
    "healthcare": {
        "base_term": "Registered Nurse",
        "variants": [
            "Registered Nurse",
            "Medical Assistant",
            "Physician Assistant",
            "Clinical Research Coordinator",
            "Healthcare Administrator",
            "Pharmacist",
            "Physical Therapist",
            "Medical Technician",
        ],
        "levels": ["", "Senior ", "Lead "],
    },
    # ==================== EDUCATION ====================
    "education": {
        "base_term": "Teacher",
        "variants": [
            "Teacher",
            "Professor",
            "Instructor",
            "Tutor",
            "Academic Advisor",
            "Curriculum Developer",
            "Education Coordinator",
            "Training Specialist",
        ],
        "levels": None,  # Education uses different hierarchy
    },
    # ==================== MARKETING & ADVERTISING ====================
    "marketing": {
        "base_term": "Marketing Manager",
        "variants": [
            "Marketing Manager",
            "Digital Marketing Specialist",
            "SEO Specialist",
            "Content Marketing Manager",
            "Social Media Manager",
            "Brand Manager",
            "Marketing Coordinator",
            "Growth Marketing Manager",
        ],
        "levels": ["", "Senior ", "Junior "],
    },
    # ==================== SALES & BUSINESS DEVELOPMENT ====================
    "sales": {
        "base_term": "Sales Representative",
        "variants": [
            "Sales Representative",
            "Account Executive",
            "Business Development Manager",
            "Sales Manager",
            "Account Manager",
            "Inside Sales Representative",
            "Sales Engineer",
            "Territory Manager",
        ],
        "levels": ["", "Senior ", "Junior "],
    },
    # ==================== OPERATIONS & SUPPLY CHAIN ====================
    "operations": {
        "base_term": "Operations Manager",
        "variants": [
            "Operations Manager",
            "Supply Chain Analyst",
            "Logistics Coordinator",
            "Operations Coordinator",
            "Supply Chain Manager",
            "Warehouse Manager",
            "Process Improvement Specialist",
            "Inventory Manager",
        ],
        "levels": ["", "Senior ", "Junior "],
    },
    # ==================== HUMAN RESOURCES ====================
    "hr": {
        "base_term": "HR Manager",
        "variants": [
            "HR Manager",
            "Recruiter",
            "Talent Acquisition Specialist",
            "HR Coordinator",
            "HR Business Partner",
            "Compensation Analyst",
            "Training and Development Manager",
            "Employee Relations Specialist",
        ],
        "levels": ["", "Senior ", "Junior "],
    },
    # ==================== LEGAL ====================
    "legal": {
        "base_term": "Lawyer",
        "variants": [
            "Attorney",
            "Lawyer",
            "Paralegal",
            "Legal Assistant",
            "Legal Counsel",
            "Contract Manager",
            "Compliance Manager",
            "Legal Secretary",
        ],
        "levels": ["", "Senior ", "Associate "],
    },
    # ==================== DESIGN & CREATIVE ====================
    "design": {
        "base_term": "Graphic Designer",
        "variants": [
            "Graphic Designer",
            "UX Designer",
            "UI Designer",
            "Product Designer",
            "Visual Designer",
            "Web Designer",
            "Motion Designer",
            "Brand Designer",
        ],
        "levels": ["", "Senior ", "Junior "],
    },
    # ==================== PRODUCT MANAGEMENT ====================
    "product": {
        "base_term": "Product Manager",
        "variants": [
            "Product Manager",
            "Product Owner",
            "Technical Product Manager",
            "Associate Product Manager",
            "Product Marketing Manager",
            "Product Analyst",
            "Group Product Manager",
            "Product Operations Manager",
        ],
        "levels": ["", "Senior ", "Junior "],
    },
    # ==================== MANUFACTURING & ENGINEERING ====================
    "manufacturing": {
        "base_term": "Manufacturing Engineer",
        "variants": [
            "Manufacturing Engineer",
            "Production Manager",
            "Quality Engineer",
            "Process Engineer",
            "Industrial Engineer",
            "Mechanical Engineer",
            "Electrical Engineer",
            "Production Supervisor",
        ],
        "levels": ["", "Senior ", "Junior "],
    },
    # ==================== RETAIL & E-COMMERCE ====================
    "retail": {
        "base_term": "Store Manager",
        "variants": [
            "Store Manager",
            "Retail Manager",
            "Assistant Store Manager",
            "Retail Sales Associate",
            "Merchandiser",
            "Visual Merchandiser",
            "Retail Buyer",
            "E-commerce Manager",
        ],
        "levels": ["", "Senior ", "Assistant "],
    },
    # ==================== CUSTOMER SERVICE & SUPPORT ====================
    "customer_service": {
        "base_term": "Customer Service Representative",
        "variants": [
            "Customer Service Representative",
            "Customer Support Specialist",
            "Customer Success Manager",
            "Technical Support Specialist",
            "Call Center Representative",
            "Client Services Coordinator",
            "Support Engineer",
            "Customer Experience Manager",
        ],
        "levels": ["", "Senior ", "Lead "],
    },
    # ==================== RESEARCH & SCIENCE ====================
    "research": {
        "base_term": "Research Scientist",
        "variants": [
            "Research Scientist",
            "Research Associate",
            "Lab Technician",
            "Clinical Research Coordinator",
            "Research Analyst",
            "Scientist",
            "Research Engineer",
            "Postdoctoral Researcher",
        ],
        "levels": ["", "Senior ", "Principal "],
    },
    # ==================== CONSULTING ====================
    "consulting": {
        "base_term": "Management Consultant",
        "variants": [
            "Management Consultant",
            "Strategy Consultant",
            "Business Analyst",
            "IT Consultant",
            "Financial Consultant",
            "Operations Consultant",
            "Technology Consultant",
            "Senior Consultant",
        ],
        "levels": ["", "Senior ", "Associate "],
    },
    # ==================== CONSTRUCTION & REAL ESTATE ====================
    "construction": {
        "base_term": "Project Manager",
        "variants": [
            "Construction Project Manager",
            "Civil Engineer",
            "Construction Manager",
            "Site Manager",
            "Estimator",
            "Architect",
            "Structural Engineer",
            "Safety Manager",
        ],
        "levels": ["", "Senior ", "Junior "],
    },
    # ==================== HOSPITALITY & TRAVEL ====================
    "hospitality": {
        "base_term": "Hotel Manager",
        "variants": [
            "Hotel Manager",
            "Restaurant Manager",
            "Event Coordinator",
            "Front Desk Manager",
            "Food and Beverage Manager",
            "Catering Manager",
            "Travel Coordinator",
            "Guest Services Manager",
        ],
        "levels": ["", "Senior ", "Assistant "],
    },
    # ==================== MEDIA & ENTERTAINMENT ====================
    "media": {
        "base_term": "Content Producer",
        "variants": [
            "Content Producer",
            "Video Editor",
            "Journalist",
            "Social Media Coordinator",
            "Copywriter",
            "Communications Specialist",
            "Public Relations Specialist",
            "Media Buyer",
        ],
        "levels": ["", "Senior ", "Junior "],
    },
    # ==================== GOVERNMENT & PUBLIC SECTOR ====================
    "government": {
        "base_term": "Program Manager",
        "variants": [
            "Program Manager",
            "Policy Analyst",
            "Government Relations Specialist",
            "Public Administrator",
            "Grant Writer",
            "Community Outreach Coordinator",
            "Legislative Assistant",
            "Program Coordinator",
        ],
        "levels": ["", "Senior ", "Associate "],
    },
    # ==================== NON-PROFIT ====================
    "nonprofit": {
        "base_term": "Program Director",
        "variants": [
            "Program Director",
            "Development Director",
            "Fundraising Manager",
            "Grant Writer",
            "Volunteer Coordinator",
            "Community Manager",
            "Advocacy Coordinator",
            "Outreach Coordinator",
        ],
        "levels": ["", "Senior ", "Associate "],
    },
    # ==================== TRANSPORTATION & LOGISTICS ====================
    "transportation": {
        "base_term": "Logistics Manager",
        "variants": [
            "Logistics Manager",
            "Transportation Manager",
            "Fleet Manager",
            "Supply Chain Coordinator",
            "Dispatcher",
            "Warehouse Supervisor",
            "Distribution Manager",
            "Freight Coordinator",
        ],
        "levels": ["", "Senior ", "Assistant "],
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
    "today": 24,  # Last 24 hours
    "hourly": 1,  # Last 1 hour
    "four_hours": 4,  # Last 4 hours
    "recent": 72,  # Last 3 days
    "week": 168,  # Last 7 days
    "month": 720,  # Last 30 days
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
    results_wanted="standard",
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
            search_jobs.append(
                {
                    "search_term": term,
                    "location": location_str,
                    "sites": platforms,
                    "hours_old": hours,
                    "results_wanted": results,
                    "category": category,
                }
            )

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

# NEW: Massive collection preset (all industries, 7 days)
PRESET_MASSIVE = {
    "categories": list(SEARCH_QUERIES.keys()),  # All 22 industries
    "platforms": PRIMARY_PLATFORMS,
    "location": "us_national",
    "time_window": "week",  # Past 7 days
    "results_wanted": "thorough",  # 100 per query
}


# Quick stats
def get_search_stats(preset_name: str = None):
    """Get statistics about search configurations"""
    if preset_name:

        presets = {
            "quick": PRESET_QUICK,
            "daily": PRESET_DAILY,
            "thorough": PRESET_THOROUGH,
            "massive": PRESET_MASSIVE,
        }
        preset = presets.get(preset_name)
        if preset:
            configs = generate_search_matrix(**preset)
            return {
                "preset": preset_name,
                "total_queries": len(configs),
                "categories": len(preset["categories"]),
                "platforms": len(preset["platforms"]),
                "expected_jobs_per_query": RESULTS_PER_QUERY[preset["results_wanted"]],
                "max_total_jobs": len(configs)
                * RESULTS_PER_QUERY[preset["results_wanted"]],
            }

    # Overall stats
    total_categories = len(SEARCH_QUERIES)
    total_variants = sum(len(q["variants"]) for q in SEARCH_QUERIES.values())

    return {
        "total_categories": total_categories,
        "total_variants": total_variants,
        "industries_covered": [
            "Technology & Software",
            "Finance & Banking",
            "Healthcare & Medical",
            "Education",
            "Marketing & Advertising",
            "Sales & Business Development",
            "Operations & Supply Chain",
            "Human Resources",
            "Legal",
            "Design & Creative",
            "Product Management",
            "Manufacturing & Engineering",
            "Retail & E-commerce",
            "Customer Service",
            "Research & Science",
            "Consulting",
            "Construction & Real Estate",
            "Hospitality & Travel",
            "Media & Entertainment",
            "Government & Public Sector",
            "Non-Profit",
            "Transportation & Logistics",
        ],
    }


# Scheduled collection preset (all industries, past 4 hours)
# Runs every 4 hours via EventBridge -> Lambda -> JobSpy EC2
PRESET_HOURLY = {
    "categories": list(SEARCH_QUERIES.keys()),  # All 22 industries
    "platforms": PRIMARY_PLATFORMS,
    "location": "us_national",
    "time_window": "four_hours",  # Past 4 hours 
    "results_wanted": "standard",  # 50 per query
}
