# Agent Mode

## Problem

Users increasingly need AI help for executable tasks (browse, inspect files, run commands), not just text generation.

## Goal

Add an agent mode where `alem` can execute tool-based workflows with explicit user control and transparent behavior.

## Non-Goals (Initial)

- silent background automation without user visibility
- broad unrestricted system access
- production-grade autonomy on day one

## Core Capabilities (Target)

- provider-native web search (v1 shipped)
- browser actions for web tasks (planned)
- terminal command execution for development workflows (planned)
- file read/write access for project operations (planned)

## Current Status (v1)

- composer includes a per-message mode switch: `Ask` and `Agent`
- mode defaults to `Ask` on every new send
- `Agent` mode runs an AI SDK tool loop with one tool category: web search
- provider search mappings:
  - OpenAI: `webSearch`
  - Google: `googleSearch`
  - Anthropic: `webSearch_20250305`

## Trust And Control Requirements

- explicit run start/stop controls
- action log visible to users
- permission prompts for sensitive scopes
- clear distinction between "plan" and "execute"
- clear UI distinction between `Ask` and `Agent` per message

## Functional Milestones

1. Per-message `Ask`/`Agent` UX and provider-native web search tool integration (complete)
2. Agent run lifecycle (queued, running, waiting, completed, failed)
3. Tool broker abstraction and provider-agnostic planner
4. Permission model and policy checks
5. Replayable run transcript and audit record

## Success Metrics

- task completion rate for agent-mode requests
- user trust score (control/transparency feedback)
- incident rate for unsafe or undesired tool actions
