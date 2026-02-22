# SECURITY

Security notes for `alem`.

## Threat Model (Current)

Sensitive assets:

- user API keys
- user prompts and chat history
- user attachments stored on disk

Primary risks:

- accidental exposure of API keys
- unsafe handling of user-provided files
- unintentional disclosure of prompt content to third-party web search providers
- over-privileged tool execution in future agent mode

## Existing Controls

- API keys are kept in local Electron store, not hardcoded in source
- renderer access to privileged actions goes through preload IPC bridge
- attachments are stored with sanitized file names
- attachment operations are mediated in main process
- agent mode includes web search and a restricted terminal tool (see below)
- terminal tool: filesystem restricted to a configurable workspace directory; command denylist (e.g. rm -rf, sudo); network default-deny; timeout and output caps enforced in main process
- composer mode defaults to `Ask` for each new message, reducing accidental tool use

## Security Requirements

- never log raw API keys
- avoid rendering untrusted file content as executable content
- validate and sanitize all IPC inputs for future expansion
- keep default behavior least-privilege for any tool integrations
- keep agent tool scope minimal and explicit per release

## Terminal Tool Security

- **Workspace restriction**: Commands always run in the configured workspace root (per-chat workspace or setting `terminalWorkspaceRoot` or default Documents); no separate cwd parameter.
- **Command denylist**: Blocks dangerous patterns (e.g. rm -rf, sudo, su, chmod, credential dumps); blocklist in `electron/terminal-runner.ts`.
- **Network**: Default deny; requests with `network: { enabled: true }` are rejected in current version (domain allowlist not yet enforced).
- **Output and time**: Hard caps on `timeout_ms` and `max_output_bytes` enforced in main process.
- **Approval**: Per-run approval for boundary violations (new domain, write outside workspace, etc.) is planned; currently such runs are denied.
- **IPC**: Only `run-terminal` and `get-terminal-workspace-root` channels; request shape validated before execution.

## Future Security Work (Roadmap-Critical)

1. Add key-masking and redaction checks in all error/report paths
2. Add per-run approval UI for terminal (and other tools) when a request would violate a boundary
3. Add user-visible tool action log and approval checkpoints
4. Add security review gate before enabling autonomous local agent mode
5. Add storage-provider threat assessment for sync capabilities

## Security Review Checklist

- [ ] No secrets committed
- [ ] New IPC channels validated and bounded
- [ ] New file operations sanitize inputs and paths
- [ ] Agent/tool actions have user-visible intent and scope
