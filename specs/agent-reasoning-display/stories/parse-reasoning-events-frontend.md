# User Story: Parse Reasoning Events in Frontend SSE Consumer

## Summary

**As a** frontend developer,
**I want** the SSE event parser to accumulate `reasoning` events into dedicated state,
**So that** the chat UI can render reasoning content separately from the answer.

## Description

> The SSE consumer in `frontend/app/agents/[slug]/page.tsx` currently only handles `chunk`, `done`, and `error` events. This story extends the parser to handle the new `event: reasoning` type, accumulating delta strings into a `streamingReasoning` state variable. The state is passed down to `ChatInterface` so the reasoning block can be rendered. This story is purely about data plumbing — the UI rendering is handled in the next story.

## Acceptance Criteria

- [ ] Given the SSE stream emits `event: reasoning` with a data payload, when the parser processes it, then the `streamingReasoning` state is updated with the accumulated reasoning text.
- [ ] Given the SSE stream emits `event: chunk`, when the parser processes it, then `streamingContent` is updated as before and `streamingReasoning` is not modified.
- [ ] Given the stream ends with `event: done`, when the session finishes, then both `streamingReasoning` and `streamingContent` are cleared and the completed message is appended to history.
- [ ] Given a new prompt is submitted, when streaming begins, then `streamingReasoning` is reset to an empty string.
- [ ] Given `streamingReasoning` contains content, when it is passed as a prop to `ChatInterface`, then `ChatInterface` receives it without TypeScript errors.

## Tasks

- [ ] Add `streamingReasoning` state variable (`useState<string>("")`) to `frontend/app/agents/[slug]/page.tsx`
- [ ] Add an `else if (currentEvent === "reasoning")` branch in the SSE parse loop to accumulate reasoning deltas into `streamingReasoning`
- [ ] Reset `streamingReasoning` to `""` at the start of each new prompt submission (alongside the existing `streamingContent` reset)
- [ ] Pass `streamingReasoning` as a prop to the `ChatInterface` component
- [ ] Add `streamingReasoning?: string` to the `ChatInterface` component's props interface in `frontend/components/ChatInterface.tsx`

## Dependencies

> Depends on: [Stream Reasoning Tokens from Backend](stream-reasoning-tokens-backend.md)

- Depends on: stream-reasoning-tokens-backend

## Out of Scope

- Rendering the reasoning block in the UI (handled in render-collapsible-reasoning-block)
- Persisting reasoning content to `localStorage` session history
- Displaying reasoning for previously completed messages (current session only)

## Notes

- The SSE parse loop pattern is `if (line.startsWith("event: ")) { currentEvent = ... } else if (line.startsWith("data: ")) { ... }` — add a `"reasoning"` branch inside the `data:` handler.
- `streamingReasoning` accumulates across all deltas for the current turn (same pattern as `streamingContent` and `accumulated`).
- Do not include reasoning in the message object pushed to the `messages` array when the stream completes — only the answer content is stored.
