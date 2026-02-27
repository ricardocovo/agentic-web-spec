# User Story: Backend Admin API

## Summary

**As a** frontend admin page,
**I want** REST endpoints to read and write agent YAML configurations,
**So that** the browser UI can load agent data and persist changes to disk without the user touching the file system.

## Description

A new Express router at `backend/src/routes/admin.ts` exposes three endpoints under `/api/admin/agents`. The router uses the existing `AGENT_FILE_MAP` (extracted to a shared module to avoid duplication) to resolve agent slugs to YAML file paths. GET endpoints read and parse the YAML files; the PUT endpoint accepts a JSON body of editable fields, merges them into the existing YAML structure (preserving the `name` field), serializes back to YAML, and writes to disk. The router is registered in `backend/src/index.ts`.

## Acceptance Criteria

- [ ] Given a GET request to `/api/admin/agents`, when the endpoint is called, then it returns HTTP 200 with a JSON array of all agents, each containing all YAML fields (`name`, `displayName`, `description`, `model`, `tools`, `prompt`) plus a `slug` property.
- [ ] Given a GET request to `/api/admin/agents/:slug` with a valid slug, when the endpoint is called, then it returns HTTP 200 with a JSON object containing all YAML fields plus `slug`.
- [ ] Given a GET request to `/api/admin/agents/:slug` with an unknown slug, when the endpoint is called, then it returns HTTP 404 with a descriptive error message.
- [ ] Given a PUT request to `/api/admin/agents/:slug` with a valid body `{ displayName, description, model, tools, prompt }`, when the endpoint is called, then the corresponding YAML file is updated on disk and the endpoint returns HTTP 200 with the updated agent object.
- [ ] Given a PUT request to `/api/admin/agents/:slug` with an unknown slug, when the endpoint is called, then it returns HTTP 404.
- [ ] Given a PUT request where the YAML file cannot be written (e.g., permissions error), when the write fails, then the endpoint returns HTTP 500 with a descriptive error message.
- [ ] Given the `name` field is present in the original YAML file, when a PUT request is processed, then the `name` field is preserved in the written YAML (it is never overwritten by PUT body data).
- [ ] Given the admin router is registered, when the backend starts, then all three endpoints are reachable at their expected paths.

## Tasks

- [ ] Extract `AGENT_FILE_MAP` from `backend/src/routes/agent.ts` into a shared module `backend/src/lib/agentFileMap.ts` and update the import in `agent.ts`
- [ ] Create `backend/src/routes/admin.ts` with an Express router
- [ ] Implement `GET /` handler: read and parse all YAML files from `AGENT_FILE_MAP`, return array with `slug` field injected
- [ ] Implement `GET /:slug` handler: resolve slug to filename, read and parse the YAML file, return object with `slug` field injected; return 404 if slug unknown
- [ ] Implement `PUT /:slug` handler: resolve slug to filename, read existing YAML, merge editable fields from request body, serialize to YAML string, write to disk; return 200 with updated object or 500 on write failure
- [ ] Add server-side validation in PUT handler: return 400 if required fields (`displayName`, `prompt`) are missing or not strings
- [ ] Use `js-yaml` (already available in the backend) for both YAML parsing and serialization
- [ ] Register the admin router in `backend/src/index.ts` as `app.use("/api/admin", adminRouter)`
- [ ] Add CORS-compatible headers (consistent with other routes) so the frontend on port 3000 can call the endpoints

## Dependencies

> Depends on: Extracting or duplicating `AGENT_FILE_MAP` so the admin router can access it
> Depends on: `js-yaml` package being available in the backend (already installed)

## Out of Scope

- Authentication or authorization middleware on the admin routes
- Endpoint for creating or deleting agent YAML files
- Endpoint for listing available models
- Schema validation beyond required-field checks

## Notes

- The `AGENT_FILE_MAP` extraction is a small refactor. If it creates unexpected risk, it is acceptable to duplicate the map in `admin.ts` as a temporary measure and clean up in a follow-up task.
- YAML serialization with `js-yaml`'s `dump()` will not preserve comments from the original file — this is an accepted trade-off documented in the spec's Non-Goals.
- File paths should be resolved using `path.resolve` relative to `backend/agents/` using `import.meta.url` (ESM pattern consistent with the rest of the backend).
- All three endpoints should include `Content-Type: application/json` in their responses.
