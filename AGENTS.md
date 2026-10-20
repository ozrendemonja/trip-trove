# Backend Query Safety

For backend data-access, DTO mapping, read endpoint, or SQL-test changes:

- Extend `backend/src/test/java/com/triptrove/manager/SqlQueryCountTest.java` using Hypersistence Utils and the existing `datasource-proxy` setup in `AbstractIntegrationTest`. New read workflows require coverage.
- Measure after `resetSqlStatementCounts()` and include DTO mapping or the full synchronous MockMvc response; the counter is thread-local. Assert exact SELECT budgets for small and larger result sets with distinct related entities and populated optional relationships.
- Preserve the covered SELECT budgets. Give each new workflow an exact budget; do not raise budgets merely to make a regression pass.
- Keep `SqlQueryCountTest` focused on SQL statement counts. Besides exact SELECT/INSERT/UPDATE/DELETE counts, assert only the expected HTTP status and minimal result cardinality or presence so an empty response cannot make the test pass accidentally.
- Keep returned IDs, ordering, DTO field values, error messages, complete pagination traversal, and retry equality in functional tests, not SQL-count tests. Do not assert persistence-context/entity statistics in `SqlQueryCountTest`.
- Keep `hibernate.query.fail_on_pagination_over_collection_fetch` enabled in tests.
- New tests must use explicit scenarios or parameterized data, without `if`/`else` or ternaries.
- Run `cd backend && ./gradlew build --console=plain`.

# Backend Read Model Naming

For backend domain read projections:

- Use `*Summary` for compact, flattened read models and `*Details` for rich read models.
- The suffix describes the breadth of data, not endpoint cardinality; either type may be returned for one item or a list.
- Reuse the same projection when list and single-item endpoints return the same shape. Do not introduce or rename a `*Details` type solely because a single-item endpoint uses it.
- Keep repository method names aligned with the projection, such as `findSummaryById` and `findDetailsById`.

## Agent skills

### Project preferences

Read [project preferences](docs/agents/project-preferences.md) before changing
or reviewing code.

### Issue tracker

Issues and specs live as local Markdown under `.scratch/<feature-slug>/`.
See [issue tracker conventions](docs/agents/issue-tracker.md).

### Domain docs

Use a single-context layout: root `CONTEXT.md` and `docs/adr/`, created lazily.
See [domain documentation rules](docs/agents/domain.md).