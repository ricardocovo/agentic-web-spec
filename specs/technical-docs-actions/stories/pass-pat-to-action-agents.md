# User Story: Pass PAT to Action Agents

## Summary

**As a** backend developer,
**I want** the user's GitHub PAT to be forwarded as environment variables to action agents,
**So that** `gh` CLI and `git push` commands inside the agents have the credentials they need.

## Description

Currently the `/api/agent/run` route only injects `GH_TOKEN` and `GITHUB_PERSONAL_ACCESS_TOKEN` into the `CopilotClient` environment when `spaceRefs` are present. The two new action agents (`spec-writer`, `issue-creator`) require these env vars unconditionally. The route should be updated to always set these env vars whenever a PAT is present in the `Authorization: Bearer` header — regardless of whether spaceRefs are provided.

## Acceptance Criteria

- [ ] Given a request to `/api/agent/run` with an `Authorization: Bearer <pat>` header and no `spaceRefs`, when `CopilotClient` is created, then `GH_TOKEN` and `GITHUB_PERSONAL_ACCESS_TOKEN` are set in the process environment.
- [ ] Given a request with no `Authorization` header, when `CopilotClient` is created, then no PAT-related env vars are added (existing behavior preserved).
- [ ] Given a request with both `spaceRefs` and an `Authorization` header, when `CopilotClient` is created, then both MCP configuration and PAT env vars are set (existing behavior preserved and extended).
- [ ] Given the env vars are set, when the `spec-writer` agent runs `git push`, then the push succeeds using the embedded remote URL credentials.
- [ ] Given the env vars are set, when the `issue-creator` agent runs `gh issue create`, then it authenticates without prompting.

## Tasks

- [ ] Update `CopilotClient` instantiation in `backend/src/routes/agent.ts` to set `GH_TOKEN` and `GITHUB_PERSONAL_ACCESS_TOKEN` whenever `pat` is truthy, not only when `spaceRefs.length > 0`
- [ ] Verify existing spaceRefs + PAT path still sets `COPILOT_MCP_COPILOT_SPACES_ENABLED: "true"` (no regression)
- [ ] Add `Authorization: Bearer {pat}` header to the fetch call in `handleCreateSpecs` and `handleCreateIssues` in `page.tsx`
- [ ] Confirm PAT is never logged in backend console output (use existing PAT sanitization pattern from `repos.ts`)

## Dependencies

- Depends on: none (self-contained backend change)

## Out of Scope

- Storing or refreshing the PAT server-side
- Validating PAT scopes before running agents (errors surface in the stream)

## Notes

- The `pat` variable in `agent.ts` is already extracted from the `Authorization` header on line 87; only the condition for setting env vars needs to change
- Change is minimal: move env var injection outside the `if (spaceRefs.length > 0 && pat)` block into a separate `if (pat)` block, then extend the spaceRefs block to add only the MCP-specific vars
- The cloned repo's remote URL already embeds credentials, so `git push` works via the remote URL — `GH_TOKEN` is primarily for `gh` CLI in `issue-creator`
