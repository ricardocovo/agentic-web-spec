# User Story: Render Collapsible Reasoning Block in Chat UI

## Summary

**As a** user who has submitted a prompt,
**I want** to see the agent's reasoning stream live in a collapsible block before the answer appears,
**So that** I can follow the agent's thought process and understand how it reached its response.

## Description

> This story implements the visual reasoning block inside `ChatInterface.tsx`. It replaces the static "Thinking..." placeholder with a dynamic, collapsible panel that streams reasoning content in real time. The block auto-expands while reasoning is arriving, auto-collapses when the first answer chunk arrives, and can be manually toggled open or closed at any time.

## Acceptance Criteria

- [ ] Given `streamingReasoning` has content and `streamingContent` is empty, when the component renders, then the reasoning block is visible and expanded, showing the live reasoning text.
- [ ] Given `streamingReasoning` has content and the first `streamingContent` chunk arrives, when the component re-renders, then the reasoning block automatically collapses to its one-line header.
- [ ] Given the reasoning block is collapsed, when the user clicks the header, then the block expands to show the full reasoning text.
- [ ] Given the reasoning block is expanded, when the user clicks the header, then the block collapses back to the one-line header.
- [ ] Given the collapsed header is rendered, when it is visible, then it shows a brain or sparkle icon, the text "Thinking · {N} chars", and a chevron icon indicating expand/collapse state.
- [ ] Given `streamingReasoning` is empty or undefined, when the component renders, then no reasoning block is shown and the existing "Thinking..." fallback renders as before.
- [ ] Given the reasoning block is expanded, when it contains long content, then it is scrollable within a max-height container and does not push other elements off screen.
- [ ] Given the collapsible toggle button, when focused via keyboard, then it is accessible and responds to Enter/Space keys.
- [ ] Given reasoning content, when rendered, then it uses a muted/monospace style visually distinct from the answer bubble text.

## Tasks

- [ ] Add `isReasoningOpen` state (`useState<boolean>(true)`) to `ChatInterface.tsx` to track collapsed/expanded state
- [ ] Add logic to auto-collapse reasoning block when `streamingContent` transitions from empty to non-empty — use a `useEffect` watching `streamingContent` to set `isReasoningOpen(false)` when the first chunk arrives
- [ ] Create the reasoning block JSX: a `<div>` wrapping a clickable header button and a conditionally rendered body
- [ ] Style the header button with the brain/sparkle (`Brain` or `Sparkle` from lucide-react) icon, "Thinking · {N} chars" label, and `ChevronDown`/`ChevronUp` icon
- [ ] Style the reasoning body as a `max-h-64 overflow-y-auto` scrollable area with `font-mono text-xs text-text-secondary whitespace-pre-wrap` text
- [ ] Add `aria-expanded={isReasoningOpen}` to the toggle button for accessibility
- [ ] Position the reasoning block above the streaming answer bubble, below the agent avatar row
- [ ] Ensure the reasoning block only renders when `streamingReasoning` is a non-empty string (guard with `streamingReasoning && streamingReasoning.length > 0`)
- [ ] Reset `isReasoningOpen` to `true` at the start of each new streaming session so the block opens fresh for each turn

## Dependencies

> Depends on: [Parse Reasoning Events in Frontend SSE Consumer](parse-reasoning-events-frontend.md)

- Depends on: parse-reasoning-events-frontend

## Out of Scope

- Rendering reasoning for completed (non-streaming) past messages
- Markdown rendering inside the reasoning block (plain text only)
- Copying reasoning content via the message copy button
- Animating the expand/collapse transition beyond a simple show/hide (CSS transition is acceptable but not required)

## Notes

- Use `Brain` from `lucide-react` for the icon if available; fall back to `Sparkle` or `Zap` if not — check what is already imported in the file.
- The reasoning block should be rendered between the existing `isStreaming && !streamingContent` (Thinking... indicator) guard and the `StreamingBubble` — replace the spinner guard so that if reasoning content is present it shows the reasoning block; if not, it shows the plain "Thinking..." spinner.
- `{N} chars` in the header should reflect `streamingReasoning.length` — it can update live while streaming or only update when collapsed, either is acceptable.
- Keep all new state (`isReasoningOpen`) local to `ChatInterface` — do not lift it to the page.
