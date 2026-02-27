# Web-Spec

> AI-powered specification generator for GitHub repositories.

Web-Spec is a dark-themed web application that lets you connect any GitHub repository and run a chained pipeline of AI agents against it — producing structured research, product requirements documents, and technical specifications in a real-time streaming chat interface. Built for developers and product teams who want to accelerate the spec-writing stage of agentic development workflows.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Agents](#agents)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **5 chained AI agents** — Deep Research → PRD Writer → Technical Docs form the analysis pipeline, with Spec Writer and Issue Creator as action agents
- **3 action agents** — Spec Writer creates spec branches/PRs, PRD Writer creates PRD docs on repo, Issue Creator creates GitHub issues — all triggered from post-action buttons
- **Repository targeting** — search any GitHub repository; it is cloned automatically and all agents run directly inside it
- **Streaming chat** — real-time server-sent event (SSE) streaming powered by the GitHub Copilot SDK
- **Agent handoff** — forward the output of one agent as context to the next with a single click
- **Knowledge Base (KDB)** — attach a Copilot Space to inject external reference context into agent sessions
- **WorkIQ integration** — search Microsoft 365 data (emails, meetings, documents, Teams) and attach results as context to agent sessions
- **Dashboard** — session history and activity log persisted in `localStorage`
- **Admin panel** — view and edit agent YAML configurations (model, tools, prompt) from the browser at `/admin`
- **Feature flags** — toggle visibility of KDB, WorkIQ, and action buttons from the `/settings` page; flags stored in `localStorage`
- **Quick prompts** — one-click prompt buttons on PRD and Technical Docs agents to auto-fill context-based prompts
- **PAT-based auth** — authenticate with a GitHub Personal Access Token; no server-side secrets are stored

---

## Architecture

```
                          Browser (port 3000)
                          ┌────────────────────────────────────┐
                          │           Next.js Frontend          │
                          │                                     │
                          │  /               Agent selector     │
                          │  /agents/[slug]  Streaming chat     │
                          │  /dashboard      Session history    │
                          │  /kdb            Copilot Spaces     │
                          │  /settings       Feature flags      │
                          │  /admin          Agent config editor│
                          │                                     │
                          │  AppProvider (React Context)        │
                          │  PAT · username · active repo       │
                          │  sessions · activity log            │
                          └──────────────┬──────────────────────┘
                                         │  HTTP / SSE
                                         │
                          Express Server (port 3001)
                          ┌──────────────▼──────────────────────┐
                          │           Node.js Backend            │
                          │                                     │
                          │  POST /api/repos/clone              │
                          │    └─ gh repo clone → ~/work/...    │
                          │                                     │
                          │  POST /api/agent/run                │
                          │    └─ @github/copilot-sdk           │
                          │       streams tokens via SSE        │
                          │                                     │
                          │  YAML agent configs (agents/)       │
                          └──────────────────────────────────────┘
                                         │
                          Cloned repos   │  GitHub API
                          ~/work/{user}/{repo}
```

The **frontend** manages UI, routing, and all client-side state via React context and `localStorage`. It sends repository clone requests and agent run requests to the backend over HTTP.

The **backend** handles repository operations via the GitHub CLI (`gh`) and spawns agent sessions using the `@github/copilot-sdk`. Agent responses are streamed back to the browser as Server-Sent Events (SSE), enabling token-by-token rendering in the chat interface.

Agent configurations are stored as YAML files in `backend/agents/` and describe the model, system prompt, and tool permissions for each agent.

For detailed Mermaid diagrams covering the system overview, agent run sequence, and agent pipeline, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend framework** | Next.js 14.2.29 |
| **UI language** | React 18, TypeScript 5 |
| **Styling** | Tailwind CSS 3.4 |
| **Icons** | Lucide React 0.462 |
| **Linting** | ESLint |
| **Backend runtime** | Node.js 18+ (ESM) |
| **Backend framework** | Express 4.21 |
| **Backend language** | TypeScript 5 (ES2022, NodeNext) |
| **AI SDK** | @github/copilot-sdk ^0.1.25 |
| **Agent config** | YAML 2.8 |
| **Dev tooling** | nodemon, tsx, concurrently ^9 |
| **Monorepo** | npm workspaces |

---

## Getting Started

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| GitHub CLI (`gh`) | Latest | [cli.github.com](https://cli.github.com) — must be authenticated (`gh auth login`) |
| GitHub Personal Access Token | — | See token requirements below — [create one](https://github.com/settings/tokens/new) |

#### PAT Permissions

**Classic token** — check these scopes: `repo`, `read:user`, `copilot`

**Fine-grained token** — select the following:
- *Account permissions*: **Copilot Editor Chat** → Read-only
- *Repository permissions*: **Contents** → Read-only, **Metadata** → Read-only (auto-selected)

> Fine-grained tokens must be scoped to your personal account (not just an org) for the Copilot Spaces API to work.

### Install

From the repository root, install dependencies for all workspaces at once:

```bash
npm run install:all
```

Or equivalently:

```bash
npm install --workspaces --include-workspace-root
```

### Run

**Option A — single command from the root (recommended)**

```bash
npm run dev
```

This uses `concurrently` to start both the frontend (port 3000) and backend (port 3001) in a single terminal session.

**Option B — two separate terminals**

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm run dev
```

```bash
# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### First-Time Setup

1. Click the settings icon in the top-right corner and enter your GitHub Personal Access Token.
2. Click **Select repo** in the repository bar, search for a GitHub repository, and select it — it will be cloned automatically to `~/work/{username}/{repo}`.
3. Choose an agent from the landing page and start chatting.

---

## Project Structure

```
agentic-web-spec/
├── package.json                    # npm workspaces root (concurrently dev script)
├── README.md
├── frontend/                       # Next.js application (port 3000)
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.mjs
│   ├── app/
│   │   ├── layout.tsx              # Root layout — wraps Nav + RepoBar
│   │   ├── page.tsx                # Agent selector landing page
│   │   ├── globals.css
│   │   ├── agents/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Dynamic agent chat page
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Session history and activity log
│   │   ├── kdb/
│   │   │   └── page.tsx            # Knowledge Base / Copilot Spaces
│   │   ├── settings/
│   │   │   └── page.tsx            # Feature flags toggle panel
│   │   └── admin/
│   │       └── page.tsx            # Agent YAML config editor
│   ├── components/
│   │   ├── ChatInterface.tsx       # Streaming chat UI component
│   │   ├── Nav.tsx                 # Top navigation bar
│   │   ├── RepoBar.tsx             # Active repository status bar
│   │   ├── PATModal.tsx            # GitHub PAT settings modal
│   │   ├── RepoSelectorModal.tsx   # Repository search and clone modal
│   │   ├── ActionPanel.tsx         # Streaming action agent modal
│   │   ├── SpaceSelector.tsx       # Multi-select Copilot Spaces
│   │   ├── WorkIQModal.tsx         # WorkIQ search & context picker
│   │   ├── SettingsDropdown.tsx    # User settings menu
│   │   └── ui/                     # Shared UI primitives
│   └── lib/
│       ├── agents.ts               # Agent definitions and chain order
│       ├── storage.ts              # localStorage read/write helpers
│       ├── context.tsx             # AppProvider — global React context
│       ├── repo-cache.ts           # Repository data caching
│       ├── spaces-cache.ts         # Copilot Spaces cache (5-min TTL)
│       └── workiq.ts               # WorkIQ availability checker
├── backend/                        # Express API server (port 3001)
│   ├── package.json
│   ├── tsconfig.json
│   ├── agents/
│   │   ├── deep-research.agent.yaml
│   │   ├── prd.agent.yaml
│   │   ├── technical-docs.agent.yaml
│   │   ├── spec-writer.agent.yaml
│   │   ├── prd-writer.agent.yaml
│   │   └── issue-creator.agent.yaml
│   └── src/
│       ├── index.ts                # Server entry point
│       ├── lib/
│       │   ├── agentFileMap.ts     # Agent slug → YAML file mapping
│       │   └── workiq-client.ts    # WorkIQ MCP client singleton
│       └── routes/
│           ├── repos.ts            # Repository clone, status, tree endpoints
│           ├── agent.ts            # Agent runner + SSE streaming
│           ├── kdb.ts              # KDB spaces proxy endpoint
│           ├── workiq.ts           # WorkIQ MCP proxy endpoints
│           └── admin.ts            # Agent CRUD REST endpoints
└── reference/                      # Reference materials
```

---

## Agents

Agents are defined as YAML configuration files in `backend/agents/`. Each file specifies the model, system prompt, and tool permissions. The three analysis agents form a sequential pipeline where the output of each agent can be forwarded as context to the next. Three action agents branch off from the Technical Docs stage to perform write operations against the repository.

### Agent Pipeline

```
┌─────────────────┐     hand-off     ┌─────────────────┐     hand-off     ┌─────────────────┐
│  Deep Research  │ ───────────────► │   PRD Writer    │ ───────────────► │ Technical Docs  │
│  deep-research  │                  │      prd        │                  │ technical-docs  │
└─────────────────┘                  └─────────────────┘                  └─────────────────┘
                                                                                  │
                                                                   ┌──────────────┼──────────────┐
                                                                   ▼              ▼              ▼
                                                           ┌──────────┐   ┌──────────┐   ┌──────────┐
                                                           │Spec Writer│   │PRD Writer│   │Issue     │
                                                           │spec-writer│   │prd-writer│   │Creator   │
                                                           └──────────┘   └──────────┘   │issue-    │
                                                                                         │creator   │
                                                                                         └──────────┘
```

The three action agents (Spec Writer, PRD Writer, Issue Creator) are triggered from post-action buttons on the Technical Docs chat page. They receive the tech-docs output as context and execute write operations against the repository.

### Agent Details

| Agent | Slug | Model | Tools | Description |
|---|---|---|---|---|
| **Deep Research** | `deep-research` | o4-mini | grep, glob, view, bash | Analyzes codebase structure, technology constraints, patterns, and dependencies to produce a research report |
| **PRD Writer** | `prd` | o4-mini | grep, glob, view | Consumes research output and generates a structured Product Requirements Document |
| **Technical Docs** | `technical-docs` | o4-mini | grep, glob, view, bash | Produces implementation task breakdowns and technical specifications based on the PRD |
| **Spec Writer** | `spec-writer` | gpt-4.1 | bash | Action agent: creates a spec branch with spec.md and story files, commits, and opens a PR |
| **PRD Writer (Repo)** | `prd-writer` | gpt-4.1 | bash | Action agent: creates a PRD markdown file on a branch and opens a PR |
| **Issue Creator** | `issue-creator` | gpt-4.1 | bash | Action agent: creates hierarchical GitHub issues (parent + sub-issues) via `gh` CLI |

---

## API Reference

All API endpoints are served by the backend on port `3001`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/repos/clone` | Clone a repository into `~/work/{username}/{repo}` |
| `GET` | `/api/repos/status` | Check whether a repository has already been cloned |
| `DELETE` | `/api/repos/remove` | Remove a cloned repository from the work directory |
| `GET` | `/api/repos/tree` | Return the file tree of a cloned repository |
| `POST` | `/api/agent/run` | Start an agent session and stream token output via SSE |
| `GET` | `/api/kdb/spaces` | Proxy endpoint to fetch GitHub Copilot Spaces (eliminates CORS errors) |
| `POST` | `/api/workiq/search` | Search Microsoft 365 data via WorkIQ MCP |
| `GET` | `/api/workiq/status` | Check if WorkIQ CLI is available |
| `POST` | `/api/workiq/detail` | Get details for a specific WorkIQ item |
| `GET` | `/api/admin/agents` | List all agent configurations |
| `GET` | `/api/admin/agents/:slug` | Get a single agent's YAML config |
| `PUT` | `/api/admin/agents/:slug` | Update an agent's YAML config |
| `GET` | `/health` | Health check — returns `200 OK` |

---

## Environment Variables

Environment variables are consumed by the **backend** only. Create a `.env` file in the `backend/` directory.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Port the Express server listens on |
| `WORK_DIR` | `~/work` | Base directory where repositories are cloned |

The frontend requires no server-side environment variables. The GitHub PAT is stored in the browser's `localStorage` and sent as an `Authorization` header on API requests.

---

## Development

### Hot Reload

- **Frontend** — Next.js provides fast refresh out of the box. Any change to a component or page is reflected immediately in the browser without a full reload.
- **Backend** — `nodemon` watches for file changes and `tsx` handles TypeScript compilation on the fly. The server restarts automatically on any `.ts` file change in `src/`.

### Root Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start both frontend and backend concurrently |
| `npm run build` | Build the frontend for production |
| `npm run install:all` | Install dependencies for all workspaces |

### Adding an Agent

1. Create a new YAML file in `backend/agents/` following the pattern of an existing agent file.
2. Register the slug → filename mapping in `backend/src/lib/agentFileMap.ts`.
3. Register the agent in `frontend/lib/agents.ts` with its `slug`, display name, description, and `nextAgent` if it chains.

---

## Testing

There are currently no automated test suites in this project. Verification is done through static analysis and manual end-to-end checks.

### Type Checking

Run the TypeScript compiler in no-emit mode against each package to catch type errors without producing build output:

```bash
# Frontend
cd frontend && npx tsc --noEmit

# Backend
cd backend && npx tsc --noEmit
```

### Linting

```bash
# Frontend (ESLint via Next.js)
cd frontend && npm run lint
```

### Manual Testing

After starting the app with `npm run dev`, verify the following flows:

| Flow | Steps |
|---|---|
| **Auth** | Open settings → enter a GitHub PAT → confirm username appears in the nav |
| **Repo clone** | Click **Select repo** → search for a public repo → select it → confirm it appears in the repo bar |
| **Agent run** | Pick any agent → type a prompt → confirm streamed tokens appear in the chat |
| **Agent handoff** | Complete a Deep Research session → click **Send to PRD Writer** → confirm context is prepopulated in the new session |
| **KDB attach** | Navigate to `/kdb` → connect a Copilot Space → start an agent session and confirm the space context is included |
| **Dashboard** | Navigate to `/dashboard` → confirm past sessions and activity events are listed |
| **WorkIQ** | Click the WorkIQ button in chat → search → attach a result → send a message → confirm context is included |
| **Admin** | Navigate to `/admin` → view agent list → edit an agent's prompt → save → confirm YAML file is updated |
| **Feature flags** | Navigate to `/settings` → toggle a flag off → confirm the corresponding UI element is hidden |
| **Action agents** | Complete a Technical Docs session → click "Create Docs on Repo" → confirm ActionPanel streams the spec-writer agent |

---

## Contributing

1. Fork the repository and create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes, ensuring code follows the existing TypeScript and ESLint conventions.
3. Run `npm run dev` and manually test affected flows.
4. Open a pull request with a clear description of the change and its motivation.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
