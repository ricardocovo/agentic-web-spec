# Feature: Agent Reasoning Display

## Overview

> When a user submits a prompt, the chat interface currently shows a static "Thinking..." indicator while the agent processes the request. This feature replaces that placeholder with a live, collapsible reasoning block that streams the agent's internal thought process in real time, powered by OpenAI's `o4-mini` reasoning model across all three agents.

## Problem Statement

> The current "Thinking..." spinner gives users no signal about what the agent is actually doing or how far along it is. For long-running agent sessions — especially Deep Research — users have no way to gauge whether the agent is making progress or stuck. Surfacing the model's chain-of-thought builds transparency and trust, and lets users catch misunderstandings early before a full response is generated.

## Goals

- [ ] Stream `assistant.reasoning_delta` tokens from the backend to the frontend as a separate SSE event type
- [ ] Display streamed reasoning in a collapsible "Thinking" block that auto-expands while reasoning is in progress
- [ ] Automatically collapse the reasoning block when the final answer begins streaming
- [ ] Allow users to re-expand the reasoning block at any time after collapse
- [ ] Switch all three agents from `gpt-4.1` to `o4-mini` to enable native reasoning token output

## Non-Goals

> What this feature explicitly does NOT do.

- Does not implement tool activity display (Option A — separate feature)
- Does not persist reasoning tokens in session history stored in `localStorage`
- Does not add a per-agent toggle to enable/disable reasoning (all agents use it uniformly)
- Does not modify agent prompts or YAML configs beyond the model field
- Does not expose reasoning tokens in the API response for external consumers

## Target Users / Personas

| Persona | Description |
|---|---|
| Developer | Wants to understand how the agent reaches its conclusions and verify it is reasoning about the right parts of the codebase |
| Product Manager | Wants confidence that the PRD agent is interpreting requirements correctly before the full document is produced |
| Power User | Wants to see the agent's chain-of-thought to learn from it and craft better follow-up prompts |

## Functional Requirements

1. The backend SHALL listen for `assistant.reasoning_delta` SDK events and emit them to the SSE stream as `event: reasoning` with the delta string as the data payload.
2. The backend SHALL continue emitting `event: chunk` for `assistant.message_delta` events unchanged.
3. The frontend SSE parser SHALL accumulate `reasoning` event data into a separate state variable, independent of `streamingContent`.
4. The frontend SHALL render a collapsible "Thinking" block above the streaming answer bubble whenever reasoning content is present.
5. The "Thinking" block SHALL auto-expand and stream content live while `assistant.reasoning_delta` tokens are arriving.
6. The "Thinking" block SHALL automatically collapse when the first `event: chunk` (answer content) arrives.
7. Users SHALL be able to click the "Thinking" header to toggle the block open or closed at any time.
8. Collapsed state SHALL show a one-line summary header (e.g. "Thinking · {N} chars") with a chevron icon.
9. All three agent YAML files (`deep-research`, `prd`, `technical-docs`) SHALL use model `o4-mini`.
10. The reasoning block content SHALL be rendered as plain text (not markdown) with a monospace or muted style to visually distinguish it from the answer.
11. If a model emits no `assistant.reasoning_delta` events, the UI SHALL fall back gracefully to the existing "Thinking..." indicator.

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Reasoning tokens must not block or delay answer token rendering; both streams are independent |
| Accessibility | The collapsible toggle must be keyboard-accessible and have an appropriate `aria-expanded` attribute |
| Visual consistency | The reasoning block must use existing Tailwind semantic tokens (`bg-surface-2`, `text-text-secondary`, `border-border`) |
| Backwards compatibility | The SSE protocol change is additive; existing `chunk`, `done`, and `error` events are unchanged |

## UX / Design Considerations

- **While reasoning streams:** The "Thinking" block is open, showing live text. No answer bubble is visible yet.
- **When answer starts:** The "Thinking" block auto-collapses to a one-line header. The answer bubble appears and streams below it.
- **Collapsed header:** Shows a brain/sparkle icon + "Thinking · {N} chars" + a down-chevron. Clicking expands it.
- **Expanded after answer:** Full reasoning text is scrollable within a max-height container.
- **No reasoning case:** If `o4-mini` produces no reasoning tokens for a given prompt (unlikely but possible), fall back to the original "Thinking..." spinner until the first chunk arrives.
- **Visual hierarchy:** Reasoning block uses a more muted style (smaller font, `text-text-secondary`) than the answer bubble to signal it is internal/supplementary.

## Technical Considerations

- The `@github/copilot-sdk` `SessionEvent` union includes `assistant.reasoning` and `assistant.reasoning_delta` types. Use `assistant.reasoning_delta` for streaming (analogous to `assistant.message_delta`).
- The new SSE event type `reasoning` is purely additive. The frontend's existing `if (currentEvent === "chunk")` parser branches are untouched.
- `o4-mini` is a reasoning model that does not support a `temperature` parameter — if any YAML configs add temperature in the future, this must be omitted.
- Reasoning content can be verbose (thousands of tokens). The collapsible container should have a `max-height` with `overflow-y: auto` to prevent layout explosion.
- Reasoning tokens are **not** appended to the saved session messages in `localStorage` — only the final answer is stored, matching the current behavior.

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| `@github/copilot-sdk` `assistant.reasoning_delta` event | Internal (SDK) | Already present in the SessionEvent union; no SDK upgrade needed |
| `o4-mini` model availability | External (GitHub Copilot API) | Must be available via the authenticated user's Copilot subscription |
| Existing SSE streaming infrastructure | Internal | `backend/src/routes/agent.ts` and frontend SSE parser in `app/agents/[slug]/page.tsx` |
| `ChatInterface.tsx` component | Internal | Owns the streaming bubble and "Thinking..." indicator UI |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `o4-mini` not available on user's Copilot plan | Med | High | Document requirement in README; backend surfaces model errors via existing `session.error` event path |
| Reasoning tokens are very long and degrade UI performance | Med | Med | Cap reasoning display with `max-height` + `overflow-y: auto`; do not store in state beyond current session |
| `assistant.reasoning_delta` never fires for certain prompts | Low | Low | Graceful fallback to existing "Thinking..." spinner already planned in FR-11 |
| Model change breaks existing prompts | Low | Med | `o4-mini` follows the same instruction-following format as `gpt-4.1`; agent YAML prompts are unchanged |

## Success Metrics

- Reasoning block is visible and streaming for >90% of agent runs using `o4-mini`
- No regression in answer quality compared to `gpt-4.1` baseline
- Collapsible interaction works correctly on all three agents and persists correctly when navigating between messages

## Open Questions

- [ ] Should the reasoning character count in the collapsed header update live while streaming, or only show the final count after collapse?
- [ ] Should reasoning content be included when the user clicks "Copy" on a message?

## User Stories

| Story | File |
|---|---|
| Switch all agents to o4-mini | [stories/switch-agents-to-o4-mini.md](stories/switch-agents-to-o4-mini.md) |
| Stream reasoning tokens from backend | [stories/stream-reasoning-tokens-backend.md](stories/stream-reasoning-tokens-backend.md) |
| Parse reasoning events in frontend SSE consumer | [stories/parse-reasoning-events-frontend.md](stories/parse-reasoning-events-frontend.md) |
| Render collapsible reasoning block in chat UI | [stories/render-collapsible-reasoning-block.md](stories/render-collapsible-reasoning-block.md) |
