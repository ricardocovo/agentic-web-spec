# User Story: Auto-Approve MCP Permissions

## Summary

**As a** developer,
**I want** MCP tool calls to be automatically approved in agent sessions,
**So that** agents can call `get_copilot_space` and `list_copilot_spaces` without manual intervention or blocking.

## Description

The Copilot SDK fires `PermissionRequest` events with `kind: "mcp"` when an agent session attempts to call an MCP tool. Without a permission handler, the SDK's default behavior may block or deny the call. Since our MCP server is the trusted GitHub endpoint for Copilot Spaces, we should auto-approve these requests.

This applies to both the KDB listing session (story: `list-spaces-mcp`) and agent sessions with a space attached (story: `inject-space-context`).

## Acceptance Criteria

- [ ] Given an agent session has a `copilot_spaces` MCP server configured, when the agent calls `list_copilot_spaces` or `get_copilot_space`, then the permission request is automatically approved.
- [ ] Given a permission request with `kind: "mcp"` is received, when the handler processes it, then it returns `{ kind: "approved" }`.
- [ ] Given a permission request with a non-MCP kind (e.g., `kind: "shell"`), when the handler processes it, then it does NOT auto-approve (either uses SDK default or denies).
- [ ] Given the KDB listing session creates a session with the permission handler, when the listing prompt triggers `list_copilot_spaces`, then the tool executes without blocking.

## Tasks

- [ ] Create a reusable `mcpPermissionHandler` function in `backend/src/routes/agent.ts` (or a shared utility) that returns `{ kind: "approved" }` for `kind: "mcp"` requests
- [ ] For non-MCP permission requests, return `{ kind: "denied-by-rules" }` or pass through to SDK defaults
- [ ] Add `onPermissionRequest: mcpPermissionHandler` to the `createSession` config in `agent.ts` when `spaceRef` is provided
- [ ] Add the same permission handler to the KDB listing session in `kdb.ts`
- [ ] Verify that shell/write/read permission requests are not affected

## Dependencies

- Depends on: None (this is a utility used by other stories)

## Out of Scope

- Implementing a full permission management UI
- Configurable permission policies per agent
- Logging or auditing permission decisions

## Notes

- The `PermissionRequest` interface has `kind: "shell" | "write" | "mcp" | "read" | "url"`. We only auto-approve `"mcp"`.
- The `PermissionRequestResult` must have `kind: "approved" | "denied-by-rules" | "denied-no-approval-rule-and-could-not-request-from-user" | "denied-interactively-by-user"`. Use `"approved"` for MCP and `"denied-by-rules"` for others.
- This handler is shared between the KDB route and the agent route. Consider placing it in a shared utility file if the routes grow, but for now inlining it in each route is acceptable since it's a ~5 line function.
