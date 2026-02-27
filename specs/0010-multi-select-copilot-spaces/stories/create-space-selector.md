# User Story: Create SpaceSelector Component

## Summary

**As a** developer using the agent chat interface,
**I want** a multi-select popover that shows my available Copilot Spaces,
**So that** I can choose which spaces to attach as context before sending a prompt.

## Description

A new self-contained React component (`SpaceSelector`) that renders a trigger button with a popover listing available Copilot Spaces. The component fetches spaces lazily (on first open) from the existing `/api/backend/kdb/spaces` endpoint, displays them as checkable items, and exposes the current selection via a callback prop. It uses the project's existing design tokens and follows the visual style of the chat interface.

## Acceptance Criteria

- [ ] Given the user has a PAT configured, when they click the space selector trigger button, then a popover opens showing available Copilot Spaces.
- [ ] Given the popover is open for the first time, when it renders, then spaces are fetched from `/api/backend/kdb/spaces` with the user's PAT and a loading spinner is shown.
- [ ] Given spaces have been fetched, when the user checks a space, then it is added to the selected list and the trigger button shows an updated count badge.
- [ ] Given spaces are selected, when the user clicks "Clear selection", then all spaces are deselected and the badge disappears.
- [ ] Given the user has no PAT configured, when the component renders, then the trigger button is hidden or disabled.
- [ ] Given the space fetch fails, when the popover is open, then an error message with a retry button is displayed.
- [ ] Given the component is in a disabled state (e.g., during streaming), when rendered, then the trigger button is non-interactive.
- [ ] Given the popover is open, when the user clicks outside it, then the popover closes and selections are preserved.
- [ ] Given the space list fetch is slow (>5 seconds), when waiting, then a "slow loading" hint is shown below the spinner.

## Tasks

- [ ] Create `frontend/components/SpaceSelector.tsx` with the component skeleton
- [ ] Implement trigger button: `w-10 h-10` square with `BookOpen` icon, matching send button styling
- [ ] Implement count badge overlay (top-right corner of trigger button) showing number of selected spaces
- [ ] Implement popover container: absolute positioned, opens upward, max-height 300px with overflow scroll, z-index above chat elements
- [ ] Implement space list fetching from `/api/backend/kdb/spaces` using PAT from `useApp()` context
- [ ] Implement lazy fetch: only trigger on first popover open, cache in component state
- [ ] Implement loading state with spinner and slow-loading hint (after 5s)
- [ ] Implement error state with message and retry button
- [ ] Implement empty state ("No Copilot Spaces found")
- [ ] Implement checkbox items: `owner/name` label with optional description line
- [ ] Implement "Clear selection" footer link (visible when ≥1 space is selected)
- [ ] Implement click-outside-to-close behavior
- [ ] Expose `selectedSpaces: string[]` via `onSelectionChange` callback prop
- [ ] Accept `disabled` prop to disable interaction during streaming
- [ ] Apply design tokens: `bg-surface-2`, `border-border`, `text-text-primary`, `text-muted`, `text-accent`

## Dependencies

- Depends on: existing `/api/backend/kdb/spaces` endpoint (already implemented)
- Depends on: `useApp()` context for PAT access (already implemented)
- Depends on: `lucide-react` for `BookOpen`, `X`, `Check`, `Loader2` icons (already installed)

## Out of Scope

- Search or filter within the spaces list
- Drag-to-reorder selected spaces
- Persisting selections to `localStorage` or context across navigations
- Creating or managing spaces from within the selector

## Notes

- The spaces API call can be slow (5-10s) because it goes through MCP. Lazy fetching on first open avoids penalizing users who don't use spaces.
- The `CopilotSpace` interface from the KDB page (`{ name, owner, description?, url? }`) should be extracted to a shared types file or duplicated in this component.
- The popover should open **upward** since the input area is at the bottom of the viewport.
