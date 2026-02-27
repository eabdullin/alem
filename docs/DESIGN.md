# DESIGN

Design direction for `qurt` UX and interaction systems.

## Product Design Intent

- make advanced AI usage feel simple for non-experts
- preserve user control while introducing smarter assistant behaviors
- help users compare and choose providers/models without bias

## Design Principles

1. **Clarity before power**
   - hide complexity until it is useful
2. **User agency first**
   - users explicitly choose provider, model, and key ownership
3. **Progressive intelligence**
   - start with chat; layer richer interactions only when they improve outcomes
4. **Trust by design**
   - show what the app is doing, especially for file/tool actions
5. **Consistency**
   - shared patterns between chat, settings, and future agent experiences

## Current UX Surface

- Home: quick prompt + attachment draft flow
- Chat: conversational thread with attachments and assistant replies
- Settings: provider API keys and model enablement
- Templates: additional prebuilt page patterns in `templates/` (non-core surfaces)

## Hybrid UI Direction (Planned)

Hybrid UI means model-assisted rendering of structured components when useful.

Use cases:

- step-by-step learning flows
- task checklists and forms in agentic workflows
- context-aware panels that reduce back-and-forth chat

Guardrails:

- model proposes, app validates
- renderer only accepts whitelisted components/schema
- user can always fall back to plain chat

## Accessibility And Visual Standards

- keyboard-accessible controls for core flows
- readable contrast in light/dark themes
- responsive behavior for narrow desktop windows
- actionable status/error messaging close to user intent
