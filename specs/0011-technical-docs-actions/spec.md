# Feature: Technical Docs Post-Action Buttons

## Overview

After the Technical Docs agent generates a specification, users currently have no automated way to act on that output. This feature adds two action buttons — **Create Docs on Repo** and **Create GitHub Issues** — that allow users to immediately persist the generated spec as files in the target repository or as GitHub issues, without leaving the app.

## Problem Statement

The Technical Docs agent produces high-quality specs, but the output stays inside the chat. Users must manually copy content, create branches, write files, and create issues — a slow, error-prone process. The pipeline should close the loop by letting users push the spec directly to their repo or issue tracker in one click.

## Goals

- [ ] Add a "Create Docs on Repo" action button visible after the Technical Docs agent responds
- [ ] Add a "Create GitHub Issues" action button visible after the Technical Docs agent responds
- [ ] Stream action progress back to the user in a modal panel (same UX as the existing chat stream)
- [ ] Create a branch, spec.md, and user story files in the repo for the docs action
- [ ] Create parent issues and sub-issues on GitHub for the issues action
- [ ] Keep action buttons specific to the `technical-docs` agent (last in chain)

## Non-Goals

- Adding action buttons to `deep-research` or `prd` agents
- Editing or reviewing generated files/issues before creation (no preview step in v1)
- Support for non-GitHub remotes (GitLab, Bitbucket, etc.)
- Configuring branch naming conventions or issue labels via UI

## Target Users / Personas

| Persona | Description |
|---|---|
| Developer / Tech Lead | Uses Web-Spec to generate implementation-ready specs from a repo and wants to immediately push them to the repo's `/specs/` folder as tracked files on a new branch |
| Engineering Manager | Uses Web-Spec to produce work breakdowns and wants to convert them directly to a GitHub issue backlog without manual copy-paste |

## Functional Requirements

1. The system shall display "Create Docs on Repo" and "Create GitHub Issues" buttons in the Technical Docs agent chat UI after at least one assistant message exists and no stream is in progress.
2. The system shall open an `ActionPanel` modal when either button is clicked, streaming real-time progress from the action agent.
3. The "Create Docs on Repo" action shall create a new git branch named `specs/{feature-slug}` (derived from the spec title) in the cloned repo, commit spec files, and push to the remote.
4. The "Create Docs on Repo" action shall create `specs/{feature-slug}/spec.md` containing the high-level feature spec and one `specs/{feature-slug}/{story-slug}.md` file per user story.
5. The "Create GitHub Issues" action shall create one parent GitHub issue per feature/task group identified in the Technical Docs output.
6. The "Create GitHub Issues" action shall create sub-issues for each user story, linked to the relevant parent issue.
7. The backend shall set the `GH_TOKEN` environment variable from the request's `Authorization: Bearer <pat>` header when spawning action agents, enabling `gh` CLI access.
8. The `ActionPanel` shall show an inline spinner while streaming, render markdown output as it arrives, and display a "Close" button once the stream ends.

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Action panel should begin streaming tokens within 3 seconds of button click |
| Security | PAT must never be logged or stored server-side; passed only as an env var scoped to the agent process |
| Accessibility | Action buttons must have descriptive `aria-label` attributes; modal must trap focus and support Escape to close |
| Scalability | Action agents run in the same stateless per-request Copilot SDK session as existing agents — no new infra needed |

## UX / Design Considerations

- Action buttons appear below the message list, alongside (or just below) the existing "Send to Next Agent" handoff button area — but since `technical-docs` is the last agent, only action buttons appear.
- Each button has a distinct icon: `GitBranch` for docs, `GitPullRequest` (or `CircleDot`) for issues.
- The `ActionPanel` is a centered modal overlay with a scrollable streaming area, consistent with the app's dark theme tokens.
- While streaming, the panel title shows "Creating…"; on success it changes to "Done ✓"; on error it shows "Failed ✗" with the error message.

## Technical Considerations

- Two new backend agent YAML files: `spec-writer.agent.yaml` and `issue-creator.agent.yaml` using only `bash` tools.
- Both new slugs registered in `AGENT_FILE_MAP` in `backend/src/routes/agent.ts`.
- The agent route must be updated to always pass `GH_TOKEN` + `GITHUB_PERSONAL_ACCESS_TOKEN` env vars when a PAT is present in the `Authorization` header (currently only done when `spaceRefs` are present).
- The cloned repo at `~/work/{username}/{repo}` already has the PAT embedded in its remote URL from initial `git clone`, so `git push` works without re-authenticating.
- The `spec-writer` agent receives the tech-docs output as `context` in the system prompt and the `repoPath` + `repoFullName` in the user prompt.
- The `issue-creator` agent receives the tech-docs output as `context` and the `repoFullName` in the user prompt; uses `gh issue create` with `GH_TOKEN`.

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| `@github/copilot-sdk` | Internal | Used by both new action agents via existing `/api/agent/run` route |
| `gh` CLI | External | Must be installed on the backend host; used by `issue-creator` agent |
| GitHub PAT (user-provided) | External | Needs `repo` + `issues` scopes |
| Existing `/api/agent/run` SSE route | Internal | Reused without modification to the streaming protocol |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `gh` CLI not installed on backend host | Med | High | Agent falls back to `curl` GitHub REST API calls; document requirement |
| PAT lacks `issues` write scope | Med | Med | Agent surfaces a clear error message in the stream; user is informed |
| Branch already exists on remote | Low | Low | Agent uses `git checkout -b` with a timestamp suffix if branch exists |
| Tech-docs output format varies, causing poor parsing | Med | Med | Agent prompt is strongly structured; worst case it creates a single spec.md with all content |
| Modal streaming breaks on slow connections | Low | Low | Same SSE reader as existing chat — already battle-tested |

## Success Metrics

- Metric 1: Users can go from a Technical Docs agent response to a pushed branch with spec files in under 60 seconds.
- Metric 2: Users can go from a Technical Docs agent response to a set of GitHub issues in under 60 seconds.
- Metric 3: Both action buttons are visible and functional in the technical-docs agent UI with zero regressions to the existing agent chain.

## Open Questions

- [ ] Should the `spec-writer` push directly to the default branch, or always to a new branch? (Current plan: always a new branch)
- [ ] Should the `issue-creator` add labels (e.g. `spec`, `generated`) to created issues? If so, should it create the labels if they don't exist?
- [ ] Should the `ActionPanel` have a "Copy output" button to let users grab the raw text?

## User Stories

| Story | File |
|---|---|
| View action buttons after Technical Docs response | [stories/view-action-buttons.md](stories/view-action-buttons.md) |
| Stream action progress in modal panel | [stories/stream-action-progress.md](stories/stream-action-progress.md) |
| Create spec branch and files on repo | [stories/create-spec-branch-and-files.md](stories/create-spec-branch-and-files.md) |
| Create GitHub issues from spec | [stories/create-github-issues.md](stories/create-github-issues.md) |
| Pass PAT to action agents | [stories/pass-pat-to-action-agents.md](stories/pass-pat-to-action-agents.md) |
