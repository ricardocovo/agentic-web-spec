# User Story: Update frontend to call backend proxy

## Summary

**As a** frontend developer,
**I want** to update the KDB page to call the backend proxy endpoint instead of GitHub API directly,
**So that** users can successfully load their Copilot Spaces without CORS errors.

## Description

This story updates the `loadSpaces()` function in `frontend/app/kdb/page.tsx` to call the new backend proxy endpoint at `/api/kdb/spaces` instead of directly calling `https://api.github.com/user/copilot/spaces`. The change is minimal: only the fetch URL needs to be updated, while all existing headers, error handling, and UI logic remain unchanged.

The frontend will continue to pass the GitHub PAT in the Authorization header, and the backend proxy will forward it to GitHub. All existing UI states (loading, error, empty, success) continue to work as designed.

## Acceptance Criteria

- [ ] Given a user with a valid PAT navigates to `/kdb`, when the page loads, then it calls `GET /api/kdb/spaces` instead of the GitHub API directly
- [ ] Given the backend returns success with spaces data, when the frontend receives the response, then the spaces are displayed in the grid layout as before
- [ ] Given the backend returns 404 or 422, when the frontend receives the response, then the "No Copilot Spaces found" empty state displays
- [ ] Given the backend returns an error (400, 401, 500), when the frontend receives the response, then the error message is displayed in the error banner
- [ ] Given no PAT is configured, when the page loads, then the existing "Configure your GitHub PAT" message displays and no API call is made

## Tasks

- [ ] Open `frontend/app/kdb/page.tsx` in editor
- [ ] Locate the `loadSpaces()` function (around line 34)
- [ ] Change the fetch URL from `https://api.github.com/user/copilot/spaces` to `/api/kdb/spaces`
- [ ] Verify all existing request headers (Authorization, Accept, X-GitHub-Api-Version) remain unchanged
- [ ] Verify error handling logic for 404/422 and other errors remains unchanged
- [ ] Verify the response parsing logic for array or object format remains unchanged
- [ ] Save the file

## Dependencies

> List any other stories, services, or preconditions that must be in place before this story can start or complete.

- Depends on: "Create backend proxy endpoint for GitHub Copilot Spaces" story must be completed and the backend endpoint must be functional
- Backend server must be running at expected port (3001 in development)

## Out of Scope

> Anything explicitly excluded from this story to keep it focused.

- Changing the UI layout or design
- Modifying error messages or empty state text
- Adding new loading states or animations
- Changing the localStorage logic for selected space
- Adding retry logic or advanced error handling
- Updating TypeScript types (the CopilotSpace interface remains the same)

## Notes

> Any additional context, references, or design decisions relevant to this story.

- In Next.js development mode, requests to `/api/*` are automatically proxied from localhost:3000 to localhost:3001 based on the backend configuration
- The change is a single-line edit: replace the full GitHub URL with the relative `/api/kdb/spaces` path
- All existing error handling is preserved; the backend passes through GitHub's error responses
- The frontend's existing logic for handling both array and object response formats means it's robust to potential GitHub API changes
- No new dependencies or imports are required for this change
