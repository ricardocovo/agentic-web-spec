# User Story: Register PRD Writer in Agent File Map

## Summary

**As a** Developer,
**I want** the `prd-writer` agent slug registered in the backend agent file map,
**So that** the `/api/agent/run` endpoint can resolve and load the `prd-writer` agent configuration when triggered from the frontend.

## Description

> Add a new entry `"prd-writer": "prd-writer.agent.yaml"` to the `AGENT_FILE_MAP` object in `backend/src/lib/agentFileMap.ts`. This is a one-line change that follows the exact pattern of the existing entries (`spec-writer`, `issue-creator`, etc.). Without this registration, the backend API will return a 404/error when the frontend attempts to run the `prd-writer` agent.

## Acceptance Criteria

- [ ] Given the `AGENT_FILE_MAP` in `backend/src/lib/agentFileMap.ts`, when inspected, then it contains the entry `"prd-writer": "prd-writer.agent.yaml"`.
- [ ] Given a request to `/api/agent/run` with `agentSlug: "prd-writer"`, when the backend resolves the agent, then it successfully loads `backend/agents/prd-writer.agent.yaml`.
- [ ] Given the existing agent entries in the map, when the new entry is added, then no existing entries are modified or removed.

## Tasks

- [ ] Add `"prd-writer": "prd-writer.agent.yaml"` to the `AGENT_FILE_MAP` object in `backend/src/lib/agentFileMap.ts`
- [ ] Verify the entry is alphabetically or logically ordered alongside existing entries (place after `"prd"` entry for readability)

## Dependencies

> List any other stories, services, or preconditions that must be in place before this story can start or complete.

- Depends on: **Create PRD Writer Backend Agent** — the YAML file must exist for the mapping to be meaningful (though the map entry itself can be added first)

## Out of Scope

> Anything explicitly excluded from this story to keep it focused.

- Creating the YAML agent file (covered in a separate story)
- Adding the agent to the frontend `AGENTS` array in `agents.ts` — the `prd-writer` is an action agent, not a pipeline agent, so it does not appear in the agent list
- Any changes to the API route handler or agent loading logic

## Notes

> Any additional context, references, or design decisions relevant to this story.

- This is a minimal, low-risk change — a single line addition to a simple key-value map
- The `AGENT_FILE_MAP` currently has 5 entries: `deep-research`, `prd`, `technical-docs`, `spec-writer`, `issue-creator`
- The `prd-writer` entry should be placed logically near `spec-writer` and `issue-creator` since they are all action agents (not pipeline agents)
- No TypeScript type changes are needed — the map is typed as `Record<string, string>`
