# User Story: Switch All Agents to o4-mini

## Summary

**As a** developer running the agent pipeline,
**I want** all three agents to use the `o4-mini` reasoning model,
**So that** the agents produce native `assistant.reasoning_delta` tokens that can be captured and displayed.

## Description

> All three agent YAML configuration files currently specify `model: gpt-4.1`. This story updates each file to `model: o4-mini`. No other fields in the YAML files change. This is a prerequisite for all other stories in this feature since `gpt-4.1` does not emit reasoning events.

## Acceptance Criteria

- [ ] Given `backend/agents/deep-research.agent.yaml` exists, when the file is read, then `model: o4-mini` is present.
- [ ] Given `backend/agents/prd.agent.yaml` exists, when the file is read, then `model: o4-mini` is present.
- [ ] Given `backend/agents/technical-docs.agent.yaml` exists, when the file is read, then `model: o4-mini` is present.
- [ ] Given the backend starts an agent session, when the YAML config is loaded, then the model passed to `CopilotClient` is `o4-mini`.

## Tasks

- [ ] Update `model` field in `backend/agents/deep-research.agent.yaml` from `gpt-4.1` to `o4-mini`
- [ ] Update `model` field in `backend/agents/prd.agent.yaml` from `gpt-4.1` to `o4-mini`
- [ ] Update `model` field in `backend/agents/technical-docs.agent.yaml` from `gpt-4.1` to `o4-mini`

## Dependencies

> No dependencies — this story has no prerequisites.

- None

## Out of Scope

- Changing any other YAML fields (prompt, tools, name, displayName)
- Adding model validation or fallback logic in the backend
- Updating the agent model displayed in the frontend agent cards or README table

## Notes

- `o4-mini` does not support a `temperature` parameter; do not add one.
- The backend's fallback `model ?? "gpt-4.1"` in `agent.ts` does not need to change — the YAML values will now always be `o4-mini`.
