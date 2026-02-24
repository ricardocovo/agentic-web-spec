# User Story: List Copilot Spaces via MCP

## Summary

**As a** developer,
**I want** the Knowledge Base page to list my Copilot Spaces by querying the GitHub MCP server through the Copilot SDK,
**So that** I can browse and select spaces even though the direct REST API is unavailable.

## Description

The current `GET /api/kdb/spaces` backend route calls `https://api.github.com/user/copilot/spaces`, which returns errors because the endpoint does not exist. This story replaces that implementation with one that creates a short-lived `CopilotClient` session configured with the `copilot_spaces` MCP server, sends a prompt to list spaces, parses the structured response, and returns it as JSON to the frontend.

The MCP server URL is `https://api.githubcopilot.com/mcp/x/copilot_spaces` (the dedicated spaces-only endpoint), which exposes the `list_copilot_spaces` tool without requiring custom `X-MCP-Toolsets` headers.

## Acceptance Criteria

- [ ] Given an authenticated user visits the KDB page, when the backend receives `GET /api/kdb/spaces`, then it creates a CopilotClient with `githubToken` from the Authorization header and returns a JSON array of spaces.
- [ ] Given the MCP session returns a valid response, when the backend parses it, then each space object contains at minimum `name` and `owner` fields.
- [ ] Given the MCP session returns markdown-wrapped JSON, when the backend parses it, then it extracts the JSON from code blocks successfully.
- [ ] Given the MCP session times out or errors, when the backend handles the failure, then it returns an appropriate HTTP error (500) with a descriptive message.
- [ ] Given the request completes (success or failure), when cleanup runs, then the CopilotClient session is destroyed and the client is stopped.

## Tasks

- [ ] Remove the direct `fetch("https://api.github.com/user/copilot/spaces")` call from `backend/src/routes/kdb.ts`
- [ ] Import `CopilotClient` from `@github/copilot-sdk` in `kdb.ts`
- [ ] Extract the PAT from the `Authorization` header (strip `Bearer ` prefix)
- [ ] Create a `CopilotClient` with `{ githubToken: pat }` option
- [ ] Start the client and create a session with `mcpServers` config: `{ copilot_spaces: { type: "http", url: "https://api.githubcopilot.com/mcp/x/copilot_spaces", tools: ["*"] } }`
- [ ] Add a permission handler to auto-approve MCP permission requests on the listing session
- [ ] Send a structured prompt via `sendAndWait` (60s timeout): "List all my Copilot Spaces. Return ONLY a JSON array where each element has fields: name, owner, description. No markdown, no explanation."
- [ ] Parse the response content — first try `JSON.parse`, then try regex extraction from markdown code blocks (`` ```json ... ``` ``)
- [ ] Return the parsed array as the HTTP response with status 200
- [ ] Wrap everything in try/catch/finally — stop the client in the `finally` block
- [ ] Return 500 with descriptive error message on failure

## Dependencies

- Depends on: `@github/copilot-sdk` supporting `mcpServers` with `MCPRemoteServerConfig` (verified in current SDK types)
- Depends on: GitHub MCP server at `https://api.githubcopilot.com/mcp/x/copilot_spaces` being operational

## Out of Scope

- Caching the spaces list (could be added as a follow-up)
- Changing the response format expected by the frontend (maintain backward compatibility where possible)
- Supporting pagination of spaces

## Notes

- The `sendAndWait` approach means this endpoint will be significantly slower than a direct API call (10-30s). The frontend story (`kdb-loading-ux`) handles the UX implications.
- The `githubToken` option on `CopilotClientOptions` passes the token to the CLI server via environment variable, which the MCP server uses for authentication.
- Consider adding `systemMessage: { content: "You are a JSON API. Only output valid JSON arrays. Never use markdown." }` to improve parsing reliability.
