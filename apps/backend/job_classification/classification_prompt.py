"""
LLM-based job classification prompt for edge cases.

Used when rule-based classifier cannot determine classification.
Uses deepseek-r1:7b via Ollama for local, fast inference.
"""

from typing import Dict, Any
import json


def build_classification_prompt(
    title: str,
    company_name: str = "",
    company_industry: str = "",
    job_function: str = "",
    description_snippet: str = "",
    skills: list = None
) -> str:
    """
    Build prompt for LLM job classification.
    
    Requests JSON output with category, industry, and specialties.
    
    Args:
        title: Job title
        company_name: Company name
        company_industry: JobSpy's company_industry field
        job_function: JobSpy's job_function field
        description_snippet: First 500 chars of description (for context)
        skills: List of skills from JobSpy
        
    Returns:
        Complete prompt for LLM
    """
    
    skills_str = ", ".join(skills) if skills else "Not specified"
    
    prompt = f"""You are a job classification expert. Classify the following job posting into precise categories.

JOB INFORMATION:
Title: {title}
Company: {company_name}
Company Industry: {company_industry or 'Not specified'}
Job Function: {job_function or 'Not specified'}
Skills: {skills_str}
Description (first 500 chars): {description_snippet or 'Not available'}

OUTPUT REQUIREMENTS:
Return ONLY a JSON object with these exact keys (no markdown, no explanation):

{{
  "category": "one of: software_backend, software_frontend, software_fullstack, software_mobile, data_science, data_engineering, ml_engineer, ai_research, devops, sre, cloud, product_management, product_design, cybersecurity, or other",
  "industry": "one of: technology, finance, fintech, healthcare, biotech, ecommerce, edtech, media, gaming, automotive, aerospace, energy, consulting, government, or other",
  "specialties": ["list of 1-3 specific technologies/domains, e.g., react, python, aws, kubernetes"],
  "confidence": "high/medium/low"
}}

CLASSIFICATION GUIDELINES:

CATEGORY (Choose ONE most specific):
- software_backend: REST APIs, microservices, server-side, databases
- software_frontend: React, Angular, Vue, HTML/CSS, UI development
- software_fullstack: Both frontend and backend responsibilities
- software_mobile: iOS, Android, React Native, Flutter
- data_science: Statistical analysis, predictive modeling, A/B testing
- data_engineering: ETL, data pipelines, Spark, Kafka, warehousing
- ml_engineer: ML infrastructure, model deployment, MLOps
- ai_research: Research papers, novel algorithms, deep learning research
- devops: CI/CD, automation, infrastructure as code
- sre: Site reliability, production systems, on-call
- cloud: AWS, Azure, GCP, cloud architecture
- product_management: Product strategy, roadmaps, user research
- product_design: UX/UI, design systems, prototyping
- cybersecurity: Security engineering, pentesting, compliance

INDUSTRY (Choose ONE):
- Use company_industry field as primary signal
- Default to "technology" for tech companies
- Be specific (fintech vs finance, biotech vs healthcare)

SPECIALTIES (Choose 1-3):
- List specific technologies mentioned (e.g., python, react, aws)
- Include domain areas (e.g., payments, computer_vision, kubernetes)
- Prioritize most prominent skills
- Maximum 3 specialties

CONFIDENCE:
- high: Clear category from title/function
- medium: Inferred from context
- low: Ambiguous, best guess

RESPOND WITH ONLY THE JSON OBJECT:"""
    
    return prompt


def parse_llm_classification(response: str) -> Dict[str, Any]:
    """
    Parse LLM response into classification dict.
    
    Args:
        response: LLM response (should be JSON)
        
    Returns:
        Dict with category, industry, specialties, confidence
        
    Raises:
        ValueError: If response is not valid JSON or missing required keys
    """
    try:
        # Remove markdown code fences if present
        response = response.strip()
        if response.startswith("```json"):
            response = response.split("```json")[1].split("```")[0].strip()
        elif response.startswith("```"):
            response = response.split("```")[1].split("```")[0].strip()
        
        # Parse JSON
        result = json.loads(response)
        
        # Validate required keys
        required_keys = ["category", "industry", "specialties", "confidence"]
        for key in required_keys:
            if key not in result:
                raise ValueError(f"Missing required key: {key}")
        
        # Validate types
        if not isinstance(result["category"], str):
            raise ValueError("category must be string")
        
        if not isinstance(result["industry"], str):
            raise ValueError("industry must be string")
        
        if not isinstance(result["specialties"], list):
            raise ValueError("specialties must be list")
        
        if result["confidence"] not in ["high", "medium", "low"]:
            result["confidence"] = "medium"  # Default if invalid
        
        return result
        
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM response is not valid JSON: {e}")
    except Exception as e:
        raise ValueError(f"Failed to parse LLM response: {e}")


# Example LLM responses for testing
EXAMPLE_RESPONSES = {
    "backend": {
        "input": {
            "title": "Senior Backend Engineer",
            "company_industry": "Software Development",
            "description": "Build scalable REST APIs using Python and PostgreSQL..."
        },
        "expected_output": {
            "category": "software_backend",
            "industry": "technology",
            "specialties": ["python", "sql", "api_design"],
            "confidence": "high"
        }
    },
    
    "ml_engineer": {
        "input": {
            "title": "Machine Learning Engineer",
            "company_industry": "Financial Services",
            "description": "Deploy ML models for fraud detection using TensorFlow..."
        },
        "expected_output": {
            "category": "ml_engineer",
            "industry": "finance",
            "specialties": ["tensorflow", "deep_learning", "mlops"],
            "confidence": "high"
        }
    },
    
    "ambiguous": {
        "input": {
            "title": "Software Engineer",
            "company_industry": "Technology",
            "description": "Join our team..."
        },
        "expected_output": {
            "category": "software_fullstack",
            "industry": "technology",
            "specialties": ["general"],
            "confidence": "low"
        }
    }
}


def validate_llm_response_format(response_text: str) -> bool:
    """
    Quick check if LLM response looks like valid JSON.
    
    Returns:
        True if response appears valid
    """
    try:
        parse_llm_classification(response_text)
        return True
    except:
        return False
