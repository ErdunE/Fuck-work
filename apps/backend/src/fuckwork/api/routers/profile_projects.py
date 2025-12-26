"""
Projects CRUD endpoints for Phase 5.2.
Manages user project portfolio.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.fuckwork.api.auth import get_current_user
from src.fuckwork.database import User, UserProject, get_db

router = APIRouter(prefix="/api/users/me/projects", tags=["profile", "projects"])


# Request/Response Models


class ProjectRequest(BaseModel):
    """Project entry request."""

    project_name: str
    role: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[str] = None


class ProjectResponse(BaseModel):
    """Project entry response."""

    id: int
    project_name: str
    role: Optional[str]
    description: Optional[str]
    tech_stack: Optional[str]

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    """Project list response."""

    projects: List[ProjectResponse]
    total: int


# Endpoints


@router.get("", response_model=ProjectListResponse)
def list_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all project entries for current user."""
    projects = db.query(UserProject).filter(UserProject.user_id == current_user.id).all()
    return ProjectListResponse(
        projects=[ProjectResponse.from_orm(p) for p in projects], total=len(projects)
    )


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    request: ProjectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add new project entry."""
    project = UserProject(
        user_id=current_user.id,
        project_name=request.project_name,
        role=request.role,
        description=request.description,
        tech_stack=request.tech_stack,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return ProjectResponse.from_orm(project)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    request: ProjectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update project entry."""
    project = (
        db.query(UserProject)
        .filter(UserProject.id == project_id, UserProject.user_id == current_user.id)
        .first()
    )

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project entry not found")

    # Update fields
    update_data = request.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)

    return ProjectResponse.from_orm(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete project entry."""
    project = (
        db.query(UserProject)
        .filter(UserProject.id == project_id, UserProject.user_id == current_user.id)
        .first()
    )

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project entry not found")

    db.delete(project)
    db.commit()

    return None
