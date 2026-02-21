# Feature: Markdown Chat Rendering

## Overview

Enable rich markdown-to-HTML rendering for agent responses in the chat UI. Currently, assistant messages display as plain text with `whitespace-pre-wrap`. This feature will integrate `react-markdown` and `remark-gfm` to render structured content (headings, code blocks, lists, tables, links, blockquotes) with dark-themed styling, while preserving the streaming UX with an animated cursor. User messages remain plain text.

## Problem Statement

Agents in the Web-Spec app return structured markdown content (PRDs, technical documentation, research reports), but the current chat interface renders these as raw text. This makes long-form, formatted responses hard to read and visually unappealing. Users expect modern markdown rendering with proper syntax highlighting, tables, and semantic HTML that matches the app's dark theme.

## Goals

- [ ] Install and integrate `react-markdown` and `remark-gfm` libraries
- [ ] Render assistant messages as styled HTML markdown
- [ ] Maintain streaming UX with animated cursor appearing after markdown content
- [ ] Apply dark-themed CSS to all markdown elements (headings, code, lists, tables, blockquotes, links)
- [ ] Keep user messages as plain text (no markdown rendering)
- [ ] Ensure no layout regressions or performance degradation

## Non-Goals

> What this feature explicitly does NOT do. Helps prevent scope creep.

- Markdown rendering for user input messages (they stay plain text)
- Syntax highlighting for code blocks (can be added later as enhancement)
- Custom markdown extensions beyond GitHub Flavored Markdown (GFM)
- WYSIWYG markdown editor for composing messages
- Real-time markdown preview in the input box

## Target Users / Personas

| Persona | Description |
|---|---|
| Developer | Software engineers using the app to generate technical specs, architecture docs, and code documentation from AI agents |
| Product Manager | PMs using the app to create PRDs, feature specs, and user stories with structured formatting |
| Technical Writer | Documentation specialists generating reports, research summaries, and structured content via agent conversations |

## Functional Requirements

> Numbered list of capabilities the feature MUST deliver.

1. The system shall install `react-markdown` and `remark-gfm` as dependencies in the frontend package
2. The system shall render assistant messages using `react-markdown` with GFM support in `MessageBubble`
3. The system shall render streaming assistant messages using `react-markdown` in `StreamingBubble`
4. The system shall position the animated cursor outside the markdown renderer to appear after the last element
5. The system shall apply scoped CSS styles (`.md-content` class) to markdown elements
6. The system shall style all markdown elements (h1-h6, p, ul, ol, li, pre, code, blockquote, table, a, hr, img) consistently with the dark theme
7. The system shall preserve existing chat UI layout, spacing, and message bubble styling
8. The system shall continue to render user messages as plain text without markdown parsing
9. The system shall maintain SSE streaming behavior with token-by-token updates

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Markdown rendering should add <50ms latency per message; streaming should remain smooth |
| Accessibility | Semantic HTML tags (h1-h6, ul, ol, blockquote, table) must be accessible to screen readers |
| Browser Compatibility | Must work in Chrome, Firefox, Safari, Edge (latest 2 versions) |
| Maintainability | Use scoped CSS approach (`.md-content`) without `@tailwindcss/typography` plugin |
| Visual Consistency | All markdown styles must use existing dark theme tokens (`bg-surface-2`, `text-text-primary`, `text-accent`, `border-border`, `text-muted`) |

## UX / Design Considerations

> Describe the user experience, key flows, or UI changes involved. Reference wireframes or mockups if available.

- **Streaming UX**: As tokens arrive, markdown is parsed and rendered incrementally. The animated cursor (pulsing block) remains visually at the end of content.
- **Visual hierarchy**: Headings use larger font sizes (h1 > h2 > h3...) and bold weight to establish content structure
- **Code blocks**: Inline code uses monospace font with subtle background; code blocks have borders and padding
- **Lists**: Bulleted and numbered lists have proper indentation and spacing
- **Tables**: GFM tables render with borders, padding, and alternating row backgrounds for readability
- **Links**: Clickable links styled with `text-accent` color and underline on hover
- **Blockquotes**: Left border accent with italic text and muted background
- **Spacing**: Consistent vertical rhythm between markdown elements (0.75-1rem gaps)

## Technical Considerations

> Architecture decisions, technology choices, API contracts, or constraints relevant to implementation.

- **Library choice**: `react-markdown` is the standard React markdown renderer with SSR support for Next.js
- **GFM support**: `remark-gfm` plugin adds GitHub Flavored Markdown features (tables, task lists, strikethrough, autolinks)
- **Streaming architecture**: The `streamingContent` string is updated token-by-token via SSE. React re-renders `StreamingBubble` on each update. Markdown parser must handle incomplete markdown gracefully.
- **Cursor positioning**: The animated cursor must render as a sibling element after `<ReactMarkdown>`, not inside it, to avoid being treated as markdown content
- **Scoped styling**: CSS is scoped to `.md-content` class to avoid conflicts with global styles
- **No Tailwind Typography**: The `@tailwindcss/typography` plugin is NOT used; custom CSS is preferred for better control
- **SSR compatibility**: Both libraries are SSR-compatible with Next.js 14 App Router

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| `react-markdown` | External NPM package | Latest stable version (^9.x) |
| `remark-gfm` | External NPM package | Latest stable version (^4.x) |
| `ChatInterface.tsx` | Internal component | Contains `MessageBubble` and `StreamingBubble` |
| `globals.css` | Internal stylesheet | Global CSS file for scoped styles |
| Existing dark theme tokens | Internal design system | Tailwind CSS custom theme variables |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Markdown parsing errors with incomplete streaming content | Medium | Medium | `react-markdown` handles partial markdown gracefully; test with incremental content |
| Performance degradation with very long messages (>10k tokens) | Low | Medium | Monitor rendering time; consider virtualization if needed |
| CSS conflicts with existing global styles | Low | Low | Use scoped `.md-content` class and test thoroughly |
| Animated cursor rendering inside markdown content | Medium | High | Position cursor as sibling element outside `<ReactMarkdown>` |
| Breaking changes in library updates | Low | Medium | Pin versions in `package.json`; review changelogs before updates |

## Success Metrics

> How will we know this feature is successful?

- All markdown elements (headings, code, lists, tables, links, blockquotes) render correctly in assistant messages
- Streaming UX remains smooth with animated cursor appearing at the end of content
- No visual regressions in existing chat UI layout or styling
- User feedback confirms improved readability of structured agent responses
- Page load and rendering performance remain within <50ms overhead per message

## Open Questions

- [ ] Should syntax highlighting be added to code blocks in this phase or deferred?
- [ ] Do we need to sanitize markdown to prevent XSS (e.g., disallow raw HTML)?
- [ ] Should tables be responsive/scrollable on mobile, or is desktop-first sufficient?
- [ ] Do we need a "copy markdown" button on assistant messages?

## User Stories

> List of all user stories for this feature (links will be added as files are created).

| Story | File |
|---|---|
| Install markdown dependencies | [install-dependencies.md](stories/install-dependencies.md) |
| Create scoped markdown styles | [create-markdown-styles.md](stories/create-markdown-styles.md) |
| Update MessageBubble for markdown rendering | [update-message-bubble.md](stories/update-message-bubble.md) |
| Update StreamingBubble for markdown rendering | [update-streaming-bubble.md](stories/update-streaming-bubble.md) |
| Test and verify markdown rendering | [test-markdown-rendering.md](stories/test-markdown-rendering.md) |
