# FuckWork Branching Strategy (Git)

FuckWork uses a strict, industry-grade branching model:
main
dev
feature/*
hotfix/*
release/*

-----------------------------------------------------------
# 1. main
- Only production-ready, stable code.
- No direct commits.
- Only accepts:
    - merge from release/*
    - merge from hotfix/*

Every commit to main must be tagged:
v0.1.0, v0.2.0, etc.

-----------------------------------------------------------
# 2. dev
- The ONLY branch where daily development happens.
- All feature branches merge into dev.
- dev must always remain runnable.

Rules:
- No breaking changes without alignment
- Commit messages follow conventional commits

-----------------------------------------------------------
# 3. feature/*
Feature branches follow the pattern:

feature/auth-scoring-engine  
feature/extension-parsing  
feature/batch-review-ui  
feature/resume-matching

Rules:
- Created from dev
- Merged into dev via PR
- PR must pass:
    - lint
    - tests
    - spec compliance

-----------------------------------------------------------
# 4. release/*
When dev accumulates enough features and is stable:

git checkout -b release/v0.1.0 dev

Release branch jobs:
- version bump
- documentation fixes
- CHANGELOG update
- final polishing

Merged:
- into main (→ becomes official release)
- into dev (to sync version bump)

-----------------------------------------------------------
# 5. hotfix/*
When a bug is found in main:

git checkout -b hotfix/login-crash main

Hotfix branch jobs:
- fix the critical issue
- bump patch version

Merged:
- into main
- into dev

-----------------------------------------------------------
# 6. Commit Message Rules (Conventional Commits)

feat: add authenticity rule engine  
fix: wrong parsing for LinkedIn  
docs: add architecture diagram  
chore: update .gitignore  
refactor: improve score fusion  
test: add case for job-with-missing-fields  

-----------------------------------------------------------
# 7. Pull Request Rules

Every PR must include:
- What was changed
- Which spec file it follows
- Before/after behavior
- Any breaking changes (should be none)
- Tests included

PR cannot be merged without:
- Passing tests
- Passing lint
- Spec compliance check

-----------------------------------------------------------
# 8. Protection Rules (Required for Cursor)

Protect main:
- PR required
- Code review required
- Tests must pass
- No direct commits

Protect dev:
- PR required
- Tests must pass
- No direct commits

-----------------------------------------------------------
# 9. Release Tagging

Main branch must be tagged:

v0.1.0  
v0.1.1  
v0.2.0  

Tagging format:
major.minor.patch

-----------------------------------------------------------

# Summary

Daily work → feature/*  
Merge to dev → controlled  
Release → release/*  
Production → main  
Emergency fix → hotfix/*

This ensures FuckWork develops fast without chaos.