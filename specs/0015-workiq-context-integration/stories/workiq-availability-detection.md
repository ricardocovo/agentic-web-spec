# User Story: WorkIQ Availability Detection

## Summary

**As a** frontend application,
**I want** to detect whether WorkIQ is available on the backend,
**So that** I can show or hide the WorkIQ button and provide appropriate feedback to the user.

## Description

Not all deployments will have the WorkIQ CLI installed or configured. The frontend needs to check WorkIQ availability on load and conditionally render the WorkIQ button. This is done via a `GET /api/workiq/status` endpoint that reports whether the WorkIQ MCP server can be spawned. The status is cached on the frontend to avoid repeated checks, but can be refreshed.

If WorkIQ becomes unavailable mid-session (e.g., the MCP server crashes and can't restart), search requests will fail gracefully with error messages in the modal rather than crashing the UI.

## Acceptance Criteria

- [ ] Given the frontend loads an agent chat page, when the component mounts, then it makes a `GET /api/workiq/status` request to check availability.
- [ ] Given the status endpoint returns `{ available: true }`, when the check completes, then the WorkIQ button is rendered in the toolbar.
- [ ] Given the status endpoint returns `{ available: false }`, when the check completes, then the WorkIQ button is not rendered.
- [ ] Given the status endpoint is unreachable (network error), when the check fails, then the WorkIQ button is not rendered (fail closed).
- [ ] Given the status was already checked in this browser session, when the user navigates to another agent page, then the cached status is used (no redundant network request) unless the cache is older than 5 minutes.
- [ ] Given the backend determines WorkIQ is not available, when the status check explains why, then the `reason` field is logged to the console for debugging (e.g., "WorkIQ CLI not found", "WorkIQ MCP server failed to start").

## Tasks

- [ ] Implement `GET /api/workiq/status` in `backend/src/routes/workiq.ts` — check if `workiq` CLI is available (e.g., `which workiq` or try spawning and checking exit code), return `{ available: boolean, reason?: string }`
- [ ] On the backend, cache the availability result for 60 seconds to avoid repeated filesystem/process checks
- [ ] Create a `frontend/lib/workiq.ts` utility module with a `checkWorkIQStatus(): Promise<boolean>` function
- [ ] Implement frontend-side caching — store status result and timestamp in a module-level variable; return cached value if less than 5 minutes old
- [ ] Call `checkWorkIQStatus()` from `ChatInterface` on mount (in a `useEffect`) and store result in `workiqAvailable` state
- [ ] Ensure the status check does not block rendering — the WorkIQ button area should render as empty initially and appear when status is confirmed
- [ ] Handle fetch errors gracefully — if the status endpoint is unreachable, default to `available: false`
- [ ] Log the `reason` field from the status response to `console.debug` for developer debugging
- [ ] Add a Next.js API rewrite or proxy rule to forward `/api/backend/workiq/*` to `http://localhost:3001/api/workiq/*` (check existing rewrite patterns in `next.config.js` or `next.config.mjs`)

## Dependencies

- Depends on: [Backend WorkIQ MCP Proxy](backend-workiq-proxy.md) — the `/api/workiq/status` endpoint and WorkIQ client module must exist

## Out of Scope

- Real-time WebSocket notifications if WorkIQ availability changes mid-session
- Admin UI for configuring or installing WorkIQ
- Retry logic for availability checks beyond the cache TTL

## Notes

- The existing `SpaceSelector` component lazy-loads its data on mount but doesn't have a separate "availability" check — it just fails gracefully if no spaces are returned. WorkIQ needs an explicit availability check because the entire button should be hidden if WorkIQ isn't installed, to avoid confusing users.
- The frontend proxy pattern should match existing patterns. Check `next.config.mjs` for how `/api/backend/*` is proxied to `localhost:3001`. The WorkIQ routes should follow the same pattern.
- Consider using `SWR` or a simple fetch-with-cache pattern. Given the existing codebase doesn't use SWR, a manual cache in a module-level variable is more consistent.
