"""
Projects CRUD endpoints - Achievements 页面 (Projects 部分)
Phase 7.0 - 匹配前端字段
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.fuckwork.api.auth import get_current_user
from src.fuckwork.database import User, UserProject, get_db

router = APIRouter(prefix="/api/users/me/projects", tags=["profile", "projects"])


# =============================================================================
# Request/Response Models - 匹配前端字段
# =============================================================================


class ProjectRequest(BaseModel):
    """Project 请求"""

    project_name: str
    role: Optional[str] = None  # "Lead Developer"
    start_month: Optional[str] = None  # "January", etc.
    start_year: Optional[int] = None
    end_month: Optional[str] = None
    end_year: Optional[int] = None
    is_ongoing: bool = False  # "This project is ongoing"
    project_url: Optional[str] = None  # "https://myproject.com"
    repo_url: Optional[str] = None  # "https://github.com/user/repo"
    description: Optional[str] = None
    technologies: Optional[List[str]] = None  # ["React", "Node.js", "PostgreSQL"]


class ProjectResponse(BaseModel):
    """Project 响应"""

    id: int
    project_name: str
    role: Optional[str] = None
    start_month: Optional[str] = None
    start_year: Optional[int] = None
    end_month: Optional[str] = None
    end_year: Optional[int] = None
    is_ongoing: bool = False
    project_url: Optional[str] = None
    repo_url: Optional[str] = None
    description: Optional[str] = None
    technologies: Optional[List[str]] = None

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    """Project 列表响应"""

    projects: List[ProjectResponse]
    total: int


# =============================================================================
# Endpoints
# =============================================================================


@router.get("", response_model=ProjectListResponse)
def list_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """获取当前用户的所有项目"""
    projects = (
        db.query(UserProject)
        .filter(UserProject.user_id == current_user.id)
        .order_by(UserProject.start_year.desc().nullslast(), UserProject.id.desc())
        .all()
    )
    return ProjectListResponse(
        projects=[ProjectResponse.model_validate(p) for p in projects],
        total=len(projects),
    )


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    request: ProjectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """添加新项目"""
    project = UserProject(
        user_id=current_user.id,
        project_name=request.project_name,
        role=request.role,
        start_month=request.start_month,
        start_year=request.start_year,
        end_month=request.end_month,
        end_year=request.end_year,
        is_ongoing=request.is_ongoing,
        project_url=request.project_url,
        repo_url=request.repo_url,
        description=request.description,
        technologies=request.technologies,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return ProjectResponse.model_validate(project)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取指定项目"""
    project = (
        db.query(UserProject)
        .filter(UserProject.id == project_id, UserProject.user_id == current_user.id)
        .first()
    )

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return ProjectResponse.model_validate(project)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    request: ProjectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新项目"""
    project = (
        db.query(UserProject)
        .filter(UserProject.id == project_id, UserProject.user_id == current_user.id)
        .first()
    )

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # 更新字段
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)

    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除项目"""
    project = (
        db.query(UserProject)
        .filter(UserProject.id == project_id, UserProject.user_id == current_user.id)
        .first()
    )

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    db.delete(project)
    db.commit()

    return None
