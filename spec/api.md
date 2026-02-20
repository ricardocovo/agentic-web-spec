# Backend API Specification

Base URL: `http://localhost:3001`  
The Next.js frontend proxies `/api/backend/*` → `http://localhost:3001/api/*` (configured in `next.config.mjs`).

---

## Health

### `GET /health`

Returns server status.

**Response**
```json
{ "status": "ok" }
```

---

## Repositories — `/api/repos`

### `POST /api/repos/clone`

Shallow-clone a GitHub repository into `~/work/<username>/<repo>`. If the path already exists, returns immediately without re-cloning.

**Request body**
```ts
{
  repoFullName: string;  // e.g. "octocat/hello-world"
  pat: string;           // GitHub Personal Access Token
  username: string;      // Authenticated GitHub username
}
```

**Response (success)**
```ts
{
  success: true;
  repoPath: string;       // Absolute path on disk
  alreadyCloned: boolean;
}
```

**Response (error)** — `400` or `500`
```ts
{ error: string }
```

---

### `GET /api/repos/status`

Check whether a repository has been cloned.

**Query parameters**
| Param | Type | Required |
|---|---|---|
| `username` | string | ✓ |
| `repoName` | string | ✓ |

**Response**
```ts
{
  exists: boolean;
  repoPath: string | null;
}
```

---

### `DELETE /api/repos/remove`

Remove a cloned repository from disk.

**Request body**
```ts
{
  username: string;
  repoName: string;
}
```

**Response (success)**
```ts
{ success: true }
```

**Response (error)** — `400` or `404` or `500`
```ts
{ error: string }
```

---

### `GET /api/repos/tree`

Return the file tree of a cloned repository (up to 3 levels deep, skipping `.git` and `node_modules`).

**Query parameters**
| Param | Type | Required |
|---|---|---|
| `username` | string | ✓ |
| `repoName` | string | ✓ |

**Response**
```ts
{
  repoPath: string;
  tree: string[];   // Relative paths; directories end with "/"
}
```

---

## Agent — `/api/agent`

### `POST /api/agent/run`

Run a named agent against a cloned repository. Streams the response as [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events).

The endpoint validates inputs and starts the Copilot client **before** opening the SSE stream, so failures return normal JSON HTTP errors.

**Request body**
```ts
{
  agentSlug: string;    // "deep-research" | "prd" | "technical-docs"
  prompt: string;       // User message
  repoPath: string;     // Absolute local path returned by /clone
  context?: string;     // Optional prior assistant messages (handoff context)
}
```

**SSE events**

| Event | Data | Description |
|---|---|---|
| `chunk` | JSON-encoded string | Incremental assistant token |
| `error` | JSON-encoded string | Error message from the session |
| `done` | `""` | Stream complete |

**Error responses** — `400`, `404`, `500`
```ts
{ error: string }
```

**Notes**
- The agent's system prompt is loaded from `backend/agents/<slug>.agent.yaml`.
- If `context` is supplied it is appended to the system prompt as `Previous context:\n<context>`.
- The Copilot session uses `model` from the YAML (defaults to `gpt-4.1`), `streaming: true`, and `workingDirectory` set to `repoPath`.
- The stream ends on `session.idle` (after the prompt is sent) or `session.error`.
