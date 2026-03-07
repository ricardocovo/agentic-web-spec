# User Story: Backend WorkIQ MCP Proxy

## Summary

**As a** backend service,
**I want** to spawn and manage a WorkIQ MCP server process and expose a single search API endpoint,
**So that** the frontend can query Microsoft 365 data without direct access to WorkIQ or M365 credentials.

## Description

The WorkIQ CLI (`@microsoft/workiq`) provides an MCP server via `workiq mcp` that communicates over stdio. The MCP server exposes two tools: `accept_eula` (must be called with `{ eulaUrl: "https://github.com/microsoft/work-iq-mcp" }` before other tools work) and `ask_work_iq` (accepts `{ question: string }`). Tool names and parameters are discovered dynamically at runtime via `client.listTools()`.

The backend implements a single-phase query flow:
1. **Search**: `POST /api/workiq/search` wraps the user's query in a structured prompt requesting full details from the last 4 weeks. The response is cleaned up (trailing AI suggestions stripped) and returned as a single `WorkIQResult` containing the full WorkIQ response as the summary.
2. **Status**: `GET /api/workiq/status` reports whether the WorkIQ CLI is installed and available.

The MCP client is managed as a singleton (lazy-start on first request, auto-restart on crash).

## Acceptance Criteria

- [ ] Given the WorkIQ CLI is installed, when the backend starts and receives its first search request, then it spawns `workiq mcp` as a child process, connects via MCP SDK stdio transport, and auto-accepts the EULA.
- [ ] Given a valid search query, when `POST /api/workiq/search` is called with `{ "query": "Q4 planning" }`, then the endpoint wraps the query in a structured prompt requesting full details from the last 4 weeks, and returns a JSON response with `{ results: WorkIQResult[] }` containing the full WorkIQ response as the summary field.
- [ ] Given the WorkIQ MCP server is running, when `GET /api/workiq/status` is called, then it returns `{ available: true }`.
- [ ] Given the WorkIQ CLI is not installed, when `GET /api/workiq/status` is called, then it returns `{ available: false, reason: "WorkIQ CLI not found" }`.
- [ ] Given the MCP server process crashes, when the next search request arrives, then the backend auto-restarts the MCP server and retries the request once.
- [ ] Given a search request takes longer than 60 seconds, when the timeout is reached, then the endpoint returns a 504 with `{ error: "WorkIQ search timed out" }`.

## Tasks

- [x] Create `backend/src/lib/workiq-client.ts` — singleton MCP client manager that spawns `workiq mcp` via stdio, connects with `@modelcontextprotocol/sdk`, auto-accepts EULA, discovers tool names/params dynamically, and exposes `search(query: string): Promise<WorkIQResult[]>` and `isAvailable(): Promise<boolean>` methods
- [x] Define the `WorkIQResult` TypeScript interface: `{ id: string; type: 'email' | 'meeting' | 'document' | 'teams_message' | 'person'; title: string; summary: string; date?: string; sourceUrl?: string }`
- [x] Implement lazy initialization — spawn `workiq mcp` on first request, store the `StdioClientTransport` and `Client` instance at module level
- [x] Implement EULA auto-acceptance — call `accept_eula` with `{ eulaUrl: "https://github.com/microsoft/work-iq-mcp" }` during client initialization
- [x] Implement dynamic tool discovery — use `client.listTools()` to find the search tool name (matches "search", "query", or "ask") and its parameter name from the input schema
- [x] Implement structured search prompts — wrap user query with instructions to return full details from the last 4 weeks
- [x] Implement markdown response parsing — `stripTrailingSuggestions()` cleans trailing AI suggestion blocks from the response
- [x] Create `backend/src/routes/workiq.ts` — Express router with `POST /search` and `GET /status` endpoints
- [x] Register the WorkIQ router in `backend/src/index.ts` at path `/api/workiq`
- [x] Add request validation on `POST /search` — require non-empty `query` string, return 400 if missing
- [x] Add error handling — catch MCP errors, return appropriate HTTP status codes (502 for MCP errors, 504 for timeouts)
- [x] Create Next.js Route Handler proxy at `frontend/app/api/backend/workiq/search/route.ts` with 90s timeout (bypasses Next.js rewrite proxy which has insufficient timeout for WorkIQ's ~30-40s response times)
- [x] Verify all imports use `.js` extensions per the project's ESM convention

## Dependencies

- Depends on: `@microsoft/workiq` CLI being installed globally on the server
- Depends on: `@modelcontextprotocol/sdk` npm package for MCP client

## Out of Scope

- User-facing M365 authentication — WorkIQ is pre-authenticated by the admin
- Caching search results on the backend (can be added later)
- Pagination of search results
- Any modification to existing agent routes (that's the agent-context-forwarding story)

## Notes

- The WorkIQ MCP server exposes two tools: `accept_eula` (requires `{ eulaUrl: string }`) and `ask_work_iq` (requires `{ question: string }`). The EULA must be accepted on every new MCP connection before `ask_work_iq` will work.
- WorkIQ returns natural language markdown from M365 Copilot, not structured JSON. Typical response time is 30-40 seconds.
- The search prompt requests full details including all relevant information. Trailing AI suggestions ("If you'd like, I can also…") are stripped from the response.
- Next.js rewrite proxies have insufficient timeout for WorkIQ's response times, so a dedicated Route Handler file is used at `frontend/app/api/backend/workiq/search/route.ts` with explicit 90s `AbortSignal.timeout()`.
- Backend uses ESM — all local imports must use `.js` extensions (e.g., `import { workiqClient } from '../lib/workiq-client.js'`).
