# User Story: Stream Action Progress in Modal Panel

## Summary

**As a** developer who has clicked an action button,
**I want** to see the action's progress streamed live in a modal panel,
**So that** I know the action is running and can see the output as it is generated.

## Description

When either action button is clicked, an `ActionPanel` modal opens and immediately begins streaming output from the relevant backend agent. The streaming experience should mirror the existing chat stream (SSE chunks rendered as markdown) but presented in a modal overlay rather than a chat bubble. The modal must remain open until the user explicitly closes it, and must handle both success and error states gracefully.

## Acceptance Criteria

- [ ] Given the user clicks "Create Docs on Repo" or "Create GitHub Issues", when the click is handled, then the `ActionPanel` modal opens and begins streaming from `/api/agent/run`.
- [ ] Given the stream is in progress, when tokens arrive, then the modal renders them as incremental markdown with a pulsing cursor indicator.
- [ ] Given the stream completes successfully, when the `done` event is received, then the spinner is replaced by a success indicator and a "Close" button becomes enabled.
- [ ] Given the stream emits an `error` event, when the error is received, then the modal shows the error message and a "Close" button.
- [ ] Given the modal is open, when the user presses Escape, then the modal closes (only after streaming has ended).
- [ ] Given the modal is open and streaming, when the user presses Escape, then the keypress is ignored (stream cannot be interrupted).

## Tasks

- [ ] Create `frontend/components/ActionPanel.tsx` component
- [ ] Accept props: `agentSlug`, `prompt`, `repoPath`, `pat`, `onClose`
- [ ] On mount, call `POST /api/agent/run` with `Authorization: Bearer {pat}` header
- [ ] Read SSE stream using the same `ReadableStream` / `TextDecoder` pattern as `page.tsx`
- [ ] Render accumulated markdown using `ReactMarkdown` + `remark-gfm`
- [ ] Show `Loader2` spinner in modal header while streaming; replace with checkmark on done
- [ ] Show error state with red indicator when `event: error` is received
- [ ] Add "Close" button (disabled while streaming, enabled after done/error)
- [ ] Add Escape key handler that only fires when not streaming
- [ ] Style modal using app design tokens: `bg-surface-1`, `border-border`, backdrop overlay

## Dependencies

- Depends on: `view-action-buttons` (ActionPanel is opened by the action button `onClick` handlers)

## Out of Scope

- "Copy output" button (noted as open question in spec — out of scope for v1)
- Cancelling a running stream mid-flight
- Persisting modal output to session history

## Notes

- Modal structure: fixed overlay → centered card (max-w-2xl, max-h-[80vh]) → header + scrollable body + footer with Close button
- Reuse existing SSE parsing logic from `page.tsx` — consider extracting to a shared hook in v2
- The `pat` prop is needed to set `Authorization` header so the backend can set `GH_TOKEN` for `gh` CLI
