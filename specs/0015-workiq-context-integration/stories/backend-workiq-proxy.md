# User Story: Backend WorkIQ MCP Proxy

## Summary

**As a** backend service,
**I want** to spawn and manage a WorkIQ MCP server process and expose a search API endpoint,
**So that** the frontend can query Microsoft 365 data without direct access to WorkIQ or M365 credentials.

## Description

The WorkIQ CLI (`@microsoft/workiq`) provides an MCP server via `workiq mcp` that communicates over stdio. The backend needs to:
1. Manage this MCP server as a singleton process (lazy-start on first request, auto-restart on crash).
2. Use the MCP SDK client to send search tool calls to the server.
3. Expose a `POST /api/workiq/search` endpoint that accepts a query string and returns categorized results.
4. Expose a `GET /api/workiq/status` health-check endpoint so the frontend knows if WorkIQ is available.

This follows the same pattern as the existing Copilot Spaces MCP integration in `backend/src/routes/agent.ts`, but uses stdio transport instead of HTTP.

## Acceptance Criteria

- [ ] Given the WorkIQ CLI is installed, when the backend starts and receives its first search request, then it spawns `workiq mcp` as a child process and connects via MCP SDK stdio transport.
- [ ] Given a valid search query, when `POST /api/workiq/search` is called with `{ "query": "Q4 planning" }`, then the endpoint returns a JSON response with `{ results: WorkIQResult[] }` where each result has `id`, `type`, `title`, `summary`, `date`, and `sourceUrl` fields.
- [ ] Given the WorkIQ MCP server is running, when `GET /api/workiq/status` is called, then it returns `{ available: true }`.
- [ ] Given the WorkIQ CLI is not installed, when `GET /api/workiq/status` is called, then it returns `{ available: false, reason: "WorkIQ CLI not found" }`.
- [ ] Given the MCP server process crashes, when the next search request arrives, then the backend auto-restarts the MCP server and retries the request once.
- [ ] Given a search request takes longer than 10 seconds, when the timeout is reached, then the endpoint returns a 504 with `{ error: "WorkIQ search timed out" }`.

## Tasks

- [ ] Create `backend/src/lib/workiq-client.ts` — singleton MCP client manager that spawns `workiq mcp` via stdio, connects with `@modelcontextprotocol/sdk`, and exposes `search(query: string): Promise<WorkIQResult[]>` and `isAvailable(): Promise<boolean>` methods
- [ ] Define the `WorkIQResult` TypeScript interface: `{ id: string; type: 'email' | 'meeting' | 'document' | 'teams_message' | 'person'; title: string; summary: string; date?: string; sourceUrl?: string }`
- [ ] Implement lazy initialization — spawn `workiq mcp` on first `search()` call, store the `StdioClientTransport` and `Client` instance at module level
- [ ] Implement process lifecycle management — listen for `close`/`error` events on the child process, set client to `null` on crash so next request re-initializes
- [ ] Add a 10-second timeout wrapper on MCP `tools/call` requests
- [ ] Create `backend/src/routes/workiq.ts` — Express router with `POST /search` and `GET /status` endpoints
- [ ] Register the WorkIQ router in `backend/src/index.ts` at path `/api/workiq`
- [ ] Add request validation on `POST /search` — require non-empty `query` string, return 400 if missing
- [ ] Add error handling middleware — catch MCP errors, return appropriate HTTP status codes (502 for MCP errors, 504 for timeouts)
- [ ] Verify all imports use `.js` extensions per the project's ESM convention
- [ ] Add `@modelcontextprotocol/sdk` to backend `package.json` dependencies if not already present

## Dependencies

- Depends on: `@microsoft/workiq` CLI being installed globally on the server
- Depends on: `@modelcontextprotocol/sdk` npm package for MCP client

## Out of Scope

- User-facing M365 authentication — WorkIQ is pre-authenticated by the admin
- Caching search results on the backend (can be added later)
- Pagination of search results
- Any modification to existing agent routes (that's the agent-context-forwarding story)

## Notes

- The existing Copilot Spaces MCP integration uses HTTP transport (`type: "http"`). WorkIQ uses stdio transport (`type: "stdio"`), so the client setup is different — use `StdioClientTransport` from `@modelcontextprotocol/sdk/client/stdio.js`.
- The WorkIQ MCP server tool name and input schema need to be discovered at runtime via `client.listTools()`. The search tool is expected to accept a `query` parameter.
- Backend uses ESM — all local imports must use `.js` extensions (e.g., `import { workiqClient } from '../lib/workiq-client.js'`).
