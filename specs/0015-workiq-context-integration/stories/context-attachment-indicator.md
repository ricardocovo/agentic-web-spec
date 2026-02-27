# User Story: Context Attachment and Indicator

## Summary

**As a** Product Manager or Engineering Lead,
**I want** to see which WorkIQ items are attached to my message and be able to remove them,
**So that** I have full control over what M365 context is sent to the agent.

## Description

After selecting WorkIQ items from the search modal, a visual indicator appears in the chat input area showing the attached items. Each item is displayed as a small chip/pill with its type icon, title (truncated), and a remove (×) button. This gives the user confidence that context is attached and allows them to remove items they don't want before sending.

When the message is sent, the attached items are included in the send payload and then cleared from the UI. The items are passed as hidden context — they don't appear in the textarea and are not visible as a regular chat message.

## Acceptance Criteria

- [ ] Given one or more WorkIQ items are attached, when the user views the input area, then a row of chips/pills is displayed above the textarea showing each attached item with its type icon and truncated title.
- [ ] Given a chip is displayed, when the user clicks the × button on it, then that item is removed from the attached items list and the chip disappears.
- [ ] Given all chips are removed, when the user views the input area, then the chip row is hidden (no empty space).
- [ ] Given WorkIQ items are attached, when the user sends a message, then the attached items are included in the send handler's payload.
- [ ] Given a message has been sent with WorkIQ items, when the send completes, then the attached items are cleared from the UI.
- [ ] Given WorkIQ items are attached, when the user views the chat, then there is no indication of the items in the prompt textarea itself — they are purely in the chip indicator area.
- [ ] Given a chip is displayed, when the user hovers over it, then a tooltip shows the full title and a brief summary.

## Tasks

- [ ] Create a `WorkIQContextChips` component in `frontend/components/WorkIQContextChips.tsx` that renders a horizontal scrollable row of chips
- [ ] Each chip renders: type icon (lucide: `Mail`/`Calendar`/`FileText`/`MessageSquare`/`User`), truncated title (max ~30 chars), and an `X` close button
- [ ] Style chips with `bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-text-primary` and hover effect `hover:border-accent`
- [ ] Style the × button as `text-muted hover:text-text-primary` with `ml-1.5`
- [ ] Add the `WorkIQContextChips` component to `ChatInterface.tsx`, rendered conditionally above the textarea when `workiqItems.length > 0`
- [ ] Position the chips row in the existing `border-t border-border pt-4` container, above the `flex gap-3 items-end` row
- [ ] Wire the chip remove handler to update the `workiqItems` state in `ChatInterface`
- [ ] Extend the `onSend` callback signature from `(content: string, selectedSpaces: string[])` to `(content: string, selectedSpaces: string[], workiqItems?: WorkIQItem[])` to pass attached items to the parent
- [ ] Update the `handleSubmit` function in `ChatInterface` to pass `workiqItems` to `onSend` and then clear the items after send
- [ ] Update the `handleSend` function in `frontend/app/agents/[slug]/page.tsx` to accept the new `workiqItems` parameter
- [ ] Add a tooltip (title attribute or custom tooltip) on each chip showing the full title and summary on hover
- [ ] Handle overflow gracefully — if many items are attached, the chip row should scroll horizontally or wrap to a second line

## Dependencies

- Depends on: [WorkIQ Toolbar Button](workiq-toolbar-button.md) — the `workiqItems` state must be established in ChatInterface
- Depends on: [WorkIQ Search Modal](workiq-search-modal.md) — items come from the modal's `onAttach` callback

## Out of Scope

- How the attached items are serialized and sent to the backend API (covered in Agent Context Forwarding story)
- Persisting attached items across page refreshes or navigation
- Drag-and-drop reordering of attached items

## Notes

- The chip pattern is similar to tag inputs or file attachment indicators in modern chat UIs (Slack, Teams). Keep them compact to avoid taking too much vertical space.
- The `onSend` signature change will require updating the type in `ChatInterface` props and all call sites in `[slug]/page.tsx`. Since there's only one call site per agent page (they all share the same `[slug]/page.tsx`), this is a minimal change.
- Consider using `flex flex-wrap gap-1.5` for the chips container to handle multiple items gracefully.
