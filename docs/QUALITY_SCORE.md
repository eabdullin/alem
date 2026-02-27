# QUALITY SCORE

Quality scoring framework for `qurt` releases.

## Scoring Model

Each dimension is scored from 1 (poor) to 5 (excellent). The release score is the average.

| Dimension | What It Measures | Current Target |
|---|---|---|
| Product clarity | UX understandability and user confidence | >= 4 |
| Functional correctness | Core chat/attachment/provider behavior works as expected | >= 4 |
| Reliability | Stability under normal and edge usage | >= 4 |
| Security hygiene | Key handling, sensitive-data safety, and safe defaults | >= 4 |
| Documentation quality | Docs reflect current behavior and roadmap | >= 4 |

## Current Baseline (Initial)

- Product clarity: 3
- Functional correctness: 3
- Reliability: 3
- Security hygiene: 3
- Documentation quality: 4

Baseline notes:

- Strong progress on docs and architecture clarity.
- Testing automation coverage is still limited.
- Reliability/security controls are present but need deeper hardening for upcoming agent features.

## Release Checklist Inputs

- lint status for changed files
- smoke test of chat + attachments
- provider key setup and model switching flow check
- docs touched for architecture or behavior changes
