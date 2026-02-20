# Agents Specification

Agents are defined as YAML files in `backend/agents/`. Each file maps to a slug used by the frontend and the `/api/agent/run` endpoint.

## Agent Chain

```
Deep Research  →  PRD  →  Technical Docs
```

Handoff is explicit: after an agent responds the user clicks **Send to [next agent]**, which stores the last assistant message in `sessionStorage` under the key `web_spec_handoff_<nextSlug>`. The next agent page reads and injects this as an opening assistant message prefixed with `📎 Context from previous agent:`.

---

## Agent: Deep Research

| Field | Value |
|---|---|
| Slug | `deep-research` |
| File | `backend/agents/deep-research.agent.yaml` |
| Model | `gpt-4.1` |
| Tools | `grep`, `glob`, `view`, `bash` |
| Next | `prd` |

**Purpose:** Thoroughly analyze the codebase and a given topic. Returns structured findings with a Summary, Codebase Analysis, Research Findings, Constraints & Risks, and Recommendations.

**Output structure**
- **Summary** — 2–3 sentence high-level overview
- **Codebase Analysis** — tech stack, key patterns, conventions
- **Research Findings** — in-depth topic analysis grounded in the codebase
- **Constraints & Risks** — technical limitations to consider
- **Recommendations** — actionable next steps

---

## Agent: PRD

| Field | Value |
|---|---|
| Slug | `prd` |
| File | `backend/agents/prd.agent.yaml` |
| Model | `gpt-4.1` |
| Tools | `grep`, `glob`, `view` |
| Next | `technical-docs` |

**Purpose:** Transform research findings into a complete Product Requirements Document with testable acceptance criteria.

**Output structure**
```
## Product Requirements Document
### Overview
### Goals & Success Metrics
### User Stories  (with acceptance criteria checkboxes)
### Technical Requirements
### Out of Scope
### Open Questions
```

---

## Agent: Technical Documents

| Field | Value |
|---|---|
| Slug | `technical-docs` |
| File | `backend/agents/technical-docs.agent.yaml` |
| Model | `gpt-4.1` |
| Tools | `grep`, `glob`, `view`, `bash` |
| Next | — (end of chain) |

**Purpose:** Convert a PRD into an implementation-ready technical specification with discrete, independently-implementable tasks.

**Output structure**
```
## Technical Specification
### Architecture Overview
### Data Models & Schemas
### API Contracts
### Implementation Tasks
  #### Task N: [title]
  File(s), Type, Description, Implementation notes, Acceptance criteria
### Testing Strategy
### Dependencies & Order
```

---

## Agent YAML Schema

```yaml
name: string           # Internal identifier
displayName: string    # Human-readable name
description: string    # Short description (used for documentation)
model: string          # Copilot model ID (e.g. gpt-4.1)
tools:                 # Tools available to the agent; "*" = all
  - grep
  - glob
  - view
  - bash
prompt: |              # System prompt (multi-line)
  ...
```

## Adding a New Agent

1. Create `backend/agents/<slug>.agent.yaml` following the schema above.
2. Add an entry to `AGENT_FILE_MAP` in `backend/src/routes/agent.ts`.
3. Add the agent config to `AGENTS` in `frontend/lib/agents.ts` (set `nextAgent` to wire it into the chain).
4. Add an icon mapping in `frontend/app/page.tsx` and `frontend/app/agents/[slug]/page.tsx`.
