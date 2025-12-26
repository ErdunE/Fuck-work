"""
AI answer generation endpoints.
Phase 3.4 - Local LLM via Ollama.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.fuckwork.core.ai import generate_answer
from src.fuckwork.core.ai.schemas import AnswerRequest, AnswerResponse
from src.fuckwork.database import User, get_db

router = APIRouter()


@router.post("/answer", response_model=AnswerResponse)
def generate_ai_answer(request: AnswerRequest, db: Session = Depends(get_db)):
    """
    Generate AI answer to application question using user's knowledge.

    Uses local Ollama (deepseek-r1:7b) for zero-cost inference.
    Strictly grounded in user data - will not hallucinate.

    **Context Types:**
    - `job_application`: Formal application question
    - `recruiter`: Conversational recruiter question
    - `general`: General question

    **Confidence Levels:**
    - `low`: Missing key information
    - `medium`: Partial information available
    - `high`: Comprehensive information available
    """
    # Verify user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate answer
    try:
        result = generate_answer(
            user_id=request.user_id,
            question=request.question,
            context_type=request.context_type,
            db=db,
        )
        return result

    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Answer generation failed: {str(e)}")
