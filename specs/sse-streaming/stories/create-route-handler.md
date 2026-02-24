# User Story: Create Next.js Route Handler for unbuffered SSE forwarding

## Summary

**As a** developer using the Web-Spec app,
**I want** agent responses to stream token-by-token in real-time,
**So that** I can see immediate feedback during generation and understand the agent's thinking process as it happens.

## Description

The Next.js rewrite proxy in `next.config.mjs` buffers SSE responses before delivering them to the client, preventing real-time streaming. This story implements a Next.js App Router Route Handler that bypasses the buffering proxy by directly piping the backend's `ReadableStream` to the response.

The route handler will:
- Accept POST requests at `/api/agent/run`
- Forward requests to the backend at `http://localhost:3001/api/agent/run`
- Pipe the response body stream directly without awaiting completion
- Set required SSE headers to prevent buffering at any layer

## Acceptance Criteria

- [x] Given a POST request to `/api/agent/run`, when the route handler processes it, then it forwards the request to `http://localhost:3001/api/agent/run`
- [x] Given the backend responds with SSE events, when the route handler receives them, then it pipes the `ReadableStream` body directly to the response without buffering
- [x] Given the response is an SSE stream, when headers are set, then `Content-Type: text/event-stream` is present
- [x] Given potential caching layers, when headers are set, then `Cache-Control: no-cache, no-transform` is present
- [x] Given potential nginx/proxy buffering, when headers are set, then `X-Accel-Buffering: no` is present
- [x] Given the client disconnects, when the route handler detects it, then it properly closes the backend connection
- [x] Given an error occurs, when the route handler catches it, then it returns an appropriate error response
- [x] Given the route handler is invoked, when auth/headers are needed, then they are properly forwarded from the client request to the backend

## Tasks

- [x] Create `frontend/app/api/agent/run/route.ts` file
- [x] Implement `POST` export function with Next.js `Request` parameter
- [x] Extract request body and headers from incoming request
- [x] Forward POST request to `http://localhost:3001/api/agent/run` with body and relevant headers
- [x] Set response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no`
- [x] Pipe backend response body `ReadableStream` directly to Next.js `Response` without awaiting
- [x] Add error handling for fetch failures
- [x] Add error handling for stream piping failures
- [x] Test with curl or browser to verify SSE events arrive incrementally

## Dependencies

> Backend SSE endpoint must be running at `http://localhost:3001/api/agent/run`

## Out of Scope

- Retry logic or connection recovery
- Request validation or schema checking (handled by backend)
- Rate limiting (handled by backend)
- WebSocket or other streaming protocols
- Modifying backend SSE implementation

## Notes

- Next.js 13+ App Router Route Handlers support `ReadableStream` responses natively
- The `Response` constructor can accept a `ReadableStream` body, enabling true streaming
- Must not await `response.text()` or `response.json()` as that buffers the entire stream
- Consider forwarding authentication headers (Authorization, cookies) if needed
- Example minimal implementation structure:
  ```typescript
  export async function POST(request: Request) {
    const body = await request.text();
    const backendRes = await fetch('http://localhost:3001/api/agent/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    return new Response(backendRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  }
  ```
