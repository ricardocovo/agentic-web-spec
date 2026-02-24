# User Story: View Action Buttons After Technical Docs Response

## Summary

**As a** developer using the Technical Docs agent,
**I want** to see "Create Docs on Repo" and "Create GitHub Issues" action buttons after the agent responds,
**So that** I can immediately act on the generated spec without leaving the app.

## Description

The Technical Docs agent is the last in the chain, so the existing "Send to Next Agent" handoff button does not appear. Instead, two action buttons should appear below the message list once the agent has produced at least one response and is not currently streaming. These buttons should match the app's design language and clearly communicate their purpose.

## Acceptance Criteria

- [ ] Given the `technical-docs` agent page has at least one assistant message and is not streaming, when the user views the page, then both "Create Docs on Repo" and "Create GitHub Issues" buttons are visible.
- [ ] Given the agent is currently streaming a response, when the user views the action area, then both action buttons are hidden/disabled.
- [ ] Given the user is on a different agent page (e.g. `deep-research` or `prd`), when they view the chat, then no action buttons from this feature appear.
- [ ] Given the action buttons are visible, when the user hovers over them, then a tooltip or description text clarifies what each action does.

## Tasks

- [ ] Add `AgentAction` type to `frontend/lib/agents.ts` or `frontend/components/ChatInterface.tsx`
- [ ] Add optional `agentActions?: AgentAction[]` prop to `ChatInterface` component
- [ ] Render action buttons in `ChatInterface` when `hasMessages && !isStreaming && agentActions?.length`
- [ ] Style action buttons using existing design tokens (`bg-surface-2`, `border-border`, `text-accent`, etc.)
- [ ] Add `GitBranch` icon for "Create Docs on Repo" and `CircleDot` icon for "Create GitHub Issues"
- [ ] Pass `agentActions` to `ChatInterface` from `page.tsx` only when `agent.slug === 'technical-docs'`

## Dependencies

- Depends on: none (pure frontend UI change)

## Out of Scope

- Action button visibility on agents other than `technical-docs`
- Any backend changes (this story is UI-only)

## Notes

- The `AgentAction` type: `{ label: string; icon: LucideIcon; description: string; onClick: () => void }`
- Button placement: same row/area as the handoff button (which won't appear for `technical-docs`)
- Use `gap-3` between the two action buttons; center them like the handoff button
