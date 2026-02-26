# Memory: Option A (AI SDK Custom Memory)

**Status**: Completed  
**Date**: 2026-02-26

## Summary

Implemented AI SDK custom memory (Option A structured actions) as a global memory capability with hybrid write behavior, integrated into the existing ToolLoopAgent flow and persisted safely in Electron user data.

## Implementation

- Main process: `memoryStore.ts` with filesystem bootstrap, `readCoreMemory`, `appendConversation`, `runMemoryCommand` (view, create, update, search)
- IPC: `memory-read-core`, `memory-append-conversation`, `memory-run-command`
- Renderer: memory tool in `agent/tools/memory/` with action, display, registry
- Agent: `prepareCall` injects core memory before each model call; `useAlemChat` appends user/assistant turns to conversations.jsonl

## Outcomes

- Global memory bank across all chats/providers
- Hybrid write policy: explicit remember requests + automatic durable facts
- Path allowlist: core.md, notes.md, conversations.jsonl only
- Tests: 9 focused tests for memory store
