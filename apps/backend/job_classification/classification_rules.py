"""
Comprehensive job classification rules.

Defines 40+ Categories, 20+ Industries, 100+ Specialties.
Maps keywords to classifications for rule-based classifier.
"""

from typing import Dict, List, Set

# ============================================================================
# CATEGORIES (40+ types)
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
    "biotech": "Biotech / Computational Biology",
    "fintech": "Financial Technology",
    
    # Research & Academia (3 types)
    "research": "Research Scientist",
    "applied_research": "Applied Research",
    "postdoc": "Postdoctoral Research",
    
    # Business & Operations (4 types)
    "business_analyst": "Business Analysis",
    "technical_writing": "Technical Writing",
    "sales_engineering": "Sales Engineering",
    "customer_success": "Customer Success Engineering",
    
    # Other
    "other": "Other / Uncategorized",
}

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
    "consulting": "Consulting & Professional Services",
    "government": "Government & Public Sector",
    "nonprofit": "Nonprofit & Social Impact",
    "other": "Other",
}

# ============================================================================
# SPECIALTIES (100+ types)
# ============================================================================

SPECIALTIES = {
    # Frontend Specialties
    "react": "React",
    "vue": "Vue.js",
    "angular": "Angular",
    "javascript": "JavaScript / TypeScript",
    "web_performance": "Web Performance",
    "ui_frameworks": "UI Frameworks",
    
    # Backend Specialties
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
    
    # Mobile Specialties
    "ios": "iOS (Swift / Objective-C)",
    "android": "Android (Kotlin / Java)",
    "react_native": "React Native",
    "flutter": "Flutter",
    "mobile_gaming": "Mobile Gaming",
    
    # Data Specialties
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
    
    # AI/ML Specialties
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
    
    # Cloud Specialties
    "aws": "Amazon Web Services (AWS)",
    "azure": "Microsoft Azure",
    "gcp": "Google Cloud Platform (GCP)",
    "kubernetes": "Kubernetes",
    "docker": "Docker / Containers",
    "terraform": "Terraform / IaC",
    "cloudformation": "CloudFormation",
    
    # DevOps Specialties
    "ci_cd": "CI/CD Pipelines",
    "jenkins": "Jenkins",
    "github_actions": "GitHub Actions",
    "monitoring": "Monitoring & Observability",
    "prometheus": "Prometheus",
    "grafana": "Grafana",
    "elk": "ELK Stack",
    
    # Security Specialties
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
    
    # Other
    "general": "General / Multiple Specialties",
}

# ============================================================================
# KEYWORD MAPPING (Rule-based Classification)
# ============================================================================

# Category Keywords (title/description matching)
CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "software_backend": [
        "backend", "back-end", "back end",
        "server-side", "api engineer", "microservices",
        "distributed systems", "rest api", "graphql"
    ],
    
    "software_frontend": [
        "frontend", "front-end", "front end",
        "ui engineer", "web developer", "javascript developer",
        "react", "angular", "vue", "html", "css"
    ],
    
    "software_fullstack": [
        "full stack", "fullstack", "full-stack",
        "software engineer",  # Generic term
        "software developer"
    ],
    
    "software_mobile": [
        "mobile", "ios", "android", "swift", "kotlin",
        "react native", "flutter", "mobile app"
    ],
    
    "software_embedded": [
        "embedded", "firmware", "iot", "hardware",
        "rtos", "microcontroller", "fpga"
    ],
    
    "software_game": [
        "game", "unity", "unreal", "graphics",
        "gameplay", "game engine"
    ],
    
    "software_security": [
        "security engineer", "appsec", "cybersecurity",
        "penetration test", "vulnerability", "infosec"
    ],
    
    "software_qa": [
        "qa", "quality assurance", "test engineer",
        "sdet", "automation test", "test automation"
    ],
    
    "data_science": [
        "data scientist", "analytics", "statistical",
        "predictive model", "a/b test"
    ],
    
    "data_engineering": [
        "data engineer", "etl", "data pipeline",
        "data warehouse", "spark", "kafka", "airflow"
    ],
    
    "data_analytics": [
        "data analyst", "business intelligence", "bi",
        "tableau", "power bi", "looker", "sql analyst"
    ],
    
    "ml_engineer": [
        "machine learning engineer", "ml engineer",
        "mlops", "ml infrastructure", "ml platform"
    ],
    
    "ai_research": [
        "ai research", "research scientist", "applied scientist",
        "deep learning research", "ml researcher"
    ],
    
    "nlp": [
        "nlp", "natural language", "text mining",
        "language model", "llm", "gpt", "bert"
    ],
    
    "computer_vision": [
        "computer vision", "cv", "image processing",
        "object detection", "image recognition"
    ],
    
    "robotics": [
        "robotics", "autonomous", "perception",
        "slam", "motion planning", "control systems"
    ],
    
    "devops": [
        "devops", "devsecops", "release engineer",
        "build engineer", "ci/cd"
    ],
    
    "sre": [
        "sre", "site reliability", "infrastructure reliability",
        "production engineer"
    ],
    
    "cloud": [
        "cloud engineer", "aws", "azure", "gcp",
        "cloud architect", "cloud infrastructure"
    ],
    
    "infrastructure": [
        "infrastructure engineer", "systems engineer",
        "network engineer", "storage engineer"
    ],
    
    "platform": [
        "platform engineer", "developer platform",
        "internal tools", "developer experience"
    ],
    
    "product_management": [
        "product manager", "pm", "product lead",
        "product owner", "product strategy"
    ],
    
    "product_design": [
        "product designer", "ux designer", "ui designer",
        "interaction designer", "design systems"
    ],
    
    "blockchain": [
        "blockchain", "web3", "crypto", "defi",
        "smart contract", "solidity", "ethereum"
    ],
    
    "cybersecurity": [
        "security analyst", "soc", "threat",
        "incident response", "forensics"
    ],
    
    "sales_engineering": [
        "sales engineer", "solutions engineer",
        "presales", "technical sales"
    ],
}

# Industry Keywords (company_industry matching)
INDUSTRY_KEYWORDS: Dict[str, List[str]] = {
    "technology": [
        "software", "technology", "internet", "saas",
        "cloud", "tech", "computer"
    ],
    
    "finance": [
        "financial services", "banking", "investment",
        "capital markets", "asset management", "insurance"
    ],
    
    "fintech": [
        "fintech", "payment", "cryptocurrency", "trading platform",
        "digital banking", "mobile payments"
    ],
    
    "healthcare": [
        "healthcare", "hospital", "medical", "health services",
        "clinical", "patient care"
    ],
    
    "biotech": [
        "biotechnology", "biotech", "genomics", "bioinformatics",
        "life sciences", "pharmaceutical research"
    ],
    
    "pharma": [
        "pharmaceutical", "pharma", "drug development",
        "clinical trials"
    ],
    
    "ecommerce": [
        "e-commerce", "ecommerce", "online retail", "marketplace",
        "shopping", "retail technology"
    ],
    
    "edtech": [
        "education", "edtech", "learning", "online education",
        "training platform"
    ],
    
    "media": [
        "media", "entertainment", "streaming", "content",
        "publishing", "broadcasting"
    ],
    
    "gaming": [
        "gaming", "video games", "esports", "game studio"
    ],
    
    "telecom": [
        "telecommunications", "telecom", "wireless", "network provider",
        "5g", "broadband"
    ],
    
    "transportation": [
        "transportation", "logistics", "shipping", "delivery",
        "rideshare", "autonomous vehicles"
    ],
    
    "automotive": [
        "automotive", "automobile", "vehicle", "car manufacturer",
        "electric vehicle", "ev"
    ],
    
    "aerospace": [
        "aerospace", "aviation", "defense", "space",
        "satellite", "aircraft"
    ],
    
    "energy": [
        "energy", "utilities", "renewable", "solar", "wind",
        "oil", "gas", "power"
    ],
    
    "real_estate": [
        "real estate", "proptech", "property management",
        "construction technology"
    ],
    
    "agriculture": [
        "agriculture", "agtech", "farming", "food tech",
        "agricultural technology"
    ],
    
    "manufacturing": [
        "manufacturing", "industrial", "factory", "production",
        "supply chain"
    ],
    
    "consulting": [
        "consulting", "professional services", "advisory",
        "management consulting"
    ],
    
    "government": [
        "government", "public sector", "federal", "state",
        "defense contractor", "civic tech"
    ],
}

# Specialty Keywords (more granular, for skills/tech stack)
SPECIALTY_KEYWORDS: Dict[str, List[str]] = {
    # Frontend
    "react": ["react", "react.js", "reactjs", "next.js", "nextjs"],
    "vue": ["vue", "vue.js", "vuejs", "nuxt"],
    "angular": ["angular", "angularjs"],
    "javascript": ["javascript", "typescript", "js", "ts", "ecmascript"],
    
    # Backend
    "python": ["python", "django", "flask", "fastapi", "python3"],
    "java": ["java", "spring", "spring boot", "hibernate", "jvm"],
    "golang": ["golang", "go", "go lang"],
    "rust": ["rust", "cargo"],
    "nodejs": ["node.js", "node", "nodejs", "express"],
    "ruby": ["ruby", "rails", "ruby on rails"],
    "dotnet": [".net", "c#", "csharp", "asp.net", "dotnet"],
    "cpp": ["c++", "cpp"],
    "scala": ["scala", "akka", "play framework"],
    
    # Mobile
    "ios": ["ios", "swift", "objective-c", "xcode", "cocoa"],
    "android": ["android", "kotlin", "android studio"],
    "react_native": ["react native"],
    "flutter": ["flutter", "dart"],
    
    # Data & Databases
    "sql": ["sql", "mysql", "postgresql", "postgres", "oracle", "sql server"],
    "nosql": ["nosql", "mongodb", "cassandra", "dynamodb", "redis"],
    "spark": ["spark", "pyspark", "apache spark"],
    "kafka": ["kafka", "apache kafka", "event streaming"],
    "airflow": ["airflow", "apache airflow", "workflow orchestration"],
    "tableau": ["tableau", "data visualization"],
    "power_bi": ["power bi", "powerbi"],
    
    # AI/ML
    "deep_learning": ["deep learning", "neural network", "cnn", "rnn", "transformer"],
    "tensorflow": ["tensorflow", "tf", "keras"],
    "pytorch": ["pytorch", "torch"],
    "llm": ["llm", "large language model", "gpt", "bert", "language model"],
    "generative_ai": ["generative ai", "gen ai", "stable diffusion", "dalle"],
    "computer_vision_cv": ["computer vision", "opencv", "image recognition"],
    "nlp_text": ["nlp", "natural language processing", "text mining"],
    "recommendation_systems": ["recommendation", "recommender system", "collaborative filtering"],
    "reinforcement_learning": ["reinforcement learning", "rl", "q-learning"],
    "mlops": ["mlops", "ml ops", "ml infrastructure"],
    
    # Cloud
    "aws": ["aws", "amazon web services", "ec2", "s3", "lambda"],
    "azure": ["azure", "microsoft azure"],
    "gcp": ["gcp", "google cloud", "gke"],
    "kubernetes": ["kubernetes", "k8s", "helm"],
    "docker": ["docker", "container"],
    "terraform": ["terraform", "iac", "infrastructure as code"],
    
    # DevOps
    "ci_cd": ["ci/cd", "continuous integration", "continuous deployment"],
    "jenkins": ["jenkins"],
    "github_actions": ["github actions"],
    "monitoring": ["monitoring", "observability", "apm"],
    "prometheus": ["prometheus"],
    "grafana": ["grafana"],
    "elk": ["elasticsearch", "logstash", "kibana", "elk"],
    
    # Security
    "appsec": ["application security", "appsec", "owasp"],
    "network_security": ["network security", "firewall", "ids", "ips"],
    "cloud_security": ["cloud security", "iam", "secrets management"],
    "penetration_testing": ["penetration testing", "pentest", "ethical hacking"],
    "compliance": ["compliance", "gdpr", "hipaa", "soc2", "pci"],
    "cryptography": ["cryptography", "encryption", "tls", "ssl"],
    
    # Specialized
    "blockchain_web3": ["blockchain", "web3", "smart contract", "solidity", "ethereum"],
    "fintech_payments": ["payments", "fintech", "trading", "financial systems"],
    "healthcare_tech": ["healthcare it", "ehr", "emr", "fhir", "medical devices"],
    "edtech_learning": ["edtech", "lms", "online learning", "mooc"],
    "ecommerce_retail": ["ecommerce", "shopify", "magento", "retail tech"],
    "gaming_engines": ["unity", "unreal engine", "game engine", "godot"],
    "graphics": ["graphics", "opengl", "vulkan", "directx", "rendering"],
    "audio_video": ["audio", "video", "streaming", "codec", "ffmpeg"],
    
    # Infrastructure
    "databases": ["database", "dba", "mysql", "postgresql", "oracle"],
    "networking": ["networking", "tcp/ip", "dns", "bgp", "vpn"],
    "load_balancing": ["load balancing", "nginx", "haproxy"],
    "cdn": ["cdn", "content delivery", "cloudflare", "akamai"],
    
    # Emerging
    "quantum_computing": ["quantum", "quantum computing", "qiskit"],
    "edge_computing": ["edge computing", "edge devices"],
    "iot": ["iot", "internet of things", "smart devices"],
    "ar_vr": ["ar", "vr", "augmented reality", "virtual reality", "metaverse"],
    "5g": ["5g", "telecommunications"],
    
    # General
    "general": ["software", "engineering", "development"],
}

# ============================================================================
# CLASSIFICATION FUNCTIONS
# ============================================================================

def find_category_by_keywords(title: str, description: str = "", job_function: str = "") -> str:
    """
    Match category based on keywords in title/description.
    
    PRIORITY RULES:
    1. Full Stack gets checked FIRST (most specific)
    2. Then other categories
    
    Returns:
        Category key or 'other'
    """
    text = f"{title} {description} {job_function}".lower()
    
    # PRIORITY 1: Check Full Stack FIRST (before backend/frontend)
    fullstack_keywords = ['full stack', 'fullstack', 'full-stack']
    if any(keyword in text for keyword in fullstack_keywords):
        return 'software_fullstack'
    
    # PRIORITY 2: Check all other categories
    for category, keywords in CATEGORY_KEYWORDS.items():
        # Skip fullstack since we already checked it
        if category == 'software_fullstack':
            continue
            
        for keyword in keywords:
            if keyword.lower() in text:
                return category
    
    return "software_general"  # Default for tech jobs


def find_industry_by_keywords(company_industry: str = "", company_name: str = "") -> str:
    """
    Match industry based on company_industry field or company name.
    
    Returns:
        Industry key or 'technology'
    """
    text = f"{company_industry} {company_name}".lower()
    
    # Exact match first
    for industry, keywords in INDUSTRY_KEYWORDS.items():
        for keyword in keywords:
            if keyword.lower() in text:
                return industry
    
    return "technology"  # Default


def find_specialties_by_keywords(title: str, description: str = "", skills: List[str] = None) -> List[str]:
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

def validate_classification(category: str, industry: str, specialties: List[str]) -> bool:
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
