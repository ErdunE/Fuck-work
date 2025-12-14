"""
Test AI answer generation with local Ollama.
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"


def test_ollama_availability():
    """Test if Ollama is running"""
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "deepseek-r1:7b", "prompt": "test", "stream": False},
            timeout=10
        )
        if response.status_code == 200:
            print("✓ Ollama is running and deepseek-r1:7b is available")
            return True
        else:
            print(f"✗ Ollama responded with status {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Ollama not available: {e}")
        print("  Start Ollama with: ollama serve")
        print("  Pull model with: ollama pull deepseek-r1:7b")
        return False


def test_application_question(user_id: int):
    """Test answering job application question"""
    payload = {
        "user_id": user_id,
        "question": "Why are you a good fit for this software engineering role?",
        "context_type": "job_application"
    }
    
    print(f"\n{'='*80}")
    print("TEST: Job Application Question")
    print(f"{'='*80}")
    print(f"Question: {payload['question']}")
    print()
    
    response = requests.post(f"{BASE_URL}/ai/answer", json=payload, timeout=120)
    
    if response.status_code == 200:
        result = response.json()
        print(f"Answer:\n{result['answer']}")
        print()
        print(f"Confidence: {result['confidence']}")
        print(f"Sources Used: {', '.join(result['sources_used'])}")
        print(f"Model: {result['model_used']}")
        print(f"{'='*80}")
        return True
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)
        return False


def test_project_question(user_id: int):
    """Test answering project-related question"""
    payload = {
        "user_id": user_id,
        "question": "Describe a challenging project you worked on and how you handled it.",
        "context_type": "job_application"
    }
    
    print(f"\n{'='*80}")
    print("TEST: Project Question")
    print(f"{'='*80}")
    print(f"Question: {payload['question']}")
    print()
    
    response = requests.post(f"{BASE_URL}/ai/answer", json=payload, timeout=120)
    
    if response.status_code == 200:
        result = response.json()
        print(f"Answer:\n{result['answer']}")
        print()
        print(f"Confidence: {result['confidence']}")
        print(f"Sources Used: {', '.join(result['sources_used'])}")
        print(f"{'='*80}")
        return True
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)
        return False


def test_missing_info_question(user_id: int):
    """Test handling of question with missing information"""
    payload = {
        "user_id": user_id,
        "question": "What is your experience with underwater basket weaving?",
        "context_type": "job_application"
    }
    
    print(f"\n{'='*80}")
    print("TEST: Missing Information Handling")
    print(f"{'='*80}")
    print(f"Question: {payload['question']}")
    print()
    
    response = requests.post(f"{BASE_URL}/ai/answer", json=payload, timeout=120)
    
    if response.status_code == 200:
        result = response.json()
        print(f"Answer:\n{result['answer']}")
        print()
        print(f"Confidence: {result['confidence']}")
        print("Expected: Should indicate information not available")
        print(f"{'='*80}")
        return True
    else:
        print(f"✗ Failed: {response.status_code}")
        return False


if __name__ == "__main__":
    print("="*80)
    print("FuckWork AI Answer Tests - Phase 3.4")
    print("="*80)
    
    # Check Ollama availability first
    if not test_ollama_availability():
        print("\n⚠️  Ollama is not running. Start it and try again.")
        exit(1)
    
    # Use existing user from Phase 3.3
    USER_ID = 1
    
    try:
        # Test various question types
        test_application_question(USER_ID)
        test_project_question(USER_ID)
        test_missing_info_question(USER_ID)
        
        print("\n" + "="*80)
        print("✓ All AI answer tests completed")
        print("="*80)
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()

