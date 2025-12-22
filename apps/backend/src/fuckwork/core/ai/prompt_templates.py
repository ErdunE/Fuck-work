"""
Prompt templates for AI answer generation.
Strict grounding rules to prevent hallucination.
"""

SYSTEM_INSTRUCTION = """You are an AI assistant helping a job seeker answer application questions.

CRITICAL RULES (MUST FOLLOW):
1. Use ONLY the information provided in the context below
2. Do NOT invent, guess, or add any facts not present in the context
3. If information is missing or unclear, explicitly state: "This information was not provided in my profile"
4. Be professional, concise, and honest
5. Do NOT embellish or exaggerate
6. Write in first person (I, my, me)
7. Keep answers between 50-150 words unless the question requires more detail

Your goal is to help the user present themselves accurately without fabricating information.
"""


def build_application_prompt(question: str, user_context: str) -> str:
    """
    Build prompt for job application question.

    Args:
        question: The application question to answer
        user_context: User's compiled knowledge and profile data

    Returns:
        Complete prompt with system instruction and context
    """
    prompt = f"""{SYSTEM_INSTRUCTION}

CONTEXT (User's Profile and Knowledge):
{user_context}

APPLICATION QUESTION:
{question}

ANSWER (based ONLY on the context above):"""

    return prompt


def build_recruiter_prompt(question: str, user_context: str) -> str:
    """
    Build prompt for recruiter conversation.
    More conversational tone, still grounded.
    """
    prompt = f"""{SYSTEM_INSTRUCTION}

NOTE: This is a conversation with a recruiter. Be friendly but professional.

CONTEXT (User's Profile and Knowledge):
{user_context}

RECRUITER QUESTION:
{question}

RESPONSE (based ONLY on the context above):"""

    return prompt


def build_general_prompt(question: str, user_context: str) -> str:
    """
    Build prompt for general questions.
    """
    prompt = f"""{SYSTEM_INSTRUCTION}

CONTEXT (User's Profile and Knowledge):
{user_context}

QUESTION:
{question}

ANSWER (based ONLY on the context above):"""

    return prompt
