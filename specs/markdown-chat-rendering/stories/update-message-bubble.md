# User Story: Update MessageBubble for markdown rendering

## Summary

**As a** user,
**I want** assistant messages to display as rich formatted markdown,
**So that** I can easily read structured content with headings, lists, tables, and code blocks.

## Description

> Provide additional context or background that helps clarify the intent of this story.

This story modifies the `MessageBubble` component in `ChatInterface.tsx` to render assistant messages using `react-markdown` with `remark-gfm` plugin support. Currently, assistant messages are rendered with `whitespace-pre-wrap` as plain text. The updated component should wrap the message content in `<ReactMarkdown>` with the `.md-content` CSS class, while user messages continue to render as plain text. The existing bubble styling, layout, and spacing must be preserved.

## Description

> Provide additional context or background that helps clarify the intent of this story.

The `MessageBubble` component displays completed (non-streaming) messages in the chat history. This update replaces the plain text rendering for assistant messages with markdown-to-HTML conversion. User messages remain unchanged to avoid unintended markdown parsing of user input.

## Acceptance Criteria

- [ ] Given an assistant message, when it is rendered in `MessageBubble`, then the content is parsed and rendered as markdown HTML.
- [ ] Given a user message, when it is rendered in `MessageBubble`, then the content is displayed as plain text (no markdown parsing).
- [ ] Given markdown content with GFM features (tables, task lists), when rendered, then GFM elements display correctly.
- [ ] Given the rendered markdown, when displayed, then it uses the `.md-content` CSS class for styling.
- [ ] Given existing message bubble styling, when markdown is rendered, then no layout or spacing regressions occur.
- [ ] Given messages with special characters or HTML entities, when rendered, then they are safely escaped by the markdown parser.

## Tasks

- [ ] Open `frontend/components/ChatInterface.tsx` in editor
- [ ] Import `ReactMarkdown` from `react-markdown` at the top of the file
- [ ] Import `remarkGfm` from `remark-gfm` at the top of the file
- [ ] Locate the `MessageBubble` component definition
- [ ] Identify where assistant message content is rendered (likely in the `role === 'assistant'` conditional)
- [ ] Replace the plain text rendering with `<ReactMarkdown remarkPlugins={[remarkGfm]} className="md-content">{content}</ReactMarkdown>`
- [ ] Ensure user messages (`role === 'user'`) continue to render with `whitespace-pre-wrap` as plain text
- [ ] Verify the component compiles without TypeScript errors
- [ ] Test with sample markdown content (headings, lists, code blocks, tables) in the dev environment
- [ ] Verify existing message bubble padding, background, and border radius are preserved

## Dependencies

> List any other stories, services, or preconditions that must be in place before this story can start or complete.

- Depends on: `install-dependencies.md` (libraries must be installed)
- Depends on: `create-markdown-styles.md` (CSS styles must be defined)

## Out of Scope

> Anything explicitly excluded from this story to keep it focused.

- Updating `StreamingBubble` (covered in separate story)
- Adding syntax highlighting to code blocks
- Custom markdown component overrides (e.g., custom link renderer)
- Markdown rendering for user messages

## Notes

> Any additional context, references, or design decisions relevant to this story.

- **Component location**: `frontend/components/ChatInterface.tsx` contains the `MessageBubble` component
- **Conditional rendering**: Use role-based conditional to apply markdown only to assistant messages
- **Props**: `ReactMarkdown` component takes `children` (string content) and `remarkPlugins` (array of plugins)
- **XSS safety**: `react-markdown` escapes HTML by default; no additional sanitization needed
- **Testing**: Use the chat UI to send messages and verify markdown rendering in assistant responses
