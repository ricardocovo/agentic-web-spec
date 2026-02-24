# Feature: Copilot Spaces MCP Migration

## Overview

Migrate the Copilot Spaces integration from a non-functional direct GitHub REST API (`/user/copilot/spaces`) to the GitHub MCP server, using the `@github/copilot-sdk`'s built-in `mcpServers` session config. This enables both listing available spaces and injecting space context into agent sessions — matching how IDEs access Copilot Spaces via MCP tools (`list_copilot_spaces`, `get_copilot_space`).

## Problem Statement

The current backend route (`GET /api/kdb/spaces`) calls `https://api.github.com/user/copilot/spaces`, a GitHub REST API endpoint that is not available. Users see errors when visiting the Knowledge Base page, and even when a space *is* selected, its context is never actually passed to agent sessions. GitHub's documentation specifies that Copilot Spaces outside the web UI must be accessed through the **GitHub MCP server** — the same approach used by VS Code, JetBrains, and other IDEs.

## Goals

- [ ] Replace the broken REST API call with MCP-based space listing via the Copilot SDK
- [ ] Inject selected Copilot Space context into agent sessions so agents can leverage curated knowledge
- [ ] Provide a seamless UX despite the inherently slower MCP-based listing (LLM round-trip required)
- [ ] Auto-approve MCP permission requests so agent sessions can call space tools without manual intervention

## Non-Goals

- Implementing a full MCP client independent of the Copilot SDK (the SDK abstracts this)
- Caching or persisting space content server-side (spaces stay in sync automatically via MCP)
- Supporting multiple simultaneous space selections (current UI selects one space at a time)
- Changing agent YAML configs or adding new agents — this feature only modifies how existing sessions are configured

## Target Users / Personas

| Persona | Description |
|---|---|
| Developer | Uses the app to analyze repos and generate specs; wants agent responses grounded in curated Copilot Space context (design docs, coding standards, architecture decisions) |
| Team Lead | Curates Copilot Spaces on GitHub with project context; wants the team's agentic tool to leverage that context automatically |

## Functional Requirements

1. The system shall list the user's available Copilot Spaces by creating a CopilotClient session with the `copilot_spaces` MCP server and prompting it to enumerate spaces
2. The system shall parse the MCP-based listing response into structured JSON (`name`, `owner`, `description`) for the frontend
3. The system shall accept an optional `spaceRef` parameter (`owner/name`) on the `POST /api/agent/run` endpoint
4. The system shall attach the `copilot_spaces` MCP server to agent sessions when `spaceRef` is provided
5. The system shall append a space-reference instruction to the agent's system prompt so the agent calls `get_copilot_space` automatically
6. The system shall auto-approve MCP permission requests (`kind: "mcp"`) in agent sessions
7. The frontend shall read the selected space from `localStorage` and include it in agent run requests
8. The frontend shall display appropriate loading UX during the slower MCP-based space listing

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Space listing via MCP may take 10–30s (LLM round-trip); frontend must show a clear loading state and not time out prematurely |
| Reliability | Robust JSON parsing of LLM output — handle markdown-wrapped JSON, extra whitespace, and partial responses gracefully |
| Security | PAT is passed to `CopilotClient` via the `githubToken` option for user-scoped space access; never logged or persisted server-side |
| Scalability | Each listing request spins up a short-lived CopilotClient; acceptable for single-user dev tool but not designed for high concurrency |

## UX / Design Considerations

- **KDB page loading**: Replace the quick spinner with a more informative loading state explaining that spaces are being fetched via MCP (takes longer than a typical API call). Consider a progress message like "Connecting to Copilot Spaces via MCP…"
- **Agent session indicator**: When a space is selected and active, the agent chat header could show a subtle badge or label (out of scope for this feature but worth noting)
- **Error handling**: If MCP listing fails or times out, show a clear error with retry option. If the response can't be parsed as JSON, show a "could not load spaces" message rather than crashing
- **Space selection flow**: No change — user still clicks a space card to select/deselect. The selection is persisted in `localStorage` under `web_spec_selected_space`

## Technical Considerations

- **MCP URL**: Use the dedicated spaces-only endpoint `https://api.githubcopilot.com/mcp/x/copilot_spaces` (avoids needing `X-MCP-Toolsets` header, provides only spaces tools)
- **SDK `mcpServers` config**: The `MCPRemoteServerConfig` type supports `type: "http"`, `url`, `headers`, and `tools` fields — all verified in the SDK's TypeScript definitions
- **`sendAndWait` for listing**: The backend creates a session, sends a structured prompt requesting JSON output, and uses `sendAndWait` with a 60s timeout. The response is parsed with fallback regex for markdown-wrapped JSON
- **Permission handling**: Agent sessions need a `permissionHandler` that returns `kind: "approved"` for MCP requests, otherwise the SDK blocks tool calls
- **Client lifecycle**: Each MCP listing request creates and destroys a CopilotClient. For agent sessions, the existing client lifecycle is reused — just the session config changes

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| `@github/copilot-sdk` v0.1.25+ | Internal | Must support `mcpServers` in `SessionConfig` (verified in current types) |
| GitHub MCP Server | External | `https://api.githubcopilot.com/mcp/x/copilot_spaces` must be operational |
| Copilot CLI authentication | Internal | CopilotClient must be authenticated to access MCP server; uses `githubToken` option |
| `web_spec_selected_space` localStorage key | Internal | Already exists in frontend; used by KDB page |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Slow space listing (10-30s) due to LLM round-trip | High | Med | Clear loading UX, consider caching results in sessionStorage for the current browser session |
| LLM returns non-JSON or malformed output | Med | Med | Robust parsing: try direct JSON.parse, then regex for JSON in markdown code blocks, then return empty array with error |
| `githubToken` option doesn't grant MCP access | Low | High | Fall back to system auth (gh CLI); test both auth methods |
| MCP permission requests block agent execution | Med | High | Auto-approve all `kind: "mcp"` permission requests in the permission handler |
| Copilot Spaces MCP endpoint is unavailable or rate-limited | Low | High | Graceful error handling with retry button; timeout at 60s |

## Success Metrics

- Metric 1: KDB page successfully lists spaces for authenticated users (currently 0% success → target 100%)
- Metric 2: Agent sessions with a selected space can access space context via MCP tools
- Metric 3: No increase in agent session startup failures when `spaceRef` is provided

## Open Questions

- [ ] Should we cache the spaces list in `sessionStorage` to avoid repeated MCP round-trips within the same browser session?
- [ ] Should the space context badge be shown in the agent chat header when a space is active?
- [ ] Should agents be given both `list_copilot_spaces` and `get_copilot_space`, or only `get_copilot_space` (since we already know the space ref)?

## User Stories

| Story | File |
|---|---|
| List Copilot Spaces via MCP | [stories/list-spaces-mcp.md](stories/list-spaces-mcp.md) |
| Inject Space Context into Agent Sessions | [stories/inject-space-context.md](stories/inject-space-context.md) |
| Pass Selected Space from Frontend to Backend | [stories/pass-space-frontend.md](stories/pass-space-frontend.md) |
| Update KDB Page Loading UX | [stories/kdb-loading-ux.md](stories/kdb-loading-ux.md) |
| Auto-Approve MCP Permissions | [stories/auto-approve-mcp-permissions.md](stories/auto-approve-mcp-permissions.md) |
