# AGENTS.md

Agent guide for `qurt`.

## Project Overview

`qurt` is an AI Coworker and assistant designed for provider freedom:

- users bring their own API keys
- users choose their preferred provider/model
- the product avoids locking users into a single vendor
- the long-term goal is fair, practical access to the strongest model or agent for a task

Current status:

- desktop app only (Electron + Vite + React + TypeScript)
- users can chat with AI and attach files/images for discussion
- users can configure API keys and enabled models by provider

## Setup Commands

- Install dependencies: `npm install`
- Start development app: `npm run dev`
- Build production app: `npm run build`
- Lint code: `npm run lint`

Notes:

- There is currently no dedicated `npm test` script.
- Keep lint clean on touched files before finishing work.

## Architecture Map

- Electron main process: `src/main/index.ts`
- Electron preload bridge: `src/preload/index.ts`
- Renderer app entry: `src/renderer/main.tsx` -> `src/renderer/App.tsx`
- Chat flows: `src/renderer/pages/HomePage/`, `src/renderer/pages/ChatPage/`, `src/renderer/shared/hooks/useQurtChat.ts`
- AI provider routing: `src/renderer/services/ai-service.ts`
- Chat persistence: Dexie in `src/renderer/db/` (chats.repo, chat-groups.repo); `src/renderer/services/chat-service.ts`
- Attachment storage: `src/main/services/fileStore.ts`

## UI And Typography

- Use Radix-based primitives from `src/renderer/shared/components/ui/` for new controls.
- Typography: Inter font family; prefer semantic classes (`.base1`, `.base2`, `.caption1`, etc.) over raw `text-sm`/`text-base`. See `docs/FRONTEND.md` for the typography scale.

## Repository Conventions

- Use path aliases (`@/components`, `@/services`, etc.) when available.
- Prefer small focused changes; avoid broad refactors unless requested.
- Keep UI logic in `src/`; treat root `templates/` as prebuilt page templates.
- `templates/` should not be edited unless the user explicitly asks.

## Content Tone Rules

- FAQ and Updates copy must be user-facing and non-technical.
- Do not mention internal implementation details (for example: file paths, stores, frameworks, or architecture moves).
- Keep wording focused on user value, product behavior, and outcomes.

## Product Priorities

Near-term roadmap themes:

1. Hybrid UI: model-driven dynamic UI rendering for better learning/agentic UX
2. Agent mode: tool-using agents (browser, terminal, files)
3. Storage provider choice: sync across user devices with pluggable storage
4. Mobile version

## Documentation Duties For Agents

When code behavior changes, update docs in the same task:

- system shape: `ARCHITECTURE.md`
- planning and roadmap: `docs/PLANS.md`, `docs/exec-plans/`
- product intent: `docs/product-specs/`
- reliability/security posture: `docs/RELIABILITY.md`, `docs/SECURITY.md`

## Security And Privacy Expectations

- Never log or expose raw API keys.
- Treat user attachments and prompts as sensitive data.
- Default to least privilege for any future tool-running agent features.

## Delivery Checklist (Before Hand-off)

- Lint passes for touched files.
- Docs updated for changed behavior.
- Risks and follow-ups captured in `docs/exec-plans/tech-debt-tracker.md` when needed.
