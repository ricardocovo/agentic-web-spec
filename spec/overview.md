# Web-Spec — Product Overview

## Summary

Web-Spec is a dark-themed web application that connects a GitHub repository to a chain of AI agents (powered by the GitHub Copilot SDK) to produce deep research, product requirements, and technical specifications — all in a real-time streaming chat interface.

## Goals

- Automate the specification pipeline: research → PRD → technical docs
- Keep context flowing between agents via an explicit handoff mechanism
- Run agents inside the actual codebase so they can inspect real files
- Persist session history locally without a backend database

## Architecture

```
agentic-web-spec/
├── frontend/   # Next.js 14 + TypeScript + Tailwind CSS  (port 3000)
└── backend/    # Node.js + Express + TypeScript           (port 3001)
```

The **frontend** handles UI, routing, and all state via localStorage.  
The **backend** clones repositories on-disk and spawns the GitHub Copilot SDK inside them, streaming SSE output back to the browser.

## User Flow

1. Enter a GitHub PAT in settings (⚙️ top-right).
2. Select a repository from the repo bar — it is shallow-cloned to `~/work/<username>/<repo>`.
3. Navigate to an agent card and start a conversation.
4. When the agent responds, click **Send to [next agent]** to pass its output as context.
5. Repeat through the chain: **Deep Research → PRD → Technical Docs**.

## Technology Stack

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
