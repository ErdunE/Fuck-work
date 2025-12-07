# FuckWork — Intelligent Job Application Orchestration System

FuckWork is a hybrid system consisting of:
1. Python backend — Authenticity Scoring Engine and Resume Matching Engine
2. Tauri + React desktop app — Batch Review UI
3. Chrome extension — Job Data Extraction

------------------------------------------
## Project Structure

fuckwork/
  apps/
    backend/                # Python FastAPI Scoring Engine
    desktop_app/            # Tauri + React UI
    browser_extension/      # Chrome Extension (Manifest V3)
  specs/                    # Architecture and Feature Specifications
  tests/                    # Unit & Integration Tests
  .gitignore
  README.md
  requirements.txt
------------------------------------------

## Setup Guide (for Cursor)

### 1. Backend (Python)
cd apps/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

Start backend:
uvicorn main:app --reload --port 5123

### 2. Desktop App (Tauri)
cd apps/desktop_app
npm install
npm run tauri dev

### 3. Chrome Extension
cd apps/browser_extension
npm install
npm run build

------------------------------------------
## Environment Variables

Create `.env` inside apps/backend:

OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

------------------------------------------
## Development Workflow

Backend:
  - Implement RuleEngine
  - Implement ScoreFusion
  - Implement ExplanationEngine
  - Unit tests using authenticity_sample_dataset.json

Desktop App:
  - Build Batch Review List UI
  - Integrate scoring API
  - Keyboard shortcuts
  - Apply Queue

Browser Extension:
  - Extract job data (LinkedIn, Indeed)
  - Send job JSON → backend scoring API
  - Display inline authenticity score and match score

------------------------------------------
## Testing

Backend:
pytest tests/backend

Integration:
pytest tests/integration

------------------------------------------
## Specs Reference

All critical specs are inside the /specs directory:
  - authenticity-scoring-spec.md
  - authenticity_rule_table.json
  - authenticity_sample_dataset.json
  - scoring_algorithm_notes.md

The backend MUST implement exactly what’s defined in these specs.