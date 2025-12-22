"""
AI Answer & Knowledge Reasoning Layer.
Phase 3.4 - Local LLM via Ollama.
"""

from .answer_engine import generate_answer
from .schemas import AnswerRequest, AnswerResponse

__all__ = ["generate_answer", "AnswerRequest", "AnswerResponse"]
