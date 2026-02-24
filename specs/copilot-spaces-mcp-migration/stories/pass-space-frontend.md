# User Story: Pass Selected Space from Frontend to Backend

## Summary

**As a** developer,
**I want** the selected Copilot Space to be automatically included in agent run requests,
**So that** I don't have to manually reference the space in every prompt — it's used as context by default.

## Description

The KDB page stores the selected space in `localStorage` under `web_spec_selected_space` (format: `"owner/name"`). Currently, the agent chat page (`/agents/[slug]/page.tsx`) does not read this value or include it in the `POST /api/agent/run` request body.

This story adds the `spaceRef` field to the agent run request body by reading the selected space from `localStorage` at request time.

## Acceptance Criteria

- [ ] Given a space is selected in localStorage (`web_spec_selected_space`), when the user sends a message in an agent chat, then the request body includes `spaceRef` with the value from localStorage.
- [ ] Given no space is selected in localStorage, when the user sends a message, then the request body does not include `spaceRef` (field is omitted or undefined).
- [ ] Given the user deselects a space on the KDB page mid-session, when the next message is sent, then `spaceRef` is no longer included in the request.
- [ ] Given the frontend proxy (`/api/agent/run/route.ts`) forwards the request, when `spaceRef` is in the body, then it reaches the backend unchanged.

## Tasks

- [ ] In `frontend/app/agents/[slug]/page.tsx`, read `web_spec_selected_space` from `localStorage` inside the `handleSend` callback
- [ ] Add `spaceRef` to the `JSON.stringify` body of the fetch call to `/api/agent/run` (only when the value is non-null)
- [ ] Verify the Next.js API proxy route (`frontend/app/api/agent/run/route.ts`) passes the body through unchanged (it does — it uses `await request.text()` and forwards as-is)

## Dependencies

- Depends on: `inject-space-context` story (backend must accept `spaceRef` in request body)

## Out of Scope

- Adding a visual indicator in the agent chat header showing the active space
- Allowing the user to change the space from within the agent chat page
- Storing space selection per-session (it's a global setting)

## Notes

- The `localStorage` key `web_spec_selected_space` stores the value as a plain string in `"owner/name"` format. No JSON parsing needed — use `localStorage.getItem()` directly.
- This read happens at send-time (not mount-time) so it always reflects the latest selection, even if the user visited the KDB page between messages.
