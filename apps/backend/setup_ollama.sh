#!/bin/bash
# Setup script for Ollama and deepseek-r1:7b

echo "==================================================================="
echo "Ollama Setup for Phase 3.4"
echo "==================================================================="

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "✗ Ollama is not installed"
    echo ""
    echo "Install Ollama:"
    echo "  macOS: brew install ollama"
    echo "  Linux: curl -fsSL https://ollama.com/install.sh | sh"
    echo "  Or visit: https://ollama.com/download"
    exit 1
fi

echo "✓ Ollama is installed"

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo ""
    echo "⚠️  Ollama is not running"
    echo "Start Ollama with: ollama serve"
    echo ""
    read -p "Start Ollama now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ollama serve &
        sleep 5
    else
        exit 1
    fi
fi

echo "✓ Ollama is running"

# Check if deepseek-r1:7b is available
if ollama list | grep -q "deepseek-r1:7b"; then
    echo "✓ deepseek-r1:7b is already installed"
else
    echo ""
    echo "Pulling deepseek-r1:7b model (this may take a few minutes)..."
    ollama pull deepseek-r1:7b
    
    if [ $? -eq 0 ]; then
        echo "✓ deepseek-r1:7b installed successfully"
    else
        echo "✗ Failed to pull deepseek-r1:7b"
        exit 1
    fi
fi

echo ""
echo "==================================================================="
echo "✓ Ollama setup complete"
echo "==================================================================="
echo ""
echo "Test Ollama:"
echo "  curl http://localhost:11434/api/generate -d '{\"model\":\"deepseek-r1:7b\",\"prompt\":\"test\",\"stream\":false}'"
echo ""

