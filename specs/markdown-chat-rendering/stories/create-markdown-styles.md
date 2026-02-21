# User Story: Create scoped markdown styles

## Summary

**As a** developer,
**I want** scoped CSS styles for markdown elements matching the dark theme,
**So that** rendered markdown content is visually consistent with the app's design system.

## Description

> Provide additional context or background that helps clarify the intent of this story.

This story involves creating a `.md-content` scoped CSS class in `frontend/app/globals.css` that styles all markdown elements (headings, paragraphs, lists, code blocks, tables, links, blockquotes, etc.) using the existing dark theme tokens. The styles must cover typography, spacing, colors, and layout for a polished, readable markdown rendering experience. The scoped approach avoids conflicts with global styles and provides granular control over each element.

## Acceptance Criteria

- [ ] Given `globals.css`, when `.md-content` styles are added, then all markdown elements (h1-h6, p, ul, ol, li, pre, code, blockquote, table, a, hr, img) have defined styles.
- [ ] Given the dark theme tokens, when markdown is rendered, then colors use `text-text-primary`, `text-accent`, `text-muted`, `bg-surface-2`, and `border-border`.
- [ ] Given nested markdown elements, when rendered, then spacing and indentation are consistent (0.75-1rem vertical rhythm).
- [ ] Given code blocks and inline code, when rendered, then they use monospace font with subtle background and borders.
- [ ] Given tables, when rendered, then they have borders, padding, and alternating row backgrounds for readability.
- [ ] Given links, when hovered, then they show underline and use `text-accent` color.
- [ ] Given blockquotes, when rendered, then they have left border accent, italic text, and muted background.

## Tasks

- [ ] Open `frontend/app/globals.css` in editor
- [ ] Add `.md-content` class definition with nested selectors for all markdown elements
- [ ] Style headings (h1-h6) with font sizes (2xl, xl, lg, base scaled down), bold weight, and consistent spacing
- [ ] Style paragraphs with base font size and 0.75rem bottom margin
- [ ] Style unordered lists (ul) with disc bullets, 1rem left padding, and 0.75rem spacing
- [ ] Style ordered lists (ol) with decimal numbering, 1rem left padding, and 0.75rem spacing
- [ ] Style list items (li) with 0.25rem bottom margin
- [ ] Style inline code with monospace font, `bg-surface-2`, `text-accent`, padding, and border radius
- [ ] Style code blocks (pre code) with monospace font, `bg-surface-2`, `border-border`, padding, and border
- [ ] Style blockquotes with left border accent, italic text, `bg-surface-2`, and padding
- [ ] Style tables with borders, cell padding, alternating row backgrounds, and header styling
- [ ] Style links (a) with `text-accent` color, underline on hover, and no underline by default
- [ ] Style horizontal rules (hr) with `border-border` color and 1rem vertical margin
- [ ] Style images (img) with max-width 100%, rounded corners, and margin
- [ ] Test styles by rendering sample markdown content in the chat UI

## Dependencies

> List any other stories, services, or preconditions that must be in place before this story can start or complete.

- Depends on: `install-dependencies.md` (markdown libraries must be installed first)

## Out of Scope

> Anything explicitly excluded from this story to keep it focused.

- Syntax highlighting for code blocks (deferred to future enhancement)
- Custom markdown extensions beyond GFM
- Responsive table scrolling on mobile (can be added later)
- Animation transitions for markdown element rendering

## Notes

> Any additional context, references, or design decisions relevant to this story.

- **Scoped approach**: Use `.md-content` class to scope all styles and avoid global CSS pollution
- **Dark theme tokens**: Reference existing Tailwind CSS custom tokens from the theme configuration
- **Typography scale**: Headings should follow a clear visual hierarchy (h1 largest → h6 smallest)
- **Code styling**: Inline code and code blocks should be visually distinct but cohesive
- **Table styling**: Use subtle alternating row backgrounds (`bg-surface-2` with opacity variation)
- **Vertical rhythm**: Consistent spacing between elements improves readability
