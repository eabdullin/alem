# AGENTS.md

## Project Overview

`qurt` is an AI Coworker and assistant designed for provider freedom:

- users bring their own API keys
- users choose their preferred provider/model
- the product avoids locking users into a single vendor
- the long-term goal is fair, practical access to the strongest model or agent for a task
- give users world-class agentic tool that is capable of doing real-value tasks

Current status:

- desktop app only (Electron + Vite + React + TypeScript)
- users can chat with AI and attach files/images for discussion
- users can configure API keys and enabled models by provider
- agents can use tools such as terminal, file change, browser control and web access to solve some users requests (it's like Cursor but outside of code)

## Product Design Intent

- make advanced AI usage feel simple for non-experts
- preserve user control while introducing smarter assistant behaviors
- help users compare and choose providers/models without bias
- Allow agents to automate user's needs minimising risks to user's data

## Build and Test
When working on tasks use these commands constantly

### Build
- Install dependencies: `npm install`
- Start development app: `npm run dev`
- Build app: `npm run build` (Use less, time consuming, tend to use at the end of the task)
- Lint code: `npm run lint`

### Test
- Run tests: `npm run test` (or `npm run test:coverage` for coverage).
- Keep lint clean on touched files before finishing work.

## Workflow
- Always create a branch for major changes
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages (see Commit Message Convention below).
- Make sure new code is always tested

## UI And Typography

- Use Radix-based primitives from `src/renderer/shared/components/ui/` for new controls.
- prefer path aliases (`@/...`) over long relative imports
- keep reusable parts in `src/renderer/shared/components/`

## Content Tone Rules

- FAQ and Updates copy must be user-facing and non-technical.
- Do not mention internal implementation details (for example: file paths, stores, frameworks, or architecture moves).
- Keep wording focused on user value, product behavior, and outcomes.

