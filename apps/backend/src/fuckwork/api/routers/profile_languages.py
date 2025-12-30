"""
Languages CRUD endpoints for Phase 6.0.
Manages user language proficiencies.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.fuckwork.api.auth import get_current_user
from src.fuckwork.database import User, UserLanguage, get_db

router = APIRouter(prefix="/api/users/me/languages", tags=["profile", "languages"])


# =============================================================================
# Request/Response Models
# =============================================================================


class LanguageRequest(BaseModel):
    """Language entry request."""

    language_name: str
    proficiency: Optional[str] = None  # native, fluent, professional, conversational, basic


class LanguageResponse(BaseModel):
    """Language entry response."""

    id: int
    language_name: str
    proficiency: Optional[str] = None

    class Config:
        from_attributes = True


class LanguageListResponse(BaseModel):
    """Language list response."""

    languages: List[LanguageResponse]
    total: int


class BulkLanguageRequest(BaseModel):
    """Bulk language update request."""

    languages: List[LanguageRequest]


# =============================================================================
# Endpoints
# =============================================================================


@router.get("", response_model=LanguageListResponse)
def list_languages(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all language entries for current user."""
    languages = db.query(UserLanguage).filter(UserLanguage.user_id == current_user.id).all()
    return LanguageListResponse(
        languages=[LanguageResponse.model_validate(lang) for lang in languages],
        total=len(languages),
    )


@router.post("", response_model=LanguageResponse, status_code=status.HTTP_201_CREATED)
def create_language(
    request: LanguageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add new language entry."""
    # Check for duplicate language
    existing = (
        db.query(UserLanguage)
        .filter(
            UserLanguage.user_id == current_user.id,
            UserLanguage.language_name == request.language_name,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Language '{request.language_name}' already exists",
        )

    language = UserLanguage(
        user_id=current_user.id,
        language_name=request.language_name,
        proficiency=request.proficiency,
    )
    db.add(language)
    db.commit()
    db.refresh(language)

    return LanguageResponse.model_validate(language)


@router.post("/bulk", response_model=LanguageListResponse)
def bulk_update_languages(
    request: BulkLanguageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Bulk update languages - replaces all existing languages with the provided list.
    Useful for syncing the entire language list from frontend.
    """
    # Delete all existing languages
    db.query(UserLanguage).filter(UserLanguage.user_id == current_user.id).delete()

    # Add new languages
    new_languages = []
    for lang_data in request.languages:
        language = UserLanguage(
            user_id=current_user.id,
            language_name=lang_data.language_name,
            proficiency=lang_data.proficiency,
        )
        db.add(language)
        new_languages.append(language)

    db.commit()

    # Refresh all to get IDs
    for lang in new_languages:
        db.refresh(lang)

    return LanguageListResponse(
        languages=[LanguageResponse.model_validate(lang) for lang in new_languages],
        total=len(new_languages),
    )


@router.get("/{language_id}", response_model=LanguageResponse)
def get_language(
    language_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific language entry."""
    language = (
        db.query(UserLanguage)
        .filter(
            UserLanguage.id == language_id,
            UserLanguage.user_id == current_user.id,
        )
        .first()
    )

    if not language:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Language entry not found"
        )

    return LanguageResponse.model_validate(language)


@router.put("/{language_id}", response_model=LanguageResponse)
def update_language(
    language_id: int,
    request: LanguageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update language entry."""
    language = (
        db.query(UserLanguage)
        .filter(
            UserLanguage.id == language_id,
            UserLanguage.user_id == current_user.id,
        )
        .first()
    )

    if not language:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Language entry not found"
        )

    # Check for duplicate if changing name
    if request.language_name != language.language_name:
        existing = (
            db.query(UserLanguage)
            .filter(
                UserLanguage.user_id == current_user.id,
                UserLanguage.language_name == request.language_name,
                UserLanguage.id != language_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Language '{request.language_name}' already exists",
            )

    # Update fields
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(language, field, value)

    db.commit()
    db.refresh(language)

    return LanguageResponse.model_validate(language)


@router.delete("/{language_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_language(
    language_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete language entry."""
    language = (
        db.query(UserLanguage)
        .filter(
            UserLanguage.id == language_id,
            UserLanguage.user_id == current_user.id,
        )
        .first()
    )

    if not language:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Language entry not found"
        )

    db.delete(language)
    db.commit()

    return None
