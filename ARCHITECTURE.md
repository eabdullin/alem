# ARCHITECTURE

System architecture for `alem`.

## Product Shape

`alem` is a desktop-first AI app that gives users vendor choice:

- bring your own API keys
- pick provider/model per preference
- chat with attachments (files/images)
- run either direct Ask replies or Agent mode with web search and optional terminal (workspace-restricted)

## Runtime Layers

1. **Electron main process**
   - window lifecycle
- IPC handlers for settings, API keys, attachments, and terminal runs
  - files: `electron/main.ts`, `electron/store.ts`, `electron/file-store.ts`, `electron/terminal-runner.ts`
2. **Electron preload bridge**
   - safe renderer API exposed via `window.alem`
   - file: `electron/preload.ts`
3. **Renderer (React + Vite)**
   - routes, UI, chat workflows, settings
   - left sidebar owns shared quick actions (search, updates, notifications, settings) across home/chat
   - updates/FAQ and notifications are available as sidebar-launched modals while the updates route remains for direct navigation
   - files: `src/main.tsx`, `src/App.tsx`, `src/pages/**`, `src/components/**`

## Directory Map

- `src/components/`: reusable app components
- `src/pages/`: app-owned, routed pages (`HomePage`, `ChatPage`, `UpdatesAndFaqPage`)
- `templates/`: prebuilt template pages/layouts; do not edit unless explicitly requested
- `src/services/`: integration logic (`ai-service`, `chat-service`, `updates-faq-service`, search helpers)
- `src/tools/`: agent tools; each tool is a folder with type (description), action (provider proxy), and display (Chain of Thought UI)
- `src/hooks/`: chat orchestration (`useAlemChat`)
- `src/stores/`: client-side and content abstractions (`chat-store`, `updates-faq-store`)
- `electron/`: desktop process code and secure bridge
- `docs/faq/`, `docs/updates/`: markdown-driven content source for the Updates & FAQ UI

## Data And Persistence

- **Settings and API keys**
  - stored in `electron-store` (`alem-config`)
  - includes active provider/model, enabled models, theme, API key map, and optional `terminalWorkspaceRoot` for agent terminal tool
- **Attachment binaries**
  - saved under app user data folder (`chat-attachments`)
  - metadata tracked in store `attachments` map
- **Chat history**
  - stored in browser `localStorage` under `alem.chat-history.v1`
  - normalized and validated by `BrowserChatStore`
  - assistant messages can include optional reasoning text for collapsible display
  - sessions now include `chatListIds` plus `isArchived` for list grouping and archive semantics
- **Chat lists**
  - stored in browser `localStorage` under `alem.chat-lists.v1`
  - normalized and validated by `BrowserChatListStore`
  - default lists are `Favorites` and `Archived`
  - active list selection is carried in route query (`?list=<listId>`) to keep left/right sidebars in sync

## AI Provider Flow

- provider/model selection is user-driven in settings and model selector
- chat composer and conversation rendering use shared `ai-elements` primitives
  (`model-selector`, `attachments`, `message`, `conversation`) to keep chat UI
  behavior consistent across home and chat routes
- supported providers are currently OpenAI, Anthropic, Google
- `src/services/ai-service.ts` maps provider IDs to SDK clients
- OpenAI model entries can map a UI model option to a base model ID plus
  provider options (for example OpenAI reasoning effort, Gemini thinking level,
  and Claude thinking budgets)
- attachments are converted into model file content parts before generation
- chat composer supports per-message mode switching:
  - `Ask`: single-pass text generation (`generateText`)
  - `Agent`: AI SDK `ToolLoopAgent` with tools from `src/tools/` registry (e.g. web-search: provider proxy in `action`, display with search icon and domain-only result badges; terminal: `run_terminal` in `src/tools/terminal/`, execution in main via `electron/terminal-runner.ts` with workspace restriction and command denylist)

## Current Scope And Boundaries

- current platform: desktop only
- no backend service is required for basic operation
- no shared cloud sync yet
- agent mode includes web search and a workspace-restricted terminal tool (command denylist, default-deny network, timeout/output caps)

## Forward Architecture Needs

Planned expansions and expected architecture impact:

1. **Hybrid UI**
   - add model-driven UI schema/renderer boundary
   - require strict validation for model-proposed UI blocks
2. **Agent mode**
   - expand from web search to local tools (browser, terminal, files)
   - permission model, audit trail, and run lifecycle state machine
3. **Storage provider choice**
   - sync abstraction layer with pluggable providers
   - conflict handling and offline-first synchronization
4. **Mobile**
   - transport and persistence contracts that can be shared across desktop/mobile

## Architecture Decision Template

- Context:
- Decision:
- Consequences:
- Status:
- Date:
