# User Story: Add Create PRD on Repo Action Button

## Summary

**As a** Product Manager,
**I want** a "Create PRD on Repo" button on the PRD agent page,
**So that** I can persist the generated PRD to the repository with a single click and get a pull request for team review.

## Description

> Extend the `agentActions` conditional in `frontend/app/agents/[slug]/page.tsx` to include an action for `slug === "prd"`. Add a `handleCreatePRD()` function (mirroring the existing `handleCreateSpecs()`) that sets the `actionPanel` state with `agentSlug: "prd-writer"`. The existing `ActionPanel` component handles the rest — streaming the agent's progress and displaying the result. No changes to `ActionPanel`, `ChatInterface`, or `agents.ts` are needed.

## Acceptance Criteria

- [ ] Given a user is on the PRD agent page (`/agents/prd`), when the agent has produced at least one assistant response, then a "Create PRD on Repo" action button is visible.
- [ ] Given the user clicks "Create PRD on Repo", when the ActionPanel opens, then it runs the `prd-writer` agent with the prompt containing the repository path and repository name.
- [ ] Given the ActionPanel is running, when the `prd-writer` agent streams progress, then the existing progress hints display steps (Creating branch, Writing PRD file, Committing, Pushing, Opening PR).
- [ ] Given the `prd-writer` agent completes, when the PR is created, then the ActionPanel shows the success state with the PR URL.
- [ ] Given the user is on any agent page other than `prd` or `technical-docs`, when the page renders, then no action buttons are shown (agentActions is undefined).
- [ ] Given the existing "Create Docs on Repo" button on the Technical Docs page, when the PRD page button is added, then the Technical Docs page actions remain unchanged.

## Tasks

- [ ] Add `handleCreatePRD()` function in `frontend/app/agents/[slug]/page.tsx`, modeled on `handleCreateSpecs()`, setting `actionPanel` with `title: "Create PRD on Repo"`, `agentSlug: "prd-writer"`, and a prompt including `activeRepo.localPath` and `activeRepo.fullName`
- [ ] Extend the `agentActions` conditional to handle `slug === "prd"` with a single action: `{ label: "Create PRD on Repo", description: "Create a branch with the PRD document in the repo", icon: GitPullRequest, onClick: handleCreatePRD }`
- [ ] Refactor the `agentActions` ternary from `slug === "technical-docs" ? [...] : undefined` to handle both `slug === "prd"` and `slug === "technical-docs"` cases (e.g. using a variable assignment or a function)
- [ ] Verify that the `GitPullRequest` icon import from `lucide-react` is already present (it is — used by the Technical Docs actions)

## Dependencies

> List any other stories, services, or preconditions that must be in place before this story can start or complete.

- Depends on: **Create PRD Writer Backend Agent** — the `prd-writer` agent YAML must exist for the action to succeed at runtime
- Depends on: **Register PRD Writer in Agent File Map** — the `prd-writer` slug must be registered for the API to resolve it

## Out of Scope

> Anything explicitly excluded from this story to keep it focused.

- Adding the `prd-writer` agent to the `AGENTS` array in `agents.ts` (it is an action-only agent, not a pipeline agent)
- Modifying the `ActionPanel` component (it works generically with any agent slug)
- Adding a "Create GitHub Issues" action to the PRD page (listed as an open question in the spec)
- Adding new progress hint patterns to `ActionPanel.tsx` (existing patterns already cover all steps)

## Notes

> Any additional context, references, or design decisions relevant to this story.

- The `handleCreatePRD()` function follows the exact same pattern as `handleCreateSpecs()`: check for `activeRepo` and `sessionRef.current`, find the last non-handoff assistant message, then call `setActionPanel()` with the agent config
- The prompt format should be: `"Create PRD document in the repository.\n\nRepository path: ${activeRepo.localPath}\nRepository: ${activeRepo.fullName}"`
- The `agentActions` conditional currently uses a simple ternary (`slug === "technical-docs" ? [...] : undefined`). With two cases, it should be refactored to something like:
  ```ts
  const agentActions: AgentAction[] | undefined =
    agent.slug === "prd"
      ? [{ label: "Create PRD on Repo", ... }]
      : agent.slug === "technical-docs"
      ? [{ label: "Create Docs on Repo", ... }, { label: "Create GitHub Issues", ... }]
      : undefined;
  ```
- The `GitPullRequest` icon is already imported at the top of the file — no new imports are needed
- The `ActionPanel` progress hints in `ActionPanel.tsx` already match patterns like `mkdir`, `git checkout -b`, `git push`, `gh pr create` — these will work for the prd-writer agent's bash commands without any changes
