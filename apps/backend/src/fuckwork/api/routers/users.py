"""
User profile and knowledge management endpoints.
Phase 3.3 - User Foundation Layer.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.fuckwork.database import get_db
from src.fuckwork.database import (
    User,
    UserProfile,
    UserEducation,
    UserExperience,
    UserProject,
    UserSkill,
    UserKnowledgeEntry,
)
from src.fuckwork.api.models_user import (
    UserCreate,
    UserResponse,
    UserProfileUpdate,
    UserProfileResponse,
    EducationCreate,
    EducationResponse,
    ExperienceCreate,
    ExperienceResponse,
    ProjectCreate,
    ProjectResponse,
    SkillCreate,
    SkillResponse,
    KnowledgeEntryCreate,
    KnowledgeEntryResponse,
    FullUserProfileResponse,
)

router = APIRouter()


# User Account Management


@router.post("", response_model=UserResponse, status_code=201)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user account.
    Email only for now - no authentication.
    """
    # Check if email exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(email=user_data.email)
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.get("/{user_id}", response_model=FullUserProfileResponse)
def get_full_user_profile(user_id: int, db: Session = Depends(get_db)):
    """
    Get complete user profile with all structured and unstructured data.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return FullUserProfileResponse(
        user=user,
        profile=user.profile,
        education=user.education,
        experience=user.experience,
        projects=user.projects,
        skills=user.skills,
        knowledge_entries=user.knowledge_entries,
    )


# Core Profile Management


@router.put("/{user_id}/profile", response_model=UserProfileResponse)
def update_profile(
    user_id: int, profile_data: UserProfileUpdate, db: Session = Depends(get_db)
):
    """
    Update or create user core profile.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get or create profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)

    # Update fields
    for field, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return profile


# Education Management


@router.post("/{user_id}/education", response_model=EducationResponse, status_code=201)
def add_education(
    user_id: int, education_data: EducationCreate, db: Session = Depends(get_db)
):
    """
    Add education entry.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    education = UserEducation(user_id=user_id, **education_data.model_dump())
    db.add(education)
    db.commit()
    db.refresh(education)

    return education


# Experience Management


@router.post(
    "/{user_id}/experience", response_model=ExperienceResponse, status_code=201
)
def add_experience(
    user_id: int, experience_data: ExperienceCreate, db: Session = Depends(get_db)
):
    """
    Add work experience entry.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    experience = UserExperience(user_id=user_id, **experience_data.model_dump())
    db.add(experience)
    db.commit()
    db.refresh(experience)

    return experience


# Project Management


@router.post("/{user_id}/projects", response_model=ProjectResponse, status_code=201)
def add_project(
    user_id: int, project_data: ProjectCreate, db: Session = Depends(get_db)
):
    """
    Add project entry.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    project = UserProject(user_id=user_id, **project_data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)

    return project


# Skills Management


@router.post("/{user_id}/skills", response_model=SkillResponse, status_code=201)
def add_skill(user_id: int, skill_data: SkillCreate, db: Session = Depends(get_db)):
    """
    Add skill entry.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    skill = UserSkill(user_id=user_id, **skill_data.model_dump())
    db.add(skill)
    db.commit()
    db.refresh(skill)

    return skill


# Knowledge Base Management


@router.post(
    "/{user_id}/knowledge", response_model=KnowledgeEntryResponse, status_code=201
)
def add_knowledge_entry(
    user_id: int, knowledge_data: KnowledgeEntryCreate, db: Session = Depends(get_db)
):
    """
    Add unstructured knowledge entry for future AI reasoning.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    entry = UserKnowledgeEntry(user_id=user_id, **knowledge_data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return entry
