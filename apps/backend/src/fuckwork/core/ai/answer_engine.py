"""
Core answer engine logic.
Fetches user data, builds context, generates grounded answers.
"""

from typing import Optional, List
from sqlalchemy.orm import Session
from src.fuckwork.database import User, UserProfile, UserEducation, UserExperience, UserProject, UserSkill, UserKnowledgeEntry
from .ollama_client import call_ollama
from .prompt_templates import build_application_prompt, build_recruiter_prompt, build_general_prompt
from .schemas import AnswerResponse
import logging

logger = logging.getLogger(__name__)


def compile_user_context(user_id: int, db: Session, context_filter: Optional[str] = None) -> str:
    """
    Compile user's knowledge into a single context string.
    
    Args:
        user_id: User ID
        db: Database session
        context_filter: Optional filter for knowledge entry types
        
    Returns:
        Formatted context string with all relevant user data
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User {user_id} not found")
    
    context_parts = []
    
    # Profile
    if user.profile:
        p = user.profile
        context_parts.append(f"NAME: {p.first_name} {p.last_name}")
        context_parts.append(f"LOCATION: {p.city}, {p.state}, {p.country}")
        if p.work_authorization:
            context_parts.append(f"WORK AUTHORIZATION: {p.work_authorization}")
    
    # Education
    if user.education:
        context_parts.append("\nEDUCATION:")
        for edu in user.education:
            edu_str = f"- {edu.school_name}"
            if edu.degree:
                edu_str += f", {edu.degree}"
            if edu.major:
                edu_str += f" in {edu.major}"
            if edu.gpa:
                edu_str += f" (GPA: {edu.gpa})"
            context_parts.append(edu_str)
    
    # Experience
    if user.experience:
        context_parts.append("\nWORK EXPERIENCE:")
        for exp in user.experience:
            exp_str = f"- {exp.job_title} at {exp.company_name}"
            if exp.is_current:
                exp_str += " (Current)"
            context_parts.append(exp_str)
            if exp.responsibilities:
                context_parts.append(f"  Responsibilities: {exp.responsibilities}")
    
    # Projects
    if user.projects:
        context_parts.append("\nPROJECTS:")
        for proj in user.projects:
            proj_str = f"- {proj.project_name}"
            if proj.role:
                proj_str += f" ({proj.role})"
            context_parts.append(proj_str)
            if proj.description:
                context_parts.append(f"  {proj.description}")
            if proj.tech_stack:
                context_parts.append(f"  Tech: {proj.tech_stack}")
    
    # Skills
    if user.skills:
        skills_by_category = {}
        for skill in user.skills:
            category = skill.skill_category or "General"
            if category not in skills_by_category:
                skills_by_category[category] = []
            skills_by_category[category].append(skill.skill_name)
        
        context_parts.append("\nSKILLS:")
        for category, skills in skills_by_category.items():
            context_parts.append(f"- {category}: {', '.join(skills)}")
    
    # Knowledge entries (unstructured)
    if user.knowledge_entries:
        # Filter by type if specified
        entries = user.knowledge_entries
        if context_filter:
            entries = [e for e in entries if e.entry_type == context_filter]
        
        if entries:
            context_parts.append("\nADDITIONAL CONTEXT:")
            for entry in entries:
                context_parts.append(f"\n[{entry.entry_type.replace('_', ' ').title()}]")
                context_parts.append(entry.content)
    
    return "\n".join(context_parts)


def assess_confidence(answer: str, user_context: str) -> str:
    """
    Simple heuristic to assess confidence in answer.
    
    Args:
        answer: Generated answer
        user_context: Context used
        
    Returns:
        Confidence level: "low", "medium", or "high"
    """
    # Low confidence indicators
    if "not provided" in answer.lower() or "don't have" in answer.lower():
        return "low"
    
    # Medium confidence: short context or generic answer
    if len(user_context) < 500 or len(answer) < 80:
        return "medium"
    
    # High confidence: substantial context and detailed answer
    return "high"


def extract_sources_used(user_context: str) -> List[str]:
    """
    Extract which sections of user data were included in context.
    
    Args:
        user_context: The compiled context string
        
    Returns:
        List of data sources used
    """
    sources = []
    
    if "EDUCATION:" in user_context:
        sources.append("Education")
    if "WORK EXPERIENCE:" in user_context:
        sources.append("Work Experience")
    if "PROJECTS:" in user_context:
        sources.append("Projects")
    if "SKILLS:" in user_context:
        sources.append("Skills")
    if "ADDITIONAL CONTEXT:" in user_context:
        sources.append("Knowledge Base")
    
    return sources


def generate_answer(
    user_id: int,
    question: str,
    context_type: str,
    db: Session,
    model: str = "deepseek-r1:7b"
) -> AnswerResponse:
    """
    Generate AI answer to a question using user's knowledge.
    
    Args:
        user_id: User ID
        question: Question to answer
        context_type: Type of context ("job_application", "recruiter", "general")
        db: Database session
        model: LLM model to use
        
    Returns:
        AnswerResponse with generated answer and metadata
    """
    logger.info(f"Generating answer for user {user_id}, question: {question[:50]}...")
    
    # Compile user context
    user_context = compile_user_context(user_id, db)
    
    if not user_context or len(user_context) < 50:
        return AnswerResponse(
            answer="I don't have enough information in my profile to answer this question comprehensively.",
            confidence="low",
            sources_used=[],
            model_used=model
        )
    
    # Build prompt based on context type
    if context_type == "job_application":
        prompt = build_application_prompt(question, user_context)
    elif context_type == "recruiter":
        prompt = build_recruiter_prompt(question, user_context)
    else:
        prompt = build_general_prompt(question, user_context)
    
    # Generate answer via Ollama
    try:
        answer = call_ollama(prompt, model=model, temperature=0.2)
    except Exception as e:
        logger.error(f"Answer generation failed: {e}")
        raise
    
    # Assess confidence and extract sources
    confidence = assess_confidence(answer, user_context)
    sources = extract_sources_used(user_context)
    
    return AnswerResponse(
        answer=answer,
        confidence=confidence,
        sources_used=sources,
        model_used=model
    )

