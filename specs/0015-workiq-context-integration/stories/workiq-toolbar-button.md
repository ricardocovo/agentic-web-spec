# User Story: WorkIQ Toolbar Button

## Summary

**As a** user on any agent chat page,
**I want** to see a WorkIQ button in the chat input toolbar,
**So that** I can open the WorkIQ search modal to find and attach M365 context.

## Description

A new icon button is added to the `ChatInterface` component's input toolbar, positioned between the prompt textarea (and its quick-prompt sparkle button) and the `SpaceSelector` button. The button opens the `WorkIQModal` when clicked. It should match the visual style of the existing `SpaceSelector` button — icon-only, same size, same hover/disabled states.

The button should only be visible when WorkIQ is available (checked via `GET /api/workiq/status`). When WorkIQ context items are attached, the button should show a badge count.

## Acceptance Criteria

- [ ] Given WorkIQ is available, when the user views the chat input area on any agent page, then a WorkIQ button is visible between the textarea and the SpaceSelector button.
- [ ] Given WorkIQ is not available, when the user views the chat input area, then the WorkIQ button is hidden.
- [ ] Given the WorkIQ button is visible, when the user clicks it, then the WorkIQ search modal opens.
- [ ] Given WorkIQ items have been attached, when the user views the WorkIQ button, then it shows a badge with the count of attached items (similar to SpaceSelector's selection count badge).
- [ ] Given the chat is disabled or streaming, when the user views the WorkIQ button, then it is disabled (non-clickable, reduced opacity), matching the SpaceSelector disabled behavior.
- [ ] Given the WorkIQ button is present, when viewed on any agent page (Research, PRD, Tech Docs), then it appears consistently in the same position.

## Tasks

- [ ] Add a `workiqAvailable` state to `ChatInterface` — fetch `GET /api/workiq/status` (or `/api/backend/workiq/status`) on mount and set boolean
- [ ] Add a `workiqModalOpen` boolean state to `ChatInterface` to control modal visibility
- [ ] Add a `workiqItems` state array to `ChatInterface` (or receive via props) to track attached WorkIQ items
- [ ] Add the WorkIQ button JSX in the input toolbar `flex gap-3 items-end` container, after the SpaceSelector and before the send button — use a lucide icon (`BrainCircuit`, `Layers`, or `Search`) that visually distinguishes it from other toolbar buttons
- [ ] Style the button to match SpaceSelector: `w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0` with `bg-surface-2 border border-border hover:border-accent` and disabled state `disabled:opacity-40 disabled:cursor-not-allowed`
- [ ] Add a selection count badge (absolute positioned, small circle with count) when `workiqItems.length > 0`, styled with `bg-accent text-white text-xs`
- [ ] Conditionally render the button only when `workiqAvailable` is true
- [ ] Render `<WorkIQModal>` when `workiqModalOpen` is true, passing `onClose` and `onAttach` handlers
- [ ] Wire `onAttach` handler to set `workiqItems` state with the selected items from the modal
- [ ] Pass `disabled={disabled || isStreaming}` to the WorkIQ button matching existing toolbar button behavior
- [ ] Import and add the `WorkIQModal` component to `ChatInterface.tsx`

## Dependencies

- Depends on: [WorkIQ Search Modal](workiq-search-modal.md) — the `WorkIQModal` component must exist
- Depends on: [Backend WorkIQ MCP Proxy](backend-workiq-proxy.md) — the `/api/workiq/status` endpoint must exist
- Depends on: [WorkIQ Availability Detection](workiq-availability-detection.md) — for the status check mechanism

## Out of Scope

- The content of the modal itself (covered in the WorkIQ Search Modal story)
- How attached items are forwarded to the backend (covered in Agent Context Forwarding story)
- The visual indicator for attached items below the textarea (covered in Context Attachment and Indicator story)

## Notes

- The existing toolbar layout is: `textarea → [sparkle button] → SpaceSelector → Send button`. The new button should go between SpaceSelector and the Send button, or between the textarea/sparkle and SpaceSelector. Based on the spec, it should be between the textarea area and SpaceSelector: `textarea → [sparkle] → WorkIQ button → SpaceSelector → Send button`.
- The `ChatInterface` component's `onSend` prop currently has signature `(content: string, selectedSpaces: string[]) => Promise<void>`. This will need to be extended (in the Context Attachment story) to also pass WorkIQ items, or WorkIQ items can be managed via a ref/context that the parent reads.
- SpaceSelector is a good reference for the button pattern — icon button with conditional badge.
