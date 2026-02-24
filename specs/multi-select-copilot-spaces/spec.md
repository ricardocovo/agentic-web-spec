# Feature: Multi-Select Copilot Spaces in Agent Chat

## Overview

Allow users to select one or more GitHub Copilot Spaces directly from the agent chat input area before submitting a prompt. A compact multi-select popover appears next to the send button, fetches available spaces from the existing KDB backend endpoint, and passes the selected spaces to the agent so it can query each space's context during its run. This replaces the current hidden single-space `localStorage` mechanism with a visible, flexible multi-select control.

## Problem Statement

The application already supports injecting a single Copilot Space into agent sessions, but the selection is invisible — it relies on a `localStorage` key (`web_spec_selected_space`) set from the KDB page with no indication in the chat UI. Users have no way to see which space is active, change it per-prompt, or select multiple spaces simultaneously. This makes the Spaces integration effectively undiscoverable and limits its usefulness for prompts that benefit from cross-referencing multiple knowledge bases.

## Goals

- [ ] Provide a visible multi-select UI for Copilot Spaces in the agent chat input area
- [ ] Allow users to select zero, one, or many spaces before each prompt submission
- [ ] Fetch available spaces from the existing `/api/backend/kdb/spaces` endpoint
- [ ] Pass all selected spaces to the backend so the agent can query each via `get_copilot_space`
- [ ] Update the backend to accept and process an array of space references
- [ ] Remove the hidden single-space `localStorage` mechanism

## Non-Goals

- Modifying the KDB page itself (it remains a read-only listing)
- Persisting space selections across browser sessions or page reloads
- Adding space creation, editing, or management functionality
- Caching the spaces list across agent pages or sessions
- Adding search/filter within the space selector (can be added later if the list grows large)
- Supporting spaces in the agent handoff flow (handoff only transfers the last message)

## Target Users / Personas

| Persona | Description |
|---|---|
| Developer | A software engineer generating specs who has domain knowledge curated in one or more Copilot Spaces and wants agents to incorporate that context |
| Technical Lead | A lead who maintains multiple Copilot Spaces (e.g., architecture decisions, API standards) and wants to attach relevant ones depending on the agent and prompt |

## Functional Requirements

1. The system shall display a space selector control in the chat input area, positioned between the textarea and the send button
2. The system shall fetch available Copilot Spaces from `GET /api/backend/kdb/spaces` when the selector is first opened, using the user's PAT for authentication
3. The system shall display each space as a checkable item showing `owner/name` and optional description
4. The system shall allow the user to select or deselect any combination of spaces
5. The system shall display the count of selected spaces as a badge on the selector trigger button
6. The system shall pass all selected space references (`owner/name` strings) to the backend when submitting a prompt
7. The backend shall accept a `spaceRefs: string[]` parameter in the `/api/agent/run` request body
8. The backend shall include all selected spaces in the agent's system prompt instruction so the agent knows to query each one
9. The backend shall enable the MCP server configuration when any space is selected (same as current single-space behavior)
10. The backend shall maintain backward compatibility by also accepting the legacy `spaceRef: string` parameter
11. The system shall include the `Authorization: Bearer <PAT>` header on agent run requests when spaces are selected
12. The system shall hide the space selector when no PAT is configured (spaces require authentication)

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Space list fetch should be triggered lazily (on first popover open, not on page load) to avoid unnecessary API calls |
| Performance | Selecting/deselecting spaces must be instant (local state only) |
| Security | PAT is only sent in request headers, never stored in component state beyond what `useApp()` already provides |
| Accessibility | Popover must be keyboard-navigable; checkboxes must have proper labels; trigger button must have an accessible name |
| Responsiveness | Selector must work on viewports ≥ 768px; on smaller screens it should remain functional but may stack vertically |
| Consistency | Component must use existing design tokens (`bg-surface-2`, `border-border`, `text-text-primary`, `text-accent`, etc.) and match the visual style of the chat interface |

## UX / Design Considerations

### Chat input layout with space selector

```
┌─────────────────────────────────────┐ ┌────────┐ ┌──────┐
│ Textarea (flex-1)                   │ │ 📚  2  │ │  ➤   │
│                                     │ │        │ │      │
└─────────────────────────────────────┘ └────────┘ └──────┘
  Press Enter to send · Shift+Enter for new line
```

- **Trigger button**: A `w-10 h-10` square button (matching the send button size) with a `BookOpen` icon. When spaces are selected, a small count badge overlays the top-right corner.
- **No PAT / no spaces**: The button is hidden or rendered as disabled with a tooltip explaining why.
- **During streaming**: The selector is disabled (same as the send button and textarea).

### Popover content

```
┌───────────────────────────────┐
│ Copilot Spaces                │
│───────────────────────────────│
│ ☑ acme-org/design-system      │
│   Design tokens and component │
│   guidelines                  │
│                               │
│ ☐ acme-org/api-standards      │
│   REST API conventions        │
│                               │
│ ☑ jdoe/project-notes          │
│   Personal research notes     │
│───────────────────────────────│
│ Clear selection               │
└───────────────────────────────┘
```

- Opens upward from the trigger button (since it's at the bottom of the page)
- Max height ~300px with scroll for long lists
- Each item shows `owner/name` in bold and description (if available) in muted text below
- "Clear selection" link at the bottom when ≥1 space is selected
- Loading spinner shown while fetching; error message with retry link on failure

### Key flows

1. **First use**: User clicks the 📚 button → popover opens → spaces load → user checks desired spaces → closes popover → types prompt → sends. Selected spaces are included in the request.
2. **Subsequent prompts**: Selections persist within the component's lifecycle (same page session). User can modify selections before any prompt.
3. **No spaces available**: Button shows as disabled with a tooltip "No Copilot Spaces available" or is hidden entirely.

## Technical Considerations

### Backend changes (`backend/src/routes/agent.ts`)

- Accept `spaceRefs?: string[]` alongside legacy `spaceRef?: string`
- Normalize: if only `spaceRef` is provided, wrap it into `[spaceRef]`; if both provided, prefer `spaceRefs`
- System prompt instruction changes from singular to plural:
  ```
  You have access to these Copilot Spaces: "owner/space-a", "owner/space-c".
  Use the get_copilot_space tool for each space to retrieve its context and incorporate it into your analysis.
  ```
- MCP server config remains identical (it's a toolset toggle, not per-space)
- Enable MCP + PAT env vars when `spaceRefs.length > 0`

### Frontend component (`frontend/components/SpaceSelector.tsx`)

- Self-contained component with its own state for fetched spaces, loading, error, and selection
- Uses `useApp()` to access `pat` for the API call
- Exposes `selectedSpaces: string[]` via a callback prop (`onSelectionChange`)
- Fetches spaces lazily on first popover open to avoid unnecessary API calls on every page load
- Popover positioning: absolute, anchored to trigger button, opening upward

### ChatInterface integration

- `ChatInterface` gains a new `onSend` signature: `(content: string, selectedSpaces: string[]) => Promise<void>`
- Alternatively, `ChatInterface` manages `selectedSpaces` internally and passes them through `onSend`
- The agent page's `handleSend` callback is updated to accept and forward the spaces array

### API contract change

**`POST /api/agent/run`** request body:
```typescript
{
  agentSlug: string;
  prompt: string;
  repoPath: string;
  context?: string;
  spaceRefs?: string[];   // NEW: array of "owner/name" strings
  spaceRef?: string;      // DEPRECATED: kept for backward compat
}
```

No response format changes.

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| `GET /api/backend/kdb/spaces` endpoint | Internal | Already exists; used to fetch available spaces |
| `POST /api/agent/run` endpoint | Internal | Must be updated to accept `spaceRefs` array |
| GitHub PAT (user-configured) | External | Required for both listing spaces and using them in agent sessions |
| Copilot MCP Server (`api.githubcopilot.com/mcp/readonly`) | External | Provides `get_copilot_space` and `list_copilot_spaces` tools |
| lucide-react icons | Internal | Already installed; `BookOpen`, `X`, `Check` icons needed |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Spaces API is slow (~5-10s) causing poor UX on popover open | High | Medium | Lazy fetch with loading spinner; cache results in component state after first load; show "slow loading" hint after 5s |
| Selecting many spaces overwhelms the agent's context window | Low | Medium | The agent controls how much it retrieves per space; no hard limit needed in v1 but can add a max-selection cap later |
| User confusion about what spaces do | Medium | Low | Add a small info tooltip on the trigger button explaining that spaces provide additional context to the agent |
| Popover z-index conflicts with other UI elements | Low | Low | Use a high z-index and test with all chat states (streaming, handoff bar visible, etc.) |
| Breaking backward compatibility for `spaceRef` | Low | High | Backend normalizes both `spaceRef` and `spaceRefs`; no existing client breaks |

## Success Metrics

- Users can discover and select spaces without navigating away from the chat page
- Selected spaces are correctly passed to agents and reflected in agent output (agent mentions querying spaces)
- Zero regressions in agent chat functionality when no spaces are selected
- The old `localStorage`-based single-space mechanism is fully removed

## Open Questions

- [ ] Should space selections persist across page navigations (e.g., via `localStorage` or context)? Current plan: no, they reset per page session.
- [ ] Should there be a maximum number of selectable spaces? Current plan: no limit in v1.
- [ ] Should the selector be visible on all agent pages or only specific agents? Current plan: all agents.

## User Stories

| Story | File |
|---|---|
| Update backend to accept multiple space references | [stories/backend-multi-space.md](stories/backend-multi-space.md) |
| Create SpaceSelector component | [stories/create-space-selector.md](stories/create-space-selector.md) |
| Integrate SpaceSelector into ChatInterface | [stories/integrate-chat-interface.md](stories/integrate-chat-interface.md) |
| Update agent page to send selected spaces | [stories/update-agent-page-send.md](stories/update-agent-page-send.md) |
| Clean up legacy single-space code | [stories/cleanup-single-space.md](stories/cleanup-single-space.md) |
