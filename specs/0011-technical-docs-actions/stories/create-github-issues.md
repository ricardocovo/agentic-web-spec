# User Story: Create GitHub Issues from Spec

## Summary

**As an** engineering manager or tech lead,
**I want** the app to create GitHub issues and sub-issues from the generated spec,
**So that** the implementation work is immediately tracked in the project's issue backlog.

## Description

When the user clicks "Create GitHub Issues", a backend agent (`issue-creator`) receives the Technical Docs output as context and the repo `fullName` as part of the prompt. The agent parses the spec to identify feature groups and user stories, then uses `gh issue create` (authenticated via `GH_TOKEN`) to create one parent issue per feature/task group and one sub-issue per user story or implementation task, linking sub-issues to their parent.

## Acceptance Criteria

- [ ] Given the action is triggered, when the issue-creator agent runs, then at least one GitHub issue is created on the target repo.
- [ ] Given the spec contains multiple feature groups or task sections, when the agent runs, then one parent issue is created per group.
- [ ] Given a parent issue is created, when user stories or tasks are identified under it, then sub-issues are created and reference the parent issue number in their body.
- [ ] Given `GH_TOKEN` is set in the agent environment, when `gh issue create` runs, then no interactive authentication prompt appears.
- [ ] Given all issues are created, when the output is streamed to the frontend, then the final message lists each created issue with its number and URL.
- [ ] Given the PAT lacks `issues` write scope, when the agent tries to create issues, then the error is surfaced clearly in the stream.

## Tasks

- [ ] Create `backend/agents/issue-creator.agent.yaml` with `bash` tool only
- [ ] Write agent prompt: parse tech-docs output (from context), identify parent features and child stories/tasks, run `gh issue create` for each, output issue URLs
- [ ] Register `issue-creator` slug in `AGENT_FILE_MAP` in `backend/src/routes/agent.ts`
- [ ] Ensure prompt instructs agent to set `REPO` variable from injected `repoFullName` and use `gh issue create --repo $REPO`
- [ ] Ensure prompt instructs agent to link sub-issues to parent using `gh issue comment` or sub-issue body reference (`Part of #N`)
- [ ] Ensure prompt instructs agent to handle `gh` auth errors gracefully and output a helpful message
- [ ] Update `handleCreateIssues` in `page.tsx` to build auto-prompt with `activeRepo.fullName`

## Dependencies

- Depends on: `pass-pat-to-action-agents` (`GH_TOKEN` env var must be set for `gh` CLI to work without interactive login)
- Depends on: `stream-action-progress` (ActionPanel must exist to display output)

## Out of Scope

- Creating GitHub Projects or milestones
- Adding custom labels or assignees (v1 creates plain issues)
- Deduplication — running the action twice will create duplicate issues

## Notes

- `gh issue create` syntax: `gh issue create --repo owner/repo --title "..." --body "..." `
- Sub-issue linking: add `Part of #<parent-issue-number>` to the sub-issue body; GitHub renders this as a relationship in the UI
- The agent should output a summary table at the end: `| Issue | URL |` listing all created issues
- If `gh` CLI is not installed, the agent should fall back to `curl` calls against the GitHub REST API using the `GH_TOKEN` env var
