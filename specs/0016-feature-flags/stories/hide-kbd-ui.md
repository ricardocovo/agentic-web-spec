# Story 5: Hide KBD Nav and Space Selector

## Summary

**As a** user,
**I want** the KBD nav link and Space selector to be hidden when I disable the KBD flag,
**So that** I don't see features I've turned off.

## Description

When `featureFlags.kbd` is `false`, hide the KBD navigation link in `Nav.tsx` and the Space selector component in `ChatInterface.tsx`. When `true` (default), render normally.

## Acceptance Criteria

- [ ] When `featureFlags.kbd` is `false`, the KBD nav link in `Nav.tsx` is not rendered.
- [ ] When `featureFlags.kbd` is `false`, the `SpaceSelector` (or equivalent space selection UI) in `ChatInterface.tsx` is not rendered.
- [ ] When `featureFlags.kbd` is `true`, both elements render normally (no change from current behavior).
- [ ] No layout shifts or broken styles when elements are hidden.
- [ ] TypeScript compiles without errors.

## Tasks

1. In `frontend/components/Nav.tsx`, import `useApp` and read `featureFlags`.
2. Wrap the KBD nav link in a conditional: `{featureFlags.kbd && (<KbdLink />)}`.
3. In `frontend/components/ChatInterface.tsx`, read `featureFlags` from context.
4. Wrap the Space selector UI in a conditional: `{featureFlags.kbd && (<SpaceSelector />)}`.
5. Verify no layout issues when elements are hidden.
6. Verify `npx tsc --noEmit` passes.

## Dependencies

- **Story 2** (Expose flags via React context) — requires `featureFlags` in context.

## Out of Scope

- Settings page or toggle UI (Story 3).
- Hiding any other elements besides KBD nav link and Space selector.

## Notes

- Use simple conditional rendering (`&&`) rather than CSS `display: none` so hidden components don't mount or make unnecessary API calls.
- If `Nav.tsx` doesn't already import `useApp`, it will need to be added (ensure the component has `"use client"` if not already).
