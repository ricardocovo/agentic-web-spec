# User Story: Verify Handoff Context Reaches Backend

## Summary

**As a** developer,
**I want** to confirm that the handoff context is present in the network request after the fix,
**So that** I can be confident the multi-agent pipeline is functioning as intended.

## Description

After the code fix in `fix-context-filter`, this story covers manual and/or automated verification that the `context` field in the POST body to `/api/agent/run` contains the deep research output when the PRD (or Technical Docs) agent is triggered via handoff.

## Acceptance Criteria

- [ ] Given the fix is applied, when Deep Research completes and the user clicks "Send to PRD", then opening the browser's network tab shows the POST to `/api/agent/run` includes a non-empty `context` field containing the deep research output.
- [ ] Given no handoff occurred, when the user sends a message to any agent directly, then the `context` field is either absent or contains only prior assistant turns (no regression).
- [ ] Given a full pipeline run (Deep Research → PRD → Technical Docs), when each handoff is triggered, then each agent's first response visibly incorporates the prior agent's output.

## Tasks

- [ ] Open the app in a browser and run the Deep Research agent on a cloned repo
- [ ] Click "Send to PRD", open browser DevTools → Network, send a message
- [ ] Confirm the POST body's `context` field contains the deep research text
- [ ] Confirm the PRD agent response references content from the deep research output
- [ ] Repeat the same check for the PRD → Technical Docs handoff

## Dependencies

- Depends on: [fix-context-filter.md](fix-context-filter.md)

## Out of Scope

- Automated end-to-end tests (manual verification is sufficient for this fix)

## Notes

- No code changes in this story — it is a verification/QA step only.
- The backend logs the `context` length if you add a `console.log` temporarily in `backend/src/routes/agent.ts`.
