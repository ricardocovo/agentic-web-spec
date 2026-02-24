# Feature: SSE Streaming Fix

## Overview

Fix Server-Sent Events (SSE) streaming so that agent thinking and response content renders token-by-token in real time, instead of appearing all at once at the end. The issue stems from Next.js rewrite proxy buffering, which prevents the frontend from receiving incremental SSE events despite the backend correctly emitting them.

## Problem Statement

Currently, when users submit prompts to AI agents via the Web-Spec app, the agent's thinking process and response content appear all at once after the entire generation completes, rather than streaming progressively. This creates a poor user experience where users wait without feedback, unsure if the system is working.

The root cause is that the Next.js rewrite proxy (`next.config.mjs`) buffers SSE responses before delivering them to the client. While the backend correctly emits SSE events incrementally via `res.write()` and the frontend has streaming UI components (`StreamingBubble`, reasoning block), the proxy layer prevents real-time delivery.

## Goals

- [x] Enable real-time token-by-token rendering of agent responses
- [x] Display thinking/reasoning process as it happens
- [x] Bypass Next.js rewrite proxy buffering for SSE endpoints
- [x] Fix frontend SSE parser to correctly handle partial streaming chunks
- [x] Maintain existing backend SSE implementation without changes
- [x] Preserve existing UI components and streaming interface

## Non-Goals

- Refactoring backend SSE implementation (already works correctly)
- Changing UI components or streaming interface design
- Supporting WebSocket or other streaming protocols
- Adding retry logic or connection recovery (can be addressed separately)
- Modifying the existing rewrite proxy for other endpoints

## Target Users / Personas

| Persona | Description |
|---|---|
| Developer / Technical Writer | Uses Web-Spec app to generate research, PRDs, and technical documentation for GitHub repositories. Submits prompts to AI agents and monitors real-time streaming responses. |
| Product Manager | Reviews AI-generated documentation and specifications, expects responsive feedback to know the system is actively processing requests. |

## Functional Requirements

1. The system shall stream agent response content token-by-token to the frontend without buffering delays
2. The system shall stream agent reasoning/thinking process in real-time as events are emitted
3. The system shall provide a Next.js Route Handler that forwards requests to the backend SSE endpoint
4. The system shall properly parse SSE events even when TCP chunks contain partial lines
5. The system shall set appropriate HTTP headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no`) for unbuffered streaming
6. The system shall maintain backward compatibility with existing frontend streaming UI components
7. The system shall handle all existing SSE event types (`event: chunk`, `event: reasoning`, `event: done`, `event: error`)

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Sub-100ms latency from backend event emission to frontend rendering |
| Security | Route handler must not introduce auth bypass or expose internal backend URLs |
| Accessibility | Streaming content must remain accessible to screen readers (existing requirement) |
| Scalability | Solution must support concurrent SSE connections from multiple users |
| Maintainability | Route handler logic should be simple and follow Next.js best practices |

## UX / Design Considerations

- **No UX changes required**: Existing `StreamingBubble` component (pulsing cursor) and reasoning block (collapsible Brain panel) already support streaming
- **Key flow**: User submits prompt → sees pulsing cursor immediately → reasoning tokens appear incrementally → response content streams word-by-word → completion indicator shows when done
- **Visual feedback**: The streaming experience will now match user expectations set by ChatGPT and similar tools

## Technical Considerations

**Architecture**:
- Monorepo structure: `frontend/` (Next.js 14 App Router) + `backend/` (Express 4 + TypeScript ESM)
- Current flow: Frontend → Next.js rewrite proxy → Backend SSE endpoint
- New flow: Frontend → Next.js Route Handler (direct pipe) → Backend SSE endpoint

**Backend (no changes needed)**:
- `backend/src/routes/agent.ts` already implements correct SSE streaming with `res.write()`
- Emits `event: chunk`, `event: reasoning`, `event: done`, `event: error`

**Frontend**:
- Consumer: `frontend/app/agents/[slug]/page.tsx` reads stream via `res.body.getReader()`
- UI: `frontend/components/ChatInterface.tsx` with `StreamingBubble` and reasoning block
- Issue: Line parser uses `text.split("\n")` per chunk, fails when TCP delivers partial lines

**Route Handler Implementation**:
- Path: `frontend/app/api/agent/run/route.ts`
- Method: POST
- Forward to: `http://localhost:3001/api/agent/run`
- Must pipe `ReadableStream` body directly without awaiting full response

**SSE Parsing Fix**:
- Add `lineBuffer` variable scoped outside the read loop
- Accumulate text from each chunk into buffer
- Split buffer on `\n`, process complete lines, keep last partial segment
- Prevents losing data when `event: chu` and `nk` arrive in separate chunks

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| Backend SSE endpoint | Internal | Already functional at `http://localhost:3001/api/agent/run` |
| Next.js App Router | Framework | Route handler requires Next.js 13+ App Router |
| Existing UI components | Internal | `StreamingBubble`, reasoning block must remain compatible |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Route handler introduces auth bypass | Medium | High | Review auth middleware and ensure credentials/headers are forwarded |
| Partial line buffer logic has edge cases | Medium | Medium | Add explicit handling for `\r\n` vs `\n`, test with various chunk sizes |
| Backend connection pooling issues with streaming | Low | Medium | Monitor connection lifecycle, ensure proper cleanup on disconnect |
| Breaking existing non-streaming API calls | Low | High | Only apply route handler to `/api/agent/run`, leave rewrite proxy for other routes |

## Success Metrics

- Latency: Time from backend `res.write()` to frontend DOM update < 100ms (measurable via browser DevTools)
- User feedback: Developers report seeing token-by-token streaming in real-time
- Visual confirmation: Recording shows cursor pulsing and text appearing progressively, not in chunks
- Error rate: No increase in SSE connection errors or parsing failures

## Open Questions

- [x] Should we add reconnection logic if SSE connection drops? → Out of scope for this fix, can address separately
- [x] Should we apply this route handler pattern to other streaming endpoints? → Only `/api/agent/run` needs it currently
- [x] Do we need rate limiting on the route handler? → Rely on existing backend rate limiting

## User Stories

| Story | File |
|---|---|
| Create Next.js Route Handler for unbuffered SSE forwarding | [stories/create-route-handler.md](stories/create-route-handler.md) |
| Fix SSE line parser to handle partial chunks | [stories/fix-line-parser.md](stories/fix-line-parser.md) |
| Update fetch URL to use new route handler | [stories/update-fetch-url.md](stories/update-fetch-url.md) |
