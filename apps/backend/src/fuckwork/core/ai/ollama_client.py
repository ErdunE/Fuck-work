"""
Ollama client for local LLM inference.
Minimal wrapper around Ollama HTTP API.
"""

import logging

import requests

logger = logging.getLogger(__name__)

OLLAMA_ENDPOINT = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "deepseek-r1:7b"


def call_ollama(
    prompt: str, model: str = DEFAULT_MODEL, temperature: float = 0.2, timeout: int = 60
) -> str:
    """
    Call Ollama API for text generation.

    Args:
        prompt: Input prompt text
        model: Model name (default: deepseek-r1:7b)
        temperature: Sampling temperature (default: 0.2 for determinism)
        timeout: Request timeout in seconds

    Returns:
        Generated text response

    Raises:
        ConnectionError: If Ollama is not running
        RuntimeError: If generation fails
    """
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": temperature, "top_p": 0.9, "top_k": 40},
    }

    try:
        logger.info(f"Calling Ollama with model: {model}, temp: {temperature}")
        response = requests.post(OLLAMA_ENDPOINT, json=payload, timeout=timeout)
        response.raise_for_status()

        data = response.json()
        generated_text = data.get("response", "")

        if not generated_text:
            raise RuntimeError("Ollama returned empty response")

        logger.info(f"Ollama response received: {len(generated_text)} chars")
        return generated_text.strip()

    except requests.exceptions.ConnectionError as e:
        raise ConnectionError(
            "Cannot connect to Ollama. Is it running? Start with: ollama serve"
        ) from e
    except requests.exceptions.Timeout as e:
        raise RuntimeError(f"Ollama request timed out after {timeout}s") from e
    except Exception as e:
        raise RuntimeError(f"Ollama generation failed: {e}") from e


def test_ollama_connection() -> bool:
    """
    Test if Ollama is running and model is available.

    Returns:
        True if connection successful, False otherwise
    """
    try:
        response = call_ollama("Test prompt", model=DEFAULT_MODEL, timeout=10)
        return len(response) > 0
    except Exception as e:
        logger.error(f"Ollama connection test failed: {e}")
        return False
