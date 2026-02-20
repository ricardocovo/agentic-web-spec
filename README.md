# Web-Spec

[![Version](https://img.shields.io/badge/version-0.1.0-blue)](package.json)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](#license)

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
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **3 chained AI agents** — Deep Research, PRD Writer, and Technical Docs form an end-to-end specification pipeline
- **Repository targeting** — search any GitHub repository; it is cloned automatically and all agents run directly inside it
- **Streaming chat** — real-time server-sent event (SSE) streaming powered by the GitHub Copilot SDK
- **Agent handoff** — forward the output of one agent as context to the next with a single click
- **Knowledge Base (KDB)** — attach a Copilot Space to inject external reference context into agent sessions
- **Dashboard** — session history and activity log persisted in `localStorage`
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
| GitHub Personal Access Token | — | Scopes required: `repo`, `read:user` — [create one](https://github.com/settings/tokens/new) |

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
│   │   └── kdb/
│   │       └── page.tsx            # Knowledge Base / Copilot Spaces
│   ├── components/
│   │   ├── ChatInterface.tsx       # Streaming chat UI component
│   │   ├── Nav.tsx                 # Top navigation bar
│   │   ├── RepoBar.tsx             # Active repository status bar
│   │   ├── PATModal.tsx            # GitHub PAT settings modal
│   │   ├── RepoSelectorModal.tsx   # Repository search and clone modal
│   │   └── ui/                     # Shared UI primitives
│   └── lib/
│       ├── agents.ts               # Agent definitions and chain order
│       ├── storage.ts              # localStorage read/write helpers
│       └── context.tsx             # AppProvider — global React context
├── backend/                        # Express API server (port 3001)
│   ├── package.json
│   ├── tsconfig.json
│   ├── agents/
│   │   ├── deep-research.agent.yaml
│   │   ├── prd.agent.yaml
│   │   └── technical-docs.agent.yaml
│   └── src/
│       ├── index.ts                # Server entry point
│       └── routes/
│           ├── repos.ts            # Repository clone, status, tree endpoints
│           └── agent.ts            # Agent runner + SSE streaming
└── reference/                      # Reference materials
```

---

## Agents

Agents are defined as YAML configuration files in `backend/agents/`. Each file specifies the model, system prompt, and tool permissions. The three agents form a sequential pipeline where the output of each agent can be forwarded as context to the next.

### Agent Pipeline

```
┌─────────────────┐     hand-off     ┌─────────────────┐     hand-off     ┌─────────────────┐
│  Deep Research  │ ───────────────► │   PRD Writer    │ ───────────────► │ Technical Docs  │
│  deep-research  │                  │      prd        │                  │ technical-docs  │
└─────────────────┘                  └─────────────────┘                  └─────────────────┘
```

### Agent Details

| Agent | Slug | Model | Tools | Description |
|---|---|---|---|---|
| **Deep Research** | `deep-research` | gpt-4.1 | grep, glob, view, bash | Analyzes codebase structure, technology constraints, patterns, and dependencies to produce a thorough research report |
| **PRD Writer** | `prd` | gpt-4.1 | grep, glob, view | Consumes the research output and generates a complete, structured Product Requirements Document with goals, user stories, and acceptance criteria |
| **Technical Docs** | `technical-docs` | gpt-4.1 | grep, glob, view, bash | Produces implementation task breakdowns, technical specifications, and developer-facing documentation based on the PRD |

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
2. Register the agent in `frontend/lib/agents.ts` with its `slug`, display name, and description.
3. Add the agent to the chain order array in `agents.ts` if it should participate in handoffs.

---

## Contributing

1. Fork the repository and create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes, ensuring code follows the existing TypeScript and ESLint conventions.
3. Run `npm run dev` and manually test affected flows.
4. Open a pull request with a clear description of the change and its motivation.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
