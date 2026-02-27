# User Story: Integrate Dropdown into Nav

## Summary

**As an** app user,
**I want** the settings dropdown to appear in the navigation bar instead of the standalone gear button and Admin link,
**So that** I can access both GitHub PAT configuration and Admin from a single, clean entry point.

## Description

Update `frontend/components/Nav.tsx` to replace the current inline gear `<button>` with the new `<SettingsDropdown>` component, and remove the "Admin" entry from the `NAV_LINKS` array. The PAT modal state (`showPAT` / `setShowPAT`) remains in `Nav.tsx` and is passed to the dropdown via the `onOpenPAT` prop. The `PATModal` continues to render conditionally at the same level as today.

After this change:
- The nav bar shows only: **Agents**, **KDB**, **Dashboard** (no more Admin link)
- The gear icon in the top-right opens a dropdown with "GitHub PAT" and "Admin" options
- Everything else in `Nav.tsx` remains unchanged

## Acceptance Criteria

- [ ] Given the nav bar renders, when the user views the nav links, then only "Agents", "KDB", and "Dashboard" are visible (Admin is removed).
- [ ] Given the nav bar renders, when the user looks at the top-right corner, then the gear icon is present and clicking it opens the settings dropdown.
- [ ] Given the user clicks "GitHub PAT" in the dropdown, when the dropdown closes, then the PAT modal appears.
- [ ] Given the user clicks "Admin" in the dropdown, then the browser navigates to `/admin`.
- [ ] Given the user is on the `/admin` page, when they open the dropdown, then the "Admin" item is visually highlighted as active.
- [ ] Given the PAT modal is open, when the user closes it, then the nav returns to its default state with no dropdown or modal visible.
- [ ] Given the existing `SlidersHorizontal` import was only used for the Admin nav link, when it is no longer in `NAV_LINKS`, then the unused import is removed from `Nav.tsx` (the icon is now imported inside `SettingsDropdown.tsx` instead).

## Tasks

- [ ] Remove the `{ href: "/admin", label: "Admin", icon: SlidersHorizontal }` entry from the `NAV_LINKS` array in `Nav.tsx`
- [ ] Remove the `SlidersHorizontal` import from `Nav.tsx` (it moves to `SettingsDropdown.tsx`)
- [ ] Import `SettingsDropdown` from `@/components/SettingsDropdown` in `Nav.tsx`
- [ ] Replace the inline `<button onClick={() => setShowPAT(true)}>` gear button with `<SettingsDropdown onOpenPAT={() => setShowPAT(true)} />`
- [ ] Remove the `Settings` icon import from `Nav.tsx` if it is no longer directly used (it moves to `SettingsDropdown.tsx`)
- [ ] Verify that the `PATModal` still renders conditionally via `{showPAT && <PATModal onClose={() => setShowPAT(false)} />}` — no change needed here
- [ ] Visually verify the nav bar layout is unchanged aside from the removed Admin link

## Dependencies

- Depends on: **Create SettingsDropdown Component** — the `SettingsDropdown` component must exist before it can be imported.

## Out of Scope

- Changing the PATModal component
- Changing the Admin page
- Adding new menu items to the dropdown
- Mobile/responsive nav changes (burger menu etc.)

## Notes

- The `Settings` and `SlidersHorizontal` icon imports move from `Nav.tsx` to `SettingsDropdown.tsx`. Make sure to clean up unused imports.
- The `showPAT` state stays in `Nav.tsx` because it controls `PATModal` rendering at the same level. The dropdown component doesn't need to know about modal state — it just calls `onOpenPAT`.
- The comment `{/* Settings */}` above the old button can be updated or kept for the new `<SettingsDropdown>` component.
