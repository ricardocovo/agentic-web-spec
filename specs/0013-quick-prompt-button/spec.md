# Feature: Quick Prompt Button

## Overview

Add a "magic button" to agent chat pages that pre-fills the prompt textarea with a sensible default message. Initially enabled for the PRD and Technical Docs agents, this small UX enhancement reduces friction by letting users kick off the most common workflow with a single click instead of typing a prompt from scratch.

## Problem Statement

When a user navigates to the PRD or Technical Docs agent page — especially after handing off context from a previous agent — they must manually type a prompt like "Create a PRD based on the current context." This is repetitive and adds unnecessary friction to the most common usage path. A one-click prompt fill removes that friction.

## Goals

- [ ] Provide a one-click way to populate the prompt textarea with a pre-configured message on supported agent pages.
- [ ] Keep the implementation config-driven so new agents can opt in by adding a single field.
- [ ] Maintain the existing send flow — the button only fills the textarea; the user still reviews and submits.

## Non-Goals

- Auto-submitting the prompt (the user must still click Send or press Enter).
- Adding quick-prompt support to the Deep Research agent (it requires user-provided context).
- Building a multi-prompt suggestion palette or prompt library.

## Target Users / Personas

| Persona | Description |
|---|---|
| Web-Spec User | A developer or PM using the agent pipeline who wants to quickly generate a PRD or Tech Spec from previously handed-off context without typing a boilerplate prompt. |

## Functional Requirements

1. The system shall display a "magic" button adjacent to the prompt textarea when the current agent defines a `quickPrompt` value.
2. Clicking the button shall populate the textarea with the agent's configured `quickPrompt` text.
3. The button shall only be visible when the textarea is empty and the agent is not currently streaming a response.
4. The button shall not auto-submit the prompt; the user must explicitly send it.
5. The `quickPrompt` field shall be optional on `AgentConfig` so agents without it are unaffected.

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | No measurable impact — this is a simple state update on click. |
| Accessibility | The button must have an `aria-label` and be keyboard-focusable. |
| Maintainability | Adding quick-prompt to a new agent requires only a one-line config change. |

## UX / Design Considerations

- The button appears inline with the textarea row (e.g., to the left of the Send button or as an inset element).
- Uses a recognizable icon (e.g., `Sparkles` from lucide-react) with the agent's `iconColor` for visual consistency.
- The button smoothly disappears once the user starts typing (input is non-empty) or while a response is streaming.

## Technical Considerations

- `AgentConfig` interface lives in `frontend/lib/agents.ts` — add an optional `quickPrompt?: string` field.
- `ChatInterface.tsx` already has access to the full `agent: AgentConfig` prop, so no additional plumbing is needed.
- lucide-react `Sparkles` icon is already available in the project's dependency tree.

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| `frontend/lib/agents.ts` | Internal | AgentConfig interface must be extended first. |
| `lucide-react` | External (already installed) | Provides the Sparkles icon. |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Button placement feels cluttered on small screens | Low | Low | Keep it a single small icon button; hide when input is non-empty. |

## Success Metrics

- Users on PRD / Tech Docs pages can populate the prompt with one click instead of typing.
- No regressions on agents that do not define `quickPrompt`.

## Open Questions

- None at this time.

## User Stories

| Story | File |
|---|---|
| Add quickPrompt field to AgentConfig | [stories/add-quick-prompt-config.md](stories/add-quick-prompt-config.md) |
| Render magic button in ChatInterface | [stories/render-magic-button.md](stories/render-magic-button.md) |
