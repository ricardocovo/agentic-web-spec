# Data Models

All client-side state is persisted in **localStorage** (no backend database). The storage layer is implemented in `frontend/lib/storage.ts`.

---

## localStorage Keys

| Key | Type | Description |
|---|---|---|
| `web_spec_pat` | `string` | GitHub Personal Access Token |
| `web_spec_username` | `string` | Authenticated GitHub username |
| `web_spec_active_repo` | `ActiveRepo` (JSON) | Currently selected repository |
| `web_spec_sessions` | `Session[]` (JSON) | All chat sessions, newest first |
| `web_spec_activity` | `ActivityEvent[]` (JSON) | Activity log, capped at 100 events |
| `web_spec_selected_space` | `string` | Selected Copilot Space (`owner/name`) |

## sessionStorage Keys

| Key | Description |
|---|---|
| `web_spec_handoff_<slug>` | Last assistant message forwarded to the next agent in the chain. Consumed and removed on the target agent page's mount. |

---

## TypeScript Interfaces

### `ActiveRepo`

```ts
interface ActiveRepo {
  fullName: string;   // "owner/repo"
  username: string;   // GitHub username of the authenticated user
  repoName: string;   // Repository name only
  localPath: string;  // Absolute path on the backend host
  clonedAt: number;   // Unix timestamp (ms)
}
```

### `Message`

```ts
interface Message {
  id: string;           // UUID
  role: "user" | "assistant";
  content: string;
  createdAt: number;    // Unix timestamp (ms)
}
```

### `Session`

```ts
interface Session {
  id: string;           // UUID
  agentSlug: string;    // e.g. "deep-research"
  agentName: string;    // e.g. "Deep Research"
  title: string;        // First 60 chars of the first user message
  messages: Message[];
  repoFullName: string; // "owner/repo"
  createdAt: number;    // Unix timestamp (ms)
  updatedAt: number;    // Unix timestamp (ms)
}
```

### `ActivityEvent`

```ts
interface ActivityEvent {
  id: string;           // UUID
  type: "session_created" | "message_sent" | "agent_handoff" | "repo_cloned";
  agentSlug?: string;
  repoFullName?: string;
  description: string;  // Human-readable summary
  createdAt: number;    // Unix timestamp (ms)
}
```

---

## Storage Helpers

| Function | Description |
|---|---|
| `getPat() / savePat() / clearPat()` | Read/write/delete the PAT |
| `getUsername() / saveUsername()` | Read/write the username |
| `getActiveRepo() / saveActiveRepo() / clearActiveRepo()` | Read/write/delete the active repo. `saveActiveRepo` also logs a `repo_cloned` activity event. |
| `getSessions() / getSession(id)` | Read all sessions or a single session by ID |
| `saveSession(session)` | Upsert a session (prepend to list, deduplicated by ID) |
| `createSession(slug, name, repo)` | Create a new session, save it, and log a `session_created` activity event |
| `addMessageToSession(sessionId, message)` | Append a message; sets session title from the first user message (≤60 chars) |
| `getActivity() / addActivity(event)` | Read activity log or append an event (list capped at 100) |
