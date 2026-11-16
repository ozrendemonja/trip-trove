# Project Preferences

For frontend UI:

- Prefer Fluent UI v9 components over custom equivalents wherever practical.
- Keep custom code for domain-specific behavior and layout, not controls,
  typography or surfaces that Fluent already provides.

For test and fixture changes, including Storybook:

- Prefer readable scenarios over deduplication; do not flag small repetition alone.
- Keep important setup, inputs, actions and expectations ordered and visible in
  the test or nearby case data.
- Use short helpers for boilerplate; avoid helper chains.
- Parameterize shared actions and assertions with explicit, clearly named cases.
- Keyset mutation/replay tests: show each continuation request and its anchor
  (last raw item).
- Preserve coverage, scenario matrices and assertion strength.

For UI changes, including prototypes (the user's design principles):

- Keep one design across the app: Fluent UI v9 and the trip board's look. No
  screen gets a style of its own.
- Be coherent, attractive and easy to use: simple, focused and concise, so the
  screen helps the user act.
- Every extra element or choice makes deciding harder. Reach value in as few
  clicks as possible; people keep about seven pieces of information in mind.
- Group content and actions that belong together, and put first what matters
  most to the user.
- Guide the next step with size, proportion, images and interaction, and keep a
  clear focus and hierarchy.
- Limit how much shows at once, and remove every element that isn't needed. Use
  few colours, so that colour carries meaning.
- Make problems catch the eye at once, so the user finds them without
  searching.
- Prefer gentle labels, such as "Check availability" over "Book a room".
- Give a newcomer who has to decide something few options and little
  navigation. An involved workspace, such as Spotify, can offer more, because
  the time spent there is the value.
- Split a task into steps only when the gain outweighs the time it costs.
  Animation or video can help.
