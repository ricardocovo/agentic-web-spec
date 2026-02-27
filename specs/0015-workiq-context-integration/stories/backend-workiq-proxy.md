# User Story: Backend WorkIQ MCP Proxy

## Summary

**As a** backend service,
**I want** to spawn and manage a WorkIQ MCP server process and expose a search API endpoint,
**So that** the frontend can query Microsoft 365 data without direct access to WorkIQ or M365 credentials.

## Description

The WorkIQ CLI (`@microsoft/workiq`) provides an MCP server via `workiq mcp` that communicates over stdio. The MCP server exposes two tools: `accept_eula` (must be called with `{ eulaUrl: "https://github.com/microsoft/work-iq-mcp" }` before other tools work) and `ask_work_iq` (accepts `{ question: string }`). Tool names and parameters are discovered dynamically at runtime via `client.listTools()`.

The backend implements a two-phase query flow:
1. **Search phase**: `POST /api/workiq/search` wraps the user's query in a structured prompt requesting itemized results from the last 4 weeks (type, title, date, brief description). The markdown response is parsed into individual `WorkIQResult` items.
2. **Detail phase**: `POST /api/workiq/detail` fetches the full summary, transcript, or notes for a specific item by title and type.
3. **Status**: `GET /api/workiq/status` reports whether the WorkIQ CLI is installed and available.

The MCP client is managed as a singleton (lazy-start on first request, auto-restart on crash).

## Acceptance Criteria

- [ ] Given the WorkIQ CLI is installed, when the backend starts and receives its first search request, then it spawns `workiq mcp` as a child process, connects via MCP SDK stdio transport, and auto-accepts the EULA.
- [ ] Given a valid search query, when `POST /api/workiq/search` is called with `{ "query": "Q4 planning" }`, then the endpoint wraps the query in a structured prompt requesting itemized results from the last 4 weeks, and returns a JSON response with `{ results: WorkIQResult[] }` where each result has `id`, `type`, `title`, `summary`, `date`, and `sourceUrl` fields parsed from the markdown response.
- [ ] Given a valid item title and type, when `POST /api/workiq/detail` is called with `{ "title": "Q4 Planning Meeting", "type": "meeting" }`, then the endpoint returns `{ detail: string }` containing the full summary, transcript, or notes for that item.
- [ ] Given the WorkIQ MCP server is running, when `GET /api/workiq/status` is called, then it returns `{ available: true }`.
- [ ] Given the WorkIQ CLI is not installed, when `GET /api/workiq/status` is called, then it returns `{ available: false, reason: "WorkIQ CLI not found" }`.
- [ ] Given the MCP server process crashes, when the next search request arrives, then the backend auto-restarts the MCP server and retries the request once.
- [ ] Given a search request takes longer than 60 seconds, when the timeout is reached, then the endpoint returns a 504 with `{ error: "WorkIQ search timed out" }`.

## Tasks

- [x] Create `backend/src/lib/workiq-client.ts` — singleton MCP client manager that spawns `workiq mcp` via stdio, connects with `@modelcontextprotocol/sdk`, auto-accepts EULA, discovers tool names/params dynamically, and exposes `search(query: string): Promise<WorkIQResult[]>`, `getDetail(title: string, type: string): Promise<string>`, and `isAvailable(): Promise<boolean>` methods
- [x] Define the `WorkIQResult` TypeScript interface: `{ id: string; type: 'email' | 'meeting' | 'document' | 'teams_message' | 'person'; title: string; summary: string; date?: string; sourceUrl?: string }`
- [x] Implement lazy initialization — spawn `workiq mcp` on first request, store the `StdioClientTransport` and `Client` instance at module level
- [x] Implement EULA auto-acceptance — call `accept_eula` with `{ eulaUrl: "https://github.com/microsoft/work-iq-mcp" }` during client initialization
- [x] Implement dynamic tool discovery — use `client.listTools()` to find the search tool name (matches "search", "query", or "ask") and its parameter name from the input schema
- [x] Implement structured search prompts — wrap user query with instructions to return itemized results from the last 4 weeks with type, title, date, and one-sentence description
- [x] Implement markdown response parsing — `parseItemizedResponse()` extracts individual items from numbered/bulleted markdown lists
- [x] Implement `getDetail()` — second-phase WorkIQ call that requests full summary/transcript/notes for a specific item
- [x] Implement process lifecycle management — listen for `close`/`error` events on the child process, set client to `null` on crash so next request re-initializes
- [x] Add a 60-second timeout wrapper on MCP `tools/call` requests
- [x] Create `backend/src/routes/workiq.ts` — Express router with `POST /search`, `POST /detail`, and `GET /status` endpoints
- [x] Register the WorkIQ router in `backend/src/index.ts` at path `/api/workiq`
- [x] Add request validation on `POST /search` — require non-empty `query` string, return 400 if missing
- [x] Add request validation on `POST /detail` — require non-empty `title` string, return 400 if missing
- [x] Add error handling — catch MCP errors, return appropriate HTTP status codes (502 for MCP errors, 504 for timeouts)
- [x] Create Next.js Route Handler proxies at `frontend/app/api/backend/workiq/search/route.ts` and `frontend/app/api/backend/workiq/detail/route.ts` with 90s timeouts (bypasses Next.js rewrite proxy which has insufficient timeout for WorkIQ's ~30-40s response times)
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
- The search prompt is structured to request itemized results only (no full content), while the detail prompt requests full summary/transcript/notes. This two-phase approach keeps the initial search fast and avoids bloating the search results.
- The markdown parser handles common patterns: numbered lists (`1. **Title**`), bold bullet items (`- **Title**`), and extracts type/date metadata from subsequent lines.
- Next.js rewrite proxies have insufficient timeout for WorkIQ's response times, so dedicated Route Handler files are used at `frontend/app/api/backend/workiq/*/route.ts` with explicit 90s `AbortSignal.timeout()`.
- Backend uses ESM — all local imports must use `.js` extensions (e.g., `import { workiqClient } from '../lib/workiq-client.js'`).
