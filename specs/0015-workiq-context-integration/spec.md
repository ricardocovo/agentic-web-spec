# Feature: WorkIQ Context Integration

## Overview

Add WorkIQ integration to all agent chat pages so users can search their Microsoft 365 data (emails, meetings, documents, Teams messages, people) and attach relevant items as hidden context to the agent conversation. A new button in the chat toolbar opens a search modal; selected results are injected into the agent's context in the same way handoff context works today — invisible to the textarea but included in the system prompt sent to the backend.

## Problem Statement

Product Managers and Engineering Leads using Web-Spec often need to reference information scattered across Microsoft 365 — email threads, meeting notes, design documents, and Teams discussions. Today they must manually copy-paste this information into the prompt or rely on memory. This breaks flow, loses fidelity, and makes it impossible to ground agent output in the original source material. WorkIQ already indexes and summarizes M365 data; integrating it directly into the agent conversation eliminates context-switching and produces higher-quality, better-grounded agent output.

## Goals

- [ ] Allow users to search their M365 data (emails, meetings, documents, Teams messages, people) from within any agent chat page
- [ ] Display search results categorized by content type for easy scanning
- [ ] Insert selected WorkIQ item summaries into the agent's hidden context (not the textarea)
- [ ] Provide a clear visual indicator when WorkIQ context is attached to the conversation
- [ ] Proxy all WorkIQ queries through the backend via the WorkIQ MCP server, requiring no user-facing authentication

## Non-Goals

- User-facing Microsoft 365 authentication flow — WorkIQ is pre-authenticated on the server by an admin
- Full M365 document preview or inline rendering of attachments
- Editing or composing M365 content (emails, calendar events) from within Web-Spec
- Persisting WorkIQ search history or selected items across sessions
- WorkIQ integration outside of agent chat pages (e.g., the dashboard or settings)

## Target Users / Personas

| Persona | Description |
|---|---|
| Product Manager | Uses Web-Spec to generate PRDs and research reports; needs to pull in context from emails, meeting notes, and planning documents stored in M365 |
| Engineering Lead | Uses Web-Spec for technical documentation; wants to reference design docs, architecture decisions from Teams discussions, and meeting notes |

## Functional Requirements

1. The system shall expose a backend API endpoint (`POST /api/workiq/search`) that proxies search queries to the WorkIQ MCP server and returns categorized results
2. The system shall display a WorkIQ button in the chat input toolbar on all agent pages, positioned between the prompt textarea (and its quick-prompt sparkle button) and the SpaceSelector button
3. The system shall open a modal when the WorkIQ button is clicked, containing a search input and a categorized results area
4. The system shall categorize search results into tabs or sections: Emails, Meetings, Documents, Teams Messages, and People
5. The system shall allow users to select one or more search results to attach as context
6. The system shall insert selected WorkIQ item summaries as hidden context in the conversation — passed to the backend as part of the `context` field on `/api/agent/run`, not inserted into the prompt textarea
7. The system shall display a visual indicator (badge/chip) near the input area showing how many WorkIQ items are attached
8. The system shall allow users to remove individual attached WorkIQ items before sending
9. The system shall append WorkIQ context to the agent system prompt in the backend, clearly labeled and separated from handoff context
10. The system shall handle WorkIQ MCP server unavailability gracefully with user-facing error messages

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Search results should return within 3 seconds for typical queries; UI must remain responsive during search |
| Security | WorkIQ queries are proxied through the backend — no M365 tokens or credentials are exposed to the frontend |
| Accessibility | Modal must be keyboard-navigable (Tab, Escape to close); search input must be auto-focused; results must be screen-reader accessible |
| Scalability | The WorkIQ MCP server process should be managed as a singleton on the backend to avoid spawning multiple stdio processes |
| Reliability | If the WorkIQ MCP server is not available (not installed or not configured), the WorkIQ button should be hidden or disabled with a tooltip explaining the issue |

## UX / Design Considerations

- **WorkIQ button**: Icon-only button (lucide `BrainCircuit` or `Search` with a distinct style) matching the size and style of the SpaceSelector button. Positioned to the left of SpaceSelector in the input toolbar.
- **Search modal**: Follows the `RepoSelectorModal` pattern — fixed overlay with `bg-black/60 backdrop-blur-sm`, max-width container, search input at top, scrollable categorized results below.
- **Result categories**: Horizontal tab bar or segmented sections for Emails, Meetings, Documents, Teams Messages, People. Each result shows: title/subject, brief snippet, date, and source icon.
- **Selection**: Checkbox or highlight-to-select pattern. Selected items show a checkmark. A "Attach N items" button at the bottom confirms selection and closes the modal.
- **Context indicator**: Small pill/chip row above or below the textarea showing attached WorkIQ items (e.g., "📎 Meeting: Q4 Planning" with an × to remove). Similar to how file attachments appear in chat UIs.
- **Empty/error states**: "No results found" message; "WorkIQ is not available" when the server is down; loading spinner during search.

## Technical Considerations

- **WorkIQ MCP integration**: The backend spawns the WorkIQ MCP server via `workiq mcp` (stdio transport). This should be a singleton process managed with lifecycle hooks (start on first request, restart on crash). The MCP client sends `tools/call` with the search tool.
- **Backend API**: New Express route at `POST /api/workiq/search` accepts `{ query: string }` and returns `{ results: WorkIQResult[] }` with categorized items. A health-check endpoint `GET /api/workiq/status` reports whether WorkIQ is available.
- **Frontend state**: WorkIQ selected items are managed as component state in `ChatInterface` (or a new context provider). Selected items are an array of `{ id, type, title, summary }` objects. On send, these are serialized and merged into the `context` field alongside any existing handoff context.
- **Context format**: WorkIQ context is formatted as a clearly labeled block appended to the system prompt: `\n\nWorkIQ Context:\n${items.map(i => `[${i.type}] ${i.title}: ${i.summary}`).join('\n')}`.
- **Backend ESM**: All new backend files use `.js` extensions in imports, consistent with existing ESM patterns.
- **Frontend styling**: All new components use existing Tailwind theme tokens (`bg-surface`, `bg-surface-2`, `text-text-primary`, `border-border`, `text-accent`, etc.) and lucide-react icons.
- **MCP server singleton**: Use a module-level variable to hold the MCP client instance. Lazy-initialize on first search request. Handle process exit and restart.

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| WorkIQ CLI (`@microsoft/workiq`) | External | Must be installed globally on the server (`npm install -g @microsoft/workiq`). `workiq mcp` starts the stdio MCP server |
| MCP SDK (`@modelcontextprotocol/sdk`) | External | Already in use (or add as dependency) for MCP client communication with the WorkIQ stdio server |
| ChatInterface component | Internal | Must be modified to accept WorkIQ items and render the button + indicator |
| Agent page (`[slug]/page.tsx`) | Internal | Must be updated to pass WorkIQ context through to the backend API call |
| Agent route (`backend/src/routes/agent.ts`) | Internal | Must be updated to accept and append WorkIQ context to the system prompt |
| SpaceSelector component | Internal | No modification needed, but the new WorkIQ button must visually integrate next to it |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| WorkIQ MCP server not installed on deployment environment | High | High | Feature degrades gracefully — button hidden/disabled when WorkIQ is unavailable; status endpoint enables frontend to check availability |
| WorkIQ MCP server process crashes or hangs | Med | Med | Implement health checks and auto-restart logic; set timeouts on MCP requests (10s); surface errors to user |
| Large WorkIQ result summaries bloat the system prompt | Med | Med | Truncate individual item summaries to ~500 chars; limit total WorkIQ context to ~4000 chars; show truncation indicator |
| Search latency degrades user experience | Med | Low | Show loading skeleton during search; debounce input (400ms); cache recent searches in memory |
| WorkIQ returns results the user doesn't have permission to see | Low | High | WorkIQ respects M365 permissions natively — no additional filtering needed, but document this assumption |

## Success Metrics

- Metric 1: ≥ 40% of active users use the WorkIQ search modal at least once per week within 30 days of launch
- Metric 2: Average time from opening modal to attaching context is under 15 seconds
- Metric 3: Agent output quality ratings improve for conversations that include WorkIQ context vs. those without
- Metric 4: Zero increase in agent API error rate after WorkIQ context integration

## Open Questions

- [ ] What is the exact tool name and schema for the WorkIQ MCP search tool? (Need to inspect `workiq mcp` tool list)
- [ ] Does WorkIQ return structured categories per result, or do we need to classify results client-side?
- [ ] What is the maximum summary length WorkIQ returns per item, and should we truncate further?
- [ ] Should we support "deep link" back to the original M365 item (e.g., open the email in Outlook)?
- [ ] Is there a rate limit on the WorkIQ MCP server, and should we implement request queuing?
- [ ] Should WorkIQ context persist across messages in the same session, or only apply to the next message sent?

## User Stories

| Story | File |
|---|---|
| Backend WorkIQ MCP Proxy | [stories/backend-workiq-proxy.md](stories/backend-workiq-proxy.md) |
| WorkIQ Search Modal | [stories/workiq-search-modal.md](stories/workiq-search-modal.md) |
| WorkIQ Toolbar Button | [stories/workiq-toolbar-button.md](stories/workiq-toolbar-button.md) |
| Context Attachment and Indicator | [stories/context-attachment-indicator.md](stories/context-attachment-indicator.md) |
| Agent Context Forwarding | [stories/agent-context-forwarding.md](stories/agent-context-forwarding.md) |
| WorkIQ Availability Detection | [stories/workiq-availability-detection.md](stories/workiq-availability-detection.md) |
