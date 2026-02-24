# User Story: Update Backend to Accept Multiple Space References

## Summary

**As a** developer using Copilot Spaces,
**I want** the agent run endpoint to accept an array of space references,
**So that** the agent can query multiple Copilot Spaces in a single session for richer context.

## Description

The current `/api/agent/run` endpoint accepts a single `spaceRef` string. This story updates it to accept `spaceRefs: string[]` (an array of `"owner/name"` strings), updates the system prompt to list all selected spaces, and maintains backward compatibility with the legacy single-value parameter.

## Acceptance Criteria

- [ ] Given a request with `spaceRefs: ["org/space-a", "org/space-b"]`, when the agent session starts, then the system prompt includes instructions referencing both spaces.
- [ ] Given a request with `spaceRefs: ["org/space-a"]`, when the agent session starts, then MCP servers are configured with copilot_spaces toolset and the PAT environment variables are set.
- [ ] Given a request with `spaceRefs: []` or no `spaceRefs`, when the agent session starts, then no space instructions are added and no MCP server is configured (same as current no-space behavior).
- [ ] Given a request with legacy `spaceRef: "org/space-a"` (no `spaceRefs`), when the agent session starts, then it is treated as `spaceRefs: ["org/space-a"]` for backward compatibility.
- [ ] Given a request with both `spaceRef` and `spaceRefs`, when the agent session starts, then `spaceRefs` takes precedence.
- [ ] Given a request with spaces selected, when the system prompt is constructed, then it reads: `You have access to these Copilot Spaces: "org/space-a", "org/space-b". Use the get_copilot_space tool for each space to retrieve its context and incorporate it into your analysis.`

## Tasks

- [ ] Update the request body type in `backend/src/routes/agent.ts` to include `spaceRefs?: string[]`
- [ ] Add normalization logic: merge `spaceRef` into `spaceRefs` if only the legacy param is provided
- [ ] Update `spaceInstruction` generation to list all space names from the array
- [ ] Update the conditional for MCP server config and PAT env vars to check `spaceRefs.length > 0`
- [ ] Update the conditional for the `Authorization` header requirement to check `spaceRefs.length > 0`
- [ ] Test with zero, one, and multiple spaces to verify system prompt and MCP config

## Dependencies

- None — this is a standalone backend change.

## Out of Scope

- Changing the MCP server configuration per-space (it's a single toolset toggle)
- Adding validation that the space names actually exist
- Rate limiting or throttling space-related requests

## Notes

- The MCP server config is identical regardless of how many spaces are selected — it enables the `copilot_spaces` toolset, and the agent calls `get_copilot_space` per space.
- The system prompt is the only place that changes based on the number of spaces — it tells the agent which spaces to query.
