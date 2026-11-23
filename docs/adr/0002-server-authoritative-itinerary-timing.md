# The server owns itinerary timing and consequences

The client validates input format, but the server resolves clocks and zones,
calculates elapsed timing, and determines the effects of itinerary changes.

Every new attraction starts at the chosen local clock in the itinerary's
`timeZone`. The client opens an unsaved draft with the start field focused.
It suggests the last entry's end only if it falls on the selected date.
Leaving a complete draft's start field saves its displayed value; cancelling
does not save. The server never substitutes the last entry's end.

If a chosen clock repeats, use its first occurrence, including an unchanged
suggestion. Scheduling requests use `date` for the day and `startTime` for the
local clock (`HH:mm` or `HH:mm:ss`), with no UTC offset; the server rejects
nonexistent clocks in the named zone. A repeated end-clock suggestion can
therefore resolve to an earlier instant than the previous entry's end;
ordinary overlap validation still applies.
The entry's `(trip_id, date)` identifies its itinerary day. Store the local clock
in `start_time` without repeating the date. Combine `date` and `start_time` in
the entry's named zone, keeping the planned elapsed minutes and, for a repeated
clock, the resolved occurrence. Resolve the local start with the server's
current rules and add the elapsed minutes to derive the end. Existing saved
entries can retain a second occurrence. An updated time-zone
database is not a planning edit: there is no historical offset snapshot, warning
or approval.

Timing is an immutable value object validated at construction. Hibernate loads
the stored fields through the same validating constructor. The resolved start
is transient: each load resolves the current zone rules, and subsequent reads
of that instance reuse the validated start without repeating clock validation.

The itinerary response exposes the zone and the resolved `start` and `end`
with their UTC offsets, not the stored minutes. A brief stop starts and ends
at the same instant. Each day's `entries` array is in visit order; clients
preserve that order even when two entries start at the same instant.

Scheduling one attraction on a day (ticket 07) is one write request after the
start is chosen. A free earlier proposed interval is inserted chronologically
without changing saved clocks. An overlap is rejected, not moved. The server
either saves the result in one transaction and returns `204 No Content`, or
returns an error without saving. A successful response includes a `Location`
header pointing to `/trips/{id}/itinerary`. The client reads the updated itinerary
with GET.
If the server cannot resolve a usable visit duration, it requests only
`VISIT_DURATION`. Once the duration is usable, it reports whichever of `START`
and `TIME_ZONE` are missing. The client keeps the draft, collects the requested
details and submits the same action again. There is no separate preview or
confirmation token for this flow.

Later ways to schedule, including drag into a gap, keep the same focused
draft and chosen-clock contract. Position-based recalculation for moving an
existing entry is a different operation. Later confirmation of a specific
consequence, such as disconnecting a transfer or accepting an alternative
path, must keep the chosen clock. If a save is unconfirmed, load and inspect
the itinerary before deliberately submitting again, as in
[the single-editor decision](./0001-trip-planning-actions.md).
