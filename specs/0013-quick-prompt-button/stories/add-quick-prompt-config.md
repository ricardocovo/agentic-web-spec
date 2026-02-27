# User Story: Add quickPrompt Field to AgentConfig

## Summary

**As a** developer maintaining the agent configuration,
**I want** an optional `quickPrompt` field on the `AgentConfig` interface,
**So that** any agent can declaratively specify a default prompt message without UI code changes.

## Description

Extend the `AgentConfig` TypeScript interface with an optional `quickPrompt?: string` property. Populate it for the `prd` and `technical-docs` agent entries with their respective default prompts. Agents that do not set this field remain unaffected.

## Acceptance Criteria

- [ ] Given the `AgentConfig` interface in `frontend/lib/agents.ts`, when inspected, then it includes an optional `quickPrompt?: string` field.
- [ ] Given the `prd` agent entry, when its config is read, then `quickPrompt` equals `"Create a PRD based on the current context"`.
- [ ] Given the `technical-docs` agent entry, when its config is read, then `quickPrompt` equals `"Create Technical Specs based on the current context"`.
- [ ] Given the `deep-research` agent entry, when its config is read, then `quickPrompt` is `undefined`.
- [ ] Given the project is type-checked with `npx tsc --noEmit`, when run, then no type errors are introduced.

## Tasks

- [ ] Add `quickPrompt?: string` to the `AgentConfig` interface in `frontend/lib/agents.ts`.
- [ ] Set `quickPrompt: "Create a PRD based on the current context"` on the `prd` agent entry.
- [ ] Set `quickPrompt: "Create Technical Specs based on the current context"` on the `technical-docs` agent entry.

## Dependencies

- None — this is a standalone config change.

## Out of Scope

- Rendering any UI element — that is handled by the next story.
- Adding `quickPrompt` to agents other than `prd` and `technical-docs`.

## Notes

- The field is intentionally optional so existing and future agents are not forced to provide a value.
