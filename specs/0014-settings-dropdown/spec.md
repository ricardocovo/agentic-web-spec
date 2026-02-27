# Feature: Settings Dropdown

## Overview

Turn the gear icon in the top-right corner of the Nav bar into a "Settings" dropdown menu. Currently the gear opens the PAT modal directly, and Admin is a separate nav link. The new behavior: clicking the gear opens a dropdown with two options — "GitHub PAT" (opens the existing PAT modal) and "Admin" (navigates to `/admin`). The Admin link is removed from the main nav bar since it moves into this dropdown. This declutters the primary navigation and groups configuration-related actions under a single entry point.

## Problem Statement

The nav bar currently mixes primary content destinations (Agents, KDB, Dashboard) with a configuration page (Admin). The gear icon only opens the PAT modal, providing no discoverability for other settings-related actions. As more settings or admin surfaces are added, scattering them across the nav bar and standalone icons won't scale. Consolidating settings-related actions into a single dropdown keeps the nav focused on content areas and provides a natural home for future configuration options.

## Goals

- [ ] Consolidate settings-related actions (GitHub PAT, Admin) under a single gear-icon dropdown
- [ ] Remove the Admin link from the primary nav bar to reduce clutter
- [ ] Maintain existing PAT modal behavior (opening, closing, token management)
- [ ] Maintain existing Admin page navigation
- [ ] Support keyboard dismissal (Escape) and click-outside-to-close behavior

## Non-Goals

- Adding new settings options beyond GitHub PAT and Admin (future work)
- Changing the visual design of the PAT modal itself
- Adding role-based visibility (e.g., hiding Admin from non-admin users) — that is a separate concern
- Changing the Admin page content or layout

## Target Users / Personas

| Persona | Description |
|---|---|
| App User | Any user of the application who needs to configure their GitHub Personal Access Token to authenticate API operations |
| Admin User | A user with administrative privileges who manages agent configurations via the `/admin` page |

## Functional Requirements

1. The system shall render a gear icon button in the top-right corner of the navigation bar (same position as today)
2. The system shall open a dropdown menu when the gear icon is clicked
3. The dropdown shall contain a "GitHub PAT" item with a Key icon that, when clicked, opens the existing PAT modal
4. The dropdown shall contain an "Admin" item with a SlidersHorizontal icon that navigates to `/admin`
5. The dropdown shall close when the user clicks outside of it
6. The dropdown shall close when the user presses the Escape key
7. The dropdown shall close after selecting either menu item
8. The system shall remove the "Admin" entry from the `NAV_LINKS` array in `Nav.tsx`
9. The Admin nav link's active-state indicator (`/admin` route highlighting) shall transfer to the dropdown's Admin item when the user is on the `/admin` page

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Dropdown must open/close instantly with no perceptible delay; no additional network requests on toggle |
| Security | No change to existing security model; PAT handling remains in the PATModal |
| Accessibility | Dropdown must be keyboard-navigable; Escape key closes the menu; appropriate ARIA attributes (`aria-expanded`, `role="menu"`, `role="menuitem"`) |
| Scalability | Component should be easy to extend with additional menu items in the future |

## UX / Design Considerations

- **Trigger**: The existing gear icon (`Settings` from lucide-react, 18px) stays in the same top-right position. Hover styles remain: `text-muted → text-text-primary`, `bg-surface-2` on hover.
- **Dropdown panel**: Positioned below and right-aligned to the gear icon. Styled with `bg-surface-2`, `border border-border`, `rounded-lg`, `shadow-lg`. Width auto-fits content (roughly 180–200px).
- **Menu items**: Each item is a row with an icon (16px) + label. Hover state: `bg-background` background, `text-text-primary` text. Default state: `text-text-secondary`.
- **Active indicator**: When on the `/admin` route, the Admin item should show `text-accent` to indicate the current page.
- **Animation**: Optional subtle fade-in / scale transition on open (CSS transition, not a hard requirement).
- **Key flow 1**: User clicks gear → dropdown appears → clicks "GitHub PAT" → dropdown closes → PAT modal opens
- **Key flow 2**: User clicks gear → dropdown appears → clicks "Admin" → dropdown closes → navigates to `/admin`
- **Key flow 3**: User clicks gear → dropdown appears → clicks outside or presses Escape → dropdown closes

## Technical Considerations

- **New component**: `frontend/components/SettingsDropdown.tsx` — a `"use client"` component that encapsulates the gear button, dropdown state, click-outside handling, and Escape key listener.
- **Click-outside handling**: Use a `useEffect` with a `mousedown` event listener on `document`, checking if the click target is outside the dropdown ref.
- **Escape key handling**: Use a `useEffect` with a `keydown` event listener on `document` for the `Escape` key.
- **Icons**: Import `Settings`, `Key`, `SlidersHorizontal` from `lucide-react`.
- **Navigation**: The Admin item uses Next.js `<Link>` for client-side navigation.
- **Props**: The component accepts an `onOpenPAT: () => void` callback so `Nav.tsx` can wire it to `setShowPAT(true)`.
- **State**: Single `boolean` state (`open`) managed with `useState` inside `SettingsDropdown`.
- **Theming**: All colors use existing Tailwind theme tokens (`bg-surface-2`, `text-text-primary`, `border-border`, `text-accent`, `text-text-secondary`, `bg-background`, `text-muted`).

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| `Nav.tsx` | Internal | Host component that renders the dropdown and provides the `onOpenPAT` callback |
| `PATModal.tsx` | Internal | Existing modal opened via the "GitHub PAT" menu item — no changes needed |
| `lucide-react` | External | Icon library already in use — `Settings`, `Key`, `SlidersHorizontal` |
| Next.js `Link` | External | Used for client-side navigation to `/admin` |
| `/admin` page | Internal | Existing admin page — no changes needed |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Click-outside handler interferes with PAT modal interactions | Low | Med | Close dropdown *before* opening PAT modal; ensure event listeners are cleaned up on unmount |
| Users can't find Admin after it moves out of the nav | Low | Med | Gear icon is a familiar settings affordance; Admin item in dropdown is clearly labeled with the same icon |
| Dropdown positioning clips on small screens | Low | Low | Right-align dropdown to gear icon; test at mobile breakpoints |

## Success Metrics

- Metric 1: Admin page remains accessible with the same number of clicks (1 click on gear + 1 click on Admin = 2 clicks, previously 1 click on nav link — acceptable trade-off for cleaner nav)
- Metric 2: PAT modal opens correctly via the dropdown with no regressions
- Metric 3: No visual regressions in the nav bar layout on desktop and tablet viewports

## Open Questions

- [ ] Should the dropdown show a visual indicator (dot/badge) when no PAT is configured, to prompt the user to set one up?
- [ ] Should there be a divider between "GitHub PAT" and "Admin" items, or are they visually distinct enough with just spacing?

## User Stories

| Story | File |
|---|---|
| Create SettingsDropdown Component | [stories/create-settings-dropdown-component.md](stories/create-settings-dropdown-component.md) |
| Integrate Dropdown into Nav | [stories/integrate-dropdown-into-nav.md](stories/integrate-dropdown-into-nav.md) |
| Keyboard and Accessibility Support | [stories/keyboard-and-accessibility.md](stories/keyboard-and-accessibility.md) |
