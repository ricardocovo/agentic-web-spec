# 0016 — Feature Flags

## Overview

A frontend-only configuration system that allows users to toggle the visibility of five features through a settings UI. All state is persisted in `localStorage` and exposed via the existing React context (`useApp()`). No backend changes are required.

## Problem Statement

Currently, all features in Web-Spec are always visible. There is no way for a user to hide features they do not use or that are not yet ready for their workflow. This creates a cluttered UI and makes it impossible to soft-launch or progressively roll out features on a per-user basis without code changes.

## Goals

- Allow users to toggle visibility of 5 specific features via a settings page.
- Persist toggle state in `localStorage` so preferences survive page refreshes.
- Default all flags to **enabled** (`true`) so existing behavior is preserved for all users.
- Expose flags through the existing `AppContext` so any component can read them via `useApp()`.
- Provide a clean, accessible settings page at `/settings` with labeled toggle switches.

## Non-Goals

- Server-side feature flag management or backend storage.
- Role-based or team-level flag configuration.
- A/B testing or analytics integration.
- Flagging features not listed in the five items below.
- Persisting flags across devices or browsers (localStorage is browser-local).

## Target Users

- **Primary:** Web-Spec end users who want to customize which features are visible.
- **Secondary:** Developers and admins who want to soft-hide features during development.

## Functional Requirements

### FR-1: Feature Flags Storage Layer

- Define a `FeatureFlags` interface with five boolean fields: `kbd`, `workiq`, `generatePrd`, `generateTechSpecs`, `createGithubIssues`.
- Store flags in `localStorage` under the key `web_spec_feature_flags` as a JSON string.
- Provide `getFeatureFlags()` and `saveFeatureFlags()` helper functions in `frontend/lib/storage.ts`.
- Default all flags to `true` when no stored value exists.
- Merge stored flags with defaults so newly added flags are always present.

### FR-2: React Context Integration

- Add `featureFlags: FeatureFlags` and `setFeatureFlags: (flags: FeatureFlags) => void` to the existing `AppContext`.
- Hydrate flags from `localStorage` on mount.
- Persist flags to `localStorage` whenever they change.

### FR-3: Settings Page

- Create a new page at `/settings` with toggle switches for each of the 5 flags.
- Each toggle displays a human-readable label and description.
- Changes take effect immediately (no save button required).
- Include a "Reset to defaults" action.

### FR-4: Settings Navigation

- Add a "Feature Flags" or "Settings" link in the existing `SettingsDropdown` component that navigates to `/settings`.

### FR-5: Conditional Rendering — KBD

- When `featureFlags.kbd` is `false`:
  - Hide the KBD nav link in `Nav.tsx`.
  - Hide the Space selector (`SpaceSelector`) in `ChatInterface.tsx`.

### FR-6: Conditional Rendering — WorkIQ

- When `featureFlags.workiq` is `false`:
  - Hide the WorkIQ (BrainCircuit) button in `ChatInterface.tsx`.
  - Hide WorkIQ context chips in the chat input area.

### FR-7: Conditional Rendering — Agent Action Buttons

- In `frontend/app/agents/[slug]/page.tsx`:
  - Hide "Create PRD on Repo" when `featureFlags.generatePrd` is `false`.
  - Hide "Create Docs on Repo" when `featureFlags.generateTechSpecs` is `false`.
  - Hide "Create GitHub Issues" when `featureFlags.createGithubIssues` is `false`.

## Non-Functional Requirements

- **Performance:** Flag reads must be synchronous from context — no async calls on every render.
- **SSR Safety:** All `localStorage` access must be guarded with `isBrowser()` checks.
- **Backwards Compatibility:** All flags default to `true`; existing users see no change until they explicitly disable a flag.
- **Accessibility:** Toggle switches must be keyboard-navigable and have proper ARIA labels.

## UX / Design Considerations

- The settings page should use existing Tailwind theme tokens (`bg-surface-2`, `text-text-primary`, `border-border`, etc.).
- Toggles should provide clear visual feedback (on/off state, transition animation).
- Group toggles under a "Feature Visibility" heading with a brief explanation.
- Use `lucide-react` icons where appropriate (e.g., `Settings`, `ToggleLeft`/`ToggleRight`).

## Technical Considerations

### FeatureFlags Interface

```ts
export interface FeatureFlags {
  kbd: boolean;
  workiq: boolean;
  generatePrd: boolean;
  generateTechSpecs: boolean;
  createGithubIssues: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  kbd: true,
  workiq: true,
  generatePrd: true,
  generateTechSpecs: true,
  createGithubIssues: true,
};
```

### Storage Key

`web_spec_feature_flags`

### Files to Modify

| File | Change |
|------|--------|
| `frontend/lib/storage.ts` | Add `FeatureFlags` interface, `getFeatureFlags()`, `saveFeatureFlags()` |
| `frontend/lib/context.tsx` | Add `featureFlags` + `setFeatureFlags` to `AppContext` |
| `frontend/app/settings/page.tsx` | New settings page (create) |
| `frontend/components/SettingsDropdown.tsx` | Add link to `/settings` |
| `frontend/components/Nav.tsx` | Conditional render KBD nav link |
| `frontend/components/ChatInterface.tsx` | Conditional render WorkIQ button + Space selector |
| `frontend/app/agents/[slug]/page.tsx` | Conditional render action buttons |

## Dependencies

- Existing `localStorage` helpers in `frontend/lib/storage.ts`.
- Existing `AppContext` in `frontend/lib/context.tsx`.
- Existing `SettingsDropdown` component.
- No new npm packages required.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| localStorage is cleared by user | Flags reset to defaults (all enabled) | Acceptable — defaults preserve full functionality |
| New flags added in future | Old stored JSON missing new keys | Merge stored flags with `DEFAULT_FEATURE_FLAGS` on read |
| SSR hydration mismatch | React hydration error if server/client differ | Guard all localStorage reads with `isBrowser()` |

## Success Metrics

- All 5 flags toggle their respective UI elements on/off correctly.
- Flags persist across page refreshes.
- No hydration errors in development or production.
- Settings page is accessible and keyboard-navigable.
- TypeScript type-checks pass (`npx tsc --noEmit`).

## Open Questions

- Should there be a visual indicator (e.g., badge) on the settings link when flags are non-default?
- Should flag state be shareable via URL query params for demo/support purposes?

## User Stories

| ID | Story | File |
|----|-------|------|
| 1 | Add feature flags storage layer | [stories/add-feature-flags-storage.md](stories/add-feature-flags-storage.md) |
| 2 | Expose flags via React context | [stories/expose-flags-via-context.md](stories/expose-flags-via-context.md) |
| 3 | Create settings page with toggles | [stories/create-settings-page.md](stories/create-settings-page.md) |
| 4 | Add settings link to dropdown | [stories/add-settings-link.md](stories/add-settings-link.md) |
| 5 | Hide KBD nav and space selector | [stories/hide-kbd-ui.md](stories/hide-kbd-ui.md) |
| 6 | Hide WorkIQ UI elements | [stories/hide-workiq-ui.md](stories/hide-workiq-ui.md) |
| 7 | Hide agent action buttons | [stories/hide-agent-action-buttons.md](stories/hide-agent-action-buttons.md) |
