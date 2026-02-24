# User Story: Edit Agent Metadata

## Summary

**As a** developer or power user,
**I want** to edit an agent's `displayName`, `description`, and `model` via form inputs in the editor panel,
**So that** I can update how the agent is labelled and which model it uses without touching YAML files directly.

## Description

When an agent is selected in the sidebar, the right-hand editor panel populates with the agent's current YAML fields. The metadata section of the editor contains three controlled form inputs: a text input for `displayName`, a text input for `description`, and a text input for `model`. Each input is pre-filled with the current value read from the YAML file. Changes to these fields mark the form as "dirty" (unsaved changes), enabling the Save button and triggering an unsaved-changes guard if the user tries to switch agents.

## Acceptance Criteria

- [ ] Given an agent is selected, when the editor panel renders, then the `displayName` input is pre-filled with the agent's current `displayName` value.
- [ ] Given an agent is selected, when the editor panel renders, then the `description` input is pre-filled with the agent's current `description` value.
- [ ] Given an agent is selected, when the editor panel renders, then the `model` input is pre-filled with the agent's current `model` value.
- [ ] Given the user changes any metadata field, when the input value differs from the originally loaded value, then the form is marked as dirty and the Save button becomes active.
- [ ] Given the form is dirty, when the user clicks a different agent in the sidebar, then a browser `confirm()` dialog warns that unsaved changes will be lost.
- [ ] Given a metadata field is empty and the user submits, when the backend returns a 400 validation error, then the error message is displayed in the editor panel.
- [ ] Given a different agent is selected from the sidebar, when the editor panel re-renders, then all metadata inputs reset to that agent's values (previous edits are discarded).

## Tasks

- [ ] Add `displayName`, `description`, and `model` fields to the editor panel form state using `useState`
- [ ] Render a labelled `<input type="text">` for `displayName` with `htmlFor`/`id` association
- [ ] Render a labelled `<input type="text">` for `description` with `htmlFor`/`id` association
- [ ] Render a labelled `<input type="text">` for `model` with `htmlFor`/`id` association
- [ ] Implement `isDirty` derived state that compares current form values against the last-loaded agent data
- [ ] Wire unsaved-changes guard: when `isDirty` is true and user clicks another sidebar item, show `window.confirm()` before switching
- [ ] Reset all form fields when a new agent is selected from the sidebar
- [ ] Style inputs using Tailwind dark-theme tokens consistent with the rest of the app

## Dependencies

> Depends on: View Agent List story (editor panel and agent selection must exist)
> Depends on: Backend Admin API story (GET /api/admin/agents/:slug to load individual agent data)

## Out of Scope

- Validating that `model` is a value from a known list (free-text input only)
- Inline field-level validation messages (only a global error from the API is shown)
- Rich text or markdown rendering for the `description` field

## Notes

- The `name` YAML field (the internal machine name) is displayed as read-only context in the editor header but is never editable.
- Consider grouping `displayName`, `description`, and `model` under a "Metadata" section heading in the editor layout.
