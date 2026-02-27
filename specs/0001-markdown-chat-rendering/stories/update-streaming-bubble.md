# User Story: Update StreamingBubble for markdown rendering

## Summary

**As a** user,
**I want** streaming assistant responses to display as formatted markdown in real-time,
**So that** I can read structured content as it arrives, with the animated cursor appearing at the end.

## Description

> Provide additional context or background that helps clarify the intent of this story.

This story modifies the `StreamingBubble` component in `ChatInterface.tsx` to render the streaming content as markdown. As tokens arrive via SSE, the `streamingContent` string updates incrementally, triggering re-renders. The markdown parser must handle incomplete markdown gracefully. The animated cursor (pulsing block) must render as a sibling element OUTSIDE the `<ReactMarkdown>` component to appear after the last rendered element, not inside the markdown content.

## Acceptance Criteria

- [ ] Given streaming content arriving token-by-token, when the bubble re-renders, then partial markdown is parsed and displayed correctly.
- [ ] Given streaming content with markdown, when rendered, then the content uses the `.md-content` CSS class.
- [ ] Given the animated cursor, when the streaming bubble renders, then the cursor appears as a sibling element after the markdown content.
- [ ] Given incomplete markdown syntax (e.g., unclosed code block), when rendered during streaming, then the parser handles it gracefully without crashing.
- [ ] Given the streaming bubble layout, when markdown is rendered, then existing bubble styling and spacing are preserved.
- [ ] Given the completion of streaming, when the message is finalized, then the cursor disappears and the markdown remains rendered.

## Tasks

- [ ] Open `frontend/components/ChatInterface.tsx` in editor
- [ ] Ensure `ReactMarkdown` and `remarkGfm` are imported (from previous story)
- [ ] Locate the `StreamingBubble` component definition
- [ ] Identify where `streamingContent` is rendered (likely as plain text with `whitespace-pre-wrap`)
- [ ] Replace plain text rendering with `<ReactMarkdown remarkPlugins={[remarkGfm]} className="md-content">{streamingContent}</ReactMarkdown>`
- [ ] Locate the animated cursor element (likely a `<span>` with animation classes)
- [ ] Ensure the cursor is rendered as a sibling element AFTER the `<ReactMarkdown>` closing tag
- [ ] Wrap both markdown and cursor in a container if needed to maintain layout
- [ ] Verify the component compiles without TypeScript errors
- [ ] Test with streaming content containing various markdown elements in the dev environment
- [ ] Verify the cursor animates smoothly at the end of content
- [ ] Test with incomplete markdown (e.g., unclosed code block, partial table) to ensure graceful handling

## Dependencies

> List any other stories, services, or preconditions that must be in place before this story can start or complete.

- Depends on: `install-dependencies.md` (libraries must be installed)
- Depends on: `create-markdown-styles.md` (CSS styles must be defined)
- Depends on: `update-message-bubble.md` (patterns established in MessageBubble apply here)

## Out of Scope

> Anything explicitly excluded from this story to keep it focused.

- Optimizing streaming performance for very long messages (>10k tokens)
- Custom streaming animations or transitions
- Debouncing or throttling markdown re-renders during streaming
- Syntax highlighting for streaming code blocks

## Notes

> Any additional context, references, or design decisions relevant to this story.

- **Cursor positioning**: The animated cursor must be a sibling of `<ReactMarkdown>`, not a child, to avoid being parsed as markdown
- **Streaming behavior**: `streamingContent` updates on every SSE chunk; React re-renders the component each time
- **Incomplete markdown**: `react-markdown` handles partial markdown well (e.g., unclosed code blocks render as plain text until closed)
- **Layout structure**: Ensure the cursor appears inline after the last paragraph or element
- **Testing**: Simulate streaming with markdown content (headings, lists, code) to verify live rendering
- **Performance**: Monitor rendering time during streaming; markdown parsing should add minimal overhead (<50ms per chunk)
