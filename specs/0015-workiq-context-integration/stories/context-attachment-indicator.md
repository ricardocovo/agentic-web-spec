# User Story: Context Attachment and Indicator

## Summary

**As a** Product Manager or Engineering Lead,
**I want** to see the full content of attached WorkIQ items as messages in the conversation,
**So that** I have full visibility into what M365 context is being sent to the agent.

## Description

After selecting WorkIQ items from the search modal, the enriched detail content is displayed as visible conversation messages in the chat. Each message has a distinct purple `Briefcase` avatar, purple-tinted border, and a "Work IQ Context" label to differentiate it from agent responses. The message content includes the item title, type, date, and full detail rendered as markdown.

Items are also tracked internally and passed as `workiqContext` when the user sends their next message. WorkIQ messages are excluded from the regular conversation context (built from assistant messages) to avoid duplication — they're sent to the backend exclusively via the `workiqContext` field.

The toolbar button shows a badge count of attached items. A `WorkIQContextChips` component still exists in the codebase for potential future use but is no longer imported or rendered.

## Acceptance Criteria

- [x] Given one or more WorkIQ items are attached (with enriched detail summaries from the detail fetch), when the user views the chat, then each item appears as a visible assistant message with a purple `Briefcase` icon, purple-tinted border (`border-purple-500/30`), and a "Work IQ Context" label header.
- [x] Given a WorkIQ context message is displayed, when the user views it, then the `📎 Work IQ Context:` prefix is stripped and the remaining content is rendered as markdown — showing the item title (bold, with type label and date), followed by the full detail text.
- [x] Given WorkIQ items are attached, when the user sends a message, then the attached items are included in the send handler's payload as `workiqContext`.
- [x] Given the context is built from previous messages, when WorkIQ messages (prefix `📎 Work IQ Context:`) are encountered, then they are excluded from the regular context string to avoid duplication with `workiqContext`.
- [x] Given a message has been sent with WorkIQ items, when the send completes, then the `workiqItems` tracking state is cleared from the UI.
- [x] Given WorkIQ context messages exist in the session, when the user reloads or resumes the session, then the messages are rendered with the distinct WorkIQ styling (detected by the `📎 Work IQ Context:` prefix).

## Tasks

- [x] Add `onAddWorkIQMessage` callback prop to `ChatInterface` — receives `WorkIQResult[]` and calls the parent to add messages
- [x] Create `handleWorkIQAttach` in `frontend/app/agents/[slug]/page.tsx` — for each item, calls `addMessageToSession` with `role: "assistant"` and content formatted as `📎 Work IQ Context:\n\n**[type] title** — date\n\nsummary`
- [x] Update `MessageBubble` in `ChatInterface.tsx` to detect WorkIQ messages (prefix `📎 Work IQ Context:`) and render with purple `Briefcase` icon avatar (`bg-purple-500/20`), purple-tinted border (`border-purple-500/30`), and "Work IQ Context" label header
- [x] Strip the `📎 Work IQ Context:\n\n` prefix before rendering markdown content
- [x] Import `Briefcase` icon from `lucide-react` in `ChatInterface.tsx`
- [x] Remove `WorkIQContextChips` import from `ChatInterface.tsx` (chips replaced by messages)
- [x] Update context-building in `handleSend` to skip messages with `📎 Work IQ Context:` prefix (sent via `workiqContext` instead)
- [x] Wire the `onAttach` handler in the WorkIQ modal to call both `setWorkiqItems` (for API context) and `onAddWorkIQMessage` (for visible messages)
- [x] Extend the `onSend` callback signature to pass `workiqItems` to the parent, clear items after send
- [x] Update `handleSend` in `frontend/app/agents/[slug]/page.tsx` to accept and serialize `workiqItems` as `workiqContext`

## Dependencies

- Depends on: [WorkIQ Toolbar Button](workiq-toolbar-button.md) — the `workiqItems` state must be established in ChatInterface
- Depends on: [WorkIQ Search Modal](workiq-search-modal.md) — items come from the modal's `onAttach` callback

## Out of Scope

- How the attached items are serialized and sent to the backend API (covered in Agent Context Forwarding story)
- Persisting attached items across page refreshes or navigation
- Drag-and-drop reordering of attached items
- Removing individual attached items from the conversation (WorkIQ messages are persisted like any other message)

## Notes

- The original design used chips/pills above the textarea. This was replaced with full conversation messages after user feedback that the chip approach didn't provide enough visibility into the attached context.
- The `WorkIQContextChips` component (`frontend/components/WorkIQContextChips.tsx`) still exists in the codebase but is no longer imported or rendered. It may be removed in a future cleanup.
- WorkIQ messages use the `📎 Work IQ Context:` prefix (similar to the `📎 Context from previous agent:` handoff prefix) for reliable detection. Both the `MessageBubble` renderer and the context-building logic use this prefix to handle these messages specially.
- The handoff and action panel logic in `page.tsx` already filter out messages starting with `📎`, so WorkIQ messages are automatically excluded from handoff content and action panel context.
