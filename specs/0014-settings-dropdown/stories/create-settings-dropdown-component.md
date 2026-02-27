# User Story: Create SettingsDropdown Component

## Summary

**As a** developer,
**I want** a self-contained `SettingsDropdown` component that renders a gear icon and a popover menu,
**So that** it can be dropped into the Nav to consolidate settings-related actions in one place.

## Description

Build a new `"use client"` component at `frontend/components/SettingsDropdown.tsx`. The component renders the existing gear icon (`Settings` from lucide-react) as a button. Clicking the button toggles an absolutely-positioned dropdown panel below it, right-aligned. The dropdown contains two menu items:

1. **GitHub PAT** — displays a `Key` icon and the label "GitHub PAT". Clicking it calls the `onOpenPAT` callback prop and closes the dropdown.
2. **Admin** — displays a `SlidersHorizontal` icon and the label "Admin". It is a Next.js `<Link>` that navigates to `/admin` and closes the dropdown.

The dropdown closes when the user clicks outside of it (via a `mousedown` listener on `document`) or presses the Escape key. The component uses existing Tailwind theme tokens for all styling.

## Acceptance Criteria

- [ ] Given the SettingsDropdown is rendered, when the user clicks the gear icon, then a dropdown menu appears below the icon, right-aligned.
- [ ] Given the dropdown is open, when the user clicks "GitHub PAT", then the `onOpenPAT` callback is invoked and the dropdown closes.
- [ ] Given the dropdown is open, when the user clicks "Admin", then the browser navigates to `/admin` and the dropdown closes.
- [ ] Given the dropdown is open, when the user clicks outside the dropdown, then the dropdown closes.
- [ ] Given the dropdown is open, when the user presses the Escape key, then the dropdown closes.
- [ ] Given the dropdown is closed, the dropdown panel is not present in the DOM (or is hidden with appropriate styles).
- [ ] Given the user is currently on the `/admin` route, the "Admin" menu item displays with `text-accent` styling to indicate the active page.

## Tasks

- [ ] Create `frontend/components/SettingsDropdown.tsx` with `"use client"` directive
- [ ] Define the component props interface: `{ onOpenPAT: () => void }`
- [ ] Add `useState<boolean>` for `open` state to control dropdown visibility
- [ ] Render the gear icon button with existing hover styles (`text-muted hover:text-text-primary hover:bg-surface-2`)
- [ ] Render the dropdown panel when `open` is true, positioned with `absolute right-0 top-full mt-2`
- [ ] Style the dropdown panel with `bg-surface-2 border border-border rounded-lg shadow-lg`
- [ ] Add "GitHub PAT" menu item with `Key` icon (16px) that calls `onOpenPAT` and sets `open` to false
- [ ] Add "Admin" menu item as a Next.js `<Link href="/admin">` with `SlidersHorizontal` icon (16px) that sets `open` to false on click
- [ ] Style menu items with `text-text-secondary hover:text-text-primary hover:bg-background` and padding/gap for comfortable click targets
- [ ] Use `usePathname()` to detect the `/admin` route and apply `text-accent` to the Admin item when active
- [ ] Add a `useRef` for the dropdown container element
- [ ] Add a `useEffect` with a `mousedown` document listener that closes the dropdown when clicking outside the ref
- [ ] Add a `useEffect` with a `keydown` document listener that closes the dropdown on Escape key press
- [ ] Clean up event listeners on unmount (return cleanup functions from `useEffect`)
- [ ] Export the component as a named export

## Dependencies

- Depends on: None — this is a standalone component that can be built and tested independently.

## Out of Scope

- Wiring the component into `Nav.tsx` (covered in the "Integrate Dropdown into Nav" story)
- Adding ARIA attributes and advanced keyboard navigation (covered in the "Keyboard and Accessibility Support" story)
- Role-based visibility of menu items

## Notes

- The dropdown wrapper should use `position: relative` on the outer container so that the absolutely-positioned dropdown panel aligns correctly.
- Consider using `z-50` or similar z-index on the dropdown panel to ensure it renders above other content.
- The `Key` icon is already imported in `PATModal.tsx` — it's available from `lucide-react`.
- Keep the component simple and focused; future menu items can be added by extending the items list.
