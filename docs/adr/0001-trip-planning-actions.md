# Single-editor trip planning in MVP

MVP assumes one user editing a trip in one browser tab. To keep planning
simple, writes use ordinary requests and database transactions, without
revision tracking, action identities or replay mechanisms.

## Consequences

- Concurrent editing is unsupported; later writes may overwrite earlier values.
- Keep one pending save in the active board, with saving, saved and error
  feedback. This does not coordinate writes across tabs or sessions.
- A timeout or lost response does not imply rollback. Reload and inspect saved
  planning before retrying; do not replay writes automatically.
