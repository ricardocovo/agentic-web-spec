# Story 7: Hide Agent Action Buttons

## Summary

**As a** user,
**I want** agent action buttons to be hidden when I disable their respective flags,
**So that** I only see actions I have enabled.

## Description

In `frontend/app/agents/[slug]/page.tsx`, conditionally render three action buttons based on their corresponding feature flags:

- "Create PRD on Repo" → `featureFlags.generatePrd`
- "Create Docs on Repo" → `featureFlags.generateTechSpecs`
- "Create GitHub Issues" → `featureFlags.createGithubIssues`

## Acceptance Criteria

- [ ] When `featureFlags.generatePrd` is `false`, the "Create PRD on Repo" button is not rendered.
- [ ] When `featureFlags.generateTechSpecs` is `false`, the "Create Docs on Repo" button is not rendered.
- [ ] When `featureFlags.createGithubIssues` is `false`, the "Create GitHub Issues" button is not rendered.
- [ ] When all flags are `true`, all buttons render normally (no change from current behavior).
- [ ] Buttons can be hidden independently (e.g., hide PRD but show the other two).
- [ ] No layout shifts or broken styles when one or more buttons are hidden.
- [ ] TypeScript compiles without errors.

## Tasks

1. In `frontend/app/agents/[slug]/page.tsx`, import `useApp` and read `featureFlags`.
2. Identify the "Create PRD on Repo" button and wrap in `{featureFlags.generatePrd && (...)}`.
3. Identify the "Create Docs on Repo" button and wrap in `{featureFlags.generateTechSpecs && (...)}`.
4. Identify the "Create GitHub Issues" button and wrap in `{featureFlags.createGithubIssues && (...)}`.
5. Verify layout is correct with various flag combinations.
6. Verify `npx tsc --noEmit` passes.

## Dependencies

- **Story 2** (Expose flags via React context) — requires `featureFlags` in context.

## Out of Scope

- Settings page or toggle UI (Story 3).
- Hiding the entire agent page or other UI elements.
- Disabling agents at the backend/routing level.

## Notes

- The action buttons may only appear on specific agent slugs (e.g., `prd-writer`, `technical-docs`). Ensure the conditional only applies to the correct buttons based on slug context.
- Use `&&` conditional rendering so hidden buttons don't mount or trigger side effects.
