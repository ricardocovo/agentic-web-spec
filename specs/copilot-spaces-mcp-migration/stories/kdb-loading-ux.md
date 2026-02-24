# User Story: Update KDB Page Loading UX

## Summary

**As a** developer,
**I want** the Knowledge Base page to show appropriate loading feedback during the slower MCP-based space listing,
**So that** I understand the system is working and don't think it's broken or hung.

## Description

The MCP-based space listing requires a CopilotClient session with an LLM round-trip, making it significantly slower than the previous direct API call (10-30 seconds vs <1 second). The current loading UX shows a generic spinner with "Loading Copilot Spaces…" which is insufficient for a multi-second wait.

This story updates the KDB page to provide better loading feedback, handle the new response format, and add error recovery options.

## Acceptance Criteria

- [ ] Given the spaces are being fetched via MCP, when the loading state is active, then the UI shows a descriptive message like "Connecting to Copilot Spaces via MCP…" instead of the generic spinner text.
- [ ] Given the MCP request takes longer than 5 seconds, when the user is waiting, then the UI shows an additional message like "This may take a moment — querying the MCP server…"
- [ ] Given the MCP request fails or times out, when the error is displayed, then a "Retry" button is available to re-attempt the listing.
- [ ] Given the backend returns a valid JSON array of spaces, when the frontend processes the response, then it correctly handles both direct arrays and `{ spaces: [...] }` wrapper formats (backward compatibility).
- [ ] Given the backend returns a 500 error with a descriptive message, when the error is shown, then the message is displayed to the user.

## Tasks

- [ ] Update the loading indicator text in `frontend/app/kdb/page.tsx` from "Loading Copilot Spaces..." to "Connecting to Copilot Spaces via MCP…"
- [ ] Add a secondary loading message that appears after a 5-second delay using a `setTimeout` in the loading state
- [ ] Add a "Retry" button in the error state that calls `loadSpaces()` again
- [ ] Ensure the response parsing handles the same `CopilotSpace` interface (`name`, `owner`, `description`, `url`)
- [ ] Test that the existing space selection/deselection flow works unchanged with the new data source

## Dependencies

- Depends on: `list-spaces-mcp` story (backend must return spaces via MCP)

## Out of Scope

- Caching spaces in `sessionStorage` to skip re-fetching (potential follow-up)
- Changing the space card design or selection mechanism
- Adding a manual space input option as fallback

## Notes

- The `CopilotSpace` interface in the frontend expects `{ name, owner, description?, url? }`. The MCP-based listing may not return `url` — ensure the UI handles missing `url` gracefully (it already does via optional chaining).
- The 5-second delayed message uses a simple `setTimeout`/`clearTimeout` pattern tied to the `loading` state. Clean up the timeout on unmount or when loading completes.
