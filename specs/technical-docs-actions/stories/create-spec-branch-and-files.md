# User Story: Create Spec Branch and Files on Repo

## Summary

**As a** developer,
**I want** the app to create a new branch with structured spec files in my repo,
**So that** the generated technical documentation is version-controlled and reviewable as a pull request.

## Description

When the user clicks "Create Docs on Repo", a backend agent (`spec-writer`) receives the Technical Docs agent output as context and the repo path + fullName as part of the prompt. The agent derives a feature slug from the spec title, creates a new git branch (`specs/{feature-slug}`), writes `specs/{feature-slug}/spec.md` and one `specs/{feature-slug}/{story-slug}.md` per identified user story, then commits and pushes the branch to the remote.

## Acceptance Criteria

- [ ] Given the action is triggered, when the spec-writer agent runs, then a new branch `specs/{feature-slug}` is created in the cloned repo.
- [ ] Given the branch is created, when the agent writes files, then `specs/{feature-slug}/spec.md` contains the main specification and one `.md` file exists per user story under `specs/{feature-slug}/`.
- [ ] Given the files are committed, when the agent pushes, then the branch appears on the GitHub remote.
- [ ] Given a branch with the same name already exists on the remote, when the agent attempts to push, then it uses a unique suffix (e.g. timestamp) to avoid collision.
- [ ] Given the agent completes successfully, when the output is streamed to the frontend, then the last message includes the branch name and a link to the GitHub compare URL.

## Tasks

- [ ] Create `backend/agents/spec-writer.agent.yaml` with `bash` tool only
- [ ] Write agent prompt: derive `{feature-slug}` from spec title, `cd {repoPath}`, create branch, create spec files, git add/commit/push
- [ ] Register `spec-writer` slug in `AGENT_FILE_MAP` in `backend/src/routes/agent.ts`
- [ ] Ensure prompt instructs agent to handle branch name collision with a timestamp suffix
- [ ] Ensure prompt instructs agent to create parent directory (`mkdir -p specs/{slug}`) before writing files
- [ ] Ensure prompt instructs agent to output a GitHub compare URL at the end: `https://github.com/{repoFullName}/compare/specs/{slug}`
- [ ] Update `handleCreateSpecs` in `page.tsx` to build the auto-prompt with `activeRepo.localPath` and `activeRepo.fullName`

## Dependencies

- Depends on: `pass-pat-to-action-agents` (git push requires credentials embedded in remote URL from initial clone)
- Depends on: `stream-action-progress` (ActionPanel must exist to display output)

## Out of Scope

- Opening a pull request automatically (user opens PR manually from the compare URL)
- Editing spec content before committing
- Support for repos not cloned via the app's `/api/repos/clone` route

## Notes

- The cloned repo remote URL already contains the PAT from the initial clone (`https://user:pat@github.com/...`), so no additional git credential setup is needed for `git push`
- The agent prompt should use the technical-docs output (passed as `context`) to extract the feature name, architecture overview, and task list for structuring the files
- Branch name pattern: `specs/{kebab-case-feature-name}` — e.g. `specs/user-authentication-flow`
