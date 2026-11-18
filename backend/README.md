# Trip Trove Backend

Spring Boot REST API backed by PostgreSQL. Persistence uses JPA/Hibernate and
Liquibase.

## Local Setup

Requirements: JDK 25, PostgreSQL, and Docker for integration tests. Use the
included Gradle wrapper; a separate Gradle installation is not required.

The default `dev` profile connects to `localhost:5432`, database `triptrove`,
with username and password `triptrove`. Override `DB_HOST`, `DB_NAME`, `DB_USER`,
and `DB_PASS` when needed.

From this directory, start the API with:

```sh
./gradlew bootRun
```

Liquibase applies database migrations at startup. The API is available at
`http://localhost:8080`, Swagger UI at `http://localhost:8080/swagger-ui/index.html`,
and the OpenAPI document at `http://localhost:8080/api-docs`.

## Build and Test

Run the same backend validation used by CI:

```sh
./gradlew build --console=plain
```

## Trip Planning Writes

MVP assumes one user editing a trip in one browser tab. Concurrent editing
across users or tabs is unsupported.

Board and trip-date writes use ordinary request bodies and return `204`.
No planning revision or idempotency metadata is required or returned. Normal
validation and database transactions still apply, including existing
name/membership conflicts.

After a timeout or lost response, reload and inspect the saved planning before
deliberately submitting another write. There is no automatic replay or
exactly-once retry guarantee.

See [the single-editor decision](../docs/adr/0001-trip-planning-actions.md).
The frontend's [tracked API contract](../client-app/openapi-doc/api-docs.json)
matches this contract; run `yarn openapi-ts` in `client-app` to regenerate the
ignored SDK after contract changes.

## Location-grouped Attraction Search

Country and region attraction searches always group results by location.
Country results are ordered by region name, then city name; region results are
ordered by city name. Attractions without a city come first within their region.
Within each location, the API keeps newest-first modification time (creation time
when never modified), then identifier order. Filters apply before pagination.
The UI groups results by visit status first: not visited, worth another visit,
visited and done, then permanently closed. Stable frontend sorting preserves the
API's region/city order within each status group.