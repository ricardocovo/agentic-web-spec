# User Story: Clear chat and context on repo switch

## Summary

**As a** multi-repo developer,
**I want** all chat sessions, activity logs, and agent handoff context automatically cleared when I switch repositories,
**So that** I start with a clean slate and don't see confusing or irrelevant information from the previous repository.

## Description

When users switch between repositories in Web-Spec, they should see a completely fresh UI state. This means clearing all persistent storage (localStorage) and session-scoped storage (sessionStorage) that relates to the previous repository's chat sessions, activity logs, and any in-progress agent handoffs. This prevents context bleeding between repositories and ensures agents don't accidentally reference or display information from a different codebase.

The clearing should happen synchronously in the frontend immediately before the active repo is updated, ensuring there's no window where the new repo is active but old context is still visible.

## Acceptance Criteria

- [ ] Given I have chat sessions in localStorage, when I select a different repository, then all sessions under `web_spec_sessions` are cleared before the new repo becomes active
- [ ] Given I have activity log entries in localStorage, when I select a different repository, then all entries under `web_spec_activity` are cleared before the new repo becomes active
- [ ] Given I have agent handoff data in sessionStorage, when I select a different repository, then all keys prefixed with `web_spec_handoff_` are cleared before the new repo becomes active
- [ ] Given I switch to a new repository, when the UI re-renders, then no chat sessions or activity from the previous repository are displayed
- [ ] Given the storage is already empty, when I select a repository, then the clearing operations execute without errors
- [ ] Given I switch repositories rapidly, when each switch completes, then the clearing operations have executed for each switch without race conditions

## Tasks

- [ ] Create `clearAllSessions()` helper function in `frontend/lib/storage.ts` that removes the `web_spec_sessions` key from localStorage
- [ ] Create `clearAllActivity()` helper function in `frontend/lib/storage.ts` that removes the `web_spec_activity` key from localStorage
- [ ] Create `clearAllAgentHandoffs()` helper function in `frontend/lib/storage.ts` that iterates through all sessionStorage keys and removes those with prefix `web_spec_handoff_`
- [ ] Create `clearAllRepoContext()` orchestrator function in `frontend/lib/storage.ts` that calls all three clear functions
- [ ] Export the new clearing functions from `frontend/lib/storage.ts`
- [ ] Import `clearAllRepoContext()` in `frontend/components/RepoSelectorModal.tsx`
- [ ] Call `clearAllRepoContext()` in the `handleSelect()` function before calling `setActiveRepo()`
- [ ] Ensure the clearing happens synchronously to avoid race conditions with the UI update
- [ ] Test that the UI shows no sessions/activity after switching repositories
- [ ] Test that clearing works correctly when storage is already empty

## Dependencies

> List any other stories, services, or preconditions that must be in place before this story can start or complete.

- None (this is a self-contained frontend change)

## Out of Scope

> Anything explicitly excluded from this story to keep it focused.

- Implementing "undo" or recovery of cleared sessions
- Adding user confirmation dialogs before clearing
- Preserving any cross-repository state
- Backend changes (handled in separate story)
- Displaying notifications or toast messages when clearing occurs

## Notes

> Any additional context, references, or design decisions relevant to this story.

- **Why synchronous?** We use direct localStorage/sessionStorage APIs which are synchronous, so there's no async complexity
- **sessionStorage iteration**: Use `Object.keys(sessionStorage)` or `sessionStorage.length` with `sessionStorage.key(i)` to iterate, then check prefix with `startsWith('web_spec_handoff_')`
- **Error handling**: Since storage APIs rarely fail, we can implement without try-catch, but consider adding it for defensive programming
- **Testing approach**: Manual testing in browser DevTools (Application tab → Storage) to verify keys are removed; consider adding integration tests later
- **Related files**:
  - `frontend/lib/storage.ts` — already has helpers for reading/writing sessions and activity
  - `frontend/components/RepoSelectorModal.tsx` — lines around `handleSelect()` and `setActiveRepo()` call
  - `frontend/lib/context.tsx` — defines `setActiveRepo()` but no changes needed there
