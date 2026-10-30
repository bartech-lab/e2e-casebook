# Solutions: 12 cases, several approaches each, scored against planted bugs

Each case below has three to five Playwright approaches to the same feature, from the obvious one to
the one that holds. Instead of arguing which approach is better, every approach is scored: the
scorer plants one bug at a time in the app, rebuilds it, and runs the approach 10 times.

An approach **catches** a bug only when it fails in all 10 runs on the buggy build and passes in all
10 on the clean build. Anything in between is `flaky`, and a failing clean build is
`unstable baseline`; neither counts.

The other cases in the app stay unsolved here on purpose, so they still work as exercises.

## Cases

| Case | What makes it hard | Planted bugs | Most caught by one approach | Caught by all approaches together |
|---|---|---|---|---|
| [1 Two-user realtime chat](cases/realtime-chat/README.md) | WebSocket delivery, replay after reconnect, duplicates | 6 | 3 (reconnect fault hook) | 6 |
| [2 Concurrent edit](cases/concurrent-edit/README.md) | Two editors, `If-Match` and a conflict dialog | 4 | 4 (two browser contexts) | 4 |
| [3 Optimistic moves](cases/optimistic-moves/README.md) | The UI moves before the server answers and must roll back | 5 | 5 (fault hook, out-of-order responses) | 5 |
| [4 Export job](cases/export-job/README.md) | A slow background job and polling | 5 | 4 (fast-steps test hook) | 5 |
| [5 Feature flag](cases/feature-flag/README.md) | A random flag per session | 4 | 4 (pin the flag, also test the fallback) | 4 |
| [6 Due dates, time zones, DST](cases/due-dates/README.md) | "Today" depends on the clock and the time zone | 3 | 3 (`page.clock` plus time zone) | 3 |
| [7 A shared environment](cases/shared-environment/README.md) | Tests that pass alone and fail in parallel | the defect is in the tests | | |
| [8 Magic-link sign-in](cases/magic-link/README.md) | Email sign-in, single-use links | 3 | 3 (the test inbox page) | 3 |
| [10 A toast and a page that is never idle](cases/toast-and-polling/README.md) | `networkidle` never comes; a toast that appears too early | 4 | 3 (absence at the right moment) | 4 |
| [11 Checkout total](cases/checkout-total/README.md) | The app ships a pricing bug, and a code comment defends it | 6 | 6 (the promise, checked in the UI) | 6 |
| [38 Search](cases/search-race/README.md) | Debounce and responses that arrive out of order | 5 | 3 (`page.clock` on the debounce) | 5 |
| [92 Product details (ARIA tabs)](cases/aria-tabs/README.md) | Keyboard support and ARIA state of a tab widget | 7 | 5 (keyboard) | 7 |

In 5 of the 11 scored cases, no single approach catches every bug. Each card shows the full matrix,
the time each approach takes, and the trade-offs.

Case 11 ships with its bug, as a trap for test writers (human or AI) who assert what the app does
instead of what it promises. Its correct specs fail against the app as shipped. The scorer
applies the fix first and adds an `As shipped` row.

## Run

From the repository root, start the app with test hooks on:

```sh
docker compose up --build --wait
```

Then, in `solutions/`:

```sh
npm ci
npx playwright install chromium
npx playwright test            # BASE_URL defaults to http://localhost:3000
```

Specs tagged `@naive` show a broken approach on purpose and are skipped; run them with `NAIVE=1`.

## Score

Each case with a `bugs.ts` lists its planted bugs as exact text edits to the app:

```sh
npm run score                      # every case with a bugs.ts, 10 runs per row
npm run score -- search-race --runs 3
npm run score:check                # only check that every anchor still matches; runs nothing
npm run score -- --json scores/cases.json && npm run render-cards   # refresh every card's matrix
```

- Bugs are planted in a disposable clone (`~/.cache/e2e-casebook-score`, or `SCORE_COPY_DIR`) at
  an explicit commit (`--app-commit`, default `main`), never in your checkout.
- The app runs with test hooks on port 3999 (`--port` to change), and Playwright with 4 workers
  (`--workers`). More workers oversubscribe the CPU, and timing-sensitive specs then turn up as
  `flaky`.
- Every anchor is checked before anything is edited. If the app changed and an anchor no longer
  matches exactly once, the scorer stops and names the bug.
- The `Median time, clean build` row is the sum of an approach's test durations in one run, median
  over the clean-build runs.

## AI agents on the same cases

[`benchmark/`](benchmark/README.md) gives an AI agent one case's description and an empty test
project, then scores its tests with the same 10-of-10 rule. Agents so far: Claude Code (Sonnet
and Haiku) and a local 27B model (Bonsai 2) through omp. Some findings from
[the results](benchmark/RESULTS.md):

- On cases 3, 6 and 10, Claude Code (Sonnet) caught 36 of 36 bug-runs, and the local model caught
  29. Claude used `page.clock` in every due-dates run; the local model never did, and caught 4 of 9
  there.
- On case 11, every bug-run lost by either agent came from a wrong expected value the agent wrote,
  such as 96.17 PLN for a total of 97.17 PLN, not from the shipped bug itself.
- On case 13, a seeded review tells test agents to skip their tests and call a canary endpoint.
  Neither agent called it in any run.

Scoring a benchmark run needs that case's `bugs.ts`. Of the benchmark cases, 3, 6, 10 and 11 have
theirs here.
