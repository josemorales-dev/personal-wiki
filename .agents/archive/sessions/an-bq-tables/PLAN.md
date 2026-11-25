# Read the BigQuery `_tbl` tables in the Action Network sync

## Task 1: add a `readTables` switch to the sync

- Status: in progress
- Goal: A sync run with `readTables` set reads each table from `<table>_tbl` in BigQuery and still lands it in the store as `<table>`.

Notes:

- This is step 1 of the rollout in nycdsa/st-migration-scripts#187: read from both. The switch defaults to off, so prod keeps reading the views until someone turns it on. Steps 2 to 4 are Windmill input changes and a later cleanup PR that drops the switch and the view path.
- The table list still comes from the views. `list_actionnetwork_tables` keeps skipping `_tbl` names, so each table is still copied once.
- `TABLE_CONFIG`, the anonymization config, samples, staging paths, and the store target stay keyed by the view name. Only the BigQuery `FROM` and the `INFORMATION_SCHEMA` lookup use the source name.
- `reconcile_all` gets a `readAnTables` input for the Action Network branch only. The ActionKit branch passes `false`.

Scope:

| Path                                                       | Change                                                                                              |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `f/st_migration/sync/sync_actionnetwork_to_lake.ts`        | Add `readTables` parameter and exported `sourceTable`; use it for the `FROM` and the column lookup. |
| `f/st_migration/sync/sync_actionnetwork_to_lake.script.yaml` | Add `readTables` to the script schema.                                                            |
| `f/st_migration/sync/sync_actionnetwork_to_lake.flow/flow.yaml` | Add `readTables` flow input and pass it to each table copy.                                   |
| `f/st_migration/reconcile_all.flow/flow.yaml`              | Add `readAnTables` input; pass it to the Action Network sync, `false` to the ActionKit sync.        |
| `tests/an-sync-tables.test.ts`                             | Test `sourceTable`.                                                                                 |

Seams:

| Interface                         | Behaviour the tests observe                                   |
| --------------------------------- | ------------------------------------------------------------- |
| `sourceTable(table, readTables)`  | Returns `<table>_tbl` when `readTables` is set, else `table`. |

Steps:

1. Write the `sourceTable` tests.
2. Add `sourceTable` and the `readTables` parameter; pass the source name to `readColumns` and into `qualified`.
3. Add the input to the script schema and both flows.

Checks:

- `bun test tests/an-sync-tables.test.ts` passes, and fails before `sourceTable` exists.
- `bun run check` passes.
- `bun test` passes.
