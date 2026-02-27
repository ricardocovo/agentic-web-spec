# User Story: WorkIQ Search Modal

## Summary

**As a** Product Manager or Engineering Lead,
**I want** to search my Microsoft 365 data from a modal within the agent chat,
**So that** I can quickly find relevant emails, meetings, documents, and Teams messages to attach as context.

## Description

A full-screen modal (following the `RepoSelectorModal` pattern) provides a search interface for WorkIQ. Users type a query, results are fetched from the backend `POST /api/workiq/search` endpoint, and displayed in categorized sections or tabs (Emails, Meetings, Documents, Teams Messages, People). Each result shows its title, a brief snippet/summary, date, and a source-type icon. Users can select multiple results via checkmarks and confirm their selection with an "Attach" button.

The modal must handle loading states, empty results, and errors (WorkIQ unavailable). Search is triggered explicitly via a Search button or the Enter key to avoid excessive API calls.

## Acceptance Criteria

- [ ] Given the modal is open, when the user types a query and clicks the Search button (or presses Enter), then a search request is sent to `POST /api/workiq/search` and results are displayed.
- [ ] Given search results are returned, when they include multiple types, then results are grouped into sections: Emails, Meetings, Documents, Teams Messages, People — each with a section header and icon.
- [ ] Given a result is displayed, when the user views it, then they see the title, a 1-2 line summary snippet, the date (relative or absolute), and a type-specific icon.
- [ ] Given results are displayed, when the user clicks a result, then it is toggled as selected (checkmark appears) and can be deselected by clicking again.
- [ ] Given one or more results are selected, when the user clicks "Attach N items", then the modal closes and the selected items are passed to the parent component.
- [ ] Given the user presses Escape or clicks the × button, when the modal is open, then it closes without attaching any items.
- [ ] Given a search is in progress, when results have not yet returned, then a loading skeleton or spinner is displayed.
- [ ] Given the search returns no results, when the results area is rendered, then a "No results found for '{query}'" message is shown.
- [ ] Given the WorkIQ backend returns an error, when the error is received, then a user-friendly error message is displayed in the modal.

## Tasks

- [ ] Create `frontend/components/WorkIQModal.tsx` component with the fixed overlay pattern from `RepoSelectorModal` (`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm`)
- [ ] Define the `WorkIQResult` TypeScript interface on the frontend: `{ id: string; type: string; title: string; summary: string; date?: string; sourceUrl?: string }`
- [ ] Define the component props interface: `{ onClose: () => void; onAttach: (items: WorkIQResult[]) => void }`
- [ ] Implement the search input with auto-focus and an explicit Search button (no debounced auto-search); support Enter key to trigger search
- [ ] Implement the API call to `POST /api/workiq/search` via `fetch` to the backend proxy (`/api/backend/workiq/search` through Next.js rewrite or direct to port 3001)
- [ ] Build the categorized results display — group results by `type` field, render each group with a header (icon + label) and a list of result cards
- [ ] Implement result card component showing: type icon (lucide: `Mail` for email, `Calendar` for meeting, `FileText` for document, `MessageSquare` for Teams, `User` for person), title, summary truncated to 2 lines, and formatted date
- [ ] Implement multi-select state — track selected item IDs in a `Set<string>`; toggle on click; show checkmark overlay on selected items
- [ ] Add the "Attach N items" footer button — disabled when nothing is selected; shows count; calls `onAttach` with selected items and closes modal
- [ ] Implement loading state with skeleton placeholders or a centered `Loader2` spinner
- [ ] Implement empty state with "No results found" message and search icon
- [ ] Implement error state with error message and retry suggestion
- [ ] Style all elements using existing Tailwind theme tokens (`bg-surface`, `bg-surface-2`, `text-text-primary`, `text-muted`, `border-border`, `text-accent`, `hover:bg-surface-3`)
- [ ] Ensure keyboard accessibility — Tab through results, Escape closes modal, Enter on focused result toggles selection
- [ ] Add click-outside-to-close behavior on the backdrop (but not on the modal container itself)

## Dependencies

- Depends on: [Backend WorkIQ MCP Proxy](backend-workiq-proxy.md) — the `POST /api/workiq/search` endpoint must exist
- Depends on: Next.js API rewrite or proxy configuration to forward `/api/backend/workiq/*` to the Express backend on port 3001

## Out of Scope

- Deep linking to original M365 items (clicking through to Outlook, SharePoint, etc.)
- Preview pane for full document/email content
- Search filters (date range, specific mailbox, etc.) — plain text search only for v1
- Pagination or infinite scroll — return first page of results only

## Notes

- The `RepoSelectorModal.tsx` component is the primary reference for modal structure, backdrop styling, and loading states.
- Search is triggered explicitly via a Search button or the Enter key — not debounced as-you-type — to avoid excessive API calls.
- Use lucide-react icons for result type indicators: `Mail`, `Calendar`, `FileText`, `MessageSquare`, `User`.
- The modal should not interfere with the existing chat interface state — it's a pure UI component that communicates via `onAttach` callback.
- Request deduplication: use a ref counter pattern (like `RepoSelectorModal`'s `requestIdRef`) to discard stale search responses.
- A `hasSearched` boolean state tracks whether a search has been performed, so "no results" is only shown after an explicit search (not while typing).
