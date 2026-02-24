# User Story: Inject Space Context into Agent Sessions

## Summary

**As a** developer,
**I want** agent sessions to automatically have access to my selected Copilot Space via MCP,
**So that** agent responses are grounded in the curated context from my space (design docs, coding standards, etc.).

## Description

Currently, even when a user selects a Copilot Space on the KDB page, the space's context is never injected into agent sessions. The selected space key (`web_spec_selected_space`) is stored in `localStorage` but the `POST /api/agent/run` endpoint doesn't accept or use it.

This story modifies `backend/src/routes/agent.ts` to accept an optional `spaceRef` parameter. When present, the agent session is created with the `copilot_spaces` MCP server attached, and the system prompt is augmented with instructions to call `get_copilot_space` to retrieve the space's context.

## Acceptance Criteria

- [ ] Given the request body contains `spaceRef: "myorg/my-space"`, when the agent session is created, then the `mcpServers` config includes the `copilot_spaces` MCP server.
- [ ] Given the request body contains `spaceRef`, when the system prompt is built, then it includes an instruction referencing the space and telling the agent to use `get_copilot_space`.
- [ ] Given the request body does NOT contain `spaceRef`, when the agent session is created, then no MCP server is added (existing behavior preserved).
- [ ] Given an agent session with MCP is running, when the agent calls `get_copilot_space`, then the MCP permission is auto-approved and the tool executes successfully.
- [ ] Given the MCP server connection fails, when the agent session encounters an error, then the error is streamed to the frontend as an SSE `error` event.

## Tasks

- [ ] Add `spaceRef?: string` to the destructured request body type in `backend/src/routes/agent.ts`
- [ ] Build a `mcpServers` config object conditionally when `spaceRef` is provided: `{ copilot_spaces: { type: "http", url: "https://api.githubcopilot.com/mcp/x/copilot_spaces", tools: ["*"] } }`
- [ ] Pass the `mcpServers` config to the `client.createSession()` call
- [ ] Append a space-context instruction to the system prompt when `spaceRef` is present: `\n\nYou have access to a Copilot Space: "${spaceRef}". Use the get_copilot_space tool to retrieve its context and incorporate it into your analysis.`
- [ ] Add `onPermissionRequest` handler to the session config that auto-approves `kind: "mcp"` requests
- [ ] Verify that existing agent behavior is unchanged when `spaceRef` is not provided

## Dependencies

- Depends on: `@github/copilot-sdk` `SessionConfig.mcpServers` support (verified)
- Depends on: Frontend passing `spaceRef` in request body (story: `pass-space-frontend`)

## Out of Scope

- Changing agent YAML configs to include MCP server definitions (MCP is added dynamically at runtime)
- Passing multiple spaces to a single agent session
- Displaying which space is active in the agent chat UI

## Notes

- The `MCPRemoteServerConfig` type requires `tools: string[]`. Use `["*"]` to expose all available tools from the copilot_spaces endpoint (`list_copilot_spaces`, `get_copilot_space`).
- The permission handler should only auto-approve `mcp` kind requests. Other permission types (`shell`, `write`) should follow existing behavior (currently no handler is set, so they use SDK defaults).
