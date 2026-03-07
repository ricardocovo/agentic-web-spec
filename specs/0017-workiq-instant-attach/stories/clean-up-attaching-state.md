# User Story: Clean Up Attaching State and UI Guards

## Summary

**As a** spec author,
**I want** the WorkIQ modal to have no unnecessary disabled states during attach,
**So that** the UI feels responsive and the code is simpler to maintain.

## Description

The `attaching` boolean state was introduced to disable inputs and prevent closing while detail requests were in flight. Since detail fetching is removed, this state and all its UI effects are dead code and should be cleaned up.

## Acceptance Criteria

- [ ] Given the `attaching` state variable is removed, when the codebase is searched for `attaching`, then no references exist in `WorkIQModal.tsx`.
- [ ] Given the user is in the WorkIQ modal, when they press Escape or click the backdrop, then the modal closes without any `attaching` guard check.
- [ ] Given the user clicks "Attach", then the footer button always shows "Attach N item(s)" (never "Fetching details…").
- [ ] Given the changes are complete, when `npx tsc --noEmit` is run in the frontend workspace, then there are no type errors.

## Tasks

- [ ] Remove the `attaching` state declaration (`useState(false)`)
- [ ] Remove `disabled={attaching}` from the search input, close button, result item buttons, and attach button
- [ ] Remove the `!attaching` guard from the Escape key handler and backdrop click handler
- [ ] Remove the conditional "Fetching details…" / spinner rendering from the footer button
- [ ] Simplify the footer button to always render "Attach N item(s)"
- [ ] Run `npx tsc --noEmit` in `frontend/` to confirm no type errors

## Dependencies

- Depends on: [Remove detail fetching from attach](remove-detail-fetch.md) (the `attaching` state becomes unused only after detail fetching is removed)

## Out of Scope

- Refactoring other state variables (e.g., `loading`, `error`)
- Visual redesign of the modal

## Notes

- Both stories can be implemented in a single pass since they affect the same file, but logically they are separate concerns (behavior change vs. dead-code cleanup).
