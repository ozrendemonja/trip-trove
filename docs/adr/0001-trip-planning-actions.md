# Single-editor trip planning in MVP

MVP assumes one user editing a trip in one browser tab. To keep planning
simple, writes use ordinary requests and database transactions, without
revision tracking, action identities or replay mechanisms.

## Consequences

- Concurrent editing is unsupported; later writes may overwrite earlier values.
- Share one pending save across the board and itinerary in the active tab.
  Step changes and leaving the trip wait for it. A rejected proposal stays
  available until corrected or discarded. Warn before reloading or closing
  with local input, a pending save or an unconfirmed outcome.
- A timeout or lost response does not imply rollback. Reload and inspect saved
  planning before retrying; do not replay writes automatically. For an
  unconfirmed addition, inspect whether the attraction is present. If it is
  absent, the draft keeps the chosen clock for a deliberate retry.
- An ordinary refresh can show that newer data is available without changing
  an active proposal or settling an unconfirmed save. Only accept current
  responses; reads started before a later write cannot replace its results.
  A failed refresh leaves previously loaded planning visibly stale.
