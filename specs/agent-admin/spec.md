# Feature: Agent Admin

## Overview

The Agent Admin feature provides an administration page at `/admin` where developers and power users can view and edit agent definitions through a browser-based UI. Agents are configured via YAML files on disk (`backend/agents/*.yaml`), and changes made in the UI are persisted back to those files through a new backend REST API. This eliminates the need to manually edit YAML files to customize agent behavior.

## Problem Statement

Agent configuration (system prompts, model selection, enabled tools) currently lives in YAML files on disk. Making changes requires direct file access, knowledge of the YAML schema, and a server restart or reload awareness. This creates friction for developers and power users who want to iterate on agent behavior quickly. An in-browser admin panel removes that barrier by exposing all editable fields through a purpose-built UI.

## Goals

- [ ] Provide a `/admin` page listing all configured agents in a sidebar
- [ ] Allow editing of `displayName`, `description`, `model`, and `tools` via form controls
- [ ] Allow editing of the `prompt` field via a multi-line textarea
- [ ] Persist changes back to the corresponding `.yaml` file on the backend via a REST API
- [ ] Surface the admin page through the main navigation bar
- [ ] Keep the implementation consistent with the existing app's dark Tailwind theme

## Non-Goals

- Creating new agents (agent files are created manually by developers)
- Deleting existing agents
- Modifying frontend-only config (`slug`, `color`, `bgColor`, `borderColor`, `iconColor`, `nextAgent` in `frontend/lib/agents.ts`)
- Authentication or access control (consistent with rest of the app)
- Live reload or restart of the backend after a YAML save
- Validating prompt content or model name against an external registry
- Version history or undo/redo of YAML changes

## Target Users / Personas

| Persona | Description |
|---|---|
| Developer | An engineer building or debugging the pipeline who needs to rapidly iterate on system prompts and model selection without leaving the browser |
| Power User | A technically-savvy stakeholder who wants to tune agent behavior (e.g., enable/disable tools, adjust descriptions) without touching the file system |

## Functional Requirements

1. The system shall expose a GET `/api/admin/agents` endpoint that returns a list of all agents (slug + full YAML fields).
2. The system shall expose a GET `/api/admin/agents/:slug` endpoint that returns the full YAML config for a single agent by slug.
3. The system shall expose a PUT `/api/admin/agents/:slug` endpoint that accepts a JSON body with updated YAML fields and writes them back to the corresponding `.yaml` file on disk.
4. The system shall read agent slugs and filenames from the existing `AGENT_FILE_MAP` in `backend/src/routes/agent.ts` (or a shared constant) to avoid duplication.
5. The frontend shall display a two-panel layout at `/admin`: a left sidebar listing all agents and a right editor panel showing the selected agent's fields.
6. The agent list sidebar shall show each agent's `displayName` and a short snippet of its `description`.
7. The editor panel shall include form fields for `displayName` (text input), `description` (text input), and `model` (text input or select).
8. The editor panel shall include a checkbox group for `tools`, where the set of available tools is the union of all tools found across all agent YAML files (`grep`, `glob`, `view`, `bash`).
9. The editor panel shall include a `<textarea>` for the `prompt` field.
10. The editor panel shall include a **Save** button that submits changes via PUT to the backend and shows a success or error notification.
11. The system shall add an "Admin" link to the `NAV_LINKS` array in `frontend/components/Nav.tsx` pointing to `/admin`.
12. The active-link highlight in the Nav shall correctly activate the "Admin" link when the user is on `/admin`.

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | GET list and GET single endpoints should respond within 200 ms under normal conditions (reads from local disk) |
| Performance | PUT endpoint should respond within 500 ms (single file write to local disk) |
| Security | No auth required; consistent with the rest of the application |
| Reliability | If a YAML file cannot be written (permissions error, etc.), the PUT endpoint shall return a 500 with a descriptive error message |
| Accessibility | Form labels must be associated with their inputs via `htmlFor`/`id`; keyboard navigation through the form must work correctly |
| Maintainability | The backend admin router shall be a separate file (`backend/src/routes/admin.ts`) registered in `backend/src/index.ts` |
| Consistency | UI components (colors, spacing, typography) must use the existing Tailwind dark-theme tokens: `bg-surface`, `text-text-primary`, `border-border`, `text-accent` |

## UX / Design Considerations

- **Two-panel layout:** The `/admin` page uses a fixed-width left sidebar (~280 px) for the agent list and a flexible right panel for the editor. On the initial load, the first agent in the list is selected automatically.
- **Agent list item:** Each item shows the agent's `displayName` in bold and the first ~100 characters of `description` as a muted subtitle. The selected item is highlighted with the `text-accent` color and a left border accent.
- **Editor panel header:** Shows the selected agent's `displayName` as a heading and its `name` (YAML key) as a muted subtitle.
- **Save feedback:** On successful save, a green inline success message ("Saved successfully") appears below the Save button and fades out after 3 seconds. On error, a red error message is shown.
- **Unsaved changes guard:** If a user clicks a different agent in the sidebar while there are unsaved edits, a browser `confirm()` dialog warns them that unsaved changes will be lost.
- **Prompt textarea:** Should be tall (min ~12 rows) with monospace font to make prompt editing comfortable.

- Key flow 1 — View & select: User navigates to `/admin` → sidebar renders all agents → first agent is auto-selected → editor panel populates with that agent's fields.
- Key flow 2 — Edit & save: User modifies one or more fields → clicks Save → frontend PUTs changes to `/api/admin/agents/:slug` → success message appears.
- Key flow 3 — Switch agent: User clicks another agent in sidebar → (confirm if dirty) → editor panel repopulates with new agent's data.

## Technical Considerations

- **Shared `AGENT_FILE_MAP`:** The map from slug → filename is currently defined inside `backend/src/routes/agent.ts`. To avoid duplication, consider extracting it to `backend/src/lib/agentFileMap.ts` and importing it in both `agent.ts` and the new `admin.ts` router.
- **YAML serialization:** The backend should use the same `js-yaml` (or equivalent) library already used for reading agent files to write them back, preserving field order where possible.
- **File path resolution:** Agent file paths are resolved relative to the `backend/agents/` directory. The admin route should use the same resolution logic as the existing `agent.ts` route.
- **PUT body schema:** The PUT endpoint accepts a JSON body with the subset of editable fields: `{ displayName, description, model, tools, prompt }`. The `name` field is derived from the slug and is never overwritten by the client.
- **Frontend data fetching:** The admin page is a client component (`"use client"`) that fetches agent data from the backend at `http://localhost:3001/api/admin/agents` on mount (consistent with how the existing frontend calls the backend).
- **Available tools list:** The set of checkboxes rendered in the tools editor is the hard-coded union of all known tools: `["grep", "glob", "view", "bash"]`. This avoids a separate API call and is easy to extend.
- **No SSR needed:** The admin page can be fully client-rendered; no Next.js server components or server actions are required.

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| `js-yaml` (or equivalent) | Internal (already used) | Must be available in the backend for YAML read/write |
| `backend/src/routes/agent.ts` `AGENT_FILE_MAP` | Internal | Needs to be extracted or duplicated for the admin router |
| `frontend/components/Nav.tsx` `NAV_LINKS` | Internal | Needs a new "Admin" entry |
| `backend/src/index.ts` | Internal | Needs to register the new admin router |
| `backend/agents/*.yaml` | Internal | Source-of-truth files that are read and written by the admin API |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Concurrent writes corrupting a YAML file (two browser tabs saving simultaneously) | Low | High | Document as a known limitation; last-write-wins is acceptable for a developer tool |
| Malformed YAML written to disk if serializer receives unexpected input | Low | High | Validate required fields server-side before writing; return 400 on validation failure |
| Refactoring `AGENT_FILE_MAP` out of `agent.ts` breaking existing agent run functionality | Low | High | Write a unit-level smoke test or manual verification step after refactor |
| Large prompts causing textarea UX issues | Low | Low | Set a `max-height` with overflow scroll on the textarea container |

## Success Metrics

- Metric 1: All three agent YAML files can be round-tripped (read → edit → save → re-read) without data loss or corruption.
- Metric 2: A developer can update a system prompt and model selection entirely within the browser in under 60 seconds.
- Metric 3: The "Admin" nav link is visible and navigates correctly from every existing page in the app.

## Open Questions

- [ ] Should the `model` field be a free-text input or a dropdown limited to known models (e.g., `o4-mini`, `gpt-4o`)? Free-text is simpler and avoids hard-coding a model list.
- [ ] Should YAML comments in the source files be preserved on save? `js-yaml` does not preserve comments by default — acceptable trade-off for now.
- [ ] Should the admin page be accessible at `/admin` in production builds, or only in development? Current scope assumes no environment gating.

## User Stories

| Story | File |
|---|---|
| View agent list | [stories/view-agent-list.md](stories/view-agent-list.md) |
| Edit agent metadata | [stories/edit-agent-metadata.md](stories/edit-agent-metadata.md) |
| Edit agent prompt | [stories/edit-agent-prompt.md](stories/edit-agent-prompt.md) |
| Edit agent tools | [stories/edit-agent-tools.md](stories/edit-agent-tools.md) |
| Persist agent changes | [stories/persist-agent-changes.md](stories/persist-agent-changes.md) |
| Backend admin API | [stories/backend-admin-api.md](stories/backend-admin-api.md) |
| Add Admin nav link | [stories/add-admin-nav-link.md](stories/add-admin-nav-link.md) |
