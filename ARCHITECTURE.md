# ARCHITECTURE

System architecture for `qurt`.

## Product Shape

`qurt` is a desktop-first AI app that gives users vendor choice:

- bring your own API keys
- pick provider/model per preference
- chat with attachments (files/images)
- run either direct Ask replies or Agent mode with web search, optional terminal (workspace-restricted), and browser control (one window per chat)

## Runtime Layers

1. **Electron main process** (`src/main/`)
   - app lifecycle, window creation, IPC registration, packaged auto-updates via `update-electron-app`
   - files: `src/main/index.ts`, `src/main/windows/mainWindow.ts`, `src/main/ipc/*.ipc.ts`, `src/main/services/*.ts`
   - IPC domains: shell (open-folder-dialog), app (settings, API keys, attachments, memory), terminal, browser, filePatch, update (check-for-updates, apply-update; update-ready/up-to-date events)
2. **Electron preload bridge** (`src/preload/`)
   - safe renderer API exposed via `window.qurt`
   - split by domain: `src/preload/api/*.api.ts`, composed in `src/preload/index.ts`
3. **Renderer (React + Vite)** (`src/renderer/`)
   - routes, UI, chat workflows, settings
   - first-run onboarding is gated in `src/renderer/App.tsx` and rendered as a carousel page in `src/renderer/features/onboarding/`
   - **UI system**: Radix UI primitives in `src/renderer/shared/components/ui/`; typography unified to Inter; legacy wrappers (Select, Modal, Actions, Switch, Checkbox, Radio) are Radix-backed adapters
   - left sidebar owns shared quick actions (search, updates, notifications, settings) across home/chat
   - checkpoint restore: `src/renderer/stores/checkpoint-store.ts`, `src/renderer/services/checkpoint-service.ts`
   - ChatPage: thin composition; `useChatPageController` orchestrates `useChatRouteState`, `useChatSession`, `useChatRuntime`, `useChatMetrics`, `useCheckpointRestoreFlow`, `useBrowserChatBinding`; `ChatMessages`, `ToolStepItem`, `tool-approval-service`
   - files: `src/renderer/main.tsx`, `src/renderer/App.tsx`, `src/renderer/features/**`, `src/renderer/shared/components/**`

## Directory Map

- `src/main/`: Electron main process
  - `index.ts`: app lifecycle, `registerAllIpc()`, auto-update bootstrap (`update-electron-app` -> GitHub Releases; checks every 24h; applies via Settings "Check for Updates" or update-ready toast)
  - `windows/mainWindow.ts`: window creation
  - `ipc/`: IPC handlers by domain (shell, app, terminal, browser, filePatch, update)
  - `services/`: terminalRunner, browserController, filePatchRunner, filePatchCheckpoints, appStore, fileStore, memoryStore
- `src/preload/`: context bridge; `api/` split by domain
- `src/shared/`: safe shared code (types, constants); `tools/` for tool protocol types
- `src/renderer/`: React app
  - `db/`: Dexie schema (`appDb.ts`), repos (`chats.repo.ts`, `chat-groups.repo.ts`), `bootstrap.ts`
  - `agent/tools/`: tool definitions, adapters, display components
  - `features/`: routed pages (chat, home, updatesFaq, settings)
  - `shared/`: components, hooks, constants, lib, utils, types
- `templates/`: prebuilt template pages; do not edit unless explicitly requested
- `landing/`: static marketing landing page (HTML/CSS); deployable to GitHub Pages or any static host
- `docs/faq/`, `docs/updates/`: markdown-driven content for Updates & FAQ UI

## Data And Persistence

- **Settings and API keys**
  - stored in `electron-store` (`qurt-config`) via `appStore` in main process
  - includes active provider/model, enabled models, theme, API key map, `browserAllowedHosts`
  - includes a `hasSeenOnboarding` flag to ensure onboarding is shown only on first run
- **Attachment binaries**
  - saved under app userData (`chat-attachments`)
  - metadata tracked in electron-store `attachments` map
- **Chat history and chat groups**
  - stored in Dexie (IndexedDB) under `qurt-db`; IndexedDB lives in Electron userData by default
  - `src/renderer/db/repos/chats.repo.ts`, `chat-groups.repo.ts`
  - migration from localStorage on first run (`bootstrap.ts`)
  - sessions include `chatGroupIds`, `isArchived`, `toolApprovalRules`
- **Agent memory**
  - stored under app userData (`.memory/`) via `memoryStore` in main process
  - files: `core.md` (injected into system prompt each turn), `notes.md` (archival notes), `conversations.jsonl` (recall history)
  - global across all chats; structured actions tool (view, create, update, search) with strict path allowlist

## AI Provider Flow

- provider/model selection is user-driven in settings and model selector
- chat composer and conversation rendering use shared `ai-elements` primitives
  (`model-selector`, `attachments`, `message`, `conversation`) to keep chat UI
  behavior consistent across home and chat routes
- supported providers: OpenAI, Anthropic, Google, Moonshot AI (Kimi K2.5), xAI (Grok 4)
- xAI uses Responses API (`xai.responses()`) with `web_search` tool; only web search is available (no terminal, browser, file-patch, memory) because server-side tools cannot be mixed with client-side tools
- **`src/renderer/services/provider-service.ts`** is the centralized service for managing AI providers, models, and their configurations:
  - singleton service pattern for consistent provider state
  - handles provider and model resolution, validation, and defaults
  - creates SDK client instances (`createChatModel()`)
  - manages provider-specific settings (reasoning effort, thinking levels) via `createProviderOptions()`
  - creates tool sets including web search (`createWebSearchToolSet()`)
  - provides helper methods for provider validation, model info lookup, and API key management
  - exports `providerService` singleton instance for use across the app
- **`src/renderer/services/ai-service.ts`** now delegates to `providerService` and exposes
  `createAgent()` returning `ToolLoopAgent` with `AgentConfig` (provider, model, apiKey, mode, optional `toolConfig`)
- chat uses `@ai-sdk/react` `useChat` with `QurtChatTransport` (`src/renderer/services/qurt-chat-transport.ts`)
- `QurtChatTransport` wraps `DirectChatTransport`, resolves `qurt-attachment://` file parts via `resolveAttachment`, and uses `getAgent()` so the agent is created with the current apiKey on each send
- attachments are stored as `qurt-attachment://<id>` URLs and resolved to data URLs before sending to the agent
- chat composer supports per-message mode switching:
  - `Ask`: single-pass text generation (no tools)
  - `Agent`: `ToolLoopAgent` with tools from `src/renderer/agent/tools/` registry (e.g. web-search: provider proxy in `action`, display with search icon and domain-only result badges; terminal: `run_terminal` in `src/renderer/agent/tools/terminal/`, execution in main via `src/main/services/terminalRunner.ts` with workspace restriction and command denylist; file-patch: `apply_file_patch` in `src/renderer/agent/tools/file-patch/`, execution in main via `src/main/services/filePatchRunner.ts` with workspace restriction, binary blocking, and checkpoint-based revert; browser: `browser_control` in `src/renderer/agent/tools/browser/`, execution in main via `src/main/services/browserController.ts` with one window per chat, http/https only; accepts a list of actions (open, navigate, click, type, press, scroll, wait, close) run atomically; always returns one screenshot per request resized to viewport dimensions for coordinate consistency; input actions force-focus the browser window before dispatch; memory: `memory` tool in `src/renderer/agent/tools/memory/`, execution in main via `src/main/services/memoryStore.ts` with structured actions (view, create, update, search) over `.memory/` files; core memory injected via `prepareCall` before each model call)

## Current Scope And Boundaries

- current platform: desktop only
- no backend service is required for basic operation
- no shared cloud sync yet
- agent mode includes web search, a workspace-restricted terminal tool (command denylist, default-deny network, timeout/output caps), a file patch tool (workspace-bounded, binary blocked, checkpoint revert), a browser control tool (one window per chat, http/https only; list of actions run atomically, one screenshot per request; coordinate-based clicks, typing at focus, key presses, scroll), and a memory tool (global long-term memory with core/notes/conversations; structured actions; core injected each turn)

## Forward Architecture Needs

Planned expansions and expected architecture impact:

1. **Hybrid UI**
   - add model-driven UI schema/renderer boundary
   - require strict validation for model-proposed UI blocks
2. **Agent mode**
   - expand from web search to local tools (browser, terminal, files); browser tool is implemented with one window per chat
   - permission model, audit trail, and run lifecycle state machine
3. **Storage provider choice**
   - sync abstraction layer with pluggable providers
   - conflict handling and offline-first synchronization
4. **Mobile**
   - transport and persistence contracts that can be shared across desktop/mobile

## Architecture Decision Template

### Centralized Provider Service

- **Context**: Provider and model logic was scattered across multiple files (`providers.ts`, `ai-service.ts`, `useQurtChat.ts`, `useChatPageController.tsx`, `web-search/action.ts`) with repetitive if/else statements for provider-specific logic. This made it difficult to:
  - Add new providers or models
  - Maintain consistent behavior across the app
  - Test provider-specific functionality
  - Manage provider-specific settings (reasoning effort, thinking levels, etc.)

- **Decision**: Created a centralized `ProviderService` singleton (`src/renderer/services/provider-service.ts`) that consolidates all provider/model management logic. Key responsibilities:
  - Provider and model resolution and validation
  - SDK client creation (`createChatModel()`)
  - Provider-specific settings management (`createProviderOptions()`)
  - Tool set creation including web search (`createWebSearchToolSet()`)
  - Helper methods for provider validation, model info lookup, and API key management
  - Exports a singleton instance (`providerService`) for consistent state across the app

- **Consequences**:
  - **Positive**: Single source of truth for provider/model logic, easier to add new providers, reduced code duplication, improved testability
  - **Positive**: Clear separation of concerns between provider management (`provider-service.ts`) and agent creation (`ai-service.ts`)
  - **Minimal impact**: Refactored files use the new service, existing functionality preserved
  - **Future**: Adding new providers or provider-specific settings only requires updating `ProviderService`

- **Status**: Implemented
- **Date**: 2026-02-24

---

- Context:
- Decision:
- Consequences:
- Status:
- Date:
