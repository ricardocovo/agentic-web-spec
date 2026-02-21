# GitHub Copilot Instructions — Web-Spec

## Project Overview

Web-Spec is an AI agent pipeline app: select a GitHub repo → run chained agents (Deep Research → PRD → Technical Docs) → get real-time streaming specs. It is a **npm workspaces monorepo** with two packages.

## Architecture

```
frontend/  — Next.js 14 App Router, port 3000
backend/   — Express 4 + TypeScript ESM, port 3001
```

- **Frontend** manages all state via React context (`frontend/lib/context.tsx`) backed by `localStorage` — there is no backend database.
- **Backend** clones repos to `~/work/{username}/{repo}` and runs `@github/copilot-sdk` sessions against them, streaming SSE back to the browser.
- Agent configs live in `backend/agents/*.agent.yaml` and define `model`, `tools`, and `prompt`.

## Dev Workflow

```bash
# Install all dependencies (run once)
npm run install:all

# Start both frontend and backend concurrently
npm run dev          # runs from repo root

# Individual packages
npm run dev --workspace=backend   # tsx + nodemon, no build step
npm run dev --workspace=frontend  # next dev --port 3000
```

- Backend uses `tsx` in dev (no compile needed). Production: `npm run build --workspace=backend` → `tsc`.
- Frontend: `npm run build` at root only builds the frontend.

## Key Files

| File | Purpose |
|---|---|
| `backend/agents/*.agent.yaml` | Agent config: model, tools, system prompt |
| `backend/src/routes/agent.ts` | `/api/agent/run` — loads YAML, creates `CopilotClient`, streams SSE |
| `backend/src/routes/repos.ts` | `/api/repos/*` — `git clone --depth 1` into `~/work/` |
| `frontend/lib/agents.ts` | Frontend agent registry: slugs, colors, `nextAgent` chain |
| `frontend/lib/storage.ts` | All `localStorage` accessors (sessions, PAT, active repo) |
| `frontend/lib/context.tsx` | `AppProvider` — PAT, username, activeRepo in React context |
| `frontend/app/agents/[slug]/page.tsx` | Per-agent chat page; reads handoff from `sessionStorage` |

## Agent System

### Adding a new agent
1. Create `backend/agents/<slug>.agent.yaml` with fields: `name`, `displayName`, `model`, `tools`, `prompt`.
2. Add the slug → filename entry to `AGENT_FILE_MAP` in `backend/src/routes/agent.ts`.
3. Add an `AgentConfig` entry to the `AGENTS` array in `frontend/lib/agents.ts`, including `nextAgent` if it fits in the chain.

### Agent YAML structure
```yaml
name: my-agent
displayName: My Agent
model: gpt-4.1
tools: [grep, glob, view, bash]
prompt: |
  System prompt here. Use {{cwd}} for working directory reference.
```

## SSE Streaming Protocol

`POST /api/agent/run` body: `{ agentSlug, prompt, repoPath, context? }`

The response stream emits:
- `event: chunk` / `data: <token>` — incremental content
- `event: done` — stream finished
- `event: error` / `data: <message>` — failure

`CopilotClient` must be created and `client.start()` called **before** setting SSE headers, so startup errors return proper HTTP status codes (see `backend/src/routes/agent.ts`).

## Agent Handoff Pattern

When a user clicks "Send to [next agent]", the last assistant message is stored in `sessionStorage` under key `web_spec_handoff_<nextSlug>`. The target agent page reads this on mount and prepends it to the session as a `📎 Context from previous agent:` prefixed assistant message, injected into `context` on the `/api/agent/run` request.

## Frontend Conventions

- All components using state, effects, or context must have `"use client"` at the top.
- Global state (PAT, username, activeRepo) is read/written only through `useApp()` from `frontend/lib/context.tsx`.
- `localStorage` interactions are isolated in `frontend/lib/storage.ts`; always guard with `isBrowser()` for SSR safety.
- Tailwind uses a custom dark theme — use semantic tokens like `bg-surface-2`, `text-text-primary`, `border-border`, `text-accent` instead of raw color classes.

## Environment & Configuration

- `WORK_DIR` env var overrides the default `~/work` base path for cloned repos (backend).
- The GitHub PAT is passed with every API call from the browser — it is never stored server-side.
- CORS is open in dev; the backend reads `PORT` (default `3001`) from env.
