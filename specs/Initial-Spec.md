# Web-Spec — Initial Specification

This document consolidates the full initial specification for the Web-Spec project, combining the product overview, agent definitions, backend API, data models, and frontend specification into a single reference.

---

## Table of Contents

- [1. Product Overview](#1-product-overview)
- [2. Agents](#2-agents)
- [3. Backend API](#3-backend-api)
- [4. Data Models](#4-data-models)
- [5. Frontend](#5-frontend)

---

## 1. Product Overview

> _Source: `spec/overview.md`_

### Summary

Web-Spec is a dark-themed web application that connects a GitHub repository to a chain of AI agents (powered by the GitHub Copilot SDK) to produce deep research, product requirements, and technical specifications — all in a real-time streaming chat interface.

### Goals

- Automate the specification pipeline: research → PRD → technical docs
- Keep context flowing between agents via an explicit handoff mechanism
- Run agents inside the actual codebase so they can inspect real files
- Persist session history locally without a backend database

### Architecture

```
agentic-web-spec/
├── frontend/   # Next.js 14 + TypeScript + Tailwind CSS  (port 3000)
└── backend/    # Node.js + Express + TypeScript           (port 3001)
```

The **frontend** handles UI, routing, and all state via localStorage.  
The **backend** clones repositories on-disk and spawns the GitHub Copilot SDK inside them, streaming SSE output back to the browser.

### User Flow

1. Enter a GitHub PAT in settings (⚙️ top-right).
2. Select a repository from the repo bar — it is shallow-cloned to `~/work/<username>/<repo>`.
3. Navigate to an agent card and start a conversation.
4. When the agent responds, click **Send to [next agent]** to pass its output as context.
5. Repeat through the chain: **Deep Research → PRD → Technical Docs**.

### Technology Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| AI | `@github/copilot-sdk` (CopilotClient) |
| Streaming | Server-Sent Events (SSE) |
| State | localStorage (client-side only) |
| Auth | GitHub Personal Access Token (PAT) |
| Repo management | `git clone --depth 1` via `child_process.execSync` |
| Agent config | YAML files in `backend/agents/` |

---

## 2. Agents

> _Source: `spec/agents.md`_

Agents are defined as YAML files in `backend/agents/`. Each file maps to a slug used by the frontend and the `/api/agent/run` endpoint.

### Agent Chain

```
Deep Research  →  PRD  →  Technical Docs
```

Handoff is explicit: after an agent responds the user clicks **Send to [next agent]**, which stores the last assistant message in `sessionStorage` under the key `web_spec_handoff_<nextSlug>`. The next agent page reads and injects this as an opening assistant message prefixed with `📎 Context from previous agent:`.

---

### Agent: Deep Research

| Field | Value |
|---|---|
| Slug | `deep-research` |
| File | `backend/agents/deep-research.agent.yaml` |
| Model | `gpt-4.1` |
| Tools | `grep`, `glob`, `view`, `bash` |
| Next | `prd` |

**Purpose:** Thoroughly analyze the codebase and a given topic. Returns structured findings with a Summary, Codebase Analysis, Research Findings, Constraints & Risks, and Recommendations.

**Output structure**
- **Summary** — 2–3 sentence high-level overview
- **Codebase Analysis** — tech stack, key patterns, conventions
- **Research Findings** — in-depth topic analysis grounded in the codebase
- **Constraints & Risks** — technical limitations to consider
- **Recommendations** — actionable next steps

---

### Agent: PRD

| Field | Value |
|---|---|
| Slug | `prd` |
| File | `backend/agents/prd.agent.yaml` |
| Model | `gpt-4.1` |
| Tools | `grep`, `glob`, `view` |
| Next | `technical-docs` |

**Purpose:** Transform research findings into a complete Product Requirements Document with testable acceptance criteria.

**Output structure**
```
## Product Requirements Document
### Overview
### Goals & Success Metrics
### User Stories  (with acceptance criteria checkboxes)
### Technical Requirements
### Out of Scope
### Open Questions
```

---

### Agent: Technical Documents

| Field | Value |
|---|---|
| Slug | `technical-docs` |
| File | `backend/agents/technical-docs.agent.yaml` |
| Model | `gpt-4.1` |
| Tools | `grep`, `glob`, `view`, `bash` |
| Next | — (end of chain) |

**Purpose:** Convert a PRD into an implementation-ready technical specification with discrete, independently-implementable tasks.

**Output structure**
```
## Technical Specification
### Architecture Overview
### Data Models & Schemas
### API Contracts
### Implementation Tasks
  #### Task N: [title]
  File(s), Type, Description, Implementation notes, Acceptance criteria
### Testing Strategy
### Dependencies & Order
```

---

### Agent YAML Schema

```yaml
name: string           # Internal identifier
displayName: string    # Human-readable name
description: string    # Short description (used for documentation)
model: string          # Copilot model ID (e.g. gpt-4.1)
tools:                 # Tools available to the agent; "*" = all
  - grep
  - glob
  - view
  - bash
prompt: |              # System prompt (multi-line)
  ...
```

### Adding a New Agent

1. Create `backend/agents/<slug>.agent.yaml` following the schema above.
2. Add an entry to `AGENT_FILE_MAP` in `backend/src/routes/agent.ts`.
3. Add the agent config to `AGENTS` in `frontend/lib/agents.ts` (set `nextAgent` to wire it into the chain).
4. Add an icon mapping in `frontend/app/page.tsx` and `frontend/app/agents/[slug]/page.tsx`.

---

## 3. Backend API

> _Source: `spec/api.md`_

Base URL: `http://localhost:3001`  
The Next.js frontend proxies `/api/backend/*` → `http://localhost:3001/api/*` (configured in `next.config.mjs`).

---

### Health

#### `GET /health`

Returns server status.

**Response**
```json
{ "status": "ok" }
```

---

### Repositories — `/api/repos`

#### `POST /api/repos/clone`

Shallow-clone a GitHub repository into `~/work/<username>/<repo>`. If the path already exists, returns immediately without re-cloning.

**Request body**
```ts
{
  repoFullName: string;  // e.g. "octocat/hello-world"
  pat: string;           // GitHub Personal Access Token
  username: string;      // Authenticated GitHub username
}
```

**Response (success)**
```ts
{
  success: true;
  repoPath: string;       // Absolute path on disk
  alreadyCloned: boolean;
}
```

**Response (error)** — `400` or `500`
```ts
{ error: string }
```

---

#### `GET /api/repos/status`

Check whether a repository has been cloned.

**Query parameters**
| Param | Type | Required |
|---|---|---|
| `username` | string | ✓ |
| `repoName` | string | ✓ |

**Response**
```ts
{
  exists: boolean;
  repoPath: string | null;
}
```

---

#### `DELETE /api/repos/remove`

Remove a cloned repository from disk.

**Request body**
```ts
{
  username: string;
  repoName: string;
}
```

**Response (success)**
```ts
{ success: true }
```

**Response (error)** — `400` or `404` or `500`
```ts
{ error: string }
```

---

#### `GET /api/repos/tree`

Return the file tree of a cloned repository (up to 3 levels deep, skipping `.git` and `node_modules`).

**Query parameters**
| Param | Type | Required |
|---|---|---|
| `username` | string | ✓ |
| `repoName` | string | ✓ |

**Response**
```ts
{
  repoPath: string;
  tree: string[];   // Relative paths; directories end with "/"
}
```

---

### Agent — `/api/agent`

#### `POST /api/agent/run`

Run a named agent against a cloned repository. Streams the response as [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events).

The endpoint validates inputs and starts the Copilot client **before** opening the SSE stream, so failures return normal JSON HTTP errors.

**Request body**
```ts
{
  agentSlug: string;    // "deep-research" | "prd" | "technical-docs"
  prompt: string;       // User message
  repoPath: string;     // Absolute local path returned by /clone
  context?: string;     // Optional prior assistant messages (handoff context)
}
```

**SSE events**

| Event | Data | Description |
|---|---|---|
| `chunk` | JSON-encoded string | Incremental assistant token |
| `error` | JSON-encoded string | Error message from the session |
| `done` | `""` | Stream complete |

**Error responses** — `400`, `404`, `500`
```ts
{ error: string }
```

**Notes**
- The agent's system prompt is loaded from `backend/agents/<slug>.agent.yaml`.
- If `context` is supplied it is appended to the system prompt as `Previous context:\n<context>`.
- The Copilot session uses `model` from the YAML (defaults to `gpt-4.1`), `streaming: true`, and `workingDirectory` set to `repoPath`.
- The stream ends on `session.idle` (after the prompt is sent) or `session.error`.

---

## 4. Data Models

> _Source: `spec/data-models.md`_

All client-side state is persisted in **localStorage** (no backend database). The storage layer is implemented in `frontend/lib/storage.ts`.

---

### localStorage Keys

| Key | Type | Description |
|---|---|---|
| `web_spec_pat` | `string` | GitHub Personal Access Token |
| `web_spec_username` | `string` | Authenticated GitHub username |
| `web_spec_active_repo` | `ActiveRepo` (JSON) | Currently selected repository |
| `web_spec_sessions` | `Session[]` (JSON) | All chat sessions, newest first |
| `web_spec_activity` | `ActivityEvent[]` (JSON) | Activity log, capped at 100 events |
| `web_spec_selected_space` | `string` | Selected Copilot Space (`owner/name`) |

### sessionStorage Keys

| Key | Description |
|---|---|
| `web_spec_handoff_<slug>` | Last assistant message forwarded to the next agent in the chain. Consumed and removed on the target agent page's mount. |

---

### TypeScript Interfaces

#### `ActiveRepo`

```ts
interface ActiveRepo {
  fullName: string;   // "owner/repo"
  username: string;   // GitHub username of the authenticated user
  repoName: string;   // Repository name only
  localPath: string;  // Absolute path on the backend host
  clonedAt: number;   // Unix timestamp (ms)
}
```

#### `Message`

```ts
interface Message {
  id: string;           // UUID
  role: "user" | "assistant";
  content: string;
  createdAt: number;    // Unix timestamp (ms)
}
```

#### `Session`

```ts
interface Session {
  id: string;           // UUID
  agentSlug: string;    // e.g. "deep-research"
  agentName: string;    // e.g. "Deep Research"
  title: string;        // First 60 chars of the first user message
  messages: Message[];
  repoFullName: string; // "owner/repo"
  createdAt: number;    // Unix timestamp (ms)
  updatedAt: number;    // Unix timestamp (ms)
}
```

#### `ActivityEvent`

```ts
interface ActivityEvent {
  id: string;           // UUID
  type: "session_created" | "message_sent" | "agent_handoff" | "repo_cloned";
  agentSlug?: string;
  repoFullName?: string;
  description: string;  // Human-readable summary
  createdAt: number;    // Unix timestamp (ms)
}
```

---

### Storage Helpers

| Function | Description |
|---|---|
| `getPat() / savePat() / clearPat()` | Read/write/delete the PAT |
| `getUsername() / saveUsername()` | Read/write the username |
| `getActiveRepo() / saveActiveRepo() / clearActiveRepo()` | Read/write/delete the active repo. `saveActiveRepo` also logs a `repo_cloned` activity event. |
| `getSessions() / getSession(id)` | Read all sessions or a single session by ID |
| `saveSession(session)` | Upsert a session (prepend to list, deduplicated by ID) |
| `createSession(slug, name, repo)` | Create a new session, save it, and log a `session_created` activity event |
| `addMessageToSession(sessionId, message)` | Append a message; sets session title from the first user message (≤60 chars) |
| `getActivity() / addActivity(event)` | Read activity log or append an event (list capped at 100) |

---

## 5. Frontend

> _Source: `spec/frontend.md`_

Framework: **Next.js 14** (App Router) · **TypeScript** · **Tailwind CSS**  
Port: `3000`

---

### Routing

| Route | File | Description |
|---|---|---|
| `/` | `app/page.tsx` | Agent selection landing page |
| `/agents/[slug]` | `app/agents/[slug]/page.tsx` | Chat session with a specific agent |
| `/kdb` | `app/kdb/page.tsx` | Knowledge Base — Copilot Spaces |
| `/dashboard` | `app/dashboard/page.tsx` | Session history and activity log |

All routes share the root layout (`app/layout.tsx`) which renders `Nav` and `RepoBar` persistently at the top.

---

### Pages

#### `/` — Agents Landing

- Displays three `AgentCard` components (one per agent).
- Cards link to `/agents/<slug>` when an active repo is set.
- Cards are disabled (greyed out, non-clickable) when no repo is active.
- A warning banner is shown when no repo is selected.

#### `/agents/[slug]` — Agent Chat

- Redirects to `/` if `activeRepo` is null.
- Creates a new `Session` in localStorage on mount.
- If a handoff key exists in `sessionStorage` (`web_spec_handoff_<slug>`), prepends the context as an assistant message and clears the key.
- Streams agent responses via `POST /api/backend/agent/run` (SSE).
- Displays a **Send to [next agent]** button after any assistant response.
- Saves all messages to the session via `lib/storage.ts`.

#### `/kdb` — Knowledge Base

- Lists Copilot Spaces retrieved from `https://api.github.com/user/copilot/spaces` using the stored PAT.
- Allows selecting one Space; the selection is persisted in `localStorage` under `web_spec_selected_space`.
- Gracefully handles 404/422 (Spaces API unavailable) and missing PAT.

#### `/dashboard` — Dashboard

- Reads sessions and activity events from localStorage.
- Sessions panel (2/3 width): sorted most-recent-first; each row links back to `/agents/<slug>`.
- Activity panel (1/3 width): shows last 30 events with type-specific icons.

---

### Components

#### `Nav`

Top navigation bar with the Web-Spec logo, nav links (Agents, KDB, Dashboard), and the settings (PAT) button.

#### `RepoBar`

Persistent bar below the nav. Shows the active repository name and a **Select repo** button that opens `RepoSelectorModal`. Cloned repos can be removed (deactivated) from this bar.

#### `PATModal`

Modal for entering a GitHub PAT. On save: validates the token against `https://api.github.com/user`, stores the PAT and username in localStorage.

#### `RepoSelectorModal`

Modal for searching and selecting a GitHub repository.

- On open: fetches the user's 20 most recently updated repos.
- On query change (400 ms debounce): searches repos scoped to the authenticated user.
- On repo select: calls `POST /api/backend/repos/clone`; on success sets the active repo in context.

#### `ChatInterface`

Core chat UI component.

**Props**
```ts
{
  agent: AgentConfig;
  messages: Message[];
  onSend: (content: string) => Promise<void>;
  isStreaming: boolean;
  streamingContent: string;
  nextAgent?: AgentConfig;
  onHandoff?: () => void;
  disabled?: boolean;
}
```

**Behaviour**
- Enter submits; Shift+Enter inserts a newline.
- Auto-resizes textarea up to 120 px.
- Shows a `StreamingBubble` with an animated cursor while streaming.
- Shows a spinning loader while waiting for the first token.
- Shows the **Send to [next agent]** handoff button after a completed response.
- Scrolls to the bottom whenever messages or streaming content change.

---

### Global State — `lib/context.tsx`

`AppProvider` / `useApp()` hook exposes:

| Field | Type | Description |
|---|---|---|
| `pat` | `string \| null` | GitHub Personal Access Token |
| `username` | `string \| null` | Authenticated GitHub username |
| `activeRepo` | `ActiveRepo \| null` | Currently selected repository |
| `setPat(pat, username)` | function | Save PAT + username to state and localStorage |
| `clearAuth()` | function | Clear PAT from state and localStorage |
| `setActiveRepo(repo)` | function | Save active repo to state and localStorage |
| `removeActiveRepo()` | function | Clear active repo from state and localStorage |

State is initialised from localStorage on mount (client-side only).

---

### Agent Config — `lib/agents.ts`

```ts
interface AgentConfig {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  color: string;       // Tailwind text colour class
  bgColor: string;     // Tailwind bg colour class
  borderColor: string; // Tailwind border colour class
  iconColor: string;   // Hex colour for icons and accents
  nextAgent?: string;  // Slug of the next agent in the chain
}
```

Helper functions: `getAgent(slug)`, `getNextAgent(slug)`.

---

### Tailwind Theme Tokens

Custom CSS variables defined in `globals.css` and surfaced as Tailwind classes:

| Token | Usage |
|---|---|
| `bg-surface` | Page / card backgrounds |
| `bg-surface-2` | Elevated surfaces (input, hover) |
| `border-border` | Default border colour |
| `text-text-primary` | Primary text |
| `text-text-secondary` | Secondary / label text |
| `text-muted` | De-emphasised text |
| `text-accent` / `bg-accent` | Brand accent colour |
