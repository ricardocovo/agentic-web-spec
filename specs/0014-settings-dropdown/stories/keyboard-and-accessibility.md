# User Story: Keyboard and Accessibility Support

## Summary

**As a** user navigating with a keyboard or assistive technology,
**I want** the settings dropdown to be fully accessible with proper ARIA semantics and keyboard interactions,
**So that** I can discover, open, navigate, and dismiss the dropdown without a mouse.

## Description

Enhance the `SettingsDropdown` component with proper ARIA attributes and keyboard interaction patterns following the WAI-ARIA menu button pattern. The gear icon button should announce itself as a menu trigger, the dropdown should be marked as a menu, and each item should be a menuitem. Focus management should move focus into the menu when it opens and return it to the trigger when it closes.

## Acceptance Criteria

- [ ] Given the gear icon button, it has `aria-haspopup="true"` and `aria-expanded` set to the current open state (`"true"` or `"false"`).
- [ ] Given the dropdown panel, it has `role="menu"` and an appropriate `aria-label` (e.g., "Settings menu").
- [ ] Given each menu item, it has `role="menuitem"`.
- [ ] Given the dropdown is open, when the user presses `Escape`, then the dropdown closes and focus returns to the gear icon button.
- [ ] Given the gear icon button is focused, when the user presses `Enter` or `Space`, then the dropdown opens.
- [ ] Given the dropdown is open, when the user presses `Tab`, then the dropdown closes (standard behavior — focus moves to next focusable element).
- [ ] Given the gear icon button, it has an accessible label (via `aria-label="Settings"` or a visible label).

## Tasks

- [ ] Add `aria-haspopup="true"` to the gear icon button
- [ ] Add `aria-expanded={open}` to the gear icon button (dynamically reflects state)
- [ ] Add `aria-label="Settings"` to the gear icon button
- [ ] Add `role="menu"` to the dropdown panel container
- [ ] Add `aria-label="Settings menu"` to the dropdown panel container
- [ ] Add `role="menuitem"` to each menu item (both "GitHub PAT" and "Admin")
- [ ] Add `tabIndex={0}` to menu items so they are focusable
- [ ] Move focus to the first menu item when the dropdown opens (use a ref + `useEffect`)
- [ ] Return focus to the gear icon button when the dropdown closes via Escape
- [ ] Ensure the Escape key handler from the base component story correctly restores focus

## Dependencies

- Depends on: **Create SettingsDropdown Component** — ARIA attributes and focus management are added on top of the base component.

## Out of Scope

- Arrow key navigation between menu items (nice-to-have for a future iteration, not required for initial release)
- Screen reader testing across multiple AT tools (manual QA step, not an implementation task)
- Roving `tabindex` pattern (simplifying to `tabIndex={0}` on all items for now)

## Notes

- The WAI-ARIA Authoring Practices for menu buttons recommend moving focus into the menu on open. For a simple 2-item menu, this is straightforward: focus the first `[role="menuitem"]` element.
- The `Enter`/`Space` behavior on the gear button is handled natively by `<button>` elements in browsers, so no extra JavaScript is needed for that.
- Reference: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
