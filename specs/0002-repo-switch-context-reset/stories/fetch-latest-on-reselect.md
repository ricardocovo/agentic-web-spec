# User Story: Fetch latest code when repo already cloned

## Summary

**As a** developer using Web-Spec,
**I want** the backend to fetch and apply the latest changes from GitHub when I select a repository that's already been cloned,
**So that** agents always analyze the most up-to-date version of the code rather than a stale snapshot.

## Description

Currently, when the `/api/backend/repos/clone` endpoint is called for a repository that already exists locally, it immediately returns `{ alreadyCloned: true }` without checking for updates. This means if the remote repository has changed since the initial clone, agents will work with outdated code.

This story modifies the backend route to execute `git fetch origin` followed by `git reset --hard origin/HEAD` when a repository directory already exists, ensuring the local copy is synchronized with the remote before returning success. Since the Personal Access Token is embedded in git URLs, all error messages must be sanitized to strip the PAT before being sent to the client.

## Acceptance Criteria

- [ ] Given a repository directory already exists locally, when the `/clone` endpoint is called, then the backend executes `git fetch origin` in that directory
- [ ] Given the fetch succeeds, when the backend continues, then it executes `git reset --hard origin/HEAD` to synchronize with remote
- [ ] Given both fetch and reset succeed, when the response is sent, then it includes `{ success: true, alreadyCloned: true, synced: true }`
- [ ] Given the fetch or reset fails, when the error is returned, then any occurrence of the PAT in the error message is replaced with `***` before sending to client
- [ ] Given a repository does not exist locally, when the `/clone` endpoint is called, then it performs a shallow clone as before with no changes to existing behavior
- [ ] Given the git operations are running, when they exceed a reasonable timeout (30 seconds), then the request fails with a timeout error
- [ ] Given multiple git error types (stderr, exception messages), when PAT sanitization occurs, then all instances of the PAT are removed regardless of error source

## Tasks

- [ ] Add a `sanitizePAT(text: string, pat: string): string` utility function in `backend/src/routes/repos.ts` that replaces all occurrences of the PAT with `***`
- [ ] Update the existing check in `/clone` route where `fs.existsSync(repoPath)` returns true
- [ ] Execute `git fetch origin` using `child_process.execSync` in the repository directory with appropriate timeout
- [ ] Capture both stdout and stderr from the fetch command
- [ ] If fetch fails, sanitize the error message using `sanitizePAT()` and return a 500 error with sanitized message
- [ ] Execute `git reset --hard origin/HEAD` using `child_process.execSync` after successful fetch
- [ ] Capture both stdout and stderr from the reset command
- [ ] If reset fails, sanitize the error message using `sanitizePAT()` and return a 500 error with sanitized message
- [ ] If both commands succeed, return success response with `{ success: true, alreadyCloned: true, synced: true }`
- [ ] Wrap git operations in try-catch to handle exceptions and sanitize exception messages
- [ ] Set a 30-second timeout for git operations using the `timeout` option in execSync
- [ ] Test with a repository that has remote changes to verify sync works correctly
- [ ] Test error cases and verify PAT never appears in error responses
- [ ] Verify existing clone behavior (when repo doesn't exist) is unchanged

## Dependencies

> List any other stories, services, or preconditions that must be in place before this story can start or complete.

- Git CLI must be installed and accessible on the backend server (already required for current clone functionality)
- PAT provided in request must have read access to the repository (existing requirement)

## Out of Scope

> Anything explicitly excluded from this story to keep it focused.

- Handling git merge conflicts (we use `--hard` reset which overwrites local changes)
- Supporting multiple remotes or custom remote names (we assume standard `origin`)
- Implementing request queuing to prevent concurrent fetch/reset on same repo
- Adding caching or "skip fetch if recent" optimization
- Displaying git commit SHA or sync timestamp in the UI
- Frontend changes (handled in separate story)

## Notes

> Any additional context, references, or design decisions relevant to this story.

- **Why `origin/HEAD`?** This is the default branch of the remote (usually `main` or `master`), matching what the initial shallow clone would check out
- **Why `--hard` reset?** We treat the local clone as a read-only cache that should exactly match the remote; any local changes (e.g., from previous operations) should be discarded
- **PAT in URLs**: The clone URL format is `https://{pat}@github.com/{repoFullName}.git`, so the PAT appears after `https://` and before `@github.com`
- **Sanitization strategy**: Use a simple string replace like `text.replace(new RegExp(pat, 'g'), '***')` but be careful to escape special regex characters in the PAT
- **Timeout handling**: The `timeout` option in `execSync` will throw an error if exceeded; catch and return a user-friendly message
- **Testing locally**: Can simulate remote changes by:
  1. Clone a test repo
  2. Make a commit on GitHub web UI
  3. Call the clone endpoint and verify fetch/reset pulls the new commit
- **Related files**:
  - `backend/src/routes/repos.ts` — specifically the `/clone` POST endpoint and the `fs.existsSync` conditional branch
- **Example sanitization test cases**:
  - Error with clone URL: `fatal: unable to access 'https://ghp_abc123@github.com/user/repo.git': Failed`
  - Should become: `fatal: unable to access 'https://***@github.com/user/repo.git': Failed`
