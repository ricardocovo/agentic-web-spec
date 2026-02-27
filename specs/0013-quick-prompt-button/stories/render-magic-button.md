# User Story: Render Magic Button in ChatInterface

## Summary

**As a** Web-Spec user on the PRD or Tech Docs agent page,
**I want** a single-click "magic" button next to the prompt textarea,
**So that** I can instantly populate the prompt with the default message without typing.

## Description

When the current agent has a `quickPrompt` configured, display a small icon button (using the `Sparkles` icon from lucide-react) adjacent to the textarea. Clicking it sets the textarea value to the agent's `quickPrompt`. The button is only shown when the textarea is empty and the agent is not streaming, keeping the UI clean.

## Acceptance Criteria

- [ ] Given an agent with `quickPrompt` defined and an empty textarea, when the chat input area is rendered, then a sparkle icon button is visible next to the textarea.
- [ ] Given the magic button is visible, when clicked, then the textarea value is set to the agent's `quickPrompt` text.
- [ ] Given the textarea already contains text, when the input area is rendered, then the magic button is not visible.
- [ ] Given the agent is currently streaming a response, when the input area is rendered, then the magic button is not visible.
- [ ] Given an agent without `quickPrompt` (e.g., deep-research), when the input area is rendered, then no magic button appears.
- [ ] Given the magic button, when inspected in the DOM, then it has an appropriate `aria-label` (e.g., "Fill prompt suggestion") and is keyboard-focusable.
- [ ] Given the magic button is clicked, when the textarea is populated, then the button disappears (since input is now non-empty) and the user must still click Send or press Enter to submit.

## Tasks

- [ ] Import the `Sparkles` icon from `lucide-react` in `frontend/components/ChatInterface.tsx`.
- [ ] Add a button element in the input row (between the textarea and SpaceSelector, or as an inset/overlay on the textarea) that renders the `Sparkles` icon.
- [ ] Style the button using the agent's `iconColor` for visual consistency with the existing Send button.
- [ ] Wire the button's `onClick` to set `input` state to `agent.quickPrompt`.
- [ ] Conditionally render the button only when `agent.quickPrompt` is defined, `input` is empty (trimmed), `disabled` is false, and `isStreaming` is false.
- [ ] Add `aria-label="Fill prompt suggestion"` and ensure the button is focusable via keyboard.

## Dependencies

- Depends on: **Add quickPrompt field to AgentConfig** — the `quickPrompt` property must exist on `AgentConfig` before it can be read in the component.

## Out of Scope

- Auto-submitting the prompt after filling.
- Animating the text appearing in the textarea.
- Showing multiple prompt suggestions or a dropdown.

## Notes

- The `Sparkles` icon is already available via the project's `lucide-react` dependency — no install needed.
- The button should feel like a subtle helper, not a dominant UI element. Keep it small (e.g., `w-8 h-8` or similar).
