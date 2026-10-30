# Case 7: a shared environment

## Feature

Card titles are unique within a sandbox (case and surrounding spaces ignored); a duplicate gets
"A card named “X” already exists." The board has a search box and a card count. The specs run
against one long-lived **shared** sandbox, created once in `global-setup.ts`, the way teams share
a staging environment, plus fresh per-test sandboxes for comparison.

What can go wrong is not a product bug: it is tests that pass alone and fail together, because
they create the same data, count data they do not own, or wipe each other's data.

## Approaches

| # | Spec | What it does |
|---|---|---|
| 1 | [`1-fixed-names`](1-fixed-names.spec.ts) | `@naive`. Creates "Release checklist" in the shared sandbox and expects 5 cards. |
| 2 | [`2-unique-names`](2-unique-names.spec.ts) | Unique title per run (worker index plus a random suffix); searches for it and expects exactly one. |
| 3 | [`3-sandbox-per-test`](3-sandbox-per-test.spec.ts) | Same steps as 1, in a sandbox of its own. |
| 4 | [`4-reset-before-each`](4-reset-before-each.spec.ts) | `@naive`. Resets the shared sandbox before the test, then does what 1 does. |

The `@naive` specs are skipped by default; run them with `NAIVE=1`.

## Evidence

No planted bugs: the defect is in the tests. Measured with `npm run isolation` (`scripts/isolation.ts`)
on 2026-10-22, app c2ef129: 10 batches per row, a fresh server (empty in-memory database, new
shared sandbox) for every batch, `NAIVE=1`.

| Condition | 1-fixed-names | 2-unique-names | 3-sandbox-per-test | 4-reset-before-each |
|---|---|---|---|---|
| Alone | 10/10 passed | 10/10 passed | 10/10 passed | 10/10 passed |
| Alone, 3 times in a row | 10/30 passed | 30/30 passed | 30/30 passed | 30/30 passed |
| All together, 1 worker | 10/10 passed | 10/10 passed | 10/10 passed | 10/10 passed |
| All together, 4 workers | 9/10 passed | 10/10 passed | 10/10 passed | 1/10 passed |

- **1 Fixed names** passes alone and fails every repeat after the first: it meets its own
  leftover "Release checklist" (10 of 30).
- **4 Reset before each** passes alone and in sequence, and fails 9 of 10 times beside the other
  specs on 4 workers. Approach 1 creates "Release checklist" in the shared sandbox between 4's
  reset and 4's own create, so 4 gets the duplicate-title error; once in 10 the order flips and
  1 is the one that fails.
- **2 Unique names** and **3 Sandbox per test** pass in every condition.

This settles the 2026-10-19 hand measurement, which saw 1 and 4 fail in varying batches without an
identified cause: 1 fails on repetition, 4 on parallel company.

## Trade-offs

- **1 Fixed names.** The second run meets its own leftovers: a duplicate-title error and a wrong
  count. It passes on a clean environment, so it looks fine in review.
- **2 Unique names.** Survives sharing and parallel workers. It must assert only on data it owns
  (search for its own title), never on totals; it also leaves data behind for someone to clean.
- **3 Sandbox per test.** Fully isolated and still able to assert totals. It needs an environment
  that can create cheap sandboxes, which most shared staging systems cannot.
- **4 Reset before each.** Looks isolated, but a reset is global: it wipes other tests' data in the
  middle of their runs, and parallel resets race. It moves the failure into someone else's test.

On a shared environment, own your data: unique names and scoped assertions (2). Where the system
allows it, isolate instead (3). Never reset what you share.
