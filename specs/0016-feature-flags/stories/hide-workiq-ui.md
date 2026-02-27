# Story 6: Hide WorkIQ UI Elements

## Summary

**As a** user,
**I want** the WorkIQ button and context chips to be hidden when I disable the WorkIQ flag,
**So that** the chat input area only shows features I have enabled.

## Description

When `featureFlags.workiq` is `false`, hide the WorkIQ (BrainCircuit) button and any WorkIQ-related context chips in `ChatInterface.tsx`. When `true` (default), render normally.

## Acceptance Criteria

- [ ] When `featureFlags.workiq` is `false`, the WorkIQ / BrainCircuit button in `ChatInterface.tsx` is not rendered.
- [ ] When `featureFlags.workiq` is `false`, WorkIQ context chips in the chat input area are not rendered.
- [ ] When `featureFlags.workiq` is `true`, all WorkIQ elements render normally.
- [ ] No layout shifts or broken styles when elements are hidden.
- [ ] TypeScript compiles without errors.

## Tasks

1. In `frontend/components/ChatInterface.tsx`, read `featureFlags` from `useApp()` (may already be imported from Story 5).
2. Wrap the WorkIQ / BrainCircuit button in a conditional: `{featureFlags.workiq && (<WorkIQButton />)}`.
3. Wrap WorkIQ context chips in a conditional: `{featureFlags.workiq && (<WorkIQChips />)}`.
4. Verify no layout issues when elements are hidden.
5. Verify `npx tsc --noEmit` passes.

## Dependencies

- **Story 2** (Expose flags via React context) — requires `featureFlags` in context.

## Out of Scope

- Settings page or toggle UI (Story 3).
- Hiding any elements not related to WorkIQ.

## Notes

- The BrainCircuit icon import from `lucide-react` can remain even when the button is hidden — only rendering is conditional.
- Context chips may be rendered in a loop; ensure the conditional wraps the correct element(s).
