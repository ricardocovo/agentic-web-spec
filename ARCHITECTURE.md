# Architecture

This document describes the system architecture of **Web-Spec** — how the frontend, backend, GitHub Copilot SDK, and external services interact.

---

## System Overview

```mermaid
flowchart TD
    subgraph Browser["Browser — localhost:3000"]
        subgraph NextJS["Next.js 14 Frontend (TypeScript + Tailwind)"]
            Pages["Pages\n/ · /agents/[slug] · /dashboard · /kdb"]
            Components["Components\nChatInterface · Nav · RepoBar\nPATModal · RepoSelectorModal"]
            AppCtx["AppProvider — React Context\npat · username · activeRepo"]
            LS[("localStorage\nsessions · activity\nPAT · username · activeRepo")]
        end
    end

    subgraph Backend["Node.js Express — localhost:3001"]
        Express["Express Server\nsrc/index.ts"]

        subgraph Routes["Routes"]
            ReposRoute["POST /api/repos/clone\nGET  /api/repos/status\nGET  /api/repos/tree\nDELETE /api/repos/remove"]
            AgentRoute["POST /api/agent/run\n— SSE Streaming —"]
            KdbRoute["GET /api/kdb/spaces\n— MCP via CopilotClient —"]
        end

        YAMLLoader["YAML Agent Config Loader\nbackend/agents/*.agent.yaml"]

        subgraph CopilotSDK["@github/copilot-sdk"]
            CopilotClient["CopilotClient\n{ cwd: repoPath }"]
            Session["Session\nmodel: gpt-4.1\nstreaming: true\nsystemMessage + tools"]
        end
    end

    subgraph Disk["Local Filesystem"]
        WorkDir[("~/work/{username}/{repo}\nShallow-cloned repositories")]
        AgentYAML["backend/agents/\ndeep-research.agent.yaml\nprd.agent.yaml\ntechnical-docs.agent.yaml"]
    end

    subgraph GitHub["GitHub"]
        GitHubAPI["GitHub REST API\nrepo search · user info"]
        CopilotSpacesMCP["GitHub MCP Server\napi.githubcopilot.com/mcp/x/copilot_spaces\nlist_copilot_spaces · get_copilot_space"]
        GitRemote["github.com\ngit clone over HTTPS + PAT"]
        CopilotAPI["GitHub Copilot API\ngpt-4.1 model\ntool execution host"]
    end

    %% Frontend internal
    Pages -- state reads/writes --> AppCtx
    AppCtx <--> LS
    Components -- state reads --> AppCtx

    %% Frontend → Backend
    Pages -- "REST + SSE\nHTTP" --> Express
    Express --> Routes

    %% Repos route
    ReposRoute -- "git clone --depth 1\n(HTTPS + PAT)" --> WorkDir
    ReposRoute -- HTTPS --> GitRemote

    %% KDB route
    KdbRoute -- "CopilotClient + MCP\nlist_copilot_spaces" --> CopilotSpacesMCP
    Pages -- "fetch /api/kdb/spaces" --> KdbRoute

    %% Agent route
    AgentRoute -- "load config" --> YAMLLoader
    YAMLLoader -- "reads" --> AgentYAML
    AgentRoute -- "new CopilotClient({ cwd })" --> CopilotClient
    CopilotClient -- "client.start()" --> Session
    CopilotClient -- "cwd reference" --> WorkDir

    %% SDK → Copilot API
    Session -- "send prompt + system message" --> CopilotAPI
    CopilotAPI -- "tool calls: grep · glob · view · bash" --> WorkDir
    WorkDir -- "tool results" --> CopilotAPI
    CopilotAPI -- "streaming token deltas" --> Session

    %% Streaming back to browser
    Session -- "message_delta events" --> AgentRoute
    AgentRoute -- "SSE: event:chunk · event:done · event:error" --> Pages

    %% Frontend → GitHub API (PAT auth)
    Pages -- "GitHub REST API\n(repo search, user info)" --> GitHubAPI
    
    %% KDB spaces listed via MCP server (CopilotClient session)
    %% Agent sessions optionally attach copilot_spaces MCP for space context
```

---

## Agent Run — Sequence Diagram

This diagram shows the exact sequence of calls when a user submits a prompt to an agent.

```mermaid
sequenceDiagram
    actor User
    participant FE as Next.js Frontend<br/>(ChatInterface.tsx)
    participant BE as Express Backend<br/>(routes/agent.ts)
    participant YAML as Agent YAML Config<br/>(agents/*.agent.yaml)
    participant SDK as @github/copilot-sdk<br/>CopilotClient
    participant Copilot as GitHub Copilot API<br/>(gpt-4.1)
    participant Repo as ~/work/{user}/{repo}<br/>(Cloned Repo)

    User->>FE: Enter prompt, click Send
    FE->>BE: POST /api/agent/run<br/>{ agentSlug, prompt, repoPath, context?, spaceRef? }

    BE->>YAML: loadAgentConfig(agentSlug)
    YAML-->>BE: { model, tools, prompt }

    BE->>SDK: new CopilotClient({ cwd: repoPath })
    BE->>SDK: client.start()

    BE->>SDK: client.createSession({<br/>  model, streaming: true,<br/>  systemMessage, availableTools,<br/>  mcpServers? (if spaceRef)<br/>})
    SDK-->>BE: session ready

    BE-->>FE: HTTP 200 + SSE headers<br/>(text/event-stream)

    BE->>SDK: session.send({ prompt })

    loop Tool execution (grep · glob · view · bash)
        Copilot->>Repo: Read files / run commands
        Repo-->>Copilot: Tool results
    end

    loop Streaming tokens
        Copilot-->>SDK: token delta (assistant.message_delta)
        SDK-->>BE: SessionEvent: message_delta
        BE-->>FE: SSE event:chunk · data:"<token>"
        FE-->>User: Append token to chat UI
    end

    SDK-->>BE: SessionEvent: session.idle
    BE-->>FE: SSE event:done
    BE->>SDK: client.stop()

    FE->>User: Show "Send to [next agent]" button
```

---

## Agent Pipeline

Agents are chained — the output of one session can be forwarded as `context` to the next agent's system prompt.

```mermaid
flowchart LR
    DR["Deep Research\ndeep-research.agent.yaml\nTools: grep · glob · view · bash"]
    PRD["PRD Writer\nprd.agent.yaml\nTools: grep · glob · view"]
    TD["Technical Docs\ntechnical-docs.agent.yaml\nTools: grep · glob · view · bash"]

    DR -- "Send to PRD\n(output as context)" --> PRD
    PRD -- "Send to Technical Docs\n(output as context)" --> TD
```

All agents use model `gpt-4.1` and run with `cwd` set to the cloned repository, giving them full filesystem access via their declared tools.

---

## Component Responsibilities

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| Frontend pages | Next.js 14 App Router | Routing, SSE consumption, UI rendering |
| Frontend state | React Context + localStorage | PAT, username, active repo, sessions, activity log |
| Backend server | Express 4 + TypeScript | HTTP routing, CORS, request validation |
| Repo management | `child_process.execSync` + `git` | Shallow clone, file tree, removal |
| Agent execution | `@github/copilot-sdk` `CopilotClient` | Session lifecycle, prompt dispatch, tool delegation, MCP server integration |
| SSE proxy | Next.js Route Handler (`app/api/agent/run/route.ts`) | Bypasses rewrite-proxy buffering; pipes backend `ReadableStream` directly to client |
| Streaming transport | Server-Sent Events (SSE) | Token-by-token delivery from Copilot API to browser |
| Agent config | YAML files (`agents/*.agent.yaml`) | Model, tools, system prompt per agent |
| Model backend | GitHub Copilot API (gpt-4.1) | LLM inference + tool call execution against the repo |

---

## Data Flow Summary

1. **User** enters a GitHub PAT and selects a repository in the frontend.
2. **Frontend** calls `POST /api/repos/clone` → backend runs `git clone --depth 1` into `~/work/{username}/{repo}`.
3. **User** picks an agent and submits a prompt.
4. **Frontend** opens an SSE connection via `POST /api/agent/run`.
5. **Backend** reads the agent's YAML config, instantiates a `CopilotClient` with `cwd` pointing to the cloned repo, and creates a streaming session.
6. **GitHub Copilot API** receives the system prompt + user message, executes tool calls (`grep`, `glob`, `view`, `bash`) directly against the repo filesystem, and streams tokens back.
7. **Backend** forwards each `message_delta` event as an SSE `chunk` event.
8. **Frontend** renders tokens in real time. On completion, a "Send to [next agent]" button appears, passing the full response as `context` to the next agent in the chain.

---

## Copilot Spaces via MCP

The Knowledge Base page lists the user's Copilot Spaces by creating a short-lived `CopilotClient` session configured with the `copilot_spaces` MCP server (`https://api.githubcopilot.com/mcp/x/copilot_spaces`). The session prompts the LLM to call `list_copilot_spaces` and return structured JSON. This takes 10-30 seconds due to the LLM round-trip.

When a user selects a space, the `spaceRef` (`owner/name`) is stored in `localStorage` and included in subsequent `POST /api/agent/run` requests. The backend conditionally attaches the `copilot_spaces` MCP server to the agent session and appends a system prompt instruction to call `get_copilot_space`, giving the agent access to the curated space context.

MCP permission requests (`kind: "mcp"`) are auto-approved in both the KDB listing and agent sessions. Non-MCP permission requests are denied by rules.
