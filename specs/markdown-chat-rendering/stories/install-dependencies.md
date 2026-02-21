# User Story: Install markdown dependencies

## Summary

**As a** developer,
**I want** `react-markdown` and `remark-gfm` installed as frontend dependencies,
**So that** the codebase has the necessary libraries to render markdown content.

## Description

> Provide additional context or background that helps clarify the intent of this story.

This story covers the initial setup step of adding the markdown rendering libraries to the frontend package. The `react-markdown` library provides the core React component for rendering markdown as HTML, while `remark-gfm` is a plugin that adds support for GitHub Flavored Markdown features like tables, task lists, strikethrough, and autolinks. These libraries must be compatible with Next.js 14 App Router and support SSR.

## Acceptance Criteria

- [ ] Given the frontend directory, when `npm install` is run, then `react-markdown` is installed (latest stable ^9.x).
- [ ] Given the frontend directory, when `npm install` is run, then `remark-gfm` is installed (latest stable ^4.x).
- [ ] Given the updated `package.json`, when the app is built, then no dependency conflicts or errors occur.
- [ ] Given the installed packages, when imported in a TypeScript file, then TypeScript recognizes the types without errors.

## Tasks

- [ ] Navigate to the `frontend/` directory
- [ ] Run `npm install react-markdown remark-gfm --save` to add dependencies
- [ ] Verify the packages appear in `frontend/package.json` under `dependencies`
- [ ] Run `npm install` to ensure lock file is updated correctly
- [ ] Test import statements in a TypeScript file to confirm type definitions are available

## Dependencies

> List any other stories, services, or preconditions that must be in place before this story can start or complete.

- None (this is the first story in the feature)

## Out of Scope

> Anything explicitly excluded from this story to keep it focused.

- Creating the markdown renderer component
- Updating any existing components to use markdown
- Adding CSS styles for markdown elements
- Testing markdown rendering in the UI

## Notes

> Any additional context, references, or design decisions relevant to this story.

- **Library versions**: Use `react-markdown` ^9.x (latest stable) and `remark-gfm` ^4.x
- **SSR compatibility**: Both libraries support Next.js SSR out of the box
- **Type safety**: `react-markdown` includes TypeScript definitions; `remark-gfm` types come with the package
- **Documentation**: `react-markdown` docs at https://github.com/remarkjs/react-markdown
