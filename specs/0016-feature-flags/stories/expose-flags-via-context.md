# Story 2: Expose Flags via React Context

## Summary

**As a** frontend component,
**I want** to read and update feature flags from `useApp()`,
**So that** any component in the tree can conditionally render based on flag state.

## Description

Extend the existing `AppContext` in `frontend/lib/context.tsx` to include `featureFlags` and `setFeatureFlags`. Hydrate from `localStorage` on mount and persist changes back to `localStorage` whenever flags are updated.

## Acceptance Criteria

- [ ] `AppContext` value includes `featureFlags: FeatureFlags` and `setFeatureFlags: (flags: FeatureFlags) => void`.
- [ ] `featureFlags` is initialized to `DEFAULT_FEATURE_FLAGS` (SSR-safe default).
- [ ] On client mount, flags are hydrated from `localStorage` via `getFeatureFlags()`.
- [ ] Calling `setFeatureFlags(newFlags)` updates context state and calls `saveFeatureFlags(newFlags)`.
- [ ] `useApp()` exposes `featureFlags` and `setFeatureFlags`.
- [ ] No hydration mismatches — initial server render uses defaults, client hydrates from storage.
- [ ] TypeScript compiles without errors.

## Tasks

1. Import `FeatureFlags`, `DEFAULT_FEATURE_FLAGS`, `getFeatureFlags`, `saveFeatureFlags` from `storage.ts`.
2. Add `featureFlags` state with `useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS)`.
3. Add `useEffect` to hydrate flags from `localStorage` on mount.
4. Create `handleSetFeatureFlags` that updates state and persists to storage.
5. Add `featureFlags` and `setFeatureFlags` to the context provider value.
6. Update the `AppContextType` interface.
7. Verify `npx tsc --noEmit` passes.

## Dependencies

- **Story 1** (Add feature flags storage layer) — requires `FeatureFlags`, `getFeatureFlags`, `saveFeatureFlags`.

## Out of Scope

- Settings page UI (Story 3).
- Conditional rendering in any component (Stories 5–7).

## Notes

- Follow the same hydration pattern used for other `localStorage`-backed state in `context.tsx` (e.g., `storedPat`).
