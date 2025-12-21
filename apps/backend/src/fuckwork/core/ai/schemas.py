"""
Pydantic schemas for AI answer API.
"""

from pydantic import BaseModel, Field
from typing import List, Literal


class AnswerRequest(BaseModel):
    """Request for AI-generated answer"""
    user_id: int = Field(..., description="User ID")
    question: str = Field(..., min_length=5, max_length=1000, description="Question to answer")
    context_type: Literal["job_application", "recruiter", "general"] = Field(
        "job_application",
        description="Type of context for answer generation"
    )


class AnswerResponse(BaseModel):
    """AI-generated answer with metadata"""
    answer: str = Field(..., description="Generated answer text")
    confidence: Literal["low", "medium", "high"] = Field(..., description="Confidence in answer quality")
    sources_used: List[str] = Field(..., description="Which user data sources were used")
    model_used: str = Field(..., description="LLM model used for generation")
    
    model_config = {"protected_namespaces": ()}

