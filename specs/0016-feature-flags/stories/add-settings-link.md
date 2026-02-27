# Story 4: Add Settings Link to Dropdown

## Summary

**As a** user,
**I want** a "Feature Flags" link in the settings dropdown menu,
**So that** I can easily navigate to the settings page.

## Description

Add a new menu item to the existing `SettingsDropdown` component (`frontend/components/SettingsDropdown.tsx`) that links to `/settings`.

## Acceptance Criteria

- [ ] A "Feature Flags" (or "Settings") menu item appears in the `SettingsDropdown`.
- [ ] Clicking the menu item navigates to `/settings`.
- [ ] The menu item uses consistent styling with existing dropdown items.
- [ ] Uses a `lucide-react` icon (e.g., `ToggleLeft` or `Settings`).
- [ ] TypeScript compiles without errors.

## Tasks

1. Import `Link` from `next/link` (or use `useRouter`) and appropriate icon from `lucide-react`.
2. Add a new menu item to `SettingsDropdown.tsx` that links to `/settings`.
3. Style consistently with existing dropdown items.
4. Verify `npx tsc --noEmit` passes.

## Dependencies

- **Story 3** (Create settings page) — the target page must exist.

## Out of Scope

- Settings page implementation (Story 3).
- Badge or indicator for non-default flag state.

## Notes

- Review existing items in `SettingsDropdown.tsx` and match the pattern (icon + label + click handler).
