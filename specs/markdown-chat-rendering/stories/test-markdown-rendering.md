# User Story: Test and verify markdown rendering

## Summary

**As a** developer,
**I want** comprehensive testing of markdown rendering across all element types,
**So that** I can ensure the feature works correctly and meets acceptance criteria.

## Description

> Provide additional context or background that helps clarify the intent of this story.

This story covers end-to-end testing and verification of the markdown rendering feature. It includes testing all markdown element types (headings, lists, code, tables, links, blockquotes), streaming behavior, edge cases (incomplete markdown, special characters), and visual consistency with the dark theme. Testing should cover both `MessageBubble` (completed messages) and `StreamingBubble` (real-time streaming).

## Acceptance Criteria

- [ ] Given sample markdown with headings (h1-h6), when rendered, then all headings display with correct font sizes and hierarchy.
- [ ] Given sample markdown with lists (ul, ol, nested), when rendered, then lists display with correct bullets/numbers and indentation.
- [ ] Given sample markdown with inline code and code blocks, when rendered, then code displays with monospace font and styled background.
- [ ] Given sample markdown with tables, when rendered, then tables display with borders, padding, and alternating row backgrounds.
- [ ] Given sample markdown with links, when rendered, then links are clickable and styled with `text-accent` color.
- [ ] Given sample markdown with blockquotes, when rendered, then blockquotes display with left border, italic text, and background.
- [ ] Given sample markdown with GFM features (task lists, strikethrough), when rendered, then GFM elements display correctly.
- [ ] Given streaming content with markdown, when tokens arrive, then markdown renders incrementally with cursor at the end.
- [ ] Given incomplete markdown during streaming (unclosed code block), when rendered, then no errors or crashes occur.
- [ ] Given user messages, when rendered, then they display as plain text without markdown parsing.
- [ ] Given the chat UI, when markdown messages are displayed, then no layout regressions or spacing issues occur.

## Tasks

- [ ] Create test markdown content covering all element types (headings, paragraphs, lists, code, tables, links, blockquotes, horizontal rules)
- [ ] Start the Next.js dev server (`npm run dev` in frontend directory)
- [ ] Send a test message with markdown content in the chat UI
- [ ] Verify headings (h1-h6) render with correct font sizes and styling
- [ ] Verify unordered lists (ul) render with disc bullets and proper indentation
- [ ] Verify ordered lists (ol) render with decimal numbers and proper indentation
- [ ] Verify nested lists render correctly with increased indentation
- [ ] Verify inline code renders with monospace font, background, and padding
- [ ] Verify code blocks (pre code) render with monospace font, border, and scrollable overflow
- [ ] Verify tables render with borders, padding, and alternating row backgrounds
- [ ] Verify links render with `text-accent` color and underline on hover
- [ ] Verify blockquotes render with left border, italic text, and background
- [ ] Verify horizontal rules render as dividers with correct color
- [ ] Test GFM features (task lists with checkboxes, strikethrough text, autolinks)
- [ ] Simulate streaming by triggering an agent response and observing incremental markdown rendering
- [ ] Verify the animated cursor appears after the last markdown element during streaming
- [ ] Test edge case: streaming with incomplete code block (e.g., opening ``` but no closing)
- [ ] Test edge case: special characters and HTML entities in markdown
- [ ] Verify user messages render as plain text (no markdown parsing)
- [ ] Check responsive layout on different screen sizes
- [ ] Run build (`npm run build`) to ensure no production build errors
- [ ] Document any issues or edge cases discovered during testing

## Dependencies

> List any other stories, services, or preconditions that must be in place before this story can start or complete.

- Depends on: `install-dependencies.md` (libraries installed)
- Depends on: `create-markdown-styles.md` (styles created)
- Depends on: `update-message-bubble.md` (MessageBubble updated)
- Depends on: `update-streaming-bubble.md` (StreamingBubble updated)

## Out of Scope

> Anything explicitly excluded from this story to keep it focused.

- Automated unit tests or integration tests (manual testing is sufficient for this phase)
- Performance benchmarking with large messages (>10k tokens)
- Mobile responsive testing (desktop-first is primary target)
- Accessibility testing with screen readers (assumes semantic HTML is accessible)

## Notes

> Any additional context, references, or design decisions relevant to this story.

- **Test content**: Create a comprehensive markdown document with all element types for testing
- **Streaming simulation**: Use the actual agent API to trigger streaming responses with markdown
- **Visual inspection**: Carefully inspect rendered output for spacing, colors, and alignment issues
- **Browser testing**: Test in Chrome and Firefox (primary browsers)
- **Edge cases**: Pay special attention to incomplete markdown during streaming
- **Documentation**: Update README or docs if needed to explain markdown rendering capability
