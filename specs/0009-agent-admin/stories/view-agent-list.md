# User Story: View Agent List

## Summary

**As a** developer or power user,
**I want** to see a sidebar listing all configured agents with their display name and a description snippet,
**So that** I can quickly identify and select the agent I want to edit.

## Description

When navigating to `/admin`, the page fetches all agent configurations from `GET /api/admin/agents` and renders them in a left-hand sidebar. Each item in the list shows the agent's `displayName` prominently and the first ~100 characters of its `description` as a muted subtitle. Clicking an item populates the right-hand editor panel with that agent's full configuration. The first agent in the list is selected automatically on initial load.

## Acceptance Criteria

- [ ] Given the user navigates to `/admin`, when the page loads, then a sidebar is rendered containing one entry per agent defined in `AGENT_FILE_MAP`.
- [ ] Given the sidebar is rendered, when viewing each list item, then the item displays the agent's `displayName` and a truncated `description` (max ~100 characters, ellipsis if longer).
- [ ] Given the page loads, when no agent has been manually selected, then the first agent in the list is selected by default and its data is shown in the editor panel.
- [ ] Given the sidebar is rendered, when the user clicks an agent list item, then that item receives the active/selected visual state (accent left border + `text-accent` color) and the editor panel updates to show that agent's data.
- [ ] Given a selected agent exists, when another item in the list is clicked and there are no unsaved changes, then the selection switches immediately without a confirmation dialog.
- [ ] Given the `GET /api/admin/agents` call fails, when the page loads, then a visible error message is displayed instead of the sidebar list.

## Tasks

- [ ] Create `frontend/app/admin/page.tsx` as a client component (`"use client"`)
- [ ] Implement `fetchAgents()` function that calls `GET http://localhost:3001/api/admin/agents` and returns the agent list
- [ ] Implement agent list state with `useState` for `agents`, `selectedSlug`, and `loadingState`
- [ ] Render the sidebar panel with a scrollable list of agent items
- [ ] Style each list item using Tailwind dark-theme tokens (`bg-surface`, `text-text-primary`, `border-border`, `text-accent`)
- [ ] Apply active-item styles (left accent border, `text-accent` color) to the currently selected item
- [ ] Truncate `description` to ~100 characters in the sidebar item rendering
- [ ] Auto-select the first agent on initial data load
- [ ] Render an error state when the fetch fails

## Dependencies

> Depends on: Backend admin API story (GET /api/admin/agents endpoint must exist)

## Out of Scope

- Creating, reordering, or deleting agents from the sidebar
- Searching or filtering the agent list
- Showing agent run history or status in the sidebar

## Notes

- The order of agents in the sidebar should follow the order of entries in `AGENT_FILE_MAP` (currently: deep-research, prd, technical-docs).
- The sidebar width should be approximately 280 px, fixed, with the editor panel taking the remaining space.
- Use the existing Tailwind theme tokens consistently; do not introduce new color values.
