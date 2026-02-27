# Story 3: Create Settings Page with Toggles

## Summary

**As a** user,
**I want** a settings page with toggle switches for each feature flag,
**So that** I can enable or disable features to customize my experience.

## Description

Create a new page at `frontend/app/settings/page.tsx` that displays 5 labeled toggle switches — one for each feature flag. Changes take effect immediately (no save button). Include a "Reset to defaults" action.

## Acceptance Criteria

- [ ] Page is accessible at `/settings`.
- [ ] Page has `"use client"` directive.
- [ ] Displays 5 toggle switches, one per feature flag.
- [ ] Each toggle shows a human-readable label (e.g., "Knowledge Base (KBD)", "WorkIQ Integration") and a brief description.
- [ ] Toggling a switch immediately updates the flag via `useApp().setFeatureFlags`.
- [ ] Toggle state reflects current `featureFlags` from context.
- [ ] A "Reset to defaults" button sets all flags back to `true`.
- [ ] Uses existing Tailwind theme tokens (`bg-surface-2`, `text-text-primary`, `border-border`, `text-accent`, etc.).
- [ ] Toggles are keyboard-accessible with proper ARIA attributes.
- [ ] TypeScript compiles without errors.

## Tasks

1. Create `frontend/app/settings/page.tsx` with `"use client"` directive.
2. Define flag metadata array (key, label, description) for each of the 5 flags.
3. Read `featureFlags` and `setFeatureFlags` from `useApp()`.
4. Render a toggle switch for each flag.
5. Implement toggle handler that spreads current flags and flips the target flag.
6. Implement "Reset to defaults" button.
7. Style using Tailwind theme tokens.
8. Add ARIA labels and keyboard support to toggles.
9. Verify `npx tsc --noEmit` passes.

## Dependencies

- **Story 2** (Expose flags via React context) — requires `featureFlags` and `setFeatureFlags` in context.

## Out of Scope

- Navigation link to this page (Story 4).
- Per-flag granular undo.

## Notes

- Use a `<button>` with `role="switch"` and `aria-checked` for accessible toggle switches, or use a styled `<input type="checkbox">`.
- Consider using `lucide-react` icons for visual polish.
