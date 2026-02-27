# Story 1: Add Feature Flags Storage Layer

## Summary

**As a** developer,
**I want** a typed storage layer for feature flags in `localStorage`,
**So that** flag state can be persisted and retrieved reliably across page loads.

## Description

Add the `FeatureFlags` interface, default values, and CRUD helper functions to the existing `frontend/lib/storage.ts` module. The helpers must follow the same patterns as existing storage functions in that file (e.g., `isBrowser()` guards, JSON serialization).

## Acceptance Criteria

- [ ] `FeatureFlags` interface is exported with five boolean fields: `kbd`, `workiq`, `generatePrd`, `generateTechSpecs`, `createGithubIssues`.
- [ ] `DEFAULT_FEATURE_FLAGS` constant is exported with all values set to `true`.
- [ ] `getFeatureFlags(): FeatureFlags` reads from `localStorage` key `web_spec_feature_flags`, parses JSON, and merges with defaults (so missing keys get default values).
- [ ] `getFeatureFlags()` returns `DEFAULT_FEATURE_FLAGS` when no stored value exists or parsing fails.
- [ ] `saveFeatureFlags(flags: FeatureFlags): void` serializes and writes to `localStorage`.
- [ ] All `localStorage` access is guarded with `isBrowser()`.
- [ ] TypeScript compiles without errors (`npx tsc --noEmit` in `frontend/`).

## Tasks

1. Define `FeatureFlags` interface in `frontend/lib/storage.ts`.
2. Define `DEFAULT_FEATURE_FLAGS` constant.
3. Implement `getFeatureFlags()` with `isBrowser()` guard, JSON parse, and merge with defaults.
4. Implement `saveFeatureFlags()` with `isBrowser()` guard and JSON stringify.
5. Verify `npx tsc --noEmit` passes.

## Dependencies

- None. This is the foundational story.

## Out of Scope

- React context integration (Story 2).
- UI components or pages.

## Notes

- Follow existing patterns in `storage.ts` for consistency (e.g., similar to how `getStoredPat()` / `saveStoredPat()` work).
- Merging stored values with defaults ensures forward compatibility when new flags are added later.
