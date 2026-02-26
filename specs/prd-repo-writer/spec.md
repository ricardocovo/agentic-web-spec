# Feature: PRD Repo Writer

## Overview

> Add a "Create PRD on Repo" action button to the PRD agent page that persists the generated PRD document directly to the repository. When clicked, a new `prd-writer` backend agent writes the PRD to `docs/prd/{feature-slug}.md`, commits to a `prd/{feature-slug}` branch, pushes, and opens a pull request. This mirrors the existing "Create Docs on Repo" flow on the Technical Docs agent page but produces a single PRD file instead of a directory of spec/story files.

## Problem Statement

> The PRD agent generates a complete Product Requirements Document in the chat interface, but users have no way to persist it directly into the repository. Currently, only the Technical Docs agent offers a "Create Docs on Repo" action (via the `spec-writer` agent). Product Managers and Developers must manually copy PRD output, create files, branches, and PRs — a tedious, error-prone process that discourages version-controlling PRDs alongside code.

## Goals

- [ ] Allow users to persist a PRD to the repository with a single click from the PRD agent page
- [ ] Produce a clean PR with the PRD written to `docs/prd/{feature-slug}.md` on a `prd/{feature-slug}` branch
- [ ] Follow existing patterns (spec-writer agent, ActionPanel, agentActions) so the feature is consistent and maintainable
- [ ] Require zero changes to shared infrastructure (ActionPanel, ChatInterface, agents.ts)

## Non-Goals

> What this feature explicitly does NOT do. Helps prevent scope creep.

- Does NOT generate or modify the PRD content itself — the PRD agent already handles generation
- Does NOT create multiple files or a directory structure (unlike the spec-writer which creates `spec.md` + individual story files)
- Does NOT add a new agent to the visible pipeline (deep-research → prd → technical-docs) — the `prd-writer` is an action agent, not a pipeline agent
- Does NOT modify the ActionPanel component, ChatInterface, or `agents.ts` config — existing infrastructure is reused as-is
- Does NOT support writing PRDs to arbitrary file paths — output path is always `docs/prd/{feature-slug}.md`

## Target Users / Personas

| Persona | Description |
|---|---|
| Product Manager | Wants to persist PRD documents directly into the codebase for version control and team review via PR |
| Developer | Wants PRD documents checked into the repo so they can reference requirements alongside code |

## Functional Requirements

> Numbered list of capabilities the feature MUST deliver.

1. The system shall provide a "Create PRD on Repo" action button on the PRD agent page (`slug === "prd"`), visible once the agent has produced at least one assistant response
2. The system shall trigger a `prd-writer` backend agent when the button is clicked, passing the latest PRD output as context
3. The `prd-writer` agent shall derive a kebab-case `{feature-slug}` from the PRD title
4. The `prd-writer` agent shall create a new branch named `prd/{feature-slug}` (with a timestamp suffix if the branch already exists)
5. The `prd-writer` agent shall write the PRD content to `docs/prd/{feature-slug}.md` as a single well-formatted Markdown file
6. The `prd-writer` agent shall commit the file with a descriptive message (e.g. `Add PRD: {feature title}`)
7. The `prd-writer` agent shall push the branch and create a pull request via the `gh` CLI with a summary body
8. The system shall display real-time progress in the existing ActionPanel modal (creating branch → writing file → committing → pushing → opening PR)
9. The system shall show the resulting PR URL upon completion

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | The action should complete within 30 seconds for a typical PRD (similar to spec-writer performance) |
| Security | Git push uses embedded remote credentials; `gh` CLI uses the existing `GH_TOKEN` env var — no new auth mechanisms required |
| Accessibility | Action button follows existing UI patterns with icon, label, and description — no additional accessibility work needed |
| Scalability | N/A — single-user action, no concurrency concerns beyond what the existing agent runner handles |
| Maintainability | Implementation must follow the existing spec-writer pattern exactly (YAML agent + agentFileMap entry + agentActions conditional) so future developers recognize the pattern |

## UX / Design Considerations

> The UX is identical to the existing "Create Docs on Repo" action on the Technical Docs page. No new UI components or flows are needed.

- Key flow 1: User generates a PRD via the PRD agent chat → sees "Create PRD on Repo" button in the action bar → clicks it → ActionPanel modal opens → progress steps animate (Creating branch → Writing PRD file → Committing changes → Pushing to remote → Opening pull request) → success state shows with PR URL
- Key flow 2: If the branch already exists, the agent appends a timestamp suffix and continues — no user intervention required
- The action button uses the `GitPullRequest` icon from lucide-react (same as "Create Docs on Repo") with label "Create PRD on Repo" and description "Create a branch with the PRD document in the repo"

## Technical Considerations

> Architecture decisions, technology choices, API contracts, or constraints relevant to implementation.

- **Backend agent config**: New file `backend/agents/prd-writer.agent.yaml` modeled on `spec-writer.agent.yaml`. Key differences: writes a single file to `docs/prd/{feature-slug}.md` instead of a directory tree; branch prefix is `prd/` instead of `specs/`; commit message prefix is `Add PRD:` instead of `Add spec:`
- **Agent registration**: Add `"prd-writer": "prd-writer.agent.yaml"` to the `AGENT_FILE_MAP` in `backend/src/lib/agentFileMap.ts`
- **Frontend wiring**: Add `handleCreatePRD()` function and extend the `agentActions` conditional in `frontend/app/agents/[slug]/page.tsx` to cover `slug === "prd"`
- **ActionPanel progress hints**: The existing `PROGRESS_HINTS` patterns in `ActionPanel.tsx` already cover branch creation, file writing, committing, pushing, and PR creation — no changes needed
- **No pipeline changes**: The `prd-writer` agent is not added to the `AGENTS` array or the pipeline chain; it is an action-only agent (same as `spec-writer` and `issue-creator`)
- **Model**: Use `gpt-4.1` (same as spec-writer) for reliable instruction following and bash tool usage

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| `spec-writer.agent.yaml` | Internal | Pattern reference — prd-writer mirrors this agent's structure |
| `ActionPanel` component | Internal | Reused as-is for streaming progress display |
| `agentFileMap.ts` | Internal | Must be updated to register the new agent slug |
| `gh` CLI | External | Required on the backend server for `gh pr create` — already a dependency of spec-writer |
| `GH_TOKEN` env var | External | Must be set in the backend environment — already required by spec-writer |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `docs/prd/` directory doesn't exist in target repo | High | Low | Agent creates it with `mkdir -p docs/prd` before writing |
| Branch name collision (`prd/{feature-slug}` already exists) | Low | Low | Agent appends timestamp suffix (same pattern as spec-writer) |
| `gh` CLI not authenticated | Low | High | Agent relies on `GH_TOKEN` env var already set for spec-writer; same deployment requirements |
| PRD content too long for single commit message body | Low | Low | Commit message uses a short title; full PRD is in the file, not the commit body |

## Success Metrics

> How will we know this feature is successful?

- Metric 1: Users can click "Create PRD on Repo" and receive a valid PR URL containing the PRD file within 30 seconds
- Metric 2: The created PR contains exactly one new file at `docs/prd/{feature-slug}.md` with well-formatted Markdown content
- Metric 3: Zero changes required to ActionPanel, ChatInterface, or agents.ts — full pattern reuse validated

## Open Questions

- [ ] Should the PRD agent page also include a "Create GitHub Issues" action (like Technical Docs has), or is that out of scope for this feature?
- [ ] Should the PR body include the full PRD content or just a summary with a link to the file?

## User Stories

> List of all user stories for this feature (links will be added as files are created).

| Story | File |
|---|---|
| Create PRD Writer Backend Agent | [stories/create-prd-writer-agent.md](stories/create-prd-writer-agent.md) |
| Register PRD Writer in Agent File Map | [stories/register-prd-writer.md](stories/register-prd-writer.md) |
| Add Create PRD on Repo Action Button | [stories/add-create-prd-action.md](stories/add-create-prd-action.md) |
