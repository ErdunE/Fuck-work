# FuckWork Engineering Specifications — Phase 1  
## Authenticity Scoring Engine (Primary Module)

**Project:** FuckWork  
**Phase:** 1  
**Component:** Authenticity Scoring Engine  
**Status:** Ready for Implementation  
**Audience:** Cursor (Implementation Engineer), ChatGPT (Chief Architect), Claude (CTO)

---

# 1. Purpose of This Directory

This `/specs` directory contains **all authoritative specification files** required for implementing the FuckWork Phase 1 module:  
➡ **Authenticity Scoring Engine**

All implementations must follow these specs **exactly**, without modification, extension, reinterpretation, or invention.

Cursor must read these files **before any coding**, per `.cursor/rules/*`.

---

# 2. Phase 1 Scope (Strict)

Phase 1 includes **only** the following:

### ✔ Authenticity Scoring Engine  
Consisting of:

1. **RuleEngine**  
   - Load 51 rules from JSON  
   - Apply pattern matching  
   - Produce activated rule list  

2. **ScoreFusion**  
   - Apply exponential dampening formula  
   - Compute authenticity score  
   - Determine confidence + level  

3. **ExplanationEngine**  
   - Generate human-readable explanation  
   - Extract red flags + positive signals  

4. **AuthenticityScorer (Integration Layer)**  
   - Orchestrate all components  
   - Produce final `AuthenticityResult`  

This is the **entire scope** of Phase 1.

Cursor MUST NOT implement anything outside this scope.

---

# 3. Files Included in Phase 1

### 📘 1. `authenticity-scoring-spec.md`  
**Primary technical specification.**  
Defines:
- Component architecture  
- Required classes/methods  
- Data contracts  
- Algorithm descriptions  
- Error handling requirements  
- File structure  
- Required public API  

Cursor must follow this file exactly.

---

### 📊 2. `authenticity_rule_table.json`  
**51-machine-readable rules**, including:
- IDs  
- Descriptions  
- Negative/positive signal  
- Pattern types  
- Weights  
- Data source paths  
- Example activations  

Loaded by RuleEngine at runtime.  

Cursor must NOT modify this file.

---

### 🧪 3. `authenticity_sample_dataset.json`  
Contains **5 full sample jobs** with:
- JobData structures  
- Expected authenticity score  
- Expected level  
- Expected confidence  
- Expected activated signals  

Used only for:  
- Unit tests  
- Integration tests  
- Acceptance validation  

Cursor must ensure accuracy within ±5 score tolerance.

---

### 📄 4. `acceptance-criteria.md`  
Defines what “Phase 1 complete” means.

Includes:
- Functional requirements  
- Performance requirements  
- Test coverage minimum (≥80%)  
- Output correctness  
- Integration behavior  
- Edge case handling  

Cursor must validate completion against this file.

---

### 📘 5. `masterplan.md`  
High-level architectural vision from Claude.  
Not directly implementable.  
Used for context only.  

Cursor must NOT implement features from this file unless also defined in Phase 1 specs.

---

### 📗 6. `PHASE1-COMPLETE.md`  
CTO-level explanation of Phase 1 deliverables and rationale.  
Not executable specifications.  
Cursor reads for context only.

---

# 4. What Cursor MUST Do

Before starting implementation, Cursor must:

### ✔ Read all Phase 1 spec files listed above  
### ✔ Follow `.cursor/rules/*` exactly  
### ✔ Follow Git workflow rules (`branching_strategy.md`)  
### ✔ Follow project structure (`fuck_work_structure.md`)  
### ✔ Start implementation ONLY with:  

RuleEngine → ScoreFusion → ExplanationEngine → Integration

### ✔ Implement EXACTLY what’s in `authenticity-scoring-spec.md`

Cursor MUST NOT:

- ❌ Add new rules  
- ❌ Add new files outside approved directories  
- ❌ Change directory structure  
- ❌ Change APIs  
- ❌ Modify any spec file  
- ❌ Add new dependencies  
- ❌ “Refactor” without approval  
- ❌ Implement future modules (resume matching, browser extension, desktop UI, etc.)

Cursor implements ONLY Phase 1.

---

# 5. Expected Directory Structure for Implementation

Cursor must write code inside:

apps/backend/authenticity_scoring/

Required structure:

authenticity_scoring/
├── init.py
├── rule_engine.py
├── score_fusion.py
├── explanation_engine.py
├── scorer.py
├── data/
│   └── authenticity_rule_table.json
└── tests/
├── init.py
├── test_rule_engine.py
├── test_score_fusion.py
├── test_explanation.py
├── test_integration.py
└── data/
└── authenticity_sample_dataset.json

This structure is required by:
- Phase 1 specs
- `.cursor/rules/filesystem-boundaries.mdc`
- `fuck_work_structure.md`

Cursor must not deviate.

---

# 6. Implementation Entry Point

Cursor should begin implementation by reading:

authenticity-scoring-spec.md (Section 2: RuleEngine)

This is the first task.

---

# 7. Testing Requirements

Cursor must write tests for:

### **Unit Tests**
- RuleEngine pattern types  
- ScoreFusion mathematical accuracy  
- ExplanationEngine output  

### **Integration Tests**
- Full scoring pipeline  
- Validate all 5 sample jobs  
- Ensure ±5 score tolerance  

### **Performance**
- <5 seconds per job  

All tests must pass locally and in CI.

---

# 8. Completion Criteria

Phase 1 is completed only when:

- All acceptance criteria in `acceptance-criteria.md` are satisfied  
- PR into `dev` is approved  
- CI pipeline passes  
- No rule violations in `.cursor/rules/*`  
- Score accuracy validated via sample dataset  
- Test coverage ≥80%  

Cursor must not mark Phase 1 complete without meeting all criteria.

---

# 9. Non-Goals (Strict)

These items are NOT part of Phase 1:

- Resume Matching Engine  
- Browser Extension  
- Desktop App UI  
- Auto-Apply Workflow  
- Embeddings-based analysis  
- Data ingestion  
- Cover letter generation  
- Application orchestration  

Implementing these violates `.cursor/rules/spec-drift-guard.mdc`.

---

# 10. Final Instruction

Cursor MUST treat this directory as **official engineering law** for Phase 1.

If there is any conflict:

Claude > ChatGPT (Architect) > Erdun > Spec Files > Cursor

If anything is unclear, Cursor must:
- STOP  
- Ask for clarification (not assume)  

This document is the authoritative Phase 1 entry point.
