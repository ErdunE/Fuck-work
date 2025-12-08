# Changelog — FuckWork

All notable changes to this project must be documented in this file.

The format is based on [Semantic Versioning](https://semver.org/):
MAJOR.MINOR.PATCH

-----------------------------------------------

## [Unreleased]

### Added
- Phase 1: Authenticity Scoring Engine
  - RuleEngine with 51 rules across 4 categories (A/B/C/D series)
  - 10 pattern types including custom action_verb_check, extreme_formatting_check, body_shop_pattern_check
  - ScoreFusion with exponential dampening formula and positive signal boost
  - ExplanationEngine for human-readable summaries and red flags
  - AuthenticityScorer integration layer
  - Context-aware weight adjustments for improved accuracy
  - Recruiter signal de-duplication logic
  - A7 rule redesign to eliminate false positives on legitimate tech companies
  - 58 unit tests
  - 47 manual validation tests
  - TUNING_NOTES.md documentation

### Changed
- 

### Fixed
- 

### Removed
- 

-----------------------------------------------
## [v0.1.0] — 2025-12-07
- Initial project scaffolding
- Implemented CI, PR templates, branching strategy

-----------------------------------------------

## Release Checklist
- [ ] Update version number
- [ ] Update changelog
- [ ] Run all tests locally
- [ ] CI passes on dev
- [ ] Merge release/* → main
- [ ] Tag main with version
- [ ] Merge main → dev