# Liquibase changesets

Place individual changeset files (`.yaml`, `.xml`, or `.sql`) in this directory.
They are picked up automatically by `db.changelog-master.yaml` via `includeAll`.

Naming convention (recommended):
`NNNN-short-description.yaml` (e.g. `0001-init-schema.yaml`).

Notes:
- `spring.jpa.hibernate.ddl-auto` is set to `validate`. Liquibase owns all
  schema changes; Hibernate only checks that the entities still match the
  database produced by the changelog. To evolve the schema, add a new
  `NNNN-*.yaml` changeset here (do **not** edit existing applied changesets).
- The baseline (`0001-init-schema.yaml`) carries an
  `onFail: MARK_RAN` precondition checking for the absence of the `continent`
  table, so environments where Hibernate previously created the schema simply
  record the changeset as applied instead of attempting to recreate tables.
- Liquibase is disabled in the test profile (`spring.liquibase.enabled=false`)
  because integration tests rely on Hibernate to create the schema in the
  Testcontainers Postgres instance.
