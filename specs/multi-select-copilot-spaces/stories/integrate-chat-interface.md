# User Story: Integrate SpaceSelector into ChatInterface

## Summary

**As a** developer using the agent chat,
**I want** the space selector to appear in the chat input area next to the send button,
**So that** I can select spaces without leaving the conversation flow.

## Description

Wire the `SpaceSelector` component into the `ChatInterface` component's input section. The selector should sit between the textarea and the send button, maintaining the existing layout's alignment and spacing. The component's selection state needs to flow through to the `onSend` callback so the parent page can include spaces in the API request.

## Acceptance Criteria

- [ ] Given the chat interface renders, when a PAT is configured, then the SpaceSelector trigger button appears between the textarea and the send button.
- [ ] Given the user selects spaces and types a prompt, when they press Enter or click Send, then the selected spaces array is passed to the `onSend` callback.
- [ ] Given the agent is streaming a response, when the chat interface is in streaming state, then the SpaceSelector is disabled (non-interactive).
- [ ] Given no PAT is configured, when the chat interface renders, then the SpaceSelector is hidden and the layout remains textarea + send button only.
- [ ] Given the user has selected 2 spaces, when they look at the input area, then the SpaceSelector shows a badge with "2".
- [ ] Given the chat interface layout, when the SpaceSelector is present, then the textarea, selector, and send button are vertically bottom-aligned (`items-end`).

## Tasks

- [ ] Import `SpaceSelector` into `frontend/components/ChatInterface.tsx`
- [ ] Add `selectedSpaces` state (`useState<string[]>([])`) to `ChatInterface`
- [ ] Place `SpaceSelector` in the input flex row between the textarea and send button
- [ ] Pass `disabled={isStreaming || disabled}` to `SpaceSelector`
- [ ] Wire `onSelectionChange` callback to update `selectedSpaces` state
- [ ] Update `ChatInterfaceProps.onSend` signature from `(content: string) => Promise<void>` to `(content: string, selectedSpaces: string[]) => Promise<void>`
- [ ] Update `handleSubmit` to pass `selectedSpaces` when calling `onSend`
- [ ] Conditionally render `SpaceSelector` only when PAT is available (access via `useApp()` or a new prop)

## Dependencies

- Depends on: `create-space-selector` (SpaceSelector component must exist)

## Out of Scope

- Modifying the SpaceSelector's internal behavior or styling
- Adding spaces to the handoff flow
- Changing the message display area

## Notes

- The `ChatInterface` component currently uses `"use client"` and imports from `@/lib/storage` and `@/lib/agents`. Adding `useApp()` for PAT access is consistent with the existing pattern.
- The `onSend` signature change will require updating the agent page's `handleSend` callback (covered in the next story).
