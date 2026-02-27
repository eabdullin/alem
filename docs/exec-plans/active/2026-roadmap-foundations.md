# 2026 Roadmap Foundations

Status: active
Owner: TBD
Last Updated: 2026-02-21

## Objective

Build the foundation for `qurt`'s next phase:

1. hybrid UI
2. agent mode
3. storage provider sync
4. mobile readiness

## Workstreams

### 1) Hybrid UI (Phase 0)

- define safe UI schema and component whitelist
- implement schema validator
- add fallback behavior to plain chat

### 2) Agent Mode (Phase 0)

- define tool broker contracts (browser, terminal, files)
- implement run lifecycle states and UI visibility
- implement permission prompts and deny paths

### 3) Storage Abstraction (Phase 0)

- define sync-provider interface
- keep local-first operation as default
- draft conflict policy and reconciliation strategy

### 4) Mobile Readiness (Phase 0)

- identify shared domain contracts for chat/provider/settings
- isolate desktop-only assumptions
- define minimum mobile MVP boundaries

## Exit Criteria

- architecture/design docs approved for all four workstreams
- at least one vertical prototype for hybrid UI and agent mode
- technical risk register updated with mitigation plans
