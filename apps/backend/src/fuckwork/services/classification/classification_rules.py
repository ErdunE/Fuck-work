"""
Comprehensive job classification rules.

Defines 70+ Categories, 20+ Industries, 100+ Specialties.
Maps keywords to classifications for rule-based classifier.

DATA-DRIVEN: Built from analysis of 63,592 real job postings.
"""

from typing import Dict, List, Tuple

# ============================================================================
# CATEGORIES (70+ types - EXPANDED from real data analysis)
# ============================================================================

CATEGORIES = {
    # Software Engineering (10 types)
    "software_backend": "Backend Engineering",
    "software_frontend": "Frontend Engineering",
    "software_fullstack": "Full-Stack Engineering",
    "software_mobile": "Mobile Engineering",
    "software_embedded": "Embedded Systems",
    "software_game": "Game Development",
    "software_web": "Web Development",
    "software_security": "Security Engineering",
    "software_qa": "Quality Assurance / Testing",
    "software_general": "Software Engineering (General)",
    # Data & AI (8 types)
    "data_science": "Data Science",
    "data_engineering": "Data Engineering",
    "data_analytics": "Data Analytics",
    "ml_engineer": "Machine Learning Engineering",
    "ai_research": "AI Research",
    "nlp": "Natural Language Processing",
    "computer_vision": "Computer Vision",
    "robotics": "Robotics Engineering",
    # Infrastructure & Operations (6 types)
    "devops": "DevOps Engineering",
    "sre": "Site Reliability Engineering",
    "cloud": "Cloud Engineering",
    "infrastructure": "Infrastructure Engineering",
    "platform": "Platform Engineering",
    "systems": "Systems Engineering",
    # Product & Design (5 types)
    "product_management": "Product Management",
    "product_design": "Product Design",
    "ux_design": "UX/UI Design",
    "technical_pm": "Technical Product Management",
    "growth": "Growth / Product Analytics",
    # Specialized Tech (8 types)
    "blockchain": "Blockchain / Web3",
    "cybersecurity": "Cybersecurity",
    "networking": "Network Engineering",
    "hardware": "Hardware Engineering",
    "firmware": "Firmware Engineering",
    "quantum": "Quantum Computing",
    "biotech_tech": "Biotech / Computational Biology",
    "fintech_tech": "Financial Technology",
    # Research & Academia (3 types)
    "research": "Research Scientist",
    "applied_research": "Applied Research",
    "postdoc": "Postdoctoral Research",
    # Business & Operations (4 types)
    "business_analyst": "Business Analysis",
    "technical_writing": "Technical Writing",
    "sales_engineering": "Sales Engineering",
    "customer_success": "Customer Success Engineering",
    # Healthcare & Medical (5 types)
    "healthcare_nursing": "Nursing & Patient Care",
    "healthcare_physician": "Physician / Medical Doctor",
    "healthcare_allied": "Allied Health Professional",
    "healthcare_admin": "Healthcare Administration",
    "healthcare_clinical": "Clinical & Laboratory",
    # Pharmacy (2 types) - NEW
    "pharmacy_pharmacist": "Pharmacist",
    "pharmacy_technician": "Pharmacy Technician",
    # Finance & Accounting (5 types)
    "finance_analyst": "Financial Analysis",
    "finance_accounting": "Accounting",
    "finance_investment": "Investment Banking / Trading",
    "finance_risk": "Risk Management",
    "finance_compliance": "Compliance & Regulatory",
    # Operations & Logistics (7 types)
    "operations_manager": "Operations Management",
    "operations_supply_chain": "Supply Chain Management",
    "operations_warehouse": "Warehouse & Logistics",
    "operations_procurement": "Procurement",
    "operations_quality": "Quality Assurance & Control",
    "operations_dispatch": "Dispatch & Coordination",  # NEW
    "operations_coordinator": "Operations Coordination",  # NEW
    # Manufacturing & Production (6 types) - NEW
    "manufacturing_engineer": "Manufacturing Engineering",
    "manufacturing_process": "Process Engineering",
    "manufacturing_production": "Production Management",
    "manufacturing_quality": "Quality Engineering",
    "manufacturing_supervisor": "Production Supervision",
    "manufacturing_electrical": "Electrical Engineering",
    "manufacturing_mechanical": "Mechanical Engineering",
    "manufacturing_civil": "Civil Engineering",
    # Sales & Marketing (5 types)
    "sales_account_exec": "Account Executive / Sales",
    "sales_business_dev": "Business Development",
    "sales_retail": "Retail Sales",  # NEW
    "marketing_digital": "Digital Marketing",
    "marketing_content": "Content Marketing",
    "marketing_brand": "Brand & Communications",
    "marketing_social": "Social Media Management",  # NEW
    # Human Resources (3 types)
    "hr_recruiter": "Recruiting & Talent Acquisition",
    "hr_generalist": "HR Generalist",
    "hr_compensation": "Compensation & Benefits",
    # Education & Training (3 types)
    "education_teacher": "Teaching",
    "education_trainer": "Corporate Training",
    "education_admin": "Education Administration",
    # Legal & Compliance (3 types)
    "legal_attorney": "Attorney / Lawyer",
    "legal_paralegal": "Paralegal",
    "legal_compliance": "Legal Compliance",
    # Customer Service (3 types)
    "customer_service_rep": "Customer Service Representative",
    "customer_service_manager": "Customer Service Management",
    "customer_support_tech": "Technical Support",
    # Retail & Hospitality (6 types) - NEW
    "retail_store_manager": "Retail Store Management",
    "retail_assistant_manager": "Retail Assistant Manager",
    "retail_shift_manager": "Shift Management",
    "restaurant_manager": "Restaurant Management",
    "restaurant_assistant_manager": "Restaurant Assistant Manager",
    "hospitality_manager": "Hospitality Management",
    # Administrative (2 types) - NEW
    "administrative_executive": "Executive Assistant",
    "administrative_assistant": "Administrative Assistant",
    # Design & Creative (4 types) - NEW
    "design_graphic": "Graphic Design",
    "design_ui_ux": "UX/UI Design",
    "design_art": "Art Direction",
    "creative_copywriter": "Copywriting",
    # Construction (3 types) - NEW
    "construction_pm": "Construction Project Management",
    "construction_estimator": "Construction Estimating",
    "construction_manager": "Construction Management",
    # Other
    "other": "Other / Uncategorized",
}

# ============================================================================
# KEYWORD MAPPING (Rule-based Classification with PRIORITY)
# ============================================================================

# PRIORITY ORDER: Specific → General
# Each tuple: (category, keywords, priority)
# Lower priority number = checked first
CATEGORY_KEYWORDS_PRIORITIZED: List[Tuple[str, List[str], int]] = [
    # ========================================================================
    # PRIORITY 1: Most Specific Titles (check these FIRST)
    # ========================================================================
    # Retail & Hospitality (very specific to avoid conflicts)
    (
        "restaurant_manager",
        ["restaurant manager", "restaurant general manager", "restaurant gm", "rgm"],
        1,
    ),
    (
        "restaurant_assistant_manager",
        [
            "restaurant assistant manager",
            "restaurant assistant general manager",
            "restaurant agm",
        ],
        1,
    ),
    (
        "retail_store_manager",
        ["store manager", "retail store manager", "retail manager"],
        1,
    ),
    (
        "retail_assistant_manager",
        ["assistant store manager", "assistant retail manager"],
        1,
    ),
    ("retail_shift_manager", ["shift manager", "shift lead", "shift supervisor"], 1),
    (
        "sales_retail",
        [
            "retail sales associate",
            "sales associate",
            "retail associate",
            "sales representative retail",
        ],
        1,
    ),
    # Administrative (very specific)
    (
        "administrative_executive",
        ["executive assistant", "exec assistant", "executive admin"],
        1,
    ),
    (
        "administrative_assistant",
        [
            "administrative assistant",
            "admin assistant",
            "office administrator",
            "administrative coordinator",
        ],
        1,
    ),
    # Design & Creative
    ("design_graphic", ["graphic designer", "graphic design", "visual designer"], 1),
    (
        "design_ui_ux",
        [
            "ui/ux designer",
            "ux designer",
            "ui designer",
            "user experience designer",
            "interaction designer",
            "product designer",  # Often means UX
        ],
        1,
    ),
    ("design_art", ["art director", "creative director", "senior art director"], 1),
    ("creative_copywriter", ["copywriter", "content writer", "creative writer"], 1),
    # Manufacturing & Production
    (
        "manufacturing_engineer",
        ["manufacturing engineer", "manufacturing engineering"],
        1,
    ),
    ("manufacturing_process", ["process engineer", "process engineering"], 1),
    ("manufacturing_production", ["production manager", "production director"], 1),
    (
        "manufacturing_supervisor",
        ["production supervisor", "production lead", "manufacturing supervisor"],
        1,
    ),
    (
        "manufacturing_quality",
        ["quality engineer", "quality assurance engineer", "qa engineer manufacturing"],
        1,
    ),
    (
        "manufacturing_electrical",
        ["electrical engineer", "electrical engineering", "senior electrical engineer"],
        1,
    ),
    (
        "manufacturing_mechanical",
        ["mechanical engineer", "mechanical engineering", "senior mechanical engineer"],
        1,
    ),
    (
        "manufacturing_civil",
        ["civil engineer", "civil engineering", "structural engineer"],
        1,
    ),
    # Construction
    (
        "construction_pm",
        [
            "construction project manager",
            "construction pm",
            "construction project management",
        ],
        1,
    ),
    (
        "construction_estimator",
        [
            "construction estimator",
            "estimator construction",
            "cost estimator construction",
        ],
        1,
    ),
    (
        "construction_manager",
        [
            "construction manager",
            "construction superintendent",
            "site manager construction",
        ],
        1,
    ),
    # Pharmacy
    (
        "pharmacy_pharmacist",
        ["pharmacist", "clinical pharmacist", "pharmacy manager", "staff pharmacist"],
        1,
    ),
    ("pharmacy_technician", ["pharmacy technician", "pharmacy tech", "pharm tech"], 1),
    # Healthcare Allied (specific titles)
    (
        "healthcare_allied",
        [
            "physical therapist",
            "pt ",
            "dpt",
            "occupational therapist",
            "ot ",
            "respiratory therapist",
            "medical assistant",
            " ma ",
            "cma",
            "radiology tech",
            "radiologic technologist",
            "patient care technician",
            "pct",
        ],
        1,
    ),
    # Healthcare Nursing (very specific)
    (
        "healthcare_nursing",
        [
            "registered nurse",
            " rn ",
            " rn,",
            " rn-",
            "rn)",
            "(rn",
            "nurse practitioner",
            " np ",
            " np,",
            " np-",
            "licensed practical nurse",
            " lpn ",
            " lpn,",
            "clinical nurse",
            "staff nurse",
            "charge nurse",
            "nursing supervisor",
        ],
        1,
    ),
    # Healthcare Physician
    (
        "healthcare_physician",
        [
            "physician",
            " md ",
            " do ",
            "m.d.",
            "d.o.",
            "medical doctor",
            "surgeon",
            "doctor ",
            "cardiologist",
            "radiologist",
            "anesthesiologist",
            "locum physician",
        ],
        1,
    ),
    # Healthcare Clinical
    (
        "healthcare_clinical",
        [
            "clinical research coordinator",
            "clinical coordinator",
            "lab technician",
            "laboratory technician",
            "phlebotomist",
            "medical technician",
            "clinical assistant",
        ],
        1,
    ),
    # Dispatch & Coordination
    (
        "operations_dispatch",
        ["dispatcher", "dispatch coordinator", "logistics dispatcher"],
        1,
    ),
    (
        "operations_coordinator",
        [
            "program coordinator",
            "project coordinator",
            "logistics coordinator",
            "operations coordinator",
        ],
        1,
    ),
    # Marketing Social Media
    (
        "marketing_social",
        ["social media manager", "social media coordinator", "social media specialist"],
        1,
    ),
    # ========================================================================
    # PRIORITY 2: Tech Roles (specific tech titles)
    # ========================================================================
    ("software_fullstack", ["full stack", "fullstack", "full-stack"], 2),
    (
        "software_backend",
        [
            "backend engineer",
            "back-end engineer",
            "back end engineer",
            "backend developer",
            "server-side engineer",
            "api engineer",
        ],
        2,
    ),
    (
        "software_frontend",
        [
            "frontend engineer",
            "front-end engineer",
            "front end engineer",
            "frontend developer",
            "ui engineer",
            "web developer frontend",
        ],
        2,
    ),
    (
        "software_mobile",
        [
            "mobile engineer",
            "mobile developer",
            "ios engineer",
            "android engineer",
            "ios developer",
            "android developer",
            "react native",
            "flutter developer",
        ],
        2,
    ),
    (
        "software_embedded",
        [
            "embedded engineer",
            "embedded software",
            "firmware engineer",
            "embedded systems",
        ],
        2,
    ),
    (
        "software_game",
        [
            "game developer",
            "game engineer",
            "unity developer",
            "unreal developer",
            "game programmer",
        ],
        2,
    ),
    (
        "software_security",
        ["security engineer", "appsec engineer", "security software engineer"],
        2,
    ),
    (
        "software_qa",
        [
            "qa engineer",
            "test engineer",
            "quality assurance engineer",
            "sdet",
            "test automation engineer",
        ],
        2,
    ),
    (
        "data_science",
        ["data scientist", "senior data scientist", "principal data scientist"],
        2,
    ),
    (
        "data_engineering",
        ["data engineer", "senior data engineer", "data platform engineer"],
        2,
    ),
    (
        "data_analytics",
        [
            "data analyst",
            "business intelligence analyst",
            "analytics engineer",
            "bi analyst",
        ],
        2,
    ),
    ("ml_engineer", ["machine learning engineer", "ml engineer", "mlops engineer"], 2),
    ("ai_research", ["ai researcher", "research scientist ai", "applied scientist"], 2),
    (
        "devops",
        ["devops engineer", "devsecops engineer", "release engineer", "build engineer"],
        2,
    ),
    ("sre", ["site reliability engineer", "sre", "production engineer"], 2),
    (
        "cloud",
        [
            "cloud engineer",
            "cloud architect",
            "aws engineer",
            "azure engineer",
            "gcp engineer",
        ],
        2,
    ),
    (
        "product_management",
        ["product manager", " pm ", "senior pm", "product lead", "product owner"],
        2,
    ),
    # ========================================================================
    # PRIORITY 3: Finance & Business
    # ========================================================================
    (
        "finance_analyst",
        ["financial analyst", "finance analyst", "fp&a analyst", "investment analyst"],
        3,
    ),
    (
        "finance_accounting",
        [
            "accountant",
            " cpa ",
            "senior accountant",
            "staff accountant",
            "accounting manager",
            "bookkeeper",
        ],
        3,
    ),
    (
        "finance_investment",
        [
            "investment banking",
            "investment banker",
            "trader",
            "portfolio manager",
            "wealth manager",
            "financial advisor",
        ],
        3,
    ),
    ("business_analyst", ["business analyst", "business systems analyst"], 3),
    # ========================================================================
    # PRIORITY 4: Operations & Logistics
    # ========================================================================
    (
        "operations_warehouse",
        [
            "warehouse manager",
            "warehouse supervisor",
            "warehouse coordinator",
            "logistics manager",
            "shipping manager",
            "receiving manager",
        ],
        4,
    ),
    (
        "operations_supply_chain",
        [
            "supply chain manager",
            "supply chain analyst",
            "procurement manager",
            "buyer",
        ],
        4,
    ),
    (
        "operations_manager",
        [
            "operations manager",
            "ops manager",
            "plant manager",
            "facility manager",
            "general manager operations",
        ],
        4,
    ),
    # ========================================================================
    # PRIORITY 5: Sales & Marketing
    # ========================================================================
    (
        "sales_account_exec",
        [
            "account executive",
            "senior account executive",
            "account manager",
            "key account manager",
        ],
        5,
    ),
    (
        "sales_business_dev",
        ["business development", "bdr", "sdr", "sales development representative"],
        5,
    ),
    (
        "marketing_digital",
        [
            "digital marketing",
            "digital marketing manager",
            "seo specialist",
            "sem specialist",
            "ppc specialist",
        ],
        5,
    ),
    (
        "marketing_content",
        ["content marketing", "content strategist", "content manager"],
        5,
    ),
    # ========================================================================
    # PRIORITY 6: HR, Legal, Education, Customer Service
    # ========================================================================
    ("hr_recruiter", ["recruiter", "talent acquisition", "technical recruiter"], 6),
    (
        "hr_generalist",
        ["hr generalist", "human resources generalist", "hr coordinator", "hr manager"],
        6,
    ),
    (
        "legal_attorney",
        ["attorney", "lawyer", "counsel", "legal counsel", "associate attorney"],
        6,
    ),
    ("legal_paralegal", ["paralegal", "legal assistant"], 6),
    (
        "education_teacher",
        ["teacher", "instructor", "professor", "educator", "tutor"],
        6,
    ),
    (
        "customer_service_rep",
        [
            "customer service representative",
            "customer support representative",
            "call center representative",
        ],
        6,
    ),
    (
        "customer_success",
        ["customer success manager", "csm", "customer success engineer"],
        6,
    ),
    # ========================================================================
    # PRIORITY 7: General/Fallback Tech Terms
    # ========================================================================
    (
        "software_general",
        ["software engineer", "software developer", "software development engineer"],
        7,
    ),
]

# ============================================================================
# INDUSTRIES (20+ types)
# ============================================================================

INDUSTRIES = {
    "technology": "Technology & Software",
    "finance": "Finance & Banking",
    "fintech": "Financial Technology",
    "healthcare": "Healthcare & Life Sciences",
    "biotech": "Biotechnology",
    "pharma": "Pharmaceuticals",
    "education": "Education & Training",
    "edtech": "Education Technology",
    "ecommerce": "E-commerce & Retail",
    "retail": "Retail & Consumer",
    "media": "Media & Entertainment",
    "gaming": "Gaming & Esports",
    "telecom": "Telecommunications",
    "transportation": "Transportation & Logistics",
    "automotive": "Automotive",
    "aerospace": "Aerospace & Defense",
    "energy": "Energy & Utilities",
    "real_estate": "Real Estate & PropTech",
    "agriculture": "Agriculture & AgTech",
    "manufacturing": "Manufacturing & Industrial",
    "construction": "Construction",
    "consulting": "Consulting & Professional Services",
    "government": "Government & Public Sector",
    "nonprofit": "Nonprofit & Social Impact",
    "hospitality": "Hospitality & Food Service",
    "other": "Other",
}

# Industry Keywords (company_industry matching)
INDUSTRY_KEYWORDS: Dict[str, List[str]] = {
    "technology": [
        "software",
        "technology",
        "internet",
        "saas",
        "cloud",
        "tech",
        "computer",
    ],
    "finance": [
        "financial services",
        "banking",
        "investment",
        "capital markets",
        "asset management",
        "insurance",
    ],
    "fintech": [
        "fintech",
        "payment",
        "cryptocurrency",
        "trading platform",
        "digital banking",
        "mobile payments",
    ],
    "healthcare": [
        "healthcare",
        "hospital",
        "medical",
        "health services",
        "clinical",
        "patient care",
    ],
    "biotech": [
        "biotechnology",
        "biotech",
        "genomics",
        "bioinformatics",
        "life sciences",
        "pharmaceutical research",
    ],
    "pharma": ["pharmaceutical", "pharma", "drug development", "clinical trials"],
    "education": ["education", "school", "university", "learning"],
    "edtech": ["edtech", "learning platform", "online education", "training platform"],
    "ecommerce": [
        "e-commerce",
        "ecommerce",
        "online retail",
        "marketplace",
        "shopping",
        "retail technology",
    ],
    "retail": ["retail", "store", "consumer goods"],
    "media": [
        "media",
        "entertainment",
        "streaming",
        "content",
        "publishing",
        "broadcasting",
    ],
    "gaming": ["gaming", "video games", "esports", "game studio"],
    "telecom": [
        "telecommunications",
        "telecom",
        "wireless",
        "network provider",
        "5g",
        "broadband",
    ],
    "transportation": [
        "transportation",
        "logistics",
        "shipping",
        "delivery",
        "rideshare",
        "autonomous vehicles",
    ],
    "automotive": [
        "automotive",
        "automobile",
        "vehicle",
        "car manufacturer",
        "electric vehicle",
        "ev",
    ],
    "aerospace": ["aerospace", "aviation", "defense", "space", "satellite", "aircraft"],
    "energy": [
        "energy",
        "utilities",
        "renewable",
        "solar",
        "wind",
        "oil",
        "gas",
        "power",
    ],
    "real_estate": [
        "real estate",
        "proptech",
        "property management",
        "construction technology",
    ],
    "agriculture": [
        "agriculture",
        "agtech",
        "farming",
        "food tech",
        "agricultural technology",
    ],
    "manufacturing": ["manufacturing", "industrial", "factory", "production"],
    "construction": ["construction", "building", "contractor"],
    "consulting": [
        "consulting",
        "professional services",
        "advisory",
        "management consulting",
    ],
    "government": [
        "government",
        "public sector",
        "federal",
        "state",
        "defense contractor",
        "civic tech",
    ],
    "hospitality": ["hospitality", "hotel", "restaurant", "food service"],
}

# ============================================================================
# SPECIALTIES (100+ types - keeping existing)
# ============================================================================

SPECIALTIES = {
    # Frontend
    "react": "React",
    "vue": "Vue.js",
    "angular": "Angular",
    "javascript": "JavaScript / TypeScript",
    "web_performance": "Web Performance",
    "ui_frameworks": "UI Frameworks",
    # Backend
    "python": "Python",
    "java": "Java",
    "golang": "Go",
    "rust": "Rust",
    "nodejs": "Node.js",
    "ruby": "Ruby",
    "dotnet": ".NET / C#",
    "cpp": "C++",
    "scala": "Scala",
    "api_design": "API Design & Development",
    "microservices": "Microservices Architecture",
    "distributed_systems": "Distributed Systems",
    # Mobile
    "ios": "iOS (Swift / Objective-C)",
    "android": "Android (Kotlin / Java)",
    "react_native": "React Native",
    "flutter": "Flutter",
    "mobile_gaming": "Mobile Gaming",
    # Data & Databases
    "sql": "SQL & Databases",
    "nosql": "NoSQL Databases",
    "data_warehousing": "Data Warehousing",
    "etl": "ETL / Data Pipelines",
    "spark": "Apache Spark",
    "kafka": "Apache Kafka",
    "airflow": "Apache Airflow",
    "tableau": "Tableau / Data Visualization",
    "power_bi": "Power BI",
    "excel": "Advanced Excel",
    # AI/ML
    "deep_learning": "Deep Learning",
    "neural_networks": "Neural Networks",
    "tensorflow": "TensorFlow",
    "pytorch": "PyTorch",
    "llm": "Large Language Models",
    "generative_ai": "Generative AI",
    "computer_vision_cv": "Computer Vision",
    "nlp_text": "Natural Language Processing",
    "recommendation_systems": "Recommendation Systems",
    "reinforcement_learning": "Reinforcement Learning",
    "mlops": "MLOps",
    # Cloud
    "aws": "Amazon Web Services (AWS)",
    "azure": "Microsoft Azure",
    "gcp": "Google Cloud Platform (GCP)",
    "kubernetes": "Kubernetes",
    "docker": "Docker / Containers",
    "terraform": "Terraform / IaC",
    "cloudformation": "CloudFormation",
    # DevOps
    "ci_cd": "CI/CD Pipelines",
    "jenkins": "Jenkins",
    "github_actions": "GitHub Actions",
    "monitoring": "Monitoring & Observability",
    "prometheus": "Prometheus",
    "grafana": "Grafana",
    "elk": "ELK Stack",
    # Security
    "appsec": "Application Security",
    "network_security": "Network Security",
    "cloud_security": "Cloud Security",
    "penetration_testing": "Penetration Testing",
    "compliance": "Security Compliance",
    "cryptography": "Cryptography",
    "zero_trust": "Zero Trust Architecture",
    # Domain-Specific
    "fintech_payments": "Payments / Fintech",
    "blockchain_web3": "Blockchain / Web3",
    "healthcare_tech": "Healthcare IT",
    "edtech_learning": "Education Technology",
    "ecommerce_retail": "E-commerce / Retail Tech",
    "gaming_engines": "Game Engines",
    "graphics": "Graphics / Rendering",
    "audio_video": "Audio/Video Processing",
    # Infrastructure
    "databases": "Database Administration",
    "storage": "Storage Systems",
    "networking": "Networking",
    "load_balancing": "Load Balancing",
    "cdn": "Content Delivery Networks",
    # Tools & Frameworks
    "git": "Git / Version Control",
    "agile": "Agile / Scrum",
    "jira": "JIRA / Project Management",
    "linux": "Linux / Unix",
    "windows": "Windows Server",
    # Emerging Tech
    "quantum_computing": "Quantum Computing",
    "edge_computing": "Edge Computing",
    "iot": "Internet of Things (IoT)",
    "ar_vr": "AR/VR",
    "5g": "5G / Telecommunications",
    # General
    "general": "General / Multiple Specialties",
}

# Specialty Keywords (keeping existing)
SPECIALTY_KEYWORDS: Dict[str, List[str]] = {
    "react": ["react", "react.js", "reactjs", "next.js", "nextjs"],
    "vue": ["vue", "vue.js", "vuejs", "nuxt"],
    "angular": ["angular", "angularjs"],
    "javascript": ["javascript", "typescript", "js", "ts", "ecmascript"],
    "python": ["python", "django", "flask", "fastapi", "python3"],
    "java": ["java", "spring", "spring boot", "hibernate", "jvm"],
    "golang": ["golang", "go", "go lang"],
    "rust": ["rust", "cargo"],
    "nodejs": ["node.js", "node", "nodejs", "express"],
    "ruby": ["ruby", "rails", "ruby on rails"],
    "dotnet": [".net", "c#", "csharp", "asp.net", "dotnet"],
    "cpp": ["c++", "cpp"],
    "scala": ["scala", "akka", "play framework"],
    "ios": ["ios", "swift", "objective-c", "xcode", "cocoa"],
    "android": ["android", "kotlin", "android studio"],
    "react_native": ["react native"],
    "flutter": ["flutter", "dart"],
    "sql": ["sql", "mysql", "postgresql", "postgres", "oracle", "sql server"],
    "nosql": ["nosql", "mongodb", "cassandra", "dynamodb", "redis"],
    "spark": ["spark", "pyspark", "apache spark"],
    "kafka": ["kafka", "apache kafka", "event streaming"],
    "airflow": ["airflow", "apache airflow", "workflow orchestration"],
    "tableau": ["tableau", "data visualization"],
    "power_bi": ["power bi", "powerbi"],
    "deep_learning": ["deep learning", "neural network", "cnn", "rnn", "transformer"],
    "tensorflow": ["tensorflow", "tf", "keras"],
    "pytorch": ["pytorch", "torch"],
    "llm": ["llm", "large language model", "gpt", "bert", "language model"],
    "generative_ai": ["generative ai", "gen ai", "stable diffusion", "dalle"],
    "computer_vision_cv": ["computer vision", "opencv", "image recognition"],
    "nlp_text": ["nlp", "natural language processing", "text mining"],
    "recommendation_systems": [
        "recommendation",
        "recommender system",
        "collaborative filtering",
    ],
    "reinforcement_learning": ["reinforcement learning", "rl", "q-learning"],
    "mlops": ["mlops", "ml ops", "ml infrastructure"],
    "aws": ["aws", "amazon web services", "ec2", "s3", "lambda"],
    "azure": ["azure", "microsoft azure"],
    "gcp": ["gcp", "google cloud", "gke"],
    "kubernetes": ["kubernetes", "k8s", "helm"],
    "docker": ["docker", "container"],
    "terraform": ["terraform", "iac", "infrastructure as code"],
    "ci_cd": ["ci/cd", "continuous integration", "continuous deployment"],
    "jenkins": ["jenkins"],
    "github_actions": ["github actions"],
    "monitoring": ["monitoring", "observability", "apm"],
    "prometheus": ["prometheus"],
    "grafana": ["grafana"],
    "elk": ["elasticsearch", "logstash", "kibana", "elk"],
    "appsec": ["application security", "appsec", "owasp"],
    "network_security": ["network security", "firewall", "ids", "ips"],
    "cloud_security": ["cloud security", "iam", "secrets management"],
    "penetration_testing": ["penetration testing", "pentest", "ethical hacking"],
    "compliance": ["compliance", "gdpr", "hipaa", "soc2", "pci"],
    "cryptography": ["cryptography", "encryption", "tls", "ssl"],
    "blockchain_web3": ["blockchain", "web3", "smart contract", "solidity", "ethereum"],
    "fintech_payments": ["payments", "fintech", "trading", "financial systems"],
    "healthcare_tech": ["healthcare it", "ehr", "emr", "fhir", "medical devices"],
    "edtech_learning": ["edtech", "lms", "online learning", "mooc"],
    "ecommerce_retail": ["ecommerce", "shopify", "magento", "retail tech"],
    "gaming_engines": ["unity", "unreal engine", "game engine", "godot"],
    "graphics": ["graphics", "opengl", "vulkan", "directx", "rendering"],
    "audio_video": ["audio", "video", "streaming", "codec", "ffmpeg"],
    "databases": ["database", "dba", "mysql", "postgresql", "oracle"],
    "networking": ["networking", "tcp/ip", "dns", "bgp", "vpn"],
    "load_balancing": ["load balancing", "nginx", "haproxy"],
    "cdn": ["cdn", "content delivery", "cloudflare", "akamai"],
    "quantum_computing": ["quantum", "quantum computing", "qiskit"],
    "edge_computing": ["edge computing", "edge devices"],
    "iot": ["iot", "internet of things", "smart devices"],
    "ar_vr": ["ar", "vr", "augmented reality", "virtual reality", "metaverse"],
    "5g": ["5g", "telecommunications"],
    "general": ["software", "engineering", "development"],
}

# ============================================================================
# CLASSIFICATION FUNCTIONS (REWRITTEN with Priority Matching)
# ============================================================================


def find_category_by_keywords(
    title: str, description: str = "", job_function: str = ""
) -> str:
    """
    Match category based on keywords with PRIORITY ordering.

    Strategy:
    1. Sort by priority (1 = highest)
    2. Match in priority order
    3. Return first match

    This ensures specific categories (e.g., "Restaurant Manager")
    are matched before general ones (e.g., "Operations Manager").

    Returns:
        Category key or 'other'
    """
    text = f"{title} {description} {job_function}".lower()

    # Sort by priority (lower number = higher priority)
    sorted_categories = sorted(CATEGORY_KEYWORDS_PRIORITIZED, key=lambda x: x[2])

    # Check in priority order
    for category, keywords, priority in sorted_categories:
        for keyword in keywords:
            if keyword.lower() in text:
                return category

    # Check for obvious non-tech indicators
    non_tech_indicators = [
        "groundskeeper",
        "janitor",
        "cleaner",
        "landscaping",
        "gardener",
        "custodian",
        "housekeeper",
        "maintenance worker",
        "driver",
        "delivery driver",
        "truck driver",
        "forklift",
        "cashier",
        "stocker",
        "bagger",
        "cook",
        "chef",
        "kitchen",
        "line cook",
        "prep cook",
        "bartender",
        "server",
        "waiter",
        "waitress",
        "security guard",
        "security officer",
        "leasing agent",
        "property manager",
        "salon",
        "stylist",
        "barber",
        "mechanic",
        "auto technician",
    ]

    if any(indicator in text for indicator in non_tech_indicators):
        return "other"

    # Default: assume tech if we can't determine
    return "software_general"


def find_industry_by_keywords(
    company_industry: str = "", company_name: str = "", job_category: str = ""
) -> str:
    """
    Match industry based on company_industry field, company name, and job category.

    Args:
        company_industry: Company's industry from JobSpy
        company_name: Company name
        job_category: Job category (used for fallback inference)

    Returns:
        Industry key or inferred industry
    """
    text = f"{company_industry} {company_name}".lower()

    # Exact match first
    for industry, keywords in INDUSTRY_KEYWORDS.items():
        for keyword in keywords:
            if keyword.lower() in text:
                return industry

    # Fallback: Infer from job category
    category_to_industry = {
        # Healthcare
        "healthcare_nursing": "healthcare",
        "healthcare_physician": "healthcare",
        "healthcare_allied": "healthcare",
        "healthcare_admin": "healthcare",
        "healthcare_clinical": "healthcare",
        "pharmacy_pharmacist": "healthcare",
        "pharmacy_technician": "healthcare",
        # Finance
        "finance_analyst": "finance",
        "finance_accounting": "finance",
        "finance_investment": "finance",
        "finance_risk": "finance",
        "finance_compliance": "finance",
        # Manufacturing
        "manufacturing_engineer": "manufacturing",
        "manufacturing_process": "manufacturing",
        "manufacturing_production": "manufacturing",
        "manufacturing_quality": "manufacturing",
        "manufacturing_supervisor": "manufacturing",
        "manufacturing_electrical": "manufacturing",
        "manufacturing_mechanical": "manufacturing",
        "manufacturing_civil": "construction",
        # Retail & Hospitality
        "retail_store_manager": "retail",
        "retail_assistant_manager": "retail",
        "retail_shift_manager": "retail",
        "sales_retail": "retail",
        "restaurant_manager": "hospitality",
        "restaurant_assistant_manager": "hospitality",
        "hospitality_manager": "hospitality",
        # Operations
        "operations_manager": "manufacturing",
        "operations_supply_chain": "transportation",
        "operations_warehouse": "transportation",
        "operations_procurement": "manufacturing",
        "operations_quality": "manufacturing",
        "operations_dispatch": "transportation",
        "operations_coordinator": "consulting",
        # Construction
        "construction_pm": "construction",
        "construction_estimator": "construction",
        "construction_manager": "construction",
        # Sales & Marketing
        "sales_account_exec": "technology",
        "sales_business_dev": "technology",
        "marketing_digital": "technology",
        "marketing_content": "media",
        "marketing_brand": "media",
        "marketing_social": "media",
        # HR
        "hr_recruiter": "consulting",
        "hr_generalist": "consulting",
        "hr_compensation": "consulting",
        # Education
        "education_teacher": "education",
        "education_trainer": "education",
        "education_admin": "education",
        # Legal
        "legal_attorney": "consulting",
        "legal_paralegal": "consulting",
        "legal_compliance": "consulting",
        # Customer Service
        "customer_service_rep": "technology",
        "customer_service_manager": "technology",
        "customer_support_tech": "technology",
        # Administrative
        "administrative_executive": "consulting",
        "administrative_assistant": "consulting",
        # Design
        "design_graphic": "media",
        "design_ui_ux": "technology",
        "design_art": "media",
        "creative_copywriter": "media",
    }

    if job_category in category_to_industry:
        return category_to_industry[job_category]

    return "technology"  # Final default


def find_specialties_by_keywords(
    title: str, description: str = "", skills: List[str] = None
) -> List[str]:
    """
    Match specialties based on keywords.
    Can return multiple specialties.

    Returns:
        List of specialty keys (up to 5)
    """
    text = f"{title} {description}".lower()
    if skills:
        text += " " + " ".join(skills).lower()

    matched = []

    for specialty, keywords in SPECIALTY_KEYWORDS.items():
        for keyword in keywords:
            if keyword.lower() in text:
                matched.append(specialty)
                break  # Only match once per specialty

    # Return top 5 most relevant
    return matched[:5] if matched else ["general"]


# ============================================================================
# DISPLAY NAMES
# ============================================================================


def get_category_display_name(category_key: str) -> str:
    """Get human-readable category name"""
    return CATEGORIES.get(category_key, "Other")


def get_industry_display_name(industry_key: str) -> str:
    """Get human-readable industry name"""
    return INDUSTRIES.get(industry_key, "Other")


def get_specialty_display_names(specialty_keys: List[str]) -> List[str]:
    """Get human-readable specialty names"""
    return [SPECIALTIES.get(key, "General") for key in specialty_keys]


# ============================================================================
# VALIDATION
# ============================================================================


def validate_classification(
    category: str, industry: str, specialties: List[str]
) -> bool:
    """
    Validate that classification values are valid.

    Returns:
        True if all values are valid
    """
    if category not in CATEGORIES:
        return False

    if industry not in INDUSTRIES:
        return False

    for specialty in specialties:
        if specialty not in SPECIALTIES:
            return False

    return True
