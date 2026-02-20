# web-spec-frontend

The frontend sub-package of the **agentic-web-spec** (Web-Spec) project. A Next.js 14 web application that provides the user interface for selecting GitHub repositories, chatting with AI agents, reviewing session history, and managing a Knowledge Base. Communicates with the backend service at `http://localhost:3001` via REST and Server-Sent Events (SSE).

---

## Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js (App Router) | 14.2.29 | React framework, routing, SSR |
| React | 18 | UI component model |
| TypeScript | 5 | Static typing |
| Tailwind CSS | 3.4 | Utility-first styling |
| PostCSS + Autoprefixer | — | CSS processing pipeline |
| Lucide React | 0.462 | Icon library |
| ESLint + eslint-config-next | 14.2.29 | Linting |

---

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout — wraps all pages with Nav and RepoBar
│   ├── page.tsx                # Agents landing page — shows agent selection cards
│   ├── globals.css             # Global CSS styles and Tailwind base imports
│   ├── agents/
│   │   └── [slug]/
│   │       └── page.tsx        # Dynamic agent chat page — streaming chat interface
│   ├── dashboard/
│   │   └── page.tsx            # Sessions list and activity event log
│   └── kdb/
│       └── page.tsx            # Knowledge Base page — lists Copilot Spaces
├── components/
│   ├── ChatInterface.tsx        # SSE streaming chat component
│   ├── Nav.tsx                  # Top navigation bar
│   ├── RepoBar.tsx              # Active repository status bar
│   ├── PATModal.tsx             # GitHub PAT settings modal
│   ├── RepoSelectorModal.tsx    # Repository search and clone modal
│   └── ui/                     # Shared low-level UI primitives
├── lib/
│   ├── agents.ts               # Agent configuration and chain definitions
│   ├── context.tsx             # Global React context (AppProvider)
│   └── storage.ts              # localStorage read/write helpers
├── public/                     # Static assets served at /
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── postcss.config.mjs          # PostCSS configuration
└── tsconfig.json               # TypeScript configuration
```

---

## Pages and Routes

| Route | File | Description |
|---|---|---|
| `/` | `app/page.tsx` | Landing page. Displays agent selection cards (Deep Research, PRD, Technical Docs). Requires an active repository to be set. |
| `/agents/[slug]` | `app/agents/[slug]/page.tsx` | Streaming chat interface for a specific agent. Valid slugs: `deep-research`, `prd`, `technical-docs`. |
| `/dashboard` | `app/dashboard/page.tsx` | Shows the session history list and an activity event log. |
| `/kdb` | `app/kdb/page.tsx` | Knowledge Base view. Lists Copilot Spaces available for injection into agent context. |

---

## Key Components

### `ChatInterface.tsx`

Manages an SSE streaming connection initiated by `POST /api/agent/run`. Renders user messages and streams the assistant response token by token as it arrives. After the agent completes its response, displays a "Send to [next agent]" button to advance to the next step in the agent chain.

### `RepoSelectorModal.tsx`

Provides a repository search UI backed by the GitHub API (authenticated with the stored PAT). Allows the user to select a repository and triggers a `POST /api/repos/clone` request to the backend to clone it locally.

### `PATModal.tsx`

Collects the user's GitHub Personal Access Token and GitHub username and persists them to localStorage. Displayed when no PAT is configured or when the user opens settings.

### `Nav.tsx`

Top navigation bar rendered in the root layout. Contains links to the agents home page (`/`), the dashboard (`/dashboard`), and the Knowledge Base (`/kdb`). Also provides access to PAT settings.

### `RepoBar.tsx`

Persistent status bar rendered in the root layout below the nav. Displays the name and status of the currently active/cloned repository sourced from global context.

### `ui/`

Directory of shared, unstyled or minimally styled UI primitive components (buttons, modals, inputs, etc.) reused across the application.

---

## State Management

Global application state is managed through a React Context defined in `lib/context.tsx` and exposed via `AppProvider`. The context is hydrated from `localStorage` on initial mount, so state persists across page navigations and browser refreshes.

### Context Values

| Value | Type | Description |
|---|---|---|
| `pat` | `string` | GitHub Personal Access Token |
| `username` | `string` | GitHub username |
| `activeRepo` | `object` | Currently selected/cloned repository |

The `activeRepo` object shape:

```ts
{
  fullName: string;   // e.g. "owner/repo"
  username: string;
  repoName: string;
  localPath: string;  // local path on the backend host
  clonedAt: string;   // ISO timestamp
}
```

### localStorage Keys

| Key | Contents |
|---|---|
| `web_spec_pat` | GitHub Personal Access Token string |
| `web_spec_username` | GitHub username string |
| `web_spec_active_repo` | JSON-serialized active repository object |
| `web_spec_sessions` | JSON array of chat session records |
| `web_spec_activity` | JSON array of activity event log entries |

localStorage helpers are in `lib/storage.ts`.

---

## Agent Chain

Three agents are defined in `lib/agents.ts`, each with a slug, display name, description, Tailwind color classes, and a `nextAgent` reference that forms a linear chain:

| Step | Slug | Name | Next |
|---|---|---|---|
| 1 | `deep-research` | Deep Research | `prd` |
| 2 | `prd` | PRD | `technical-docs` |
| 3 | `technical-docs` | Technical Docs | — (end of chain) |

After each agent completes its response in the chat interface, the user is offered a one-click handoff button to carry the output to the next agent in the chain. The chain is defined entirely in `lib/agents.ts` and consumed by `ChatInterface.tsx`.

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- The backend service running at `http://localhost:3001` (see `../backend/README.md`)

### Install Dependencies

From the repository root (installs all workspaces):

```bash
npm install
```

Or install only the frontend dependencies directly:

```bash
cd frontend
npm install
```

### Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `next dev -p 3000` | Starts the Next.js development server on port 3000 with hot reload |
| `build` | `next build` | Compiles and bundles the application for production |
| `start` | `next start -p 3000` | Serves the production build on port 3000 |
| `lint` | `next lint` | Runs ESLint across the project |

---

## Configuration

### TypeScript (`tsconfig.json`)

- **Target:** `ES2022`
- **Strict mode:** enabled
- **Path alias:** `@/` resolves to the project root, allowing imports like `import { agents } from '@/lib/agents'`
- **JSX transform:** `react-jsx`

### Tailwind CSS (`tailwind.config.ts`)

Configured with a dark theme. Content paths cover `app/**`, `components/**`, and `lib/**`. Extend the theme in `tailwind.config.ts` and add base styles in `app/globals.css`.

### Next.js (`next.config.mjs`)

Minimal configuration with no custom rewrites or redirects. The default App Router behavior is used throughout.

---

## Backend Integration

The frontend communicates with the backend at the hardcoded base URL `http://localhost:3001`. No environment variable is required for local development.

### Streaming (SSE)

Agent execution uses Server-Sent Events for token-by-token streaming. The `ChatInterface` component opens a connection to:

```
POST http://localhost:3001/api/agent/run
```

The backend responds with an `text/event-stream` content type. Each event contains a partial response token. The client accumulates tokens and renders them progressively until the `[DONE]` event is received.

### REST Endpoints

Repository operations use standard JSON REST calls:

| Operation | Method | Endpoint |
|---|---|---|
| Search repositories | GitHub API (client-side, via PAT) | — |
| Clone a repository | `POST` | `http://localhost:3001/api/repos/clone` |

All API calls originate from the browser. There are no Next.js API routes or server-side proxies — the frontend communicates directly with the backend service.
