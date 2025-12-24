"""
Skills and keywords configuration for all 22 industries.

Based on search_config.py categories and actual job data analysis.
This enables skill extraction and job matching across all domains.
"""

# ============================================================================
# SKILLS BY INDUSTRY
# ============================================================================

SKILLS_BY_INDUSTRY = {
    # ==================== TECHNOLOGY & SOFTWARE ====================
    "technology": {
        "languages": [
            "python", "java", "javascript", "typescript", "c++", "c#", "go", "golang",
            "rust", "ruby", "php", "scala", "kotlin", "swift", "r", "matlab", "perl",
            "objective-c", "lua", "haskell", "elixir", "clojure", "f#", "dart"
        ],
        "frontend": [
            "react", "angular", "vue", "vue.js", "next.js", "nuxt", "svelte", "html",
            "css", "sass", "scss", "less", "tailwind", "bootstrap", "webpack", "vite",
            "redux", "mobx", "jquery", "ember", "backbone"
        ],
        "backend": [
            "node.js", "express", "django", "flask", "fastapi", "spring", "spring boot",
            "rails", "ruby on rails", ".net", "asp.net", "laravel", "symfony",
            "gin", "echo", "fiber", "nestjs", "koa"
        ],
        "data": [
            "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
            "cassandra", "dynamodb", "snowflake", "databricks", "spark", "hadoop",
            "kafka", "airflow", "dbt", "presto", "hive", "redshift", "bigquery",
            "neo4j", "graphql", "oracle", "sql server", "mariadb", "sqlite"
        ],
        "cloud_devops": [
            "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
            "terraform", "ansible", "jenkins", "github actions", "gitlab ci",
            "circleci", "prometheus", "grafana", "datadog", "splunk", "new relic",
            "cloudformation", "pulumi", "helm", "istio", "nginx", "apache"
        ],
        "ml_ai": [
            "machine learning", "deep learning", "tensorflow", "pytorch", "keras",
            "scikit-learn", "pandas", "numpy", "nlp", "computer vision", "llm",
            "langchain", "openai", "huggingface", "transformers", "bert", "gpt",
            "opencv", "spacy", "nltk", "xgboost", "lightgbm", "mlflow"
        ],
        "tools": [
            "git", "github", "gitlab", "bitbucket", "jira", "confluence", "slack",
            "notion", "figma", "postman", "swagger", "linux", "unix", "bash",
            "vim", "vscode", "intellij", "pycharm"
        ],
        "concepts": [
            "rest", "api", "microservices", "agile", "scrum", "ci/cd", "devops",
            "tdd", "unit testing", "integration testing", "oop", "solid",
            "design patterns", "distributed systems", "system design"
        ]
    },

    # ==================== FINANCE & BANKING ====================
    "finance": {
        "tools": [
            "excel", "bloomberg", "reuters", "factset", "capital iq", "pitchbook",
            "quickbooks", "sap", "oracle financials", "netsuite", "hyperion",
            "tableau", "power bi", "alteryx", "sql", "python", "r", "vba", "matlab"
        ],
        "concepts": [
            "financial modeling", "dcf", "lbo", "m&a", "valuation", "due diligence",
            "financial analysis", "budgeting", "forecasting", "variance analysis",
            "gaap", "ifrs", "sox", "audit", "tax", "treasury", "risk management",
            "credit analysis", "portfolio management", "derivatives", "fixed income",
            "equity research", "investment banking", "private equity", "venture capital",
            "hedge fund", "asset management", "wealth management", "financial planning"
        ],
        "certifications": [
            "cpa", "cfa", "cfp", "cma", "cia", "frm", "series 7", "series 63",
            "series 66", "finra"
        ]
    },

    # ==================== HEALTHCARE & MEDICAL ====================
    "healthcare": {
        "clinical": [
            "patient care", "vital signs", "medication administration", "iv therapy",
            "wound care", "phlebotomy", "ehr", "emr", "epic", "cerner", "meditech",
            "hipaa", "clinical documentation", "care coordination", "discharge planning",
            "infection control", "patient assessment", "medical terminology"
        ],
        "certifications": [
            "rn", "lpn", "cna", "bls", "acls", "pals", "nrp", "tncc", "enpc",
            "ccrn", "oncology certified", "med-surg certified", "pediatric certified"
        ],
        "specialties": [
            "icu", "er", "emergency", "surgery", "oncology", "pediatrics", "geriatrics",
            "cardiology", "neurology", "orthopedics", "psychiatry", "ob/gyn",
            "labor and delivery", "nicu", "telemetry", "dialysis", "home health",
            "hospice", "rehabilitation", "outpatient", "inpatient"
        ],
        "administrative": [
            "medical billing", "medical coding", "icd-10", "cpt", "hcpcs",
            "insurance verification", "prior authorization", "revenue cycle",
            "healthcare administration", "practice management"
        ]
    },

    # ==================== EDUCATION ====================
    "education": {
        "tools": [
            "google classroom", "canvas", "blackboard", "moodle", "zoom",
            "microsoft teams", "powerpoint", "smart board", "kahoot", "nearpod",
            "schoology", "edmodo", "seesaw", "class dojo", "powerschool"
        ],
        "concepts": [
            "curriculum development", "lesson planning", "differentiated instruction",
            "classroom management", "student assessment", "iep", "504 plan",
            "special education", "esl", "ell", "stem", "steam", "project-based learning",
            "blended learning", "remote learning", "student engagement"
        ],
        "certifications": [
            "teaching certificate", "state certification", "tesol", "tefl",
            "national board certified", "reading specialist", "math specialist"
        ],
        "subjects": [
            "mathematics", "science", "english", "history", "social studies",
            "physics", "chemistry", "biology", "computer science", "art", "music",
            "physical education", "foreign language", "spanish", "french"
        ]
    },

    # ==================== MARKETING & ADVERTISING ====================
    "marketing": {
        "tools": [
            "google analytics", "google ads", "facebook ads", "meta ads",
            "hubspot", "salesforce", "marketo", "mailchimp", "hootsuite",
            "sprout social", "buffer", "semrush", "ahrefs", "moz", "hotjar",
            "mixpanel", "amplitude", "segment", "klaviyo", "braze", "canva",
            "adobe creative suite", "photoshop", "illustrator", "premiere pro"
        ],
        "concepts": [
            "seo", "sem", "ppc", "cpc", "cpm", "ctr", "roi", "kpi",
            "content marketing", "social media marketing", "email marketing",
            "digital marketing", "brand strategy", "market research",
            "lead generation", "demand generation", "growth marketing",
            "conversion optimization", "a/b testing", "marketing automation",
            "influencer marketing", "affiliate marketing", "pr", "public relations"
        ],
        "platforms": [
            "facebook", "instagram", "twitter", "linkedin", "tiktok", "youtube",
            "pinterest", "snapchat", "reddit"
        ]
    },

    # ==================== SALES & BUSINESS DEVELOPMENT ====================
    "sales": {
        "tools": [
            "salesforce", "hubspot", "pipedrive", "zoho crm", "outreach",
            "salesloft", "gong", "chorus", "linkedin sales navigator",
            "zoominfo", "apollo", "clearbit", "docusign", "pandadoc"
        ],
        "concepts": [
            "b2b sales", "b2c sales", "saas sales", "enterprise sales",
            "inside sales", "outside sales", "field sales", "channel sales",
            "account management", "territory management", "pipeline management",
            "lead qualification", "cold calling", "prospecting", "negotiation",
            "closing", "quota attainment", "sales cycle", "solution selling",
            "consultative selling", "spin selling", "meddic", "bant"
        ],
        "metrics": [
            "quota", "arr", "mrr", "ltv", "cac", "churn", "nps",
            "win rate", "conversion rate", "average deal size"
        ]
    },

    # ==================== OPERATIONS & SUPPLY CHAIN ====================
    "operations": {
        "tools": [
            "sap", "oracle", "netsuite", "microsoft dynamics", "jd edwards",
            "tableau", "power bi", "excel", "sql", "python", "r",
            "warehouse management system", "wms", "tms", "erp"
        ],
        "concepts": [
            "supply chain management", "logistics", "inventory management",
            "demand planning", "forecasting", "procurement", "sourcing",
            "vendor management", "supplier relations", "lean manufacturing",
            "six sigma", "continuous improvement", "kaizen", "5s",
            "process optimization", "kpi", "sla", "capacity planning",
            "warehouse operations", "distribution", "fulfillment", "last mile"
        ],
        "certifications": [
            "apics", "cscp", "cpim", "cltd", "six sigma green belt",
            "six sigma black belt", "lean certified", "pmp"
        ]
    },

    # ==================== HUMAN RESOURCES ====================
    "hr": {
        "tools": [
            "workday", "adp", "bamboohr", "greenhouse", "lever", "icims",
            "taleo", "successfactors", "ultipro", "paylocity", "gusto",
            "linkedin recruiter", "indeed", "glassdoor"
        ],
        "concepts": [
            "recruiting", "talent acquisition", "sourcing", "interviewing",
            "onboarding", "employee relations", "performance management",
            "compensation", "benefits administration", "payroll", "hris",
            "employee engagement", "retention", "succession planning",
            "workforce planning", "diversity and inclusion", "dei",
            "learning and development", "training", "compliance", "fmla", "ada"
        ],
        "certifications": [
            "phr", "sphr", "shrm-cp", "shrm-scp", "gphr"
        ]
    },

    # ==================== LEGAL ====================
    "legal": {
        "tools": [
            "westlaw", "lexisnexis", "clio", "relativity", "document review",
            "contract management", "e-discovery", "microsoft office"
        ],
        "concepts": [
            "contract drafting", "contract review", "legal research",
            "litigation", "corporate law", "intellectual property", "patent",
            "trademark", "copyright", "employment law", "real estate law",
            "mergers and acquisitions", "securities", "regulatory compliance",
            "due diligence", "legal writing", "case management", "paralegal"
        ],
        "certifications": [
            "bar admission", "jd", "paralegal certificate", "notary public"
        ]
    },

    # ==================== DESIGN & CREATIVE ====================
    "design": {
        "tools": [
            "figma", "sketch", "adobe xd", "invision", "zeplin", "abstract",
            "photoshop", "illustrator", "indesign", "after effects",
            "premiere pro", "lightroom", "blender", "cinema 4d", "maya",
            "procreate", "canva", "miro", "figjam", "principle", "framer"
        ],
        "concepts": [
            "ui design", "ux design", "user research", "wireframing",
            "prototyping", "user testing", "usability", "accessibility",
            "design systems", "typography", "color theory", "layout",
            "responsive design", "mobile design", "web design", "branding",
            "visual design", "motion design", "animation", "illustration",
            "print design", "packaging design", "3d design"
        ]
    },

    # ==================== PRODUCT MANAGEMENT ====================
    "product": {
        "tools": [
            "jira", "asana", "trello", "monday", "notion", "confluence",
            "productboard", "aha", "amplitude", "mixpanel", "pendo",
            "fullstory", "hotjar", "figma", "miro", "lucidchart"
        ],
        "concepts": [
            "product strategy", "product roadmap", "product discovery",
            "user research", "customer interviews", "competitive analysis",
            "market research", "product requirements", "prd", "user stories",
            "agile", "scrum", "kanban", "sprint planning", "backlog grooming",
            "prioritization", "okrs", "kpis", "a/b testing", "experimentation",
            "go-to-market", "product launch", "product lifecycle"
        ]
    },

    # ==================== MANUFACTURING & ENGINEERING ====================
    "manufacturing": {
        "tools": [
            "autocad", "solidworks", "catia", "creo", "inventor", "nx",
            "ansys", "matlab", "simulink", "plc", "scada", "mes",
            "sap", "oracle", "minitab", "excel"
        ],
        "concepts": [
            "lean manufacturing", "six sigma", "quality control", "quality assurance",
            "process improvement", "continuous improvement", "kaizen", "5s",
            "root cause analysis", "fmea", "spc", "gd&t", "blueprint reading",
            "cnc", "machining", "welding", "fabrication", "assembly",
            "maintenance", "preventive maintenance", "reliability",
            "safety", "osha", "iso 9001", "iso 14001", "iatf 16949"
        ],
        "certifications": [
            "pe", "professional engineer", "six sigma green belt",
            "six sigma black belt", "lean certified", "cqe", "cqa"
        ]
    },

    # ==================== RETAIL & E-COMMERCE ====================
    "retail": {
        "tools": [
            "pos", "point of sale", "shopify", "magento", "woocommerce",
            "salesforce commerce", "sap retail", "oracle retail",
            "inventory management", "merchandising software"
        ],
        "concepts": [
            "visual merchandising", "inventory management", "stock management",
            "customer service", "sales floor", "cash handling", "pos operations",
            "loss prevention", "shrinkage", "planogram", "store operations",
            "retail analytics", "omnichannel", "e-commerce", "fulfillment",
            "customer experience", "upselling", "cross-selling"
        ]
    },

    # ==================== CUSTOMER SERVICE & SUPPORT ====================
    "customer_service": {
        "tools": [
            "zendesk", "freshdesk", "intercom", "salesforce service cloud",
            "hubspot service", "servicenow", "jira service desk",
            "live chat", "chatbot", "crm"
        ],
        "concepts": [
            "customer support", "technical support", "help desk",
            "ticket management", "escalation", "troubleshooting",
            "customer satisfaction", "csat", "nps", "first call resolution",
            "average handle time", "sla", "customer retention",
            "customer success", "account management", "onboarding",
            "product adoption", "churn prevention"
        ]
    },

    # ==================== RESEARCH & SCIENCE ====================
    "research": {
        "tools": [
            "spss", "sas", "stata", "r", "python", "matlab", "prism",
            "endnote", "mendeley", "lab equipment", "microscopy",
            "chromatography", "spectroscopy", "pcr", "elisa"
        ],
        "concepts": [
            "research methodology", "experimental design", "data analysis",
            "statistical analysis", "literature review", "peer review",
            "scientific writing", "grant writing", "clinical trials",
            "irb", "gcp", "glp", "regulatory affairs", "fda"
        ]
    },

    # ==================== CONSULTING ====================
    "consulting": {
        "tools": [
            "powerpoint", "excel", "tableau", "alteryx", "python", "sql",
            "salesforce", "sap", "oracle"
        ],
        "concepts": [
            "strategy consulting", "management consulting", "it consulting",
            "business analysis", "process improvement", "change management",
            "stakeholder management", "client relations", "project management",
            "problem solving", "data analysis", "presentation skills",
            "workshop facilitation", "implementation"
        ]
    },

    # ==================== CONSTRUCTION & REAL ESTATE ====================
    "construction": {
        "tools": [
            "autocad", "revit", "bluebeam", "procore", "primavera", "ms project",
            "estimating software", "takeoff software", "building codes"
        ],
        "concepts": [
            "project management", "construction management", "site supervision",
            "scheduling", "budgeting", "estimating", "bidding", "contracts",
            "subcontractor management", "safety", "osha", "quality control",
            "building codes", "permits", "inspections", "blueprint reading",
            "structural engineering", "civil engineering"
        ],
        "certifications": [
            "pmp", "pe", "leed", "osha 30", "osha 10", "cpm"
        ]
    },

    # ==================== HOSPITALITY & TRAVEL ====================
    "hospitality": {
        "tools": [
            "opera", "micros", "aloha", "toast", "reservations systems",
            "property management system", "pms", "booking platforms"
        ],
        "concepts": [
            "guest services", "front desk", "concierge", "housekeeping",
            "food and beverage", "banquets", "catering", "event planning",
            "revenue management", "occupancy", "adr", "revpar",
            "customer service", "hospitality management"
        ]
    },

    # ==================== MEDIA & ENTERTAINMENT ====================
    "media": {
        "tools": [
            "premiere pro", "final cut", "avid", "after effects", "photoshop",
            "lightroom", "pro tools", "logic pro", "wordpress", "cms",
            "social media platforms", "analytics tools"
        ],
        "concepts": [
            "content creation", "video production", "audio production",
            "editing", "storytelling", "journalism", "broadcasting",
            "social media", "content strategy", "audience engagement",
            "seo", "analytics", "monetization", "copyright", "licensing"
        ]
    },

    # ==================== GOVERNMENT & PUBLIC SECTOR ====================
    "government": {
        "concepts": [
            "policy analysis", "public administration", "program management",
            "grant management", "budgeting", "procurement", "compliance",
            "regulatory affairs", "stakeholder engagement", "public speaking",
            "government relations", "lobbying", "legislation", "appropriations"
        ],
        "clearances": [
            "security clearance", "public trust", "secret", "top secret",
            "ts/sci"
        ]
    },

    # ==================== NON-PROFIT ====================
    "nonprofit": {
        "tools": [
            "salesforce nonprofit", "bloomerang", "neon", "network for good",
            "constant contact", "mailchimp", "canva"
        ],
        "concepts": [
            "fundraising", "grant writing", "donor relations", "stewardship",
            "volunteer management", "community outreach", "program development",
            "impact measurement", "nonprofit management", "board relations"
        ]
    },

    # ==================== TRANSPORTATION & LOGISTICS ====================
    "transportation": {
        "tools": [
            "tms", "wms", "fleet management", "routing software",
            "gps tracking", "eld", "electronic logging"
        ],
        "concepts": [
            "fleet management", "dispatch", "routing", "scheduling",
            "dot compliance", "fmcsa", "hazmat", "cdl", "freight",
            "ltl", "ftl", "intermodal", "cross-docking", "last mile delivery"
        ],
        "certifications": [
            "cdl", "hazmat", "twic", "dot medical"
        ]
    }
}


# ============================================================================
# UNIVERSAL SOFT SKILLS (applies to all industries)
# ============================================================================

SOFT_SKILLS = [
    # Communication
    "communication", "written communication", "verbal communication",
    "presentation", "public speaking", "negotiation", "persuasion",
    
    # Leadership
    "leadership", "team leadership", "management", "mentoring", "coaching",
    "delegation", "motivation", "conflict resolution",
    
    # Collaboration
    "teamwork", "collaboration", "cross-functional", "stakeholder management",
    "relationship building", "interpersonal",
    
    # Problem Solving
    "problem solving", "critical thinking", "analytical", "strategic thinking",
    "decision making", "innovation", "creativity",
    
    # Work Style
    "attention to detail", "organization", "time management", "multitasking",
    "prioritization", "deadline-driven", "self-motivated", "initiative",
    "adaptability", "flexibility", "fast-paced", "high-pressure"
]


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_all_skills_flat() -> set:
    """Get all skills as a flat set for quick lookup."""
    all_skills = set()
    
    for industry, categories in SKILLS_BY_INDUSTRY.items():
        for category, skills in categories.items():
            all_skills.update(skill.lower() for skill in skills)
    
    all_skills.update(skill.lower() for skill in SOFT_SKILLS)
    
    return all_skills


def get_industry_skills(industry: str) -> dict:
    """Get skills for a specific industry."""
    return SKILLS_BY_INDUSTRY.get(industry, {})


def detect_industry_from_skills(skills: list) -> str:
    """Detect likely industry based on extracted skills."""
    skills_lower = set(s.lower() for s in skills)
    
    scores = {}
    for industry, categories in SKILLS_BY_INDUSTRY.items():
        score = 0
        industry_skills = set()
        for category_skills in categories.values():
            industry_skills.update(s.lower() for s in category_skills)
        
        matches = skills_lower & industry_skills
        score = len(matches)
        if score > 0:
            scores[industry] = score
    
    if scores:
        return max(scores, key=scores.get)
    return "other"


# ============================================================================
# STATISTICS
# ============================================================================

def get_skills_stats():
    """Get statistics about the skills database."""
    all_skills = get_all_skills_flat()
    
    by_industry = {}
    for industry, categories in SKILLS_BY_INDUSTRY.items():
        count = sum(len(skills) for skills in categories.values())
        by_industry[industry] = count
    
    return {
        "total_unique_skills": len(all_skills),
        "industries_covered": len(SKILLS_BY_INDUSTRY),
        "soft_skills": len(SOFT_SKILLS),
        "by_industry": by_industry
    }


if __name__ == "__main__":
    stats = get_skills_stats()
    print("=" * 60)
    print("SKILLS DATABASE STATISTICS")
    print("=" * 60)
    print(f"\nTotal unique skills: {stats['total_unique_skills']}")
    print(f"Industries covered: {stats['industries_covered']}")
    print(f"Soft skills: {stats['soft_skills']}")
    print(f"\nBy industry:")
    for industry, count in sorted(stats['by_industry'].items(), key=lambda x: -x[1]):
        print(f"  {industry}: {count}")
