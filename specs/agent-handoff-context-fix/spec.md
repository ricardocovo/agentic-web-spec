# Feature: Agent Handoff Context Fix

## Overview

When a user clicks "Send to [Next Agent]" (e.g., Deep Research → PRD), the source agent's output is stored and displayed in the destination agent's chat as a "📎 Context from previous agent" message. However, due to a filter bug, that context is silently excluded when the user sends their first message — so the destination agent runs with no knowledge of what the previous agent produced.

This fix ensures the handoff context is correctly forwarded to the backend on every API call.

## Problem Statement

The filter in `handleSend` (`page.tsx`) was meant to avoid redundant context recursion, but it uses `!m.content.startsWith("📎")` which strips the **entire** handoff context message. The PRD and Technical Docs agents therefore receive no input from the previous agent, making the multi-agent pipeline functionally broken.

## Goals

- [ ] Handoff context from Deep Research is included in every POST to `/api/agent/run` for the PRD agent
- [ ] Handoff context from PRD is included in every POST to `/api/agent/run` for the Technical Docs agent
- [ ] The "📎" UI label prefix is stripped before sending to the backend (to avoid duplicating wrapper text)
- [ ] Non-handoff sessions (first-run agents with no prior context) continue to work as before

## Non-Goals

- Adding new handoff UI or UX changes
- Persisting handoff context across page reloads or to `localStorage`
- Passing context from multiple prior agents (only the immediate predecessor's context is in scope)
- Any changes to the backend or agent YAML configs

## Target Users / Personas

| Persona | Description |
|---|---|
| Developer / Technical User | Uses the full Deep Research → PRD → Technical Docs pipeline and expects each agent to build on the previous one's output |

## Functional Requirements

1. The system shall include handoff context messages in the `context` field sent to `/api/agent/run`.
2. The system shall strip the `"📎 Context from previous agent:\n\n"` prefix from handoff messages before sending them to the backend.
3. The system shall continue to include all prior non-handoff assistant messages in `context`.
4. The system shall not send an empty string as `context` when no assistant messages exist.

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Correctness | No regressions in sessions that never received a handoff |
| Maintainability | The prefix constant should be defined once and reused if the handoff prefix ever changes |

## UX / Design Considerations

No UI changes. The fix is entirely in the data sent to the backend — the displayed "📎 Context" message in the chat remains unchanged.

## Technical Considerations

- The fix is a 4-line change in `frontend/app/agents/[slug]/page.tsx` (lines 91–94).
- The `HANDOFF_PREFIX` constant (`"📎 Context from previous agent:\n\n"`) must match exactly what is set in the `contextMsg.content` on line 56 of the same file.
- The backend at `backend/src/routes/agent.ts` already handles the `context` field correctly (prepends it to the system prompt) — no backend changes needed.

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| `frontend/app/agents/[slug]/page.tsx` | Internal | Only file that needs to change |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Prefix string mismatch causes context to not be stripped | Low | Low | Define prefix as a shared constant in the same file |
| Sending very large context to backend causes timeouts | Low | Med | No change in behavior — deep research output was always intended to be in context |

## Success Metrics

- Metric 1: POST body to `/api/agent/run` contains the deep research output in `context` when triggered from a handoff
- Metric 2: PRD agent response visibly incorporates content from deep research

## Open Questions

- [ ] Should the handoff prefix constant be moved to `frontend/lib/storage.ts` or `frontend/lib/agents.ts` for reuse?

## User Stories

| Story | File |
|---|---|
| Fix context filter to include handoff messages | [stories/fix-context-filter.md](stories/fix-context-filter.md) |
| Verify handoff context reaches backend | [stories/verify-handoff-reaches-backend.md](stories/verify-handoff-reaches-backend.md) |
