# Clean up /now and keep events until they end

Repository: `~/Projects/website`, branch `feat/213-now-page`. Each task is one commit in the house style: imperative sentence-case subject, a body saying why, `Refs #213`.

## Task 1: Move /now parsing and labels into map-now

- Status: not started
- Goal: `now.astro` makes one `mapNowGroups` call, and `map-now.ts` owns parsing, the time label, and host matching, with no change in what the page shows.

Notes:

- `groupHref` stays in `map-now.ts`. `WorkingGroupCard.astro` shows the detail and email links side by side, so it can't share an either-or helper.

Scope:

| Path                              | Change                                                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/lib/events-feed.ts` | Export `TIME_ZONE` and `DAY_MS`.                                                                                        |
| `apps/web/src/lib/map-now.ts`     | `mapNowGroups` takes raw CMS records; `NowEvent` gets `timeLabel` in place of `weekday` and `time`; `hostKey` is private; import the two constants. |
| `apps/web/src/pages/now.astro`    | Pass the raw records to `mapNowGroups`; render `timeLabel`.                                                             |
| `apps/web/tests/map-now.test.ts`  | Build groups as CMS records; drop the `hostKey` test; add a test for records that don't parse; assert `timeLabel`.      |

Seams:

| Interface      | Behaviour the tests observe                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `mapNowGroups` | Skips group and event records that don't parse; labels a timed event "Tue · 7:00 PM" and an all-day event "Thu · All day". |

Steps:

1. Land the test changes and watch the new tests fail.
2. Land the `events-feed.ts`, `map-now.ts` and `now.astro` changes for this task only.
3. Commit as "Move /now parsing and labels into map-now".

Checks:

- `pnpm --filter web exec vitest run tests/map-now.test.ts` passes.
- `pnpm --filter web lint` shows 0 errors.

## Task 2: Keep a working group's next event until it ends

- Status: not started
- Goal: an event stays a group's next event until it ends, still labelled "Coming up".

Notes:

- The next event is the soonest event a group hosts that hasn't ended. It ends at `endsAt`. When `endsAt` is missing or not after the start, it ends when its New York day closes.
- The eyebrow stays "Coming up" for every event, including one under way. Jose chose one label to keep it simple.
- The query still starts at the start of today, so a multi-day event that began on an earlier day doesn't appear. Out of scope.

Scope:

| Path                              | Change                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| `apps/web/src/lib/events-feed.ts` | Add `startOfNextNewYorkDay`.                                                                |
| `apps/web/src/lib/map-now.ts`     | Select `endsAt`; keep events until `eventEnd`.                                              |
| `apps/web/tests/map-now.test.ts`  | Replace "not started" with "not ended"; cover an event under way, a missing or bad end time, and an all-day event today. |

Seams:

| Interface      | Behaviour the tests observe                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `mapNowGroups` | Keeps an event until `endsAt`, or until midnight in New York without a usable `endsAt`. |

Steps:

1. Land the new tests and watch them fail against Task 1's code.
2. Land the rest of the draft.
3. Commit as "Keep a working group's next event on the page until it ends".

Checks:

- `pnpm --filter web exec vitest run tests/map-now.test.ts` fails before step 2 on the "has started" tests and passes after it.
- `pnpm --filter web lint` shows 0 errors.
- `pnpm --filter web test` passes in full.
