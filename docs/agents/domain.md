# Domain Docs

How engineering skills consume this repo's domain documentation.

## Layout

Use a single-context layout:

- `CONTEXT.md` at the repository root holds the domain glossary.
- `docs/adr/` holds architecture decision records.

Create these lazily, not as empty setup scaffolding.

## Before exploring, read these

- The root [CONTEXT.md](../../CONTEXT.md).
- Relevant ADRs in [docs/adr/](../adr/).

If these files or directories do not exist, proceed silently. Do not flag their
absence or suggest creating them upfront. `/domain-modeling` creates them when
terms or decisions actually get resolved.

## Use the glossary's vocabulary

Use terms defined in `CONTEXT.md` when naming domain concepts in issues,
proposals, hypotheses, and tests. Avoid synonyms the glossary explicitly rejects.

If a needed concept is missing, reconsider whether the project uses that concept
or note the gap for `/domain-modeling`.

## Flag ADR conflicts

Explicitly surface any proposal that contradicts an existing ADR. Identify the
decision and explain why it may be worth revisiting rather than silently
overriding it.
