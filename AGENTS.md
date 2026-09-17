# Backend Query Safety

For backend data-access, DTO mapping, read endpoint, or SQL-test changes:

- Extend `backend/src/test/java/com/triptrove/manager/SqlQueryCountTest.java` using Hypersistence Utils and the existing `datasource-proxy` setup in `AbstractIntegrationTest`. New read workflows require coverage.
- Measure after `resetSqlStatementCounts()` and include DTO mapping or the full synchronous MockMvc response; the counter is thread-local. Assert exact SELECT budgets for small and larger result sets with distinct related entities and populated optional relationships.
- Preserve the covered SELECT budgets. Give each new workflow an exact budget; do not raise budgets merely to make a regression pass.
- Keep `hibernate.query.fail_on_pagination_over_collection_fetch` enabled in tests.
- New tests must use explicit scenarios or parameterized data, without `if`/`else` or ternaries.
- Run `cd backend && ./gradlew build --console=plain`.