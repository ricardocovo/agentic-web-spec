# User Story: Edit Agent Prompt

## Summary

**As a** developer or power user,
**I want** to edit an agent's system prompt via a large textarea in the editor panel,
**So that** I can iterate on agent instructions quickly without opening YAML files in a text editor.

## Description

The editor panel includes a clearly labelled textarea for the agent's `prompt` field. The textarea is pre-filled with the full current prompt string from the YAML file. Because prompts can be long (multiple paragraphs with template variables like `{{cwd}}`), the textarea should be comfortable to read and edit — tall, monospace font, and scrollable. Editing the prompt marks the form as dirty in the same way as the metadata fields.

## Acceptance Criteria

- [ ] Given an agent is selected, when the editor panel renders, then the `prompt` textarea is pre-filled with the agent's full current `prompt` value (including newlines).
- [ ] Given the user edits the prompt textarea, when the value changes from the originally loaded value, then the form is marked as dirty and the Save button becomes active.
- [ ] Given the form is dirty due to prompt changes, when the user selects a different agent in the sidebar, then the unsaved-changes `confirm()` dialog is shown.
- [ ] Given a different agent is selected from the sidebar, when the editor panel re-renders, then the textarea resets to the new agent's prompt (previous edits are discarded).
- [ ] Given the user is editing the prompt, when scrolling within the textarea, then scrolling is contained within the textarea (does not scroll the page).

## Tasks

- [ ] Add `prompt` field to the editor panel form state using `useState`
- [ ] Render a labelled `<textarea>` for `prompt` with `htmlFor`/`id` association
- [ ] Set a minimum height of 12 rows on the textarea via Tailwind or inline style
- [ ] Apply `font-mono` Tailwind class to the textarea for monospace rendering
- [ ] Ensure `overflow-y: auto` on the textarea so long prompts scroll within it
- [ ] Include the prompt value in the `isDirty` comparison alongside metadata fields
- [ ] Reset the textarea value when a new agent is selected
- [ ] Style the textarea using dark-theme Tailwind tokens (`bg-surface`, `border-border`, `text-text-primary`)

## Dependencies

> Depends on: View Agent List story (editor panel and agent selection must exist)
> Depends on: Edit Agent Metadata story (shared `isDirty` and form state pattern)

## Out of Scope

- Syntax highlighting for the prompt textarea
- Template variable (e.g., `{{cwd}}`) validation or auto-completion
- Diff view comparing current prompt to saved state

## Notes

- Prompts use `{{cwd}}` as a template variable. The editor should not process or escape these — they are stored and displayed as-is.
- Place the Prompt section below the Metadata and Tools sections in the editor layout, as it is the longest field.
- Consider a section heading "System Prompt" above the textarea for clarity.
