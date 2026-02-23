# Feature: KDB Spaces Proxy

## Overview

The Knowledge Base (KDB) page allows developers to connect a GitHub Copilot Space as context for their agent sessions. Currently, the page attempts to fetch spaces directly from `https://api.github.com/user/copilot/spaces` in the browser, which fails due to CORS policy restrictions (GitHub API does not support browser preflight requests for this endpoint). This feature implements a backend proxy endpoint that forwards the GitHub API call server-side, eliminating the CORS error and enabling users to successfully load and select their Copilot Spaces.

## Problem Statement

Users attempting to access the `/kdb` page see a CORS error in the browser console when the page tries to fetch their Copilot Spaces from GitHub's API. This prevents the spaces from loading, making it impossible to connect a space as knowledge base context. Browser-based requests to GitHub API endpoints that require authentication trigger CORS preflight checks, which GitHub does not support for this endpoint, resulting in request failures.

## Goals

- [x] Enable successful loading of GitHub Copilot Spaces on the KDB page
- [x] Eliminate CORS errors by proxying GitHub API calls through the backend
- [x] Maintain the existing security model (PAT passed per-request, never stored)
- [x] Preserve the existing user experience and UI behavior
- [x] Use only built-in Node.js capabilities (no new dependencies)

## Non-Goals

> What this feature explicitly does NOT do. Helps prevent scope creep.

- Storing or caching the GitHub PAT on the backend
- Implementing authentication or session management
- Modifying the UI/UX of the KDB page beyond changing the API endpoint
- Adding retry logic or advanced error handling beyond basic HTTP error codes
- Proxying other GitHub API endpoints (only `/user/copilot/spaces`)
- Implementing rate limiting or request throttling
- Adding logging or monitoring (can be added in future iterations)

## Target Users / Personas

| Persona | Description |
|---|---|
| Developer | A software engineer using Web-Spec to generate feature specifications who wants to connect their GitHub Copilot Space as additional knowledge base context for more accurate spec generation |
| Technical Writer | A documentation specialist using Web-Spec who has curated knowledge in a Copilot Space and wants to leverage it for consistent terminology and context |

## Functional Requirements

> Numbered list of capabilities the feature MUST deliver.

1. The system shall provide a new backend endpoint `GET /api/kdb/spaces` that accepts a GitHub PAT in the Authorization header
2. The system shall forward the GitHub PAT and required headers (`Accept`, `X-GitHub-Api-Version`) to `https://api.github.com/user/copilot/spaces`
3. The system shall return the GitHub API response body and HTTP status code directly to the frontend client
4. The system shall handle GitHub API error responses (404, 422, 401, 403, 500, etc.) by passing them through to the client
5. The frontend KDB page shall call the new backend proxy endpoint instead of calling GitHub API directly
6. The system shall preserve the existing behavior for empty states, error states, and successful space listing
7. The system shall continue to pass the Authorization header from the frontend to the backend on each request
8. The system shall maintain compatibility with the existing `CopilotSpace` data structure

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Proxy endpoint should respond within 2 seconds under normal GitHub API latency |
| Security | PAT must only exist in request headers and never be logged, stored, or cached |
| Accessibility | No changes to UI accessibility; existing KDB page remains compliant |
| Scalability | Endpoint should handle concurrent requests from multiple browser sessions |
| Reliability | Endpoint should gracefully handle GitHub API timeouts and return appropriate error messages |
| Maintainability | Use native fetch API and follow existing backend code patterns (TypeScript, Express Router) |

## UX / Design Considerations

> Describe the user experience, key flows, or UI changes involved. Reference wireframes or mockups if available.

- **No visible UX changes**: The user experience remains identical; users will simply see their spaces load successfully instead of encountering an error
- **Error messaging**: Existing error handling in the UI will display any backend or GitHub API errors in the red error banner
- **Loading state**: The existing loading spinner continues to work as expected during the API call
- **Empty state**: If GitHub returns 404/422 or an empty array, the existing "No Copilot Spaces found" message displays
- **Success state**: Spaces appear in the grid layout as they currently do when data is available

**Key flow:**
1. User navigates to `/kdb` with a valid GitHub PAT configured
2. Frontend calls `GET /api/kdb/spaces` (backend proxy) instead of calling GitHub directly
3. Backend forwards the request to GitHub API with the PAT
4. Backend returns the response to the frontend
5. Frontend renders the spaces list or error message as it currently does

## Technical Considerations

> Architecture decisions, technology choices, API contracts, or constraints relevant to implementation.

### Backend Architecture
- Create a new router file `backend/src/routes/kdb.ts` following the pattern of `repos.ts` and `agent.ts`
- Mount the router at `/api/kdb` in `backend/src/index.ts`
- Use Node.js native `fetch` (available in Node 18+) to call GitHub API server-side
- Extract the Authorization header from the incoming request and forward it to GitHub
- Return GitHub's response directly using `res.status(statusCode).json(data)`

### API Contract
**New endpoint:** `GET /api/kdb/spaces`
- **Request headers:** 
  - `Authorization: Bearer <GITHUB_PAT>` (required)
- **Response:** Proxies GitHub API response
  - Success (200): `CopilotSpace[]` or `{ spaces: CopilotSpace[] }`
  - Error (4xx/5xx): GitHub error response body
- **Error codes:**
  - 400: Missing Authorization header
  - 401/403: Invalid or insufficient PAT permissions
  - 404/422: Spaces API not available for user
  - 500: GitHub API or network error

### Frontend Changes
- In `frontend/app/kdb/page.tsx`, change the fetch URL from `https://api.github.com/user/copilot/spaces` to `/api/kdb/spaces`
- Update the request to use relative URL: `fetch("/api/kdb/spaces", ...)`
- Keep all existing headers and error handling logic
- The backend will be accessed via Next.js proxy during development (localhost:3000 → localhost:3001)

### CORS Consideration
- No CORS configuration changes needed; backend already has `cors({ origin: "http://localhost:3000" })`
- In production, ensure the backend CORS origin matches the production frontend domain

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| Node.js 18+ | External | Required for native fetch API support |
| Express backend running | Internal | Frontend calls assume backend is available at expected port |
| GitHub Copilot Spaces API | External | GitHub API must be available; feature degrades gracefully if unavailable |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| GitHub API changes response format | Low | Medium | Frontend already handles both array and `{ spaces: [] }` format; maintain flexible parsing |
| PAT accidentally logged or exposed | Low | High | Explicitly avoid logging Authorization header; code review for PAT handling |
| GitHub API rate limiting affects multiple users | Medium | Medium | Accept as current limitation; document for future rate limit handling |
| Backend timeout on slow GitHub response | Low | Low | Let request fail naturally; frontend already handles errors gracefully |
| Breaking changes during deployment | Low | Medium | Backend and frontend can be deployed independently; test in staging first |

## Success Metrics

> How will we know this feature is successful?

- **Primary:** Zero CORS errors in browser console when accessing `/kdb` page with valid PAT
- **User-facing:** Users can successfully see their Copilot Spaces listed on the KDB page
- **Error rate:** GitHub API errors (401, 404, etc.) are displayed to users as actionable error messages instead of generic CORS failures
- **Developer feedback:** Users report successful space selection and no blocking errors

## Open Questions

- [x] Should we add request timeout handling in the proxy endpoint?
  - *Resolution: Let the native fetch default timeout handle this; avoid adding complexity for v1*
- [x] Should we validate the PAT format before forwarding to GitHub?
  - *Resolution: No; let GitHub handle validation and return appropriate error codes*
- [x] Should we log successful proxy requests for monitoring?
  - *Resolution: Not in v1; can add observability in future iteration*

## User Stories

> List of all user stories for this feature (links will be added as files are created).

| Story | File |
|---|---|
| Create backend proxy endpoint for GitHub Copilot Spaces | [stories/create-backend-proxy.md](stories/create-backend-proxy.md) |
| Update frontend to call backend proxy | [stories/update-frontend-proxy.md](stories/update-frontend-proxy.md) |
| Test and validate CORS fix | [stories/test-cors-fix.md](stories/test-cors-fix.md) |
