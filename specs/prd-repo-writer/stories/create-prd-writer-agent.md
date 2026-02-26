# User Story: Create PRD Writer Backend Agent

## Summary

**As a** Product Manager,
**I want** a backend agent that takes PRD content and writes it to the repository as a Markdown file on a new branch with a pull request,
**So that** my PRD is version-controlled and reviewable by the team without manual file creation.

## Description

> Create a new agent configuration file `backend/agents/prd-writer.agent.yaml` that mirrors the existing `spec-writer.agent.yaml` pattern. The agent receives PRD content as context, derives a feature slug from the PRD title, creates a `prd/{feature-slug}` branch, writes a single file to `docs/prd/{feature-slug}.md`, commits, pushes, and opens a PR using the `gh` CLI. Unlike the spec-writer (which creates a directory with `spec.md` and multiple story files), the prd-writer produces a single flat Markdown file.

## Acceptance Criteria

- [ ] Given the file `backend/agents/prd-writer.agent.yaml` exists, when the backend loads agent configs, then it can resolve and parse the `prd-writer` agent definition.
- [ ] Given PRD content is provided as context, when the agent runs, then it derives a kebab-case `{feature-slug}` from the PRD title (e.g. "User Authentication Flow" → `user-authentication-flow`).
- [ ] Given the agent runs in a repository, when it creates a branch, then the branch is named `prd/{feature-slug}` (or `prd/{feature-slug}-{timestamp}` if the branch already exists).
- [ ] Given the agent runs, when it writes the PRD file, then the file is located at `docs/prd/{feature-slug}.md` with clean Markdown formatting.
- [ ] Given the agent has written the file, when it commits and pushes, then the commit message is `Add PRD: {feature title}` and the branch is pushed to origin.
- [ ] Given the branch is pushed, when the agent creates a PR, then the PR has a descriptive title and body including a summary and a "Files included" section listing the created file.
- [ ] Given any step fails (e.g. git push error), when the agent encounters the failure, then it reports the error clearly in its output.

## Tasks

- [ ] Create `backend/agents/prd-writer.agent.yaml` with `name: prd-writer`, `displayName: PRD Writer`, `model: gpt-4.1`, `tools: [bash]`
- [ ] Write the agent prompt with step-by-step instructions: read context, derive feature-slug, checkout default branch, pull latest, create `prd/{feature-slug}` branch (with timestamp fallback), `mkdir -p docs/prd`, write `docs/prd/{feature-slug}.md`, `git add`, `git commit`, `git push origin HEAD`, `gh pr create` with descriptive body
- [ ] Include instruction that the PRD is a single file (not a directory with sub-files like spec-writer)
- [ ] Include notes about embedded git credentials and `GH_TOKEN` env var (matching spec-writer pattern)
- [ ] Verify the YAML file parses correctly by reviewing against the spec-writer YAML structure

## Dependencies

> List any other stories, services, or preconditions that must be in place before this story can start or complete.

- Depends on: None — this story can be implemented independently
- Reference: `backend/agents/spec-writer.agent.yaml` as the structural template

## Out of Scope

> Anything explicitly excluded from this story to keep it focused.

- Registering the agent in `agentFileMap.ts` (covered in a separate story)
- Frontend UI changes (covered in a separate story)
- Modifying the PRD agent itself or its output format
- Supporting multiple output files or directory structures

## Notes

> Any additional context, references, or design decisions relevant to this story.

- The `spec-writer.agent.yaml` prompt is ~40 lines — the prd-writer prompt will be shorter since it writes a single file instead of parsing the spec into multiple story files
- The agent should use `mkdir -p docs/prd` to ensure the output directory exists, as most repos won't have it pre-created
- Branch naming uses `prd/` prefix (not `prds/` or `docs/prd/`) for consistency and brevity
- The PR body should include a brief summary of the PRD content and list the single file created, following the spec-writer's PR body pattern
