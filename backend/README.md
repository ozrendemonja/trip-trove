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

Each attraction entry and unscheduled card carries its trip-owned working
hours, visit duration and trip note when recorded. The attraction facts
dialog reads current catalogue data from `GET /attractions/{id}` on demand
(one additional SELECT), keeping the catalogue tip separate from the trip
note and the entry's planned length separate from the visit duration.

Liquibase creates the itinerary tables and backfills existing trips in one
transaction. The backfill only initializes trips that have no itinerary. If it
reports invalid saved dates, the entire migration is rolled back; correct the
source trip dates before restarting. The migration does not guess replacements
or reset any existing itinerary.

`POST /trips/{id}/itinerary/check` records the user's manual assessment of the
whole itinerary, including an empty one. Send `{"checkContext":"..."}` with the
value from the displayed itinerary. If that context is stale, the
server returns `409` without acknowledging changes. Reload and review the
itinerary before confirming again. A successful check saves the check time
and renews all entry and source-change baselines in one transaction. It returns
`204` with an itinerary `Location`. After an unconfirmed reply, use GET to
inspect the saved check and any later notices; do not replay the earlier request.

GET supplies the check state and notices grouped by entry. Watched trip and
catalogue values are compared with their values when scheduled or at the last
check. Field-specific versions preserve changes that were restored between
reads. Existing entries start tracking from the values present at migration;
no earlier source history is inferred. Source notices can appear before the
first check without changing the **Not yet checked** state. Manual addition,
move, clock, length, start-lock and transfer notices appear only after a
check. Removing an entry ends source tracking; after a check its removal
keeps the label and last day but no entry link.

Each saved entry also includes a `warnings` array, separate from change
notices. Permanent closure keeps existing entries editable and movable, but
prevents new entries for the attraction and excludes it from unscheduled
attractions. Reopening it never restores removed entries. An out-of-range
planned length, or a missing or invalid source visit duration, warns without
changing saved timing. `MISSING_TRANSFER` belongs to the gap after an entry,
not to the last entry of a day. These conditions are derived by the same
one-SELECT itinerary read. A manual check can accept them without fixing them: warnings
remain visible, and correcting a condition is a new change to check.

`PUT /trips/{id}/itinerary/entries/{entryId}/fixed-start` takes
`{"fixedStart":true}` to lock or `{"fixedStart":false}` to unlock a start.
It returns `204` with the itinerary `Location` and does not change the
interval. A fixed start blocks automatic propagation but can still be
edited deliberately without losing its lock.

An attraction has one planning note per trip, edited in Edit mode via
`PUT /trips/{id}/attractions/{attractionId}/note`. The itinerary shows this
same `tripNote` before and after scheduling or moving the attraction.
There is no separate note for its position or date.

Use `PUT /trips/{id}/itinerary/days/{date}/note` to replace a day's untimed
reminder. It takes `{"note":"..."}` (up to 2,000 characters of plain multiline
text); an empty string clears it. It returns `204` with an itinerary `Location`.
GET omits an absent day note. Moving an attraction does not move the day note.
A date change cannot drop a day that still has a note.

Day notes count as itinerary content, but they are reminders outside the
manual check. Adding, editing or clearing one does not invalidate the check
context or create a change notice.
The itinerary and trip overview (`hasItineraryEntries`, `hasItineraryDayNotes`)
still use one SELECT each.

For board removal or a move to Excluded Attractions, preview the scheduled
entry, its affected dates and its incoming and outgoing transfers using
`GET /trips/{id}/itinerary`. After the user reviews it, send the `entryId`
and the previewed `transfersToRemove` (if any) as the optional JSON body of
`DELETE /trips/{id}/attractions/{attractionId}`, or as `itineraryRemoval` on
the board move or group update. An attraction has at most one entry, so the
request removes that entry wherever it is, even if it moved after the
preview, provided the disconnected transfers still match. A missing or
changed `itineraryRemoval` returns `409` with no changes; load the itinerary
and review the current consequences before submitting again. For unscheduled
attractions, omit `itineraryRemoval`. Each request applies the board and
itinerary effects in one transaction, leaves other entries' timings alone,
and returns `204`. After a check, the removal notice includes whether the
attraction was excluded or removed from the trip. Moving it back from
Excluded never recreates the entry.

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

### Transfers between entries

`PUT /trips/{id}/itinerary/transfers/{fromEntryId}/{toEntryId}` replaces the
transfer between ordered neighbours on one day. Send `mode` (`WALKING`,
`METRO`, `BUS`, `TRAM`, `TRAIN`, `CAR`, `BOAT` or `FLIGHT`), nonnegative whole
`minutes`, and optionally `note` (up to 512 characters). Transfer distance
is not stored or returned by the API. `DELETE` on the same route clears the
transfer and does not pull any start earlier. Both return `204` with the itinerary
`Location`. GET includes `outgoingTransfer` on the departure entry only
when entered. An absent transfer adds no time; zero minutes is a recorded
value, not missing data.

Timing propagation leaves each following start in place until the preceding
end plus its transfer needs more time. A conflict with a fixed start or
itinerary bounds rejects the whole edit, not the transfer in isolation.
There is no 24-hour cap.

An insertion, move or removal that disconnects transfers returns `409`
with `transfersToRemove` and writes nothing. After the user reviews them,
repeat the same action with `transfersToRemove` containing the listed
`transfer` objects. This removes exactly those transfers with the rest of
the action; none is reused for a different pair. A pool addition still uses the submitted clock and
does not retime saved entries.

## Location-grouped Attraction Search

Country and region attraction searches always group results by location.
Country results are ordered by region name, then city name; region results are
ordered by city name. Attractions without a city come first within their region.
Within each location, the API keeps newest-first modification time (creation time
when never modified), then identifier order. Filters apply before pagination.
The UI groups results by visit status first: not visited, worth another visit,
visited and done, then permanently closed. Stable frontend sorting preserves the
API's region/city order within each status group.