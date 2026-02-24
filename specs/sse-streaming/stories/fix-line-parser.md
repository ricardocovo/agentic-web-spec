# User Story: Fix SSE line parser to handle partial chunks

## Summary

**As a** developer using the Web-Spec app,
**I want** SSE events to be parsed correctly even when TCP chunks contain partial lines,
**So that** I see complete tokens and reasoning text without data loss or corruption.

## Description

The current SSE parser in `frontend/app/agents/[slug]/page.tsx` uses `text.split("\n")` on each `reader.read()` chunk. However, TCP may deliver partial lines across chunks (e.g., `event: chu` in chunk 1, `nk` in chunk 2), causing the parser to miss or malform events.

This story fixes the parser by introducing a `lineBuffer` that accumulates text across reads, processes only complete lines (those ending with `\n`), and retains the last partial segment for the next iteration.

## Acceptance Criteria

- [x] Given an SSE chunk containing a partial line, when the parser processes it, then it accumulates the partial line in a buffer
- [x] Given a subsequent chunk completes the partial line, when the parser processes it, then it combines the buffer with the new text and processes the complete line
- [x] Given a chunk contains multiple complete lines and one partial line, when the parser processes it, then it processes all complete lines and buffers the partial line
- [x] Given the stream ends with a partial line in the buffer, when processing completes, then the partial line is processed as a final line
- [x] Given various chunk sizes (1 byte, 100 bytes, 1 KB), when the parser processes them, then it correctly assembles all SSE events without data loss
- [x] Given a complete SSE event arrives, when parsed, then `streamingContent` or `streamingReasoning` state updates correctly

## Tasks

- [x] Locate the SSE parsing logic in `frontend/app/agents/[slug]/page.tsx`
- [x] Identify the read loop that calls `reader.read()` and processes chunks
- [x] Add a `let lineBuffer = '';` variable scoped outside the read loop
- [x] Modify the chunk processing to prepend `lineBuffer` to each new chunk's text
- [x] Split the combined text by `\n` into an array of segments
- [x] Process all segments except the last one (which may be partial) as complete lines
- [x] Assign the last segment (partial or empty) back to `lineBuffer`
- [x] After the read loop exits, process any remaining text in `lineBuffer` as a final line
- [x] Test with artificially small chunk sizes to verify partial line handling
- [x] Test with production backend to verify streaming works correctly

## Dependencies

> Depends on: Route handler implementation (Story 1) to deliver unbuffered chunks

## Out of Scope

- Handling `\r\n` line endings (SSE spec uses `\n`, but can be added if needed)
- Parsing SSE event structure (already handled by existing code)
- Retry logic or error recovery
- Optimizing buffer concatenation performance

## Notes

- The SSE specification uses `\n` (LF) as the line delimiter, not `\r\n`
- Example logic structure:
  ```typescript
  let lineBuffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const text = decoder.decode(value, { stream: true });
    const combinedText = lineBuffer + text;
    const lines = combinedText.split('\n');
    
    // Process all complete lines (all but the last segment)
    for (let i = 0; i < lines.length - 1; i++) {
      processLine(lines[i]);
    }
    
    // Keep the last segment (may be partial) in the buffer
    lineBuffer = lines[lines.length - 1];
  }
  
  // Process any remaining partial line
  if (lineBuffer) {
    processLine(lineBuffer);
  }
  ```
- Existing `processLine` logic likely checks for `event:` prefix and parses `data:` fields
- May need to handle empty lines (which denote event boundaries in SSE spec)
