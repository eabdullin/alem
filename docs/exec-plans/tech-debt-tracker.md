# Tech Debt Tracker

Track debt items with impact and remediation plans.

| ID | Area | Debt | Impact | Priority | Owner | Status | Target Date |
|----|------|------|--------|----------|-------|--------|-------------|
| TD-001 | Chat Flow | Attachment handling logic is duplicated in `HomePage/Main` and `useAlemChat` | Inconsistent behavior and harder maintenance | High | TBD | Open | 2026-03 |
| TD-002 | Testing | No automated end-to-end test path for chat + attachments | Regressions can ship unnoticed | High | TBD | Open | 2026-03 |
| TD-003 | Persistence | No formal schema migration/versioning for local stored settings/history | Potential breakage across app updates | Medium | TBD | Open | 2026-04 |
| TD-004 | Observability | Error instrumentation is limited for provider/IPC failures | Slower debugging and incident response | Medium | TBD | Open | 2026-04 |
| TD-005 | Architecture | Future agent mode lacks formal permission/audit design | Security and trust risk when tool execution lands | High | TBD | Open | 2026-04 |
| TD-006 | Agent UX | Agent mode does not yet expose a detailed per-step tool action transcript in chat UI | Lower transparency and harder troubleshooting for failed runs | Medium | TBD | Open | 2026-04 |
| TD-007 | Terminal tool | Per-run approval for boundary violations (new domain, write outside workspace, system packages) not implemented; network allowlist not enforced; child process can still read files outside workspace | Users cannot approve risky runs; network/read sandboxing incomplete | Medium | TBD | Open | 2026-04 |

## Notes

- Link related execution plans in `active/`.
- Move finalized plan docs to `completed/` with short outcome summaries.
