---
description: 'Generates a complete feature specification and implementation plan for a given feature. Creates a spec file under /specs/{feature-name}/spec.md and individual user story files under /specs/{feature-name}/{user-story-short-name}.md. Covers requirements, design considerations, acceptance criteria, and task breakdowns.'
model: Claude Sonnet 4.6 (copilot)
tools: [execute, read, edit, search, web, agent, todo]
---

# Feature Specification Generator

Generate a full feature specification and implementation plan based on the feature description provided by the user.

## Instructions

Ask the user for the following if not already provided:
- **Feature name** (will be used as the folder name, use kebab-case)
- **Feature description** (brief summary of what the feature does and why)
- **Target users / personas** (who will use it)

Once you have that information, perform the following steps:

---

## Step 1 — Create the Feature Specification File

Create a file at `specs/{feature-name}/spec.md` with the content below.

Use the sections exactly as defined. Fill in each section based on the feature description and your analysis of the codebase and project context.

---

### Template: `specs/{feature-name}/spec.md`

```markdown
# Feature: {Feature Name}

## Overview

> A concise summary (2–4 sentences) of what this feature does, who it is for, and the primary value it delivers.

## Problem Statement

> Describe the pain point, gap, or opportunity this feature addresses. Why does it need to exist?

## Goals

- [ ] Goal 1
- [ ] Goal 2
- [ ] ...

## Non-Goals

> What this feature explicitly does NOT do. Helps prevent scope creep.

- Non-goal 1
- Non-goal 2

## Target Users / Personas

| Persona | Description |
|---|---|
| {Persona 1} | {Who they are and their key need} |
| {Persona 2} | ... |

## Functional Requirements

> Numbered list of capabilities the feature MUST deliver.

1. The system shall...
2. The system shall...
3. ...

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | ... |
| Security | ... |
| Accessibility | ... |
| Scalability | ... |

## UX / Design Considerations

> Describe the user experience, key flows, or UI changes involved. Reference wireframes or mockups if available.

- Key flow 1: ...
- Key flow 2: ...

## Technical Considerations

> Architecture decisions, technology choices, API contracts, or constraints relevant to implementation.

- ...

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| {Service / Feature / Team} | Internal / External | ... |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| ... | Low / Med / High | Low / Med / High | ... |

## Success Metrics

> How will we know this feature is successful?

- Metric 1: ...
- Metric 2: ...

## Open Questions

- [ ] Question 1
- [ ] Question 2

## User Stories

> List of all user stories for this feature (links will be added as files are created).

| Story | File |
|---|---|
| {User Story Title} | [stories/{short-name}.md]({short-name}.md) |
```

---

## Step 2 — Identify User Stories

Break the feature down into meaningful user stories. Each story should represent a distinct slice of user-facing value. Aim for 3–8 stories depending on the feature's scope.

For each story, determine:
- A human-readable title (e.g. "View feature dashboard")
- A short kebab-case file name (e.g. `view-feature-dashboard`)

---

## Step 3 — Create Individual User Story Files

For each user story, create a file at `specs/{feature-name}/stories/{user-story-short-name}.md` using the template below.

Tasks within each story should be single-line action items (start with a verb).

---

### Template: `specs/{feature-name}/stories/{user-story-short-name}.md`

```markdown
# User Story: {Title}

## Summary

**As a** {persona},
**I want** {goal or capability},
**So that** {benefit or outcome}.

## Description

> Provide additional context or background that helps clarify the intent of this story.

## Acceptance Criteria

- [ ] Given {context}, when {action}, then {outcome}.
- [ ] Given {context}, when {action}, then {outcome}.
- [ ] ...

## Tasks

- [ ] {Single-line task — start with a verb, e.g. "Create API endpoint for..."}
- [ ] {Single-line task}
- [ ] {Single-line task}
- [ ] ...

## Dependencies

> List any other stories, services, or preconditions that must be in place before this story can start or complete.

- Depends on: ...

## Out of Scope

> Anything explicitly excluded from this story to keep it focused.

- ...

## Notes

> Any additional context, references, or design decisions relevant to this story.

- ...
```

---

## Step 4 — Update the Spec File's User Stories Table

After creating all user story files, go back to `specs/{feature-name}/spec.md` and fill in the **User Stories** table at the bottom with the title and filename of each created story.

---

## Final Checklist

- [ ] `specs/{feature-name}/spec.md` created and fully filled in
- [ ] Each user story has its own file under `specs/{feature-name}/stories`
- [ ] The User Stories table in `spec.md` links to all story files
- [ ] All section headings are present in every file
- [ ] Tasks in each story are single-line, action-oriented items
