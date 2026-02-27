# User Story: Agent Context Forwarding

## Summary

**As a** backend agent service,
**I want** to receive WorkIQ context items and append them to the agent's system prompt,
**So that** the agent can reference Microsoft 365 data when generating responses.

## Description

When the user sends a message with WorkIQ items attached, the frontend serializes the items and includes them in the `/api/agent/run` request body. The backend receives this data and appends it to the agent's system prompt as a clearly labeled section, separate from handoff context and Copilot Spaces instructions.

This follows the same pattern as existing handoff context — the context is invisible to the user in the chat UI but available to the model in the system prompt.

## Acceptance Criteria

- [ ] Given the user sends a message with WorkIQ items attached, when the frontend calls `POST /api/agent/run`, then the request body includes a `workiqContext` field containing serialized WorkIQ item summaries.
- [ ] Given the backend receives a request with `workiqContext`, when building the system prompt, then it appends a "WorkIQ Context" section after the base prompt and any previous handoff context.
- [ ] Given multiple WorkIQ items are included, when the system prompt is built, then each item is formatted as `[Type] Title: Summary` on its own line, under a "WorkIQ Context:" header.
- [ ] Given the `workiqContext` field is absent or empty, when the system prompt is built, then no WorkIQ section is appended (no empty headers).
- [ ] Given WorkIQ context combined with other context exceeds a reasonable limit, when the system prompt is built, then individual item summaries are truncated to keep total WorkIQ context under ~4000 characters.
- [ ] Given the agent response is streamed back, when the user views the chat, then the WorkIQ context is not visible as a chat message — it was only in the system prompt.

## Tasks

- [ ] Define a `WorkIQContextItem` interface in `backend/src/routes/agent.ts` (or a shared types file): `{ type: string; title: string; summary: string }`
- [ ] Update the request body schema in `backend/src/routes/agent.ts` to accept an optional `workiqContext: WorkIQContextItem[]` field
- [ ] Update the system prompt construction logic to append WorkIQ context: format as `\n\nWorkIQ Context (Microsoft 365 data provided by the user):\n${items.map(i => `[${i.type}] ${i.title}: ${i.summary}`).join('\n')}`
- [ ] Ensure WorkIQ context is appended AFTER handoff context and BEFORE space instructions and think guidance in the prompt chain: `basePrompt + handoffContext + workiqContext + spaceInstruction + THINK_GUIDANCE`
- [ ] Add truncation logic — if total WorkIQ context exceeds 4000 characters, truncate individual summaries proportionally and append "... (truncated)"
- [ ] Update `frontend/app/agents/[slug]/page.tsx` `handleSend` to serialize WorkIQ items and include in the fetch body as `workiqContext`
- [ ] Format WorkIQ items on the frontend before sending: `workiqItems.map(item => ({ type: item.type, title: item.title, summary: item.summary }))`
- [ ] Update the TypeScript types for the `/api/agent/run` request body in both frontend and backend
- [ ] Verify that WorkIQ context does not appear in the assistant messages stored in session — it should only exist in the system prompt
- [ ] Add logging on the backend to log when WorkIQ context is included (item count and total character length) for debugging

## Dependencies

- Depends on: [Context Attachment and Indicator](context-attachment-indicator.md) — the `handleSend` function must pass WorkIQ items
- Depends on: [Backend WorkIQ MCP Proxy](backend-workiq-proxy.md) — for the `WorkIQResult` type definition (shared or duplicated)

## Out of Scope

- Persisting WorkIQ context across multiple messages in the same session (each send is independent)
- Modifying the agent YAML config to reference WorkIQ — all WorkIQ handling is in the route logic
- Adding WorkIQ as an MCP tool that the agent can call autonomously (this is user-initiated context only)

## Notes

- The current system prompt construction in `agent.ts` (line 62) is: `basePrompt + "\n\nPrevious context:\n" + context + spaceInstruction + THINK_GUIDANCE`. WorkIQ context slots in between the handoff context and space instruction.
- The format `[Type] Title: Summary` is designed to be easily parseable by the model and clearly indicates the source of each piece of context.
- Total system prompt length should be monitored — with base prompt (~2000 chars), handoff context (variable), WorkIQ context (up to ~4000 chars), and space instructions, we should stay well within model context limits.
- Consider adding a comment in the code explaining the prompt construction order for future maintainers.
