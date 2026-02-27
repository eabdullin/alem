# Tech Debt Tracker

Track debt items with impact and remediation plans.

| ID | Area | Debt | Impact | Priority | Owner | Status | Target Date |
|----|------|------|--------|----------|-------|--------|-------------|
| TD-001 | Chat Flow | Attachment handling logic is duplicated in `HomePage/Main` and `useQurtChat` | Inconsistent behavior and harder maintenance | High | TBD | Open | 2026-03 |
| TD-002 | Testing | No automated end-to-end test path for chat + attachments | Regressions can ship unnoticed | High | TBD | Open | 2026-03 |
| TD-003 | Persistence | No formal schema migration/versioning for local stored settings/history | Potential breakage across app updates | Medium | TBD | Open | 2026-04 |
| TD-004 | Observability | Error instrumentation is limited for provider/IPC failures | Slower debugging and incident response | Medium | TBD | Open | 2026-04 |
| TD-005 | Architecture | Future agent mode lacks formal permission/audit design | Security and trust risk when tool execution lands | High | TBD | Open | 2026-04 |
| TD-006 | Agent UX | Agent mode does not yet expose a detailed per-step tool action transcript in chat UI | Lower transparency and harder troubleshooting for failed runs | Medium | TBD | Open | 2026-04 |
| TD-007 | Terminal tool | Per-run approval for boundary violations (new domain, write outside workspace, system packages) not implemented; network allowlist not enforced; child process can still read files outside workspace | Users cannot approve risky runs; network/read sandboxing incomplete | Medium | TBD | Open | 2026-04 |
| TD-008 | Browser tool | Sites with captcha, anti-bot, or heavy JS may block or fail; no multi-tab orchestration; no file upload/download hooks | Some workflows (e.g. certain government portals) may require manual steps | Low | TBD | Open | 2026-05 |
| TD-009 | Testing | `browser-screenshot-prune.test.ts` has 4 failing tests; expectations may not match current implementation | Test suite incomplete | Medium | TBD | Open | 2026-03 |
| TD-010 | Tooling | No ESLint config; `npm run lint` fails with "couldn't find configuration file" | Lint gate not usable | Medium | TBD | Open | 2026-03 |
| TD-011 | Agent / API | Images from tools on OpenAI-compatible chat completion APIs serialize base64 to JSON, exhausting context window; image understanding works but long runs with many tool images fail | Context limit errors when tools return images | High | TBD | Open | TBD |
| TD-012 | Agent / SDK | AI SDK has no support for defining provider-executed tools (e.g. web_search for Kimi K2.5) | Provider-native tools like Kimi web search cannot be used | Medium | TBD | Open | TBD |

## Notes

- Link related execution plans in `active/`.
- Move finalized plan docs to `completed/` with short outcome summaries.
- Refactor continuation (2026-02): Config alignment, shared tool contracts, tree cleanup, and docs parity completed. See `docs/exec-plans/completed/refactor-continuation-2026-02.md` for outcome summary.
- Chat feature architecture (2026-02): Split monolithic `useChatPageController` into focused hooks (`useChatRouteState`, `useChatSession`, `useChatRuntime`, `useChatMetrics`, `useCheckpointRestoreFlow`, `useBrowserChatBinding`); moved message-part helpers to `@/lib/chat/messageParts`; made `UserMessageItem` and `ToolStepItem` presentational.
- UI consistency (2026-02): Unified typography to Inter; migrated all HeadlessUI usage to Radix primitives; legacy Select, Modal, Actions, Switch, Checkbox, Radio are now Radix-backed adapters; removed `@headlessui/react` and `@headlessui/tailwindcss`; see `docs/FRONTEND.md` for typography usage.
- Dark theme (2026-02): Added `[data-theme="dark"]` selector to `globals.css` so CSS variables apply when Chakra uses data-theme; improved chat history checkbox and secondary text contrast in dark mode; documented dark theme usage in `docs/FRONTEND.md`.
- Component cleanup (2026-02): Removed unused legacy components (Export, Adjust, Users, Feedback, AddChatList, Question, Menu) and `constants/export.tsx`; kept `ui/` and `ai-elements/` as requested.
