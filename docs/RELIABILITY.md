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
- file patch tool creates checkpoints before writes; restore checkpoint reverts all file changes after that user message atomically, deletes that message and all following messages, and puts the user message content back in the prompt input for re-editing; checkpoints pruned with bounded retention
- browser control tool: one window per active chat; switching chats closes the previous window; http/https only; actions (navigate, click_at, type, press, scroll, wait, screenshot, close) use screenshots; input actions focus the browser window before dispatch and scroll targets the last pointer position (or viewport center fallback); screenshots are normalized to viewport dimensions for coordinate consistency; per-run approval required by default; scoped auto-approval (allow once, allow this tool for this chat, allow all tools for this chat, allow this website globally) reduces prompts when user has opted in; prepareStep prunes old screenshots from AI request context (keeps only the last one) to avoid token overflow
- memory tool: files stored under app userData (`.memory/`); bootstrap on startup; path allowlist restricts operations to core.md, notes.md, conversations.jsonl; append failures do not block chat flow; conversation logging is best-effort

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
