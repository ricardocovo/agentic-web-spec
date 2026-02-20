# Frontend Specification

Framework: **Next.js 14** (App Router) · **TypeScript** · **Tailwind CSS**  
Port: `3000`

---

## Routing

| Route | File | Description |
|---|---|---|
| `/` | `app/page.tsx` | Agent selection landing page |
| `/agents/[slug]` | `app/agents/[slug]/page.tsx` | Chat session with a specific agent |
| `/kdb` | `app/kdb/page.tsx` | Knowledge Base — Copilot Spaces |
| `/dashboard` | `app/dashboard/page.tsx` | Session history and activity log |

All routes share the root layout (`app/layout.tsx`) which renders `Nav` and `RepoBar` persistently at the top.

---

## Pages

### `/` — Agents Landing

- Displays three `AgentCard` components (one per agent).
- Cards link to `/agents/<slug>` when an active repo is set.
- Cards are disabled (greyed out, non-clickable) when no repo is active.
- A warning banner is shown when no repo is selected.

### `/agents/[slug]` — Agent Chat

- Redirects to `/` if `activeRepo` is null.
- Creates a new `Session` in localStorage on mount.
- If a handoff key exists in `sessionStorage` (`web_spec_handoff_<slug>`), prepends the context as an assistant message and clears the key.
- Streams agent responses via `POST /api/backend/agent/run` (SSE).
- Displays a **Send to [next agent]** button after any assistant response.
- Saves all messages to the session via `lib/storage.ts`.

### `/kdb` — Knowledge Base

- Lists Copilot Spaces retrieved from `https://api.github.com/user/copilot/spaces` using the stored PAT.
- Allows selecting one Space; the selection is persisted in `localStorage` under `web_spec_selected_space`.
- Gracefully handles 404/422 (Spaces API unavailable) and missing PAT.

### `/dashboard` — Dashboard

- Reads sessions and activity events from localStorage.
- Sessions panel (2/3 width): sorted most-recent-first; each row links back to `/agents/<slug>`.
- Activity panel (1/3 width): shows last 30 events with type-specific icons.

---

## Components

### `Nav`

Top navigation bar with the Web-Spec logo, nav links (Agents, KDB, Dashboard), and the settings (PAT) button.

### `RepoBar`

Persistent bar below the nav. Shows the active repository name and a **Select repo** button that opens `RepoSelectorModal`. Cloned repos can be removed (deactivated) from this bar.

### `PATModal`

Modal for entering a GitHub PAT. On save: validates the token against `https://api.github.com/user`, stores the PAT and username in localStorage.

### `RepoSelectorModal`

Modal for searching and selecting a GitHub repository.

- On open: fetches the user's 20 most recently updated repos.
- On query change (400 ms debounce): searches repos scoped to the authenticated user.
- On repo select: calls `POST /api/backend/repos/clone`; on success sets the active repo in context.

### `ChatInterface`

Core chat UI component.

**Props**
```ts
{
  agent: AgentConfig;
  messages: Message[];
  onSend: (content: string) => Promise<void>;
  isStreaming: boolean;
  streamingContent: string;
  nextAgent?: AgentConfig;
  onHandoff?: () => void;
  disabled?: boolean;
}
```

**Behaviour**
- Enter submits; Shift+Enter inserts a newline.
- Auto-resizes textarea up to 120 px.
- Shows a `StreamingBubble` with an animated cursor while streaming.
- Shows a spinning loader while waiting for the first token.
- Shows the **Send to [next agent]** handoff button after a completed response.
- Scrolls to the bottom whenever messages or streaming content change.

---

## Global State — `lib/context.tsx`

`AppProvider` / `useApp()` hook exposes:

| Field | Type | Description |
|---|---|---|
| `pat` | `string \| null` | GitHub Personal Access Token |
| `username` | `string \| null` | Authenticated GitHub username |
| `activeRepo` | `ActiveRepo \| null` | Currently selected repository |
| `setPat(pat, username)` | function | Save PAT + username to state and localStorage |
| `clearAuth()` | function | Clear PAT from state and localStorage |
| `setActiveRepo(repo)` | function | Save active repo to state and localStorage |
| `removeActiveRepo()` | function | Clear active repo from state and localStorage |

State is initialised from localStorage on mount (client-side only).

---

## Agent Config — `lib/agents.ts`

```ts
interface AgentConfig {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  color: string;       // Tailwind text colour class
  bgColor: string;     // Tailwind bg colour class
  borderColor: string; // Tailwind border colour class
  iconColor: string;   // Hex colour for icons and accents
  nextAgent?: string;  // Slug of the next agent in the chain
}
```

Helper functions: `getAgent(slug)`, `getNextAgent(slug)`.

---

## Tailwind Theme Tokens

Custom CSS variables defined in `globals.css` and surfaced as Tailwind classes:

| Token | Usage |
|---|---|
| `bg-surface` | Page / card backgrounds |
| `bg-surface-2` | Elevated surfaces (input, hover) |
| `border-border` | Default border colour |
| `text-text-primary` | Primary text |
| `text-text-secondary` | Secondary / label text |
| `text-muted` | De-emphasised text |
| `text-accent` / `bg-accent` | Brand accent colour |
