# User Story: Stream Reasoning Tokens from Backend

## Summary

**As a** frontend developer,
**I want** the backend to emit reasoning delta tokens as a separate SSE event type,
**So that** the frontend can display the agent's reasoning independently from the answer content.

## Description

> The `@github/copilot-sdk` emits `assistant.reasoning_delta` events containing incremental reasoning text as the model thinks. Currently `backend/src/routes/agent.ts` only handles `assistant.message_delta` and `assistant.message` events. This story adds a handler for `assistant.reasoning_delta` that emits a new `event: reasoning` SSE event to the client, following the same pattern as `event: chunk`.

## Acceptance Criteria

- [ ] Given an agent session is running, when the SDK emits an `assistant.reasoning_delta` event, then the backend sends `event: reasoning\ndata: "<delta>"\n\n` to the SSE stream.
- [ ] Given an agent session is running, when `assistant.message_delta` events arrive after reasoning, then `event: chunk` events continue to be emitted unchanged.
- [ ] Given no `assistant.reasoning_delta` events are emitted by the model, then no `event: reasoning` events appear in the stream and existing behavior is unaffected.
- [ ] Given a `reasoning` event is emitted, then it appears in the stream **before** the first `chunk` event for the same turn.

## Tasks

- [ ] Add a handler in `backend/src/routes/agent.ts` for `event.type === "assistant.reasoning_delta"` inside the `session.on` callback
- [ ] Emit `sendEvent("reasoning", event.data.deltaContent ?? "")` (or the correct field name from the SDK type) when the event fires
- [ ] Verify the field name on `assistant.reasoning_delta` data by inspecting the SDK type definition for that event

## Dependencies

> Depends on: switch-agents-to-o4-mini (the model must emit reasoning tokens for this to be testable end-to-end, though the handler code itself can be written independently)

- Depends on: [Switch All Agents to o4-mini](switch-agents-to-o4-mini.md)

## Out of Scope

- Buffering or batching reasoning tokens before sending
- Adding reasoning content to the final `assistant.message` stored in session history
- Any changes to the `event: chunk`, `event: done`, or `event: error` event types

## Notes

- The `sendEvent` helper already exists in `agent.ts` and handles SSE formatting — reuse it directly.
- The `assistant.reasoning_delta` event data shape should mirror `assistant.message_delta` but confirm the exact property name (`deltaContent`, `content`, or `delta`) from the SDK type union before implementing.
- If the property name differs, use optional chaining with a `?? ""` fallback to avoid emitting `undefined`.
