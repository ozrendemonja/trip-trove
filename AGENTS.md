# Backend Query Safety

For backend data-access, DTO mapping, read endpoint, or SQL-test changes:

- Extend `backend/src/test/java/com/triptrove/manager/SqlQueryCountTest.java` using Hypersistence Utils and the existing `datasource-proxy` setup in `AbstractIntegrationTest`. New read workflows require coverage.
- Measure after `resetSqlStatementCounts()` and include DTO mapping or the full synchronous MockMvc response; the counter is thread-local. Assert exact SELECT budgets for small and larger result sets with distinct related entities and populated optional relationships.
- Preserve the covered SELECT budgets. Give each new workflow an exact budget; do not raise budgets merely to make a regression pass.
- Keep `hibernate.query.fail_on_pagination_over_collection_fetch` enabled in tests.
- New tests must use explicit scenarios or parameterized data, without `if`/`else` or ternaries.
- Run `cd backend && ./gradlew build --console=plain`.

# Backend Read Model Naming

For backend domain read projections:

- Use `*Summary` for compact, flattened read models and `*Details` for rich read models.
- The suffix describes the breadth of data, not endpoint cardinality; either type may be returned for one item or a list.
- Reuse the same projection when list and single-item endpoints return the same shape. Do not introduce or rename a `*Details` type solely because a single-item endpoint uses it.
- Keep repository method names aligned with the projection, such as `findSummaryById` and `findDetailsById`.