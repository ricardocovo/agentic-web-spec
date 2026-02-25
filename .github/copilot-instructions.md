# GitHub Copilot Instructions — Web-Spec

## Project Overview

Web-Spec is an AI agent pipeline app: select a GitHub repo → run chained agents (Deep Research → PRD → Technical Docs) → get real-time streaming specs. It is an **npm workspaces monorepo** with two packages: `frontend/` (Next.js 14 App Router, port 3000) and `backend/` (Express 4 + TypeScript ESM, port 3001).

## Commands

```bash
# Install all dependencies
npm run install:all

# Start both frontend + backend concurrently
npm run dev

# Individual packages
npm run dev --workspace=backend    # tsx + nodemon, auto-restarts on .ts changes
npm run dev --workspace=frontend   # next dev --port 3000

# Type-check (no tests exist)
cd frontend && npx tsc --noEmit
cd backend && npx tsc --noEmit

# Lint (frontend only)
cd frontend && npm run lint

# Build
npm run build                       # builds frontend only
npm run build --workspace=backend   # tsc → dist/
```

## Architecture

- **No database.** All state lives in `localStorage` on the client. The backend is stateless.
- **Backend** clones repos to `~/work/{username}/{repo}` and runs `@github/copilot-sdk` sessions, streaming SSE back to the browser.
- **Frontend** consumes SSE via a Next.js Route Handler proxy (`frontend/app/api/agent/run/route.ts`) that pipes the backend stream directly, bypassing Next.js rewrite-proxy buffering.
- Agent configs live in `backend/agents/*.agent.yaml` and define `model`, `tools`, and `prompt`.
- The GitHub PAT is stored in the browser and passed as `Authorization: Bearer <pat>` on every API call — never stored server-side.

### Agent pipeline

```
Deep Research → PRD Writer → Technical Docs → [spec-writer | issue-creator]
```

When a user clicks "Send to [next agent]", the output is stored in `sessionStorage` under `web_spec_handoff_<nextSlug>` and injected as `context` on the next `/api/agent/run` request.

### SSE streaming protocol

`POST /api/agent/run` body: `{ agentSlug, prompt, repoPath, context?, spaceRefs? }`

Events: `chunk` (token), `reasoning` (think block), `done`, `error`.

**Critical pattern:** `CopilotClient` must be created and `client.start()` called *before* setting SSE headers, so startup errors return proper HTTP status codes.

## Adding a New Agent

Three files must be updated:

1. **`backend/agents/<slug>.agent.yaml`** — agent config with `name`, `displayName`, `model`, `tools`, `prompt`.
2. **`backend/src/lib/agentFileMap.ts`** — add slug → filename to `AGENT_FILE_MAP`.
3. **`frontend/lib/agents.ts`** — add `AgentConfig` entry to `AGENTS` array with `nextAgent` if it chains.

## Frontend Conventions

- All components using state/effects/context must have `"use client"` at the top.
- Global state is read/written only through `useApp()` from `frontend/lib/context.tsx`.
- `localStorage` access is isolated in `frontend/lib/storage.ts`; always guard with `isBrowser()` for SSR safety.
- Use the custom Tailwind theme tokens (`bg-surface-2`, `text-text-primary`, `border-border`, `text-accent`, `text-text-secondary`, `bg-background`, `text-muted`) — not raw color classes. See `frontend/tailwind.config.ts` for all tokens.
- Icons come from `lucide-react`. Markdown rendering uses `react-markdown` + `remark-gfm`.

## Backend Conventions

- ESM modules (`"type": "module"` in package.json) — all local imports use `.js` extension (e.g., `import { foo } from "./lib/bar.js"`).
- Express routers are exported as named constants (e.g., `export const agentRouter = Router()`).
- Errors during SDK startup return proper HTTP status codes; errors during streaming are sent as SSE `error` events.

## Environment Variables

Set in `backend/.env`:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Express listen port |
| `WORK_DIR` | `~/work` | Base path for cloned repos |

## Specs Workflow

Feature specs are generated under `specs/{feature-name}/` using the `feature-spec-generator` agent (`.github/agents/feature-spec-generator.agent.md`). Implementation is handled by the `spec-developer` agent which reads the spec, sequences stories by dependencies, implements each one, then validates with build + lint.
