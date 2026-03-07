# User Story: Remove Detail Fetching from Attach

## Summary

**As a** spec author,
**I want** the "Attach" action to use search results as-is without calling a separate detail endpoint,
**So that** attaching WorkIQ items is instant and never fails due to a backend timeout.

## Description

The `handleAttach` in `WorkIQModal.tsx` directly passes selected search results to `onAttach()` without any additional network requests. The backend `/detail` endpoint and its frontend proxy have been removed entirely — the single `POST /api/workiq/search` endpoint now returns full WorkIQ responses directly as the summary field.

## Acceptance Criteria

- [x] Given a user has selected one or more search results, when they click "Attach", then `onAttach()` is called immediately with the selected items' existing data (no network request).
- [x] Given a user clicks "Attach", then the modal closes immediately without any loading indicator.
- [x] Given the backend has no `/detail` endpoint, when the codebase is searched, then no references to `/api/workiq/detail` or `/api/backend/workiq/detail` exist.

## Tasks

- [x] Replace the async `handleAttach` body with synchronous logic: filter selected items from `results`, call `onAttach(selectedItems)`, call `onClose()`
- [x] Remove the `try/catch` block and `Promise.all` detail-fetching logic from `handleAttach`
- [x] Remove the `setAttaching` / `setError` calls inside `handleAttach`
- [x] Remove the backend `POST /detail` endpoint from `backend/src/routes/workiq.ts`
- [x] Remove the `getDetail()` function and `trimToContentSummary()` helper from `backend/src/lib/workiq-client.ts`
- [x] Remove the frontend proxy route at `frontend/app/api/backend/workiq/detail/route.ts`
- [x] Verify the `onAttach` callback in `ChatInterface.tsx` still receives the expected `WorkIQResult[]` shape

## Dependencies

- None — this is a standalone change

## Out of Scope

- Adding an on-demand "Get Details" button

## Notes

- The `handleAttach` function is a plain (non-async) callback since it no longer awaits anything.
- The search endpoint returns full WorkIQ responses as the summary field, so no detail enrichment is needed.
