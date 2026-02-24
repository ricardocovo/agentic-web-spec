# User Story: Clean Up Legacy Single-Space Code

## Summary

**As a** maintainer of the codebase,
**I want** the old single-space `localStorage` mechanism removed,
**So that** there is one clear path for space selection and no dead code.

## Description

With the multi-select SpaceSelector now handling space selection in the chat UI, the old `web_spec_selected_space` localStorage key and any related single-select logic should be removed. This is a cleanup story to ensure the codebase has no orphaned code paths.

## Acceptance Criteria

- [ ] Given the codebase, when searching for `web_spec_selected_space`, then zero results are found.
- [ ] Given the KDB page, when a user views it, then there is no "select" button or single-space selection mechanism that writes to `localStorage`.
- [ ] Given the agent page, when `handleSend` runs, then it does not read from `localStorage` for space selection.
- [ ] Given the application runs, when no spaces are selected in the SpaceSelector, then no space-related parameters are sent to the backend (clean default).

## Tasks

- [ ] Search the codebase for all references to `web_spec_selected_space` and remove them
- [ ] Verify the KDB page (`frontend/app/kdb/page.tsx`) does not have select/deselect buttons that write to `localStorage` (if it does, remove them)
- [ ] Verify no other components read `web_spec_selected_space` from `localStorage`
- [ ] Run the frontend build to confirm no dead imports or references remain
- [ ] Smoke test: verify agent chat works correctly with zero spaces selected and with spaces selected

## Dependencies

- Depends on: `update-agent-page-send` (the new multi-select path must be fully wired before removing the old one)

## Out of Scope

- Modifying the KDB page layout or functionality beyond removing single-select
- Adding deprecation warnings or migration logic (this is a clean removal)

## Notes

- Currently the only reference to `web_spec_selected_space` is in `frontend/app/agents/[slug]/page.tsx` at line 126. If the KDB page also has a selection mechanism, it should be identified and removed.
- This story should be the last one implemented to avoid breaking the current (hidden) space functionality before the new multi-select is fully operational.
