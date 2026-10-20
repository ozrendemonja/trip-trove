# Project Preferences

For test and fixture changes, including Storybook:

- Prefer readable scenarios over deduplication; do not flag small repetition alone.
- Keep important setup, inputs, actions and expectations ordered and visible in
  the test or nearby case data.
- Use short helpers for boilerplate; avoid helper chains.
- Parameterize shared actions and assertions with explicit, clearly named cases.
- Keyset mutation/replay tests: show each continuation request and its anchor
  (last raw item).
- Preserve coverage, scenario matrices and assertion strength.
