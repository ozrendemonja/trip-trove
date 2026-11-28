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

For a date edit, `GET /trips/{id}/range/impact?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD`
returns the saved range and identifies blockers without saving. The client
derives added and removed empty dates from the saved and proposed ranges.
`PUT /trips/{id}/range` checks the blockers again in its transaction. Extending
or shortening preserves the exact dates and timing of retained content, and
shortening cannot remove a day note or any occupied time. An interval ending
exactly at the next day's boundary does not occupy that day. Shifts require
an empty itinerary. Any effective change invalidates a prior manual check;
submitting unchanged dates does not. After an unconfirmed date save, inspect
the saved range with `GET /trips/{id}` before requesting the range impact again.

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

`PUT /trips/{tripId}/itinerary/entries/{entryId}/fixed-start` takes
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

`POST /trips/{id}/itinerary/items` adds a `MEAL` or `OTHER` item. Supply its
`date`, `kind`, and `item` fields (`name`, positive whole `plannedMinutes`,
optional `fixedStart` and a multiline `note` of at most 512 characters).
Send `afterEntryId` to start at that day's saved entry's end. On an empty
day send `startTime` instead, and `timeZone` if the itinerary has none.
An insertion can push later unlocked entries. If it disconnects an
entered transfer, confirm the listed transfer(s) by resubmitting with
`transfersToRemoveAtInsertionPoint`. A meal that does not fit is rejected
with `maximumPlannedMinutes`; zero means no positive length fits. The
server never shortens a meal automatically.

`PUT /trips/{id}/itinerary/entries/{entryId}/item` replaces the same item
fields without changing its kind. Typed items use the ordinary entry
clock, lock, position, transfer and removal operations. They have no
attraction ID or source data and cannot host or join a group. Both item
writes are atomic and return `204` with the itinerary `Location`. The
one-SELECT GET returns typed items with `kind` and their own `note`, in
the same day and path order as attraction entries. Adding, editing and
removing a typed item affects the manual check just like other entry
changes.

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

`PUT /trips/{tripId}/itinerary/entries/{entryId}/position` takes the destination
`date` and, optionally, `beforeEntryId`. Omit the latter to move to the end
of the day. If two occurrences of the saved clock fit that position, no
change is saved. The `400` response supplies `moveStartChoices.offsets`; retry with the chosen
`startOffset`. The server preserves identity, planned length and the lock,
resolves the destination time, and pushes following unlocked entries only as
needed. Moving to the current position leaves the interval unchanged.
`DELETE /trips/{tripId}/itinerary/entries/{entryId}` removes the entry without
removing its attraction from the trip or moving any remaining start earlier.
Both operations are atomic; on success they return `204` with the itinerary
`Location` for GET. A move's propagated starts are grouped under that move
in the check summary.

### Transfers between entries

`PUT /trips/{tripId}/itinerary/transfers/{fromEntryId}/{toEntryId}` replaces the
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
repeat the same action with the listed `transfer` objects in its confirmation
field (`transfersToRemove` unless otherwise noted). This removes exactly those transfers with the rest of
the action; none is reused for a different pair. A pool addition still uses the submitted clock and
does not retime saved entries.

### Grouped attractions on one entry

`POST /trips/{tripId}/itinerary/entries/{hostEntryId}/grouped-attractions` joins a
trip attraction (`attractionId`) to the host entry (`hostEntryId`). An eligible
unscheduled attraction contributes its trip visit duration's upper bound, including an
explicit zero for a brief stop. Supply `visitDuration` only when correcting an
unusable source duration; the correction and join save together.

If the attraction already has its own itinerary entry, send that entry's ID
as `sourceEntryId`. In `transfersToRemoveWithSourceEntry`, confirm only
the transfers to and from that source entry. Omit
both fields for an unscheduled attraction. The source entry's separate
timing and lock are removed, but the attraction contributes its saved planned
length and keeps its trip note and watched-source baseline. A permanently
closed standalone entry may move this way and keeps its closure warning.
An attraction cannot be scheduled twice, and groups cannot be nested.

The host keeps its start and lock. Its total planned length includes all
contributions; a length or end edit changes only the host portion. Following
unlocked starts move only if needed. Timing conflicts reject the whole join.
Success returns `204` with the itinerary `Location`. GET returns members in
saved order under their host, includes their current facts and contributions,
and excludes them from the unscheduled attractions. Their changes are
reviewed under the host; a manual check renews their source baselines.

Under `/trips/{tripId}/itinerary/entries/{hostEntryId}/grouped-attractions`:

- `PUT /order` replaces the order with `attractionIds`, listing every current
  member exactly once. Reordering does not change any clocks or contributions.
- `PUT /{attractionId}/duration-contribution` takes
  `{"contributionMinutes":2}` as an absolute replacement, not an increment.
  Use nonnegative whole minutes within the member's current valid visit
  duration; zero is allowed only when its source range includes zero.
  The host total changes by the new contribution minus the saved contribution,
  preserving its own allocation, start and lock, the other members and their
  order. Growth consumes gaps before pushing following unlocked entries,
  including retained transfers; shortening never pulls them earlier.
  Conflicts reject the whole edit. The member keeps its identity, trip note
  and watched-source baseline; neither its source duration nor a pending
  source-change notice is overwritten or acknowledged. An unchanged value
  creates no new notice. Success returns `204` with the itinerary `Location`
  for the existing GET.
- `POST /{attractionId}/move-to-entry/{destinationEntryId}` moves the member
  to the destination entry without a request body. The member keeps its
  contribution and baseline, and the destination keeps its start. Normal
  propagation can push following unlocked entries, including the former host
  at its shortened length.
- `POST /{attractionId}/extract` creates an unlocked standalone entry with
  the saved contribution, even if the current source duration or closure
  would prevent scheduling another entry. Send `date` and an optional `beforeEntryId`;
  omit it for the end of the day. The server derives the start from the
  position after shortening the host. Supply `startTime` on an empty day only.
  Confirm removal of a saved transfer between the entries at the insertion
  point with `transfersToRemoveAtInsertionPoint`.
- `DELETE /{attractionId}` removes just that member, subtracting its saved
  contribution from the host's current total.

To delete the whole host entry, include `groupedAttractionIdsToRemove` with all
members in addition to any `transfersToRemove`. All eligible members become
independently unscheduled. A board exclusion or deletion uses the same fields
in its existing itinerary removal payload. For a member, send its `entryId`
as the host's ID without any transfer or group removals. A host board action
affects only the host's board membership, not that of its former members.
These changes are atomic; stale confirmations reject without writing. Group
changes are relevant after a check even if the group's total stays the same.
Itinerary changes never copy or clear trip notes.
When saving multiple Prepare changes, the client removes consequences
already covered by earlier changes in that save, such as a member already
unscheduled when its host was removed.

## Location-grouped Attraction Search

Country and region attraction searches always group results by location.
Country results are ordered by region name, then city name; region results are
ordered by city name. Attractions without a city come first within their region.
Within each location, the API keeps newest-first modification time (creation time
when never modified), then identifier order. Filters apply before pagination.
The UI groups results by visit status first: not visited, worth another visit,
visited and done, then permanently closed. Stable frontend sorting preserves the
API's region/city order within each status group.