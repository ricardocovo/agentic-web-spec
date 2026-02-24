# User Story: Add Admin Nav Link

## Summary

**As a** developer or power user,
**I want** an "Admin" link in the main navigation bar,
**So that** I can reach the agent administration page from any page in the app without manually typing the URL.

## Description

The `NAV_LINKS` array in `frontend/components/Nav.tsx` is updated to include a new entry for the admin page. The link follows the same pattern as existing links (object with `href` and `label` fields) and benefits automatically from the Nav's existing active-link highlighting logic. No other changes to the Nav component layout or styling are required.

## Acceptance Criteria

- [ ] Given the user is on any page in the app, when they view the navigation bar, then an "Admin" link is visible alongside the existing "Agents", "KDB", and "Dashboard" links.
- [ ] Given the user clicks the "Admin" nav link, when the click is processed, then the browser navigates to `/admin`.
- [ ] Given the user is on the `/admin` page, when the navigation bar renders, then the "Admin" link receives the active/highlighted styling (consistent with how other links are highlighted when their route is active).
- [ ] Given the user is NOT on the `/admin` page, when the navigation bar renders, then the "Admin" link does not receive active styling.

## Tasks

- [ ] Add `{ href: "/admin", label: "Admin" }` to the `NAV_LINKS` array in `frontend/components/Nav.tsx`
- [ ] Verify that the existing active-link detection logic in `Nav.tsx` correctly activates the "Admin" link for the `/admin` route (no special-case handling should be needed since `/admin` is a unique prefix)

## Dependencies

> Depends on: The `/admin` page existing (frontend admin page story) — the link can be added independently, but the page must exist for the link to be functional end-to-end.

## Out of Scope

- Changing the visual design or layout of the Nav component
- Adding an icon or badge to the "Admin" nav link
- Restricting the "Admin" link visibility based on user role or environment

## Notes

- The existing active-link logic in `Nav.tsx` handles the special case where `/` also matches `/agents/**`. The `/admin` route has no such ambiguity — `pathname === "/admin"` or `pathname.startsWith("/admin")` will work correctly with the existing logic.
- The "Admin" link should be appended at the end of `NAV_LINKS` so it appears as the rightmost item in the nav, consistent with its secondary / power-user nature.
