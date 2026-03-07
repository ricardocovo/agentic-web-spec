# Feature: WorkIQ Instant Attach

## Overview

Simplify the WorkIQ search-and-attach flow so that selecting search results and clicking "Attach" immediately adds items to the chat context without making a secondary network call to fetch full details. This removes latency, eliminates a failure point, and gives the user instant feedback.

## Problem Statement

When a user searches WorkIQ and clicks "Attach", the modal fires a `/api/backend/workiq/detail` request for **every** selected item before closing. This introduces noticeable delay (up to 90 seconds per item), can fail silently, and blocks the entire modal UI with a spinner. Users expect the attach action to be instant — they already see the search results and should be able to decide later whether to enrich them.

## Goals

- [ ] Make the "Attach" action instantaneous (no network calls)
- [ ] Remove the loading / "Fetching details…" state from the attach flow
- [ ] Keep search results data (title, type, summary, date) intact when attached

## Non-Goals

- Changing the search query logic or result parsing
- Adding an on-demand "Get Details" button (may be a follow-up feature)

## Target Users / Personas

| Persona | Description |
|---|---|
| Spec Author | A developer or PM who uses the agent pipeline to generate specs and wants to quickly pull in M365 context (emails, meetings, docs) without waiting |

## Functional Requirements

1. The system shall attach selected WorkIQ search results to the chat context immediately upon clicking "Attach", using only the data already returned by the search endpoint.
2. The system shall close the WorkIQ modal immediately after attaching items.
3. The system shall no longer display a loading spinner or "Fetching details…" text during attach.
4. The system shall remove all `disabled` guards that were tied to the detail-fetching `attaching` state.

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Attach action completes in < 50 ms (no network round-trip) |
| Reliability | Attach cannot fail due to a backend timeout or error |
| Accessibility | No change — existing keyboard and screen-reader support is preserved |

## UX / Design Considerations

- **Before:** User clicks Attach → spinner appears → modal blocked → detail requests fire → modal closes (or shows error).
- **After:** User clicks Attach → items added to chat chips instantly → modal closes. No spinner, no delay.
- The footer button text changes from conditional "Fetching details…" / "Attach N items" to always showing "Attach N item(s)".

## Technical Considerations

- The change is isolated to `frontend/components/WorkIQModal.tsx`.
- The `attaching` state variable and all references can be removed.
- The `handleAttach` callback becomes synchronous — it filters selected items, calls `onAttach()`, and calls `onClose()`.
- The backend `/detail` endpoint and its frontend proxy have been removed as they are no longer needed. Only `POST /api/workiq/search` remains.

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| WorkIQ search endpoint | Internal | Must continue returning `title`, `type`, `summary`, `date` in results |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Attached items have less detail than before | Med | Low | Search results already contain title, type, summary, and date — sufficient for context injection |
| Users miss the full-detail content | Low | Low | Can be addressed in a future "expand details" feature if needed |

## Success Metrics

- Attach action completes with zero network latency (instant)
- No UI errors or loading states during attach
- Existing search + attach + chat flow continues to work end-to-end

## Open Questions

- [x] Should the unused `/detail` frontend proxy route be removed now or left for future use? → **Resolved**: Removed. The single `POST /api/workiq/search` endpoint returns full WorkIQ responses directly, eliminating the need for a separate detail endpoint.

## User Stories

| Story | File |
|---|---|
| Remove detail fetching from attach | [stories/remove-detail-fetch.md](remove-detail-fetch.md) |
| Clean up attaching state and UI guards | [stories/clean-up-attaching-state.md](clean-up-attaching-state.md) |
