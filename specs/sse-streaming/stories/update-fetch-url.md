# User Story: Update fetch URL to use new route handler

## Summary

**As a** developer using the Web-Spec app,
**I want** fetch requests to use the new unbuffered route handler,
**So that** SSE events reach the client in real-time without proxy buffering.

## Description

Currently, `frontend/app/agents/[slug]/page.tsx` makes fetch requests to `/api/backend/agent/run`, which routes through the Next.js rewrite proxy that buffers responses. This story updates the fetch URL to `/api/agent/run` to use the new Next.js Route Handler that pipes streams directly.

This is a simple one-line change but critical to completing the SSE streaming fix.

## Acceptance Criteria

- [x] Given the agent page makes a fetch request, when it invokes `fetch()`, then the URL is `/api/agent/run`
- [x] Given the old URL was `/api/backend/agent/run`, when the code is updated, then all references to the old URL are removed
- [x] Given the page loads, when a user submits a prompt, then the request goes to the route handler at `/api/agent/run`
- [x] Given the route handler is working, when the fetch completes, then SSE events stream in real-time

## Tasks

- [x] Locate the fetch call in `frontend/app/agents/[slug]/page.tsx` that invokes `/api/backend/agent/run`
- [x] Change the URL parameter from `/api/backend/agent/run` to `/api/agent/run`
- [x] Search the codebase for any other references to `/api/backend/agent/run` (there should be none, but verify)
- [x] Test the page end-to-end to verify streaming works
- [x] Verify in browser DevTools Network tab that requests go to `/api/agent/run`
- [x] Verify in browser DevTools that SSE events appear incrementally (not all at once)

## Dependencies

> Depends on:
> - Route handler implementation (Story 1)
> - SSE line parser fix (Story 2) for correct parsing of streamed events

## Out of Scope

- Changing request body format or headers
- Adding error handling or retry logic (already exists)
- Updating other API endpoints (only `/api/backend/agent/run` is affected)

## Notes

- This is a single-line change but requires the route handler to be in place first
- The old rewrite proxy rule can remain in `next.config.mjs` for other endpoints (if any use it)
- After this change, the flow is: Frontend → Route Handler → Backend (unbuffered)
- Example change:
  ```typescript
  // Before:
  const response = await fetch('/api/backend/agent/run', { ... });
  
  // After:
  const response = await fetch('/api/agent/run', { ... });
  ```
- Verify the change doesn't break error handling or loading states
