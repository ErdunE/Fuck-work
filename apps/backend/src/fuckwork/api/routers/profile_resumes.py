"""
Resumes & Cover Letters CRUD endpoints for Phase 6.0.
Manages user resumes and cover letters with S3 storage.
"""

import uuid
from datetime import datetime
from typing import List, Optional

import boto3
from botocore.config import Config
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.fuckwork.api.auth import get_current_user
from src.fuckwork.config import settings
from src.fuckwork.database import User, UserResume, get_db

router = APIRouter(prefix="/api/users/me/resumes", tags=["profile", "resumes"])

# S3 Configuration
S3_BUCKET = (
    settings.S3_UPLOADS_BUCKET
    if hasattr(settings, "S3_UPLOADS_BUCKET")
    else "fuckwork-dev-uploads-302222527269"
)
S3_REGION = settings.AWS_REGION if hasattr(settings, "AWS_REGION") else "us-east-1"

# Initialize S3 client
s3_client = boto3.client(
    "s3",
    region_name=S3_REGION,
    config=Config(signature_version="s3v4"),
)


# =============================================================================
# Request/Response Models
# =============================================================================


class ResumeRequest(BaseModel):
    """Resume entry request (for creating after upload)."""

    file_name: str
    file_url: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    is_default: bool = False
    is_cover_letter: bool = False


class ResumeResponse(BaseModel):
    """Resume entry response."""

    id: int
    file_name: str
    file_url: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    is_default: bool = False
    is_cover_letter: bool = False
    uploaded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ResumeListResponse(BaseModel):
    """Resume list response."""

    resumes: List[ResumeResponse]
    cover_letters: List[ResumeResponse]
    total: int


class PresignedUrlRequest(BaseModel):
    """Request for presigned upload URL."""

    file_name: str
    file_type: str  # pdf, docx, doc
    is_cover_letter: bool = False


class PresignedUrlResponse(BaseModel):
    """Presigned URL response."""

    upload_url: str
    file_url: str
    file_key: str
    expires_in: int = 3600


class SetDefaultRequest(BaseModel):
    """Set default resume request."""

    resume_id: int


# =============================================================================
# Helper Functions
# =============================================================================


def get_s3_key(user_id: int, file_name: str, is_cover_letter: bool = False) -> str:
    """Generate S3 key for file storage."""
    folder = "cover-letters" if is_cover_letter else "resumes"
    unique_id = str(uuid.uuid4())[:8]
    safe_name = file_name.replace(" ", "_")
    return f"{folder}/{user_id}/{unique_id}_{safe_name}"


def get_file_url(key: str) -> str:
    """Get the S3 URL for a file."""
    return f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{key}"


# =============================================================================
# Endpoints
# =============================================================================


@router.get("", response_model=ResumeListResponse)
def list_resumes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all resumes and cover letters for current user."""
    all_files = db.query(UserResume).filter(UserResume.user_id == current_user.id).all()

    resumes = [r for r in all_files if not r.is_cover_letter]
    cover_letters = [r for r in all_files if r.is_cover_letter]

    return ResumeListResponse(
        resumes=[ResumeResponse.model_validate(r) for r in resumes],
        cover_letters=[ResumeResponse.model_validate(c) for c in cover_letters],
        total=len(all_files),
    )


@router.post("/presigned-url", response_model=PresignedUrlResponse)
def get_presigned_upload_url(
    request: PresignedUrlRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Get a presigned URL for uploading a file to S3.
    Frontend uses this URL to upload directly to S3.
    """
    # Validate file type
    allowed_types = ["pdf", "docx", "doc"]
    file_ext = request.file_type.lower()
    if file_ext not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type must be one of: {', '.join(allowed_types)}",
        )

    # Generate S3 key
    file_key = get_s3_key(current_user.id, request.file_name, request.is_cover_letter)

    # Content type mapping
    content_types = {
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "doc": "application/msword",
    }

    try:
        # Generate presigned URL for PUT
        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": file_key,
                "ContentType": content_types.get(file_ext, "application/octet-stream"),
            },
            ExpiresIn=3600,  # 1 hour
        )

        return PresignedUrlResponse(
            upload_url=presigned_url,
            file_url=get_file_url(file_key),
            file_key=file_key,
            expires_in=3600,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate upload URL: {str(e)}",
        )


@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
def create_resume(
    request: ResumeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a resume/cover letter record after successful S3 upload.
    Call this after uploading to the presigned URL.
    """
    # If this is set as default, unset other defaults
    if request.is_default and not request.is_cover_letter:
        db.query(UserResume).filter(
            UserResume.user_id == current_user.id,
            UserResume.is_cover_letter is False,
            UserResume.is_default is True,
        ).update({"is_default": False})

    resume = UserResume(
        user_id=current_user.id,
        file_name=request.file_name,
        file_url=request.file_url,
        file_type=request.file_type,
        file_size=request.file_size,
        is_default=request.is_default,
        is_cover_letter=request.is_cover_letter,
        uploaded_at=datetime.utcnow(),
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return ResumeResponse.model_validate(resume)


@router.put("/{resume_id}/set-default", response_model=ResumeResponse)
def set_default_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Set a resume as the default (only for resumes, not cover letters)."""
    resume = (
        db.query(UserResume)
        .filter(
            UserResume.id == resume_id,
            UserResume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    if resume.is_cover_letter:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot set cover letter as default resume",
        )

    # Unset other defaults
    db.query(UserResume).filter(
        UserResume.user_id == current_user.id,
        UserResume.is_cover_letter is False,
        UserResume.is_default is True,
    ).update({"is_default": False})

    # Set this one as default
    resume.is_default = True
    db.commit()
    db.refresh(resume)

    return ResumeResponse.model_validate(resume)


@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific resume/cover letter."""
    resume = (
        db.query(UserResume)
        .filter(
            UserResume.id == resume_id,
            UserResume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    return ResumeResponse.model_validate(resume)


@router.get("/{resume_id}/download-url")
def get_download_url(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a presigned download URL for a resume."""
    resume = (
        db.query(UserResume)
        .filter(
            UserResume.id == resume_id,
            UserResume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    # Extract key from URL
    file_key = resume.file_url.split(f"{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/")[-1]

    try:
        presigned_url = s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": file_key,
            },
            ExpiresIn=3600,
        )
        return {"download_url": presigned_url, "expires_in": 3600}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate download URL: {str(e)}",
        )


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a resume/cover letter (also deletes from S3)."""
    resume = (
        db.query(UserResume)
        .filter(
            UserResume.id == resume_id,
            UserResume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    # Extract key from URL and delete from S3
    try:
        file_key = resume.file_url.split(f"{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/")[-1]
        s3_client.delete_object(Bucket=S3_BUCKET, Key=file_key)
    except Exception as e:
        # Log but don't fail - file might already be deleted
        print(f"Warning: Failed to delete S3 object: {e}")

    db.delete(resume)
    db.commit()

    return None
