# User Story: Create backend proxy endpoint for GitHub Copilot Spaces

## Summary

**As a** backend developer,
**I want** to create a new `/api/kdb/spaces` endpoint that proxies requests to GitHub's Copilot Spaces API,
**So that** the frontend can fetch spaces without encountering CORS errors.

## Description

This story implements the server-side proxy endpoint that will receive requests from the frontend with the GitHub PAT in the Authorization header, forward the request to `https://api.github.com/user/copilot/spaces` with the necessary headers, and return the GitHub API response. The proxy eliminates CORS issues by making the request server-side where browser preflight checks do not apply.

The implementation follows the existing pattern used in `repos.ts` and `agent.ts` routes, creating a new router module for KDB-related endpoints and mounting it in the main Express app.

## Acceptance Criteria

- [ ] Given a valid GitHub PAT in the Authorization header, when the client calls `GET /api/kdb/spaces`, then the endpoint forwards the request to GitHub API with the correct headers and returns the spaces data
- [ ] Given no Authorization header, when the client calls the endpoint, then it returns a 400 error with message "Authorization header is required"
- [ ] Given GitHub API returns an error (401, 403, 404, 422, 500), when the proxy receives the response, then it passes through the status code and error body to the client
- [ ] Given GitHub API returns success with spaces data (array or object format), when the proxy receives the response, then it returns 200 with the data unchanged
- [ ] Given the GitHub API request times out or fails, when a network error occurs, then the endpoint returns a 500 error with an appropriate message

## Tasks

- [ ] Create new file `backend/src/routes/kdb.ts` with Router export
- [ ] Implement `GET /spaces` route handler that extracts Authorization header from request
- [ ] Add validation to return 400 if Authorization header is missing
- [ ] Use native fetch to call `https://api.github.com/user/copilot/spaces` with Authorization, Accept, and X-GitHub-Api-Version headers
- [ ] Handle fetch response by parsing JSON and returning GitHub's status code and body
- [ ] Add try-catch error handling for network failures and return 500 with error message
- [ ] Export `kdbRouter` from the new routes file
- [ ] Import `kdbRouter` in `backend/src/index.ts`
- [ ] Mount the router at `/api/kdb` in the Express app (after repos and agent routers)
- [ ] Test the endpoint manually with curl or Postman using a valid GitHub PAT

## Dependencies

> List any other stories, services, or preconditions that must be in place before this story can start or complete.

- Node.js 18+ environment (already present)
- Express app running with CORS configured (already present)
- Valid GitHub PAT available for testing

## Out of Scope

> Anything explicitly excluded from this story to keep it focused.

- Logging or monitoring of requests
- Rate limiting or request throttling
- Caching of GitHub API responses
- PAT validation or format checking
- Retry logic for failed requests
- Timeout configuration (uses default fetch timeout)

## Notes

> Any additional context, references, or design decisions relevant to this story.

- The endpoint does NOT store, cache, or log the PAT; it only exists in the request/response cycle
- Follow the same TypeScript patterns as `repos.ts`: typed Request/Response from Express
- GitHub API documentation: https://docs.github.com/en/rest/copilot/copilot-user-management
- The Accept header value should be `application/vnd.github+json`
- The X-GitHub-Api-Version header should be `2022-11-28`
- Use `res.status(statusCode).json(data)` to return responses matching GitHub's format
