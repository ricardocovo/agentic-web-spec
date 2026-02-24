# User Story: Edit Agent Tools

## Summary

**As a** developer or power user,
**I want** to enable or disable individual tools for an agent via checkboxes,
**So that** I can control which capabilities an agent has access to without editing YAML directly.

## Description

The editor panel includes a "Tools" section that renders one checkbox per known tool. The known tools are the union of all tools currently used across agent YAML files: `grep`, `glob`, `view`, and `bash`. Each checkbox is checked if the tool is currently present in the agent's `tools` array, and unchecked otherwise. Toggling checkboxes updates the local form state and marks the form dirty.

## Acceptance Criteria

- [ ] Given an agent is selected, when the editor panel renders the Tools section, then exactly four checkboxes are shown: `grep`, `glob`, `view`, `bash`.
- [ ] Given an agent's YAML includes a tool (e.g., `bash`), when the Tools section renders, then the checkbox for that tool is pre-checked.
- [ ] Given an agent's YAML does not include a tool (e.g., `prd.agent.yaml` does not include `bash`), when the Tools section renders, then the checkbox for that tool is unchecked.
- [ ] Given the user toggles a checkbox, when the checked state changes from the originally loaded value, then the form is marked as dirty.
- [ ] Given the user unchecks all tool checkboxes, when the form is saved, then the backend stores an empty `tools: []` array in the YAML file.
- [ ] Given a different agent is selected from the sidebar, when the editor panel re-renders, then all checkboxes reset to that agent's `tools` values.

## Tasks

- [ ] Define the `AVAILABLE_TOOLS` constant as `["grep", "glob", "view", "bash"]` in the admin page component
- [ ] Add `selectedTools` (a `Set<string>` or `string[]`) to the editor form state using `useState`
- [ ] Render the Tools section with a labelled checkbox group, one `<input type="checkbox">` per tool in `AVAILABLE_TOOLS`
- [ ] Associate each checkbox label with its input via `htmlFor`/`id`
- [ ] Pre-check each checkbox based on whether its tool name is present in the loaded agent's `tools` array
- [ ] Handle checkbox toggle: add/remove tool from `selectedTools` state
- [ ] Include `selectedTools` in the `isDirty` comparison
- [ ] Reset `selectedTools` when a new agent is selected
- [ ] Style the checkbox group using dark-theme Tailwind tokens; ensure sufficient spacing between items for easy clicking

## Dependencies

> Depends on: View Agent List story (editor panel and agent selection must exist)
> Depends on: Edit Agent Metadata story (shared `isDirty` and form state pattern)

## Out of Scope

- Dynamically discovering available tools from the backend (tools list is hard-coded on the frontend)
- Tool descriptions or documentation tooltips (labels are tool name strings only)
- Ordering/prioritizing tools

## Notes

- The four known tools (`grep`, `glob`, `view`, `bash`) cover the full set found across all three current agent YAML files. Adding a new tool in the future only requires updating `AVAILABLE_TOOLS`.
- Checkboxes should be laid out in a horizontal flex-wrap or 2-column grid to make efficient use of space.
