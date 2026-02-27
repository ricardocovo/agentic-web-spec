# User Story: Fix Context Filter to Include Handoff Messages

## Summary

**As a** developer using the multi-agent pipeline,
**I want** the handoff context from the previous agent to be included in every API call to the backend,
**So that** the destination agent (e.g. PRD) has the full output of the source agent (e.g. Deep Research) available when generating its response.

## Description

Currently, `handleSend` in `page.tsx` builds a `context` string from prior assistant messages but filters out any message whose content starts with `"📎"`. This was intended to prevent circular inclusion, but it accidentally removes the entire handoff context message before it is ever sent to the backend.

The fix is to change the filter so it **includes** handoff messages, but **strips the UI-only prefix** (`"📎 Context from previous agent:\n\n"`) before joining them into the context string.

## Acceptance Criteria

- [ ] Given a session where a handoff context message exists, when the user sends their first message, then the `context` field in the POST body to `/api/agent/run` contains the raw deep research output (without the "📎" prefix).
- [ ] Given a session with no handoff context, when the user sends a message, then the `context` field behaves exactly as before (only includes prior assistant messages).
- [ ] Given a session with multiple assistant messages including a handoff, when the user sends a message, then all assistant messages are included in `context`, with the handoff prefix stripped only from the handoff message.

## Tasks

- [ ] Define a `HANDOFF_PREFIX` constant at the top of the `handleSend` scope (or module level) matching the string used when creating `contextMsg.content` on line 56
- [ ] Replace the `.filter()` that excludes "📎"-prefixed messages with a `.map()` that strips the prefix from handoff messages
- [ ] Keep the `context || undefined` guard so empty context is not sent

## Dependencies

> No story dependencies — this is a self-contained one-file change.

- Depends on: none

## Out of Scope

- Changes to how the "📎" message is displayed in the UI
- Backend changes
- Persisting handoff context to `localStorage`

## Notes

- File: `frontend/app/agents/[slug]/page.tsx`, lines 91–94
- The exact prefix string on line 56 is: `` `📎 Context from previous agent:\n\n${handoffContext}` ``
- New code:
  ```tsx
  const HANDOFF_PREFIX = "📎 Context from previous agent:\n\n";
  const context = updated.messages
    .filter((m) => m.role === "assistant")
    .map((m) =>
      m.content.startsWith(HANDOFF_PREFIX)
        ? m.content.slice(HANDOFF_PREFIX.length)
        : m.content
    )
    .join("\n\n");
  ```
