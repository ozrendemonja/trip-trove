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

Every trip has one itinerary, with a saved day for each date in its inclusive
range. `GET /trips/{id}/itinerary` returns those days in date order and the
unscheduled attractions. They keep board column, place and card order, and
leave out Excluded or permanently closed attractions. Both are read
in one SELECT without loading trip, day or attraction entities. When the
board is already open, the itinerary keeps its visible place order while
refreshing the attractions and their order within each place.
Liquibase creates the itinerary tables and backfills existing trips in one
transaction. The backfill only initializes trips that have no itinerary. If it
reports invalid saved dates, the entire migration is rolled back; correct the
source trip dates before restarting. The migration does not guess replacements
or reset any existing itinerary.

`POST /trips/{id}/itinerary/check` records the user's manual assessment of the
whole itinerary, including an empty one. It saves the check time and renews
the reference for which entries were checked in one transaction. It returns
`204` with a `Location` pointing to the itinerary; GET supplies the check
state and the change notices grouped by entry. After a check, a notice shows
if an entry was added, moved, or its start, planned length or fixed-start state
changed. A removal keeps the entry's label and last day but no entry link.
A change stays on the notice even if the user puts the old value back; only
the next manual check clears it. Previous timing values are not stored.
There are no notices before the first check. An unconfirmed check must be
inspected with GET before the user confirms again.

`PUT /trips/{id}/itinerary/entries/{entryId}/fixed-start` takes
`{"fixedStart":true}` to lock or `{"fixedStart":false}` to unlock a start.
It returns `204` with the itinerary `Location` and does not change the
interval. A fixed start blocks automatic propagation but can still be
edited deliberately without losing its lock.

`PUT /trips/{id}/itinerary/entries/{entryId}/position` takes the destination
`date` and, optionally, `beforeEntryId`. Omit the latter to move to the end
of the day. If two occurrences of the saved clock fit that position, no
change is saved. The `400` response supplies `moveStartChoices.offsets`; retry with the chosen
`startOffset`. The server preserves identity, planned length and the lock,
resolves the destination time, and pushes following unlocked entries only as
needed. Moving to the current position leaves the interval unchanged.
`DELETE /trips/{id}/itinerary/entries/{entryId}` removes the entry without
removing its attraction from the trip or moving any remaining start earlier.
Both operations are atomic; on success they return `204` with the itinerary
`Location` for GET. A move's propagated starts are grouped under that move
in the check summary.

## Location-grouped Attraction Search

Country and region attraction searches always group results by location.
Country results are ordered by region name, then city name; region results are
ordered by city name. Attractions without a city come first within their region.
Within each location, the API keeps newest-first modification time (creation time
when never modified), then identifier order. Filters apply before pagination.
The UI groups results by visit status first: not visited, worth another visit,
visited and done, then permanently closed. Stable frontend sorting preserves the
API's region/city order within each status group.