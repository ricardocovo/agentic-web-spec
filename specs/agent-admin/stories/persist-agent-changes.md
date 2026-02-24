# User Story: Persist Agent Changes

## Summary

**As a** developer or power user,
**I want** to save my edits to an agent by clicking a Save button,
**So that** my changes are written to the YAML file on disk and take effect for future agent runs.

## Description

The editor panel has a Save button at the bottom of the form. When clicked, the frontend collects the current form state (`displayName`, `description`, `model`, `tools`, `prompt`) and sends a PUT request to `/api/admin/agents/:slug`. On success, the form is marked as clean (not dirty), and a success notification is shown briefly. On failure, an error message is displayed. The Save button is visually disabled when the form has no unsaved changes.

## Acceptance Criteria

- [ ] Given the form has unsaved changes, when the user clicks the Save button, then a PUT request is sent to `http://localhost:3001/api/admin/agents/:slug` with the full form state as a JSON body.
- [ ] Given the PUT request succeeds (HTTP 200), when the response is received, then the form is marked as clean (not dirty) and a green "Saved successfully" message appears below the Save button.
- [ ] Given the success message is shown, when 3 seconds have elapsed, then the success message is automatically hidden.
- [ ] Given the PUT request fails (HTTP 4xx or 5xx), when the response is received, then a red error message containing the API error detail is displayed below the Save button and remains visible until the next save attempt.
- [ ] Given the form has no unsaved changes (`isDirty` is false), when the editor panel renders the Save button, then the button is visually dimmed and does not submit when clicked.
- [ ] Given a save is in progress, when the PUT request has not yet resolved, then the Save button shows a loading state (e.g., "Saving…") and is not clickable.
- [ ] Given a save succeeds, when the user reloads the page and selects the same agent, then the editor panel shows the updated values that were just saved.

## Tasks

- [ ] Add `isSaving` and `saveStatus` (`'idle' | 'saving' | 'success' | 'error'`) state to the editor form state
- [ ] Implement `handleSave()` async function that PUTs `{ displayName, description, model, tools, prompt }` to `http://localhost:3001/api/admin/agents/${selectedSlug}`
- [ ] Set `isSaving` to true while the request is in flight and reset on completion
- [ ] On success: mark form as clean (sync `lastSavedValues` ref), set `saveStatus` to `'success'`
- [ ] On error: set `saveStatus` to `'error'` with error message text
- [ ] Auto-clear success status after 3 seconds using `setTimeout` inside a `useEffect`
- [ ] Render Save button with disabled + dimmed styling when `!isDirty || isSaving`
- [ ] Render "Saving…" label on the Save button when `isSaving` is true
- [ ] Render a green success message below the button when `saveStatus === 'success'`
- [ ] Render a red error message below the button when `saveStatus === 'error'`

## Dependencies

> Depends on: Backend Admin API story (PUT /api/admin/agents/:slug must exist and accept the JSON body)
> Depends on: Edit Agent Metadata, Edit Agent Prompt, Edit Agent Tools stories (form fields must exist)

## Out of Scope

- Optimistic UI updates before the server confirms the write
- Auto-save on field blur or debounced auto-save
- Conflict detection if another user saves the same file concurrently

## Notes

- The JSON body sent in the PUT request should contain only the five editable fields: `displayName`, `description`, `model`, `tools`, `prompt`. The `name` field is never sent — the backend derives it from the slug in the URL.
- Success/error messages should be positioned consistently below the Save button and styled using the existing Tailwind theme tokens.
