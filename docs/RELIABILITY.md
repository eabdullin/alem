# RELIABILITY

Reliability posture and hardening plan for `alem`.

## Reliability Goals

- chat requests should complete consistently for valid API keys
- agent-mode web search requests should complete consistently for supported providers
- attachment upload/read/open/delete should be durable and recoverable
- chat history should remain intact across app restarts
- settings changes should persist without silent data loss

## Current Reliability Characteristics

- desktop local-first architecture reduces network dependencies
- chat history persisted in local storage with normalization
- attachment files stored on disk with metadata mapping
- IPC boundary is explicit, reducing hidden renderer/main coupling
- agent mode uses bounded tool loops (`stepCountIs`) to prevent runaway iterations

## Known Gaps

- no automated end-to-end regression suite yet
- limited structured telemetry for failure analysis
- no explicit migration versioning for settings/store schemas
- no sync conflict handling yet (future storage providers)
- no dedicated agent-mode regression tests per provider

## Reliability Backlog

1. Add smoke test coverage for chat and attachment workflows
2. Add smoke test coverage for Ask vs Agent flows across providers
3. Add structured error instrumentation around tool-loop and provider tool failures
4. Introduce schema versioning/migrations for persisted data
5. Define recovery playbooks for attachment metadata drift
6. Add guardrails for long-running future agent runs

## Incident Template

- Date:
- Symptom:
- User impact:
- Root cause:
- Mitigation:
- Follow-up actions:
