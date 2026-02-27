# FRONTEND

Frontend implementation guide for `qurt`.

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
  - `src/renderer/features/updatesFaq` (route: `/updates-and-faq`)
  - `src/renderer/features/settings` (route: `/settings`)
  - `src/renderer/features/onboarding` (first-run carousel)
- Additional prebuilt routes still come from root `templates/` via alias `@/templates`

## State And Data Flow

- `QurtContext` (`src/renderer/App.tsx`) stores user settings in memory
- settings persist through `window.qurt` IPC bridge
- chat orchestration lives in `src/renderer/shared/hooks/useQurtChat.ts`
- chat group/history persistence is in `src/renderer/stores/chat-store.ts` + `src/renderer/services/chat-service.ts`
- right sidebar history supports multi-select actions (`archive`, `delete`) backed by chat-store APIs
- archive is a soft state (`isArchived`) so archived chats are hidden from active history without hard deletion
- chat history items include the latest attached image preview when the conversation has image attachments
- Updates and FAQ UI reads content through `src/renderer/services/updates-faq-service.ts`
- Content loading/parsing is handled in `src/renderer/stores/updates-faq-store.ts`

## Provider And Model Handling

- provider catalog: `src/renderer/shared/constants/providers.ts` (includes `logoPath` for each provider; logos in `public/provider-logos/`)
- provider key management UI: `src/renderer/shared/components/Settings/AiProviders`
- active model switcher UI: `src/renderer/shared/components/ModelSelector`
- model execution adapter: `src/renderer/services/ai-service.ts`

## Attachment Flow

1. user adds file in `Message` input
2. renderer converts file to base64
3. preload/main IPC saves attachment to local file store
4. chat message stores attachment metadata
5. AI service resolves attachment data for model calls

## Typography

The app uses **Inter** as the single font family. Typography classes are defined in `tailwind.config.ts`:

| Class | Use case | Size |
|-------|----------|------|
| `.h1`–`.h6` | Headings | 3.5rem down to 1rem |
| `.body1`, `.body1S`, `.body2` | Body text | 1.375rem, 1.25rem, 1rem |
| `.base1`, `.base2` | UI labels, controls | 0.9375rem, 0.8125rem |
| `.caption1`, `.caption2` | Meta, secondary text | 0.6875rem, 0.625rem |

Prefer these semantic classes over raw `text-sm`/`text-base` for consistency. Use `font-sans` (Inter) for default text.

## Dark Theme

Dark mode is driven by Chakra UI’s `useColorMode` and applied via `data-theme="dark"` or `.dark` on an ancestor. Tailwind’s `dark:` variant is configured with `darkMode: ["class", '[data-theme="dark"]']` in `tailwind.config.ts`.

- **CSS variables**: `globals.css` defines dark-mode tokens under both `.dark` and `[data-theme="dark"]` so semantic colors (`--foreground`, `--muted-foreground`, etc.) work regardless of how dark mode is triggered.
- **Qurt palette**: Use `n-1`–`n-7` for backgrounds and text; in dark mode, `n-1` is lightest, `n-7` darkest. Prefer `dark:text-n-1`, `dark:bg-n-6`, `dark:border-n-5` for consistent contrast.
- **User message bubbles**: `dark:bg-n-5/50`, `dark:border-transparent`.
- **Chat history**: Checkboxes use `dark:border-n-3` for visibility; secondary text uses `dark:text-n-3`.

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
