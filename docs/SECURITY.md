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
- agent mode includes web search, a restricted terminal tool (see below), a file patch tool (see below), a browser control tool (see below), and a memory tool (see below)
- terminal tool: filesystem restricted to a configurable workspace directory; command denylist (e.g. rm -rf, sudo); network default-deny; timeout and output caps enforced in main process
- composer mode defaults to `Ask` for each new message, reducing accidental tool use

## Security Requirements

- never log raw API keys
- avoid rendering untrusted file content as executable content
- validate and sanitize all IPC inputs for future expansion
- keep default behavior least-privilege for any tool integrations
- keep agent tool scope minimal and explicit per release

## Terminal Tool Security

- **Workspace restriction**: Commands always run in the per-chat workspace root; user must select a workspace folder per chat before running terminal or file-patch commands; no default workspace or separate cwd parameter.
- **Command denylist**: Blocks dangerous patterns (e.g. rm -rf, sudo, su, chmod, credential dumps); blocklist in `src/shared/tools/terminal/denylist.ts`; runner in `src/main/services/terminalRunner.ts`.
- **Network**: Default deny; requests with `network: { enabled: true }` are rejected in current version (domain allowlist not yet enforced).
- **Output and time**: Hard caps on `timeout_ms` and `max_output_bytes` enforced in main process.
- **Approval**: `needsApproval: true`; user must approve each terminal run by default. Scoped options: allow once, allow this tool for this chat, allow all tools for this chat. Auto-approval applies when chat rules match. Per-run approval for boundary violations (new domain, write outside workspace, etc.) is planned; currently such runs are denied.
- **IPC**: `run-terminal`, `apply-file-patch`, `restore-file-patch-checkpoint`, `restore-file-patch-checkpoints`, `browser-set-active-chat`, `browser-close-window`, `browser-execute`, `browser-get-status`, `memory-read-core`, `memory-append-conversation`, `memory-run-command`; request shape validated before execution.

## Browser Tool Security

- **URL restriction**: Only http and https schemes allowed; file:, javascript:, data: and other schemes rejected.
- **One window per chat**: Active-chat-only lifecycle; switching chats closes the previous browser window; no orphaned windows.
- **Sandbox**: Browser window uses `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`.
- **Selector injection**: CSS selectors passed to `executeJavaScript` are JSON-escaped to prevent script injection.
- **Screenshot**: Uses `webContents.capturePage()`; no DOM access for page state; coordinate-based click via `sendInputEvent`.
- **Approval**: `needsApproval: true`; user must approve each browser action run by default. Scoped options: allow once, allow this tool for this chat, allow all tools for this chat, allow this website globally (exact host only). Auto-approval applies when chat rules or global `browserAllowedHosts` match.

## File Patch Tool Security

- **Workspace restriction**: All paths resolved relative to workspace root; `realpath` used to resolve symlinks; paths escaping workspace are rejected.
- **Binary blocking**: Binary file types (e.g. images, archives, executables) blocked by extension; content heuristics (null bytes, non-text ratio) reject ambiguous files.
- **base_hashes**: Optional SHA-256 validation before apply; mismatch rejects that file with explicit reason.
- **Per-file atomicity**: Each file patch is all-or-nothing; failures do not leave partial writes.
- **Checkpoint revert**: Pre-patch state stored before writes; restore via `restore-file-patch-checkpoint` (single) or `restore-file-patch-checkpoints` (batch) IPC; restore deletes messages and reverts all file changes after that user message.
- **Approval**: `needsApproval: true`; user must approve each patch run by default. Scoped options: allow once, allow this tool for this chat, allow all tools for this chat. Auto-approval applies when chat rules match.

## Memory Tool Security

- **Path allowlist**: Only `core.md`, `notes.md`, `conversations.jsonl` under `.memory/` are accessible; no path traversal or arbitrary file access.
- **Storage location**: Memory files under app userData; not in workspace or user-visible directories.
- **No approval**: Memory tool runs without user approval (low-risk writes; user prompts and attachments are not stored raw).
- **IPC**: `memory-read-core`, `memory-append-conversation`, `memory-run-command`; input validated before execution.

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
