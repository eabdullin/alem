# FRONTEND

Frontend implementation guide for `alem`.

## Stack

- React 18 + TypeScript
- Vite 6
- Electron renderer via `vite-plugin-electron`
- Tailwind-based styling patterns

## Entry And Routing

- Entry: `src/renderer/main.tsx`
- App router: `src/renderer/App.tsx`; route composition in `src/renderer/app/routes/`
- Primary pages (feature modules):
  - `src/renderer/features/home`
  - `src/renderer/features/chat`
  - `src/renderer/features/updatesFaq`
- Additional prebuilt routes still come from root `templates/` via alias `@/templates`

## State And Data Flow

- `AlemContext` (`src/renderer/App.tsx`) stores user settings in memory
- settings persist through `window.alem` IPC bridge
- chat orchestration lives in `src/renderer/shared/hooks/useAlemChat.ts`
- chat group/history persistence is in `src/renderer/stores/chat-store.ts` + `src/renderer/services/chat-service.ts`
- right sidebar history supports multi-select actions (`archive`, `delete`) backed by chat-store APIs
- archive is a soft state (`isArchived`) so archived chats are hidden from active history without hard deletion
- chat history items include the latest attached image preview when the conversation has image attachments
- Updates and FAQ UI reads content through `src/renderer/services/updates-faq-service.ts`
- Content loading/parsing is handled in `src/renderer/stores/updates-faq-store.ts`

## Provider And Model Handling

- provider catalog: `src/renderer/shared/constants/providers.ts`
- provider key management UI: `src/renderer/shared/components/Settings/AiProviders`
- active model switcher UI: `src/renderer/shared/components/ModelSelector`
- model execution adapter: `src/renderer/services/ai-service.ts`

## Attachment Flow

1. user adds file in `Message` input
2. renderer converts file to base64
3. preload/main IPC saves attachment to local file store
4. chat message stores attachment metadata
5. AI service resolves attachment data for model calls

## Conventions

- prefer path aliases (`@/...`) over long relative imports
- keep reusable parts in `src/renderer/shared/components/`
- `src/renderer/shared/components/` includes Icon and other app-wide adapters (e.g. Heroicons)
- keep page composition in `src/renderer/features/` (feature-first modules)
- treat `templates/` as prebuilt reference surfaces; avoid editing unless requested

## Frontend Risks To Watch

- duplicated attachment handling logic between Home and Chat flows
- increasing route complexity as template pages transition into product pages
- future hybrid UI needs strict schema validation before rendering dynamic blocks
