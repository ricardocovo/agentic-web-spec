# web-spec-backend

Backend service for the **Web-Spec** (agentic-web-spec) project. It is a Node.js + Express HTTP server that manages GitHub repository cloning, spawns GitHub Copilot SDK agent sessions against those repositories, and streams model output back to the frontend via Server-Sent Events (SSE).

---

## Technology Stack

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | 4.21 | HTTP server and routing |
| `@github/copilot-sdk` | ^0.1.25 | Copilot agent sessions and tool execution |
| `yaml` | ^2.8.2 | Agent YAML configuration parsing |
| `cors` | ^2.8.5 | Cross-origin request handling |
| `dotenv` | ^16.4.0 | Environment variable loading |
| `typescript` | 5 | Type-safe compilation (ES2022, NodeNext) |
| `tsx` | ^4.21.0 | Zero-compile dev execution |
| `nodemon` | ^3.1.0 | File-watch dev server restarts |

Runtime: **Node.js 18+**, ESM (`"type": "module"`).

---

## Project Structure

```
backend/
├── agents/
│   ├── deep-research.agent.yaml   # Deep Research agent — codebase analysis
│   ├── prd.agent.yaml             # PRD Writer agent — requirements documents
│   └── technical-docs.agent.yaml  # Technical Docs agent — task breakdowns
├── src/
│   ├── index.ts                   # Express server entry point (port 3001)
│   └── routes/
│       ├── repos.ts               # Repository management endpoints
│       └── agent.ts               # Agent runner + SSE streaming
├── .env.example                   # Example environment variable definitions
├── tsconfig.json                  # TypeScript config (NodeNext, ES2022)
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js 18+** (ESM support required)
- **GitHub CLI (`gh`)** authenticated (`gh auth login`) — required for Copilot SDK sessions

### Install

```bash
cd backend
npm install
```

### Environment Setup

```bash
cp .env.example .env
```

Edit `.env` as needed (see [Environment Variables](#environment-variables) below).

### Run in Development

```bash
npm run dev
```

The server starts on `http://localhost:3001` and restarts automatically when source files change.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port the Express server listens on |
| `WORK_DIR` | `~/work` | Base directory where repositories are cloned (`os.homedir()/work`) |

---

## API Reference

### Repository Endpoints — `/api/repos`

| Method | Path | Body / Query | Description |
|--------|------|------|-------------|
| `POST` | `/api/repos/clone` | `{ repoFullName, pat, username }` | Shallow-clone a repo into `$WORK_DIR/{username}/{repo}`. Returns `{ success, repoPath, alreadyCloned }` |
| `GET` | `/api/repos/status` | `?username=&repoName=` | Check whether a repo has already been cloned. Returns `{ exists, repoPath }` |
| `DELETE` | `/api/repos/remove` | `{ username, repoName }` | Delete a cloned repository from disk |
| `GET` | `/api/repos/tree` | `?username=&repoName=` | Return the file tree of a cloned repository |

### Agent Endpoint — `/api/agent`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/api/agent/run` | `{ agentSlug, prompt, repoPath, context? }` | Start a Copilot agent session and stream output via SSE. `context` is optional prior-session context injected into the system prompt |

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Returns `{ status: "ok" }` |

---

## SSE Streaming

`POST /api/agent/run` does not return a standard JSON response. Instead it opens a persistent **Server-Sent Events** stream (`Content-Type: text/event-stream`).

### Event Format

Each line from the server follows the SSE protocol:

```
data: <payload>\n\n
```

### Payload Types

| Payload | Meaning |
|---------|---------|
| `<text token>` | A streamed text fragment from the model |
| `[DONE]` | The agent session completed successfully |
| `[ERROR] <message>` | A fatal error occurred; the stream closes after this event |

### Client Example

```js
const res = await fetch('/api/agent/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ agentSlug: 'prd', prompt: '...', repoPath: '/path/to/repo' }),
});

const reader = res.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  const text = decoder.decode(value);
  // parse SSE lines: strip "data: " prefix, check for [DONE] / [ERROR]
}
```

---

## Agent Configuration

Agents are defined as YAML files in `backend/agents/`. The route handler in `src/routes/agent.ts` maps a slug to a file at startup.

### YAML Schema

```yaml
name: <slug>
displayName: <human-readable name>
description: <one-line description>
model: gpt-4.1
tools:
  - grep
  - glob
  - view
  - bash        # optional
prompt: |
  <system prompt — may contain {{cwd}} placeholder>
```

The `{{cwd}}` placeholder is replaced at runtime with the absolute path of the cloned repository.

### Slug-to-File Mapping

| Slug | File |
|------|------|
| `deep-research` | `agents/deep-research.agent.yaml` |
| `prd` | `agents/prd.agent.yaml` |
| `technical-docs` | `agents/technical-docs.agent.yaml` |

### Available Agents

#### Deep Research

| Field | Value |
|-------|-------|
| Model | gpt-4.1 |
| Tools | grep, glob, view, bash |
| Purpose | Thorough codebase analysis — structure, patterns, tech stack, constraints, risks, recommendations |
| Output | Summary, Codebase Analysis, Research Findings, Constraints & Risks, Recommendations |

#### PRD Writer

| Field | Value |
|-------|-------|
| Model | gpt-4.1 |
| Tools | grep, glob, view |
| Purpose | Transforms research output into actionable Product Requirements Documents |
| Output | Overview, Goals & Success Metrics, User Stories with acceptance criteria, Technical Requirements, Out of Scope, Open Questions |

#### Technical Docs

| Field | Value |
|-------|-------|
| Model | gpt-4.1 |
| Tools | grep, glob, view, bash |
| Purpose | Converts PRDs into implementation-ready task breakdowns |
| Output | Architecture Overview, Data Models & Schemas, API Contracts, Implementation Tasks (each with file paths, type, description, implementation notes, acceptance criteria) |

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `nodemon --exec tsx src/index.ts` | Watch mode — restarts on source changes |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/index.js` | Run the compiled production build |

---

## TypeScript Configuration

Defined in `tsconfig.json`:

| Option | Value |
|--------|-------|
| `target` | `ES2022` |
| `module` | `NodeNext` |
| `moduleResolution` | `NodeNext` |
| `strict` | `true` |
| `outDir` | `./dist` |
| `rootDir` | `./src` |

`NodeNext` module resolution is required to correctly resolve `.js` extension imports in ESM output. All source lives under `src/`; compiled output goes to `dist/`.

---

## Development Notes

**Hot reload via `tsx`**
The dev server uses `tsx` (not `ts-node`) for near-instant restarts without a separate compilation step. `nodemon` watches the `src/` directory and re-executes `tsx src/index.ts` on any change.

**CORS**
The server accepts cross-origin requests only from `http://localhost:3000`. Requests from any other origin are rejected by the `cors` middleware. To change the allowed origin, update the `cors` options in `src/index.ts`.

**Repository cloning**
Cloning is performed with `git clone --depth 1` (shallow clone) to minimise disk usage. The PAT provided in the request body is interpolated into the remote URL but is redacted from any error messages returned to the client.

**Copilot SDK lifecycle**
`CopilotClient` must be started (`.start()`) before a session can be created. If any error occurs after the client has started, `client.stop()` is called in the error handler to release resources. Always check that the client is running before attempting to create a session.

**Agent context injection**
The optional `context` field in a `/api/agent/run` request body is prepended to the agent's system prompt. This allows the caller to carry context from a prior agent session (for example, passing Deep Research output into the PRD Writer).
