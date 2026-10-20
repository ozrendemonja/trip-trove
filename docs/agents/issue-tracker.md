# Issue tracker: Local Markdown

Issues and specs for this repo live as Markdown files in `.scratch/`,
not GitHub Issues.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`.
- The spec is `.scratch/<feature-slug>/spec.md`.
- Implementation tickets are `.scratch/<feature-slug>/issues/<NN>-<slug>.md`,
  numbered from `01`. Use one file per ticket, never a combined tickets file.
- Append comments and conversation history under a `## Comments` heading.

## When a skill says "publish to the issue tracker"

Write the spec or individual ticket files at the paths above, creating
directories as needed.

## When a skill says "fetch the relevant ticket"

Read the referenced file. Ticket numbers are scoped to their feature directory;
ask for clarification if the reference is ambiguous.

## Wayfinding operations

Used by `/wayfinder`. The map is a file with one child file per ticket.

- **Map**: `.scratch/<effort>/map.md`, containing Notes / Decisions-so-far / Fog.
- **Child ticket**: `.scratch/<effort>/issues/<NN>-<slug>.md`, numbered from `01`,
  with the question in the body. A `Type:` line records
  `research`/`prototype`/`grilling`/`task`. A `Status:` line starts as `open`
  and changes to `claimed` or `resolved`.
- **Blocking**: a `Blocked by: NN, NN` line references tickets in the same effort.
  A ticket is unblocked when every referenced ticket is `resolved`.
- **Frontier**: scan the effort's issues for open, unblocked, unclaimed tickets;
  first by number wins.
- **Claim**: set `Status: claimed` and save before starting work.
- **Resolve**: append the answer under `## Answer`, set `Status: resolved`,
  then append a gist and link to the map's Decisions-so-far.
