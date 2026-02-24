# User Story: Update Agent Page to Send Selected Spaces

## Summary

**As a** developer submitting prompts to agents,
**I want** my selected Copilot Spaces to be included in the agent run request,
**So that** the agent can access those spaces' knowledge during its response.

## Description

Update the agent page (`frontend/app/agents/[slug]/page.tsx`) to receive the selected spaces array from `ChatInterface`'s updated `onSend` callback and include them as `spaceRefs` in the `POST /api/agent/run` request body. Also ensure the `Authorization` header is sent when spaces are selected.

## Acceptance Criteria

- [ ] Given the user has selected spaces ["org/space-a", "org/space-b"] and submits a prompt, when the API request is made, then the body includes `spaceRefs: ["org/space-a", "org/space-b"]`.
- [ ] Given the user has selected spaces and has a PAT, when the API request is made, then the `Authorization: Bearer <PAT>` header is included.
- [ ] Given the user has not selected any spaces, when the API request is made, then no `spaceRefs` field is in the body and no Authorization header is added (unless required for other reasons).
- [ ] Given the `handleSend` callback receives `(content, selectedSpaces)`, when it builds the fetch request, then it uses `selectedSpaces` from the argument (not from `localStorage`).
- [ ] Given the old `localStorage.getItem("web_spec_selected_space")` line exists, when this story is complete, then that line is removed from `handleSend`.

## Tasks

- [ ] Update `handleSend` in `frontend/app/agents/[slug]/page.tsx` to accept `selectedSpaces: string[]` as second parameter
- [ ] Replace `localStorage.getItem("web_spec_selected_space")` with the `selectedSpaces` parameter
- [ ] Change the request body from `spaceRef: string` to `spaceRefs: string[]`
- [ ] Update the Authorization header conditional to check `selectedSpaces.length > 0` instead of `spaceRef`
- [ ] Update the `useCallback` dependency array if needed
- [ ] Verify the `handleSend` signature matches `ChatInterface`'s `onSend` prop type

## Dependencies

- Depends on: `integrate-chat-interface` (ChatInterface must pass `selectedSpaces` through `onSend`)
- Depends on: `backend-multi-space` (backend must accept `spaceRefs` array)

## Out of Scope

- Modifying the SSE streaming response handling
- Changing how context from previous messages is built
- Updating the handoff mechanism

## Notes

- The current code at line 126 reads `const spaceRef = localStorage.getItem("web_spec_selected_space") || undefined;` — this is the line to replace.
- The Authorization header logic at line 130-131 currently checks `spaceRef && pat` — update to check `selectedSpaces.length > 0 && pat`.
