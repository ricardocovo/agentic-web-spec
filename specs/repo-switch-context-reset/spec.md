# Feature: Repo Switch Context Reset

## Overview

When a user switches repositories in the Web-Spec app, the application will automatically clear all prior chat sessions, activity logs, and agent handoff context, and will ensure the locally cloned repository is synchronized with the latest remote changes. This ensures agents always work with a clean slate and up-to-date code when analyzing a new repository.

## Problem Statement

Currently, when users switch between repositories in Web-Spec:
1. Old chat sessions, activity logs, and agent handoff state persist in browser storage, leading to confusion and stale context when working with a different repository.
2. If a repository has been previously cloned, the backend immediately returns without checking for updates, meaning agents may analyze outdated code if the remote repository has changed since the last clone.

This creates a poor user experience where agents may generate specs based on stale code or where the UI shows irrelevant chat history from a different repository.

## Goals

- [ ] Automatically clear all chat sessions when switching repositories
- [ ] Automatically clear activity log when switching repositories
- [ ] Automatically clear agent handoff context (sessionStorage) when switching repositories
- [ ] Fetch and apply latest remote changes when re-selecting an already-cloned repository
- [ ] Maintain security by ensuring Personal Access Tokens (PATs) are never exposed in error messages
- [ ] Provide graceful error handling when git fetch/reset operations fail

## Non-Goals

- Implementing undo/recovery for cleared sessions or activity (users are switching repos intentionally)
- Preserving any state or history across repository switches
- Supporting selective clearing (e.g., keeping some sessions but not others)
- Implementing git conflict resolution or merge strategies (we use hard reset)
- Supporting repositories with multiple remotes or complex git configurations

## Target Users / Personas

| Persona | Description |
|---|---|
| Multi-Repo Developer | Developer who works across multiple GitHub repositories and uses Web-Spec to generate specs for different projects throughout the day |
| Team Lead / Architect | Technical lead who reviews multiple repositories in their organization and needs fresh, accurate specs for each |
| Open Source Contributor | Developer exploring various open source projects and using Web-Spec to understand codebases before contributing |

## Functional Requirements

1. The system shall clear all chat sessions from localStorage when a user selects a different repository
2. The system shall clear all activity log entries from localStorage when a user selects a different repository
3. The system shall clear all agent handoff context from sessionStorage when a user selects a different repository
4. The system shall execute `git fetch` followed by `git reset --hard` when the clone endpoint is called for an already-cloned repository
5. The system shall sanitize Personal Access Tokens from all error messages and logs related to git operations
6. The system shall return appropriate error responses if git fetch or reset operations fail
7. The system shall continue to perform shallow clone (`--depth 1`) for repositories not yet cloned locally
8. The system shall update the UI to reflect a clean state immediately after context clearing

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Context clearing must complete within 100ms to avoid perceptible delay when switching repos |
| Performance | Git fetch + reset operations should complete within 10 seconds for typical repositories |
| Security | Personal Access Tokens must never appear in error messages, logs, or API responses |
| Security | PAT sanitization must handle all error types (stdout, stderr, exception messages) |
| Reliability | Failed git operations must not leave the repository in an inconsistent state |
| Usability | Users should receive clear error messages if repository sync fails, without technical git jargon |

## UX / Design Considerations

- **Immediate feedback**: When a user selects a repository, the UI should show a loading state while the backend prepares the repository
- **Clean slate**: Once complete, the UI should display an empty chat interface with no previous sessions visible
- **Error communication**: If git operations fail, show a user-friendly error message like "Unable to sync repository. Please try again or contact support." rather than raw git error output
- **No confirmation dialog**: Since repo switching is an intentional action, don't ask users to confirm clearing context (it's expected behavior)
- **Key flow**: User opens repo selector → selects different repo → loading indicator appears → backend clones/syncs repo → frontend clears all context → UI updates with clean state → user can start fresh

## Technical Considerations

- **Storage architecture**: Web-Spec uses both localStorage (persistent) for sessions/activity and sessionStorage (tab-scoped) for agent handoffs
  - Sessions: `web_spec_sessions` key in localStorage
  - Activity: `web_spec_activity` key in localStorage  
  - Agent handoffs: Multiple keys in sessionStorage with prefix `web_spec_handoff_`
- **Git operations**: Backend uses Node.js `child_process` to execute git commands synchronously
  - Must handle both stdout and stderr from git commands
  - Error messages from git often include the full command with embedded credentials
- **PAT handling**: Personal Access Token is embedded in clone URL as `https://{pat}@github.com/{repoFullName}.git`
  - Must be stripped from error messages using string replacement or regex before returning to client
  - Consider creating a utility function for consistent PAT sanitization
- **Atomicity**: Context clearing on frontend should happen before `setActiveRepo()` to ensure clean state
- **Idempotency**: Clearing operations should be safe to call even if storage is already empty
- **Backward compatibility**: Clearing logic should handle both new and legacy storage key formats gracefully

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| Git CLI | External | Must be installed on backend server; already required for current clone functionality |
| GitHub API | External | Indirectly via git operations; requires valid PAT with repo read access |
| Browser localStorage API | External | Standard Web API, universally supported |
| Browser sessionStorage API | External | Standard Web API, universally supported |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| User loses unsaved work in chat when switching repos | Medium | Medium | Document expected behavior; consider adding a "Save session" feature in future (out of scope) |
| Git fetch fails due to network issues | Medium | High | Implement graceful error handling; allow user to retry; consider showing last successful sync timestamp |
| Git reset fails leaving repo in bad state | Low | High | Validate repo directory structure before reset; consider backup/recovery mechanism |
| PAT accidentally exposed in logs or errors | Medium | Critical | Implement comprehensive PAT sanitization utility; test with various error scenarios |
| Concurrent requests to clone endpoint cause race conditions | Low | Medium | Consider adding request locking or queue mechanism for same repo (future enhancement) |
| Large repositories take too long to fetch | Low | Medium | Continue using shallow clone (--depth 1); consider showing progress indicator; implement timeout |

## Success Metrics

- **Context clearing**: 100% of repo switches result in empty chat/activity UI
- **Code freshness**: Agents work with code matching remote HEAD on every repo switch
- **Security**: Zero incidents of PAT exposure in error messages or logs
- **User satisfaction**: Qualitative feedback that "repo switching feels clean and reliable"
- **Performance**: 95th percentile repo switch time (including fetch/reset) under 10 seconds
- **Error rate**: Less than 5% of repo switches fail due to git errors

## Open Questions

- [ ] Should we show a confirmation if the user has active chat messages before switching repos?
- [ ] Should we display the git commit SHA or timestamp of the synced code somewhere in the UI?
- [ ] Should we cache the last fetch timestamp and skip fetch if it was recent (e.g., within last 5 minutes)?
- [ ] Should we emit analytics events for repo switches to track usage patterns?
- [ ] How should we handle the case where a user switches to a repo that was deleted on GitHub?

## User Stories

| Story | File |
|---|---|
| Clear chat and context on repo switch | [stories/clear-context-on-switch.md](stories/clear-context-on-switch.md) |
| Fetch latest code when repo already cloned | [stories/fetch-latest-on-reselect.md](stories/fetch-latest-on-reselect.md) |
