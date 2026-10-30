# Agent benchmark

An AI agent gets one case's README promise and writes Playwright tests for it. The tests are then
scored against that case's planted bugs with the same 10 of 10 rule as the hand-written approaches.

## Run

```sh
node benchmark/run.ts --agent bonsai --case due-dates --runs 3
npm run score -- due-dates --config benchmark/playwright.config.ts --tests bonsai/due-dates/ --approach-by run
```

`run.ts` needs Docker and `claude` and `omp` on `PATH` (their binaries are copied into the agent image). The app is
this repository; its committed HEAD is what gets tested, so commit first. Each run:

1. Builds `epg-app:<sha>` from the repository's committed HEAD, and `epg-agent` from `image/`
   (Playwright 1.64.1 with Chromium, the agent CLIs, and the `workspace/` project).
2. Starts the app with test hooks on a private Docker network, reachable as `http://epg:3000`.
3. Runs the agent in a second container. It sees a read-only copy of the public source at
   `/work/app` and an empty `/work/tests-project/tests`. The copy leaves out `solutions/`, so the agent
   never sees these answers.
4. Saves the specs, a gzipped transcript, and `run.json` (exit code, duration, and counts of
   `waitForTimeout`, `skip`/`fixme`, `evaluate`, `route`, `clock`, test hooks, and hardcoded URLs)
   under `runs/<agent>/<case>/<n>/`, or `runs/<agent>-<variant>/...` with `--prompt prompt-<variant>.md`.

Agents: `bonsai` (omp with Bonsai 2 27B on a llama.cpp server; needs `LLAMA_CPP_BASE_URL` and
`LLAMA_CPP_API_KEY` in the environment) and `claude` (needs `CLAUDE_CODE_OAUTH_TOKEN`).
Each run is capped at 20 minutes (`--timeout-min`); rounds 2 to 8 used 45, round 1 used 30. The scorer config gives each test 10 s.

The prompt (`prompt.md`) tells the agent the grading rule. A clean-build failure in any of its
tests scores the whole run as `unstable baseline`. `prompt-no-rule.md` is the same prompt without
the grading section.
`prompt-v2.md` adds that the app may break a promise: the agent keeps the failing test and names
the broken promise. The trap cases (11, 12) need it, because their shipped build breaks a promise
and the correct build scored against is the fixed one (`baseline` in `bugs.ts`).

Cases: optimistic-moves, due-dates, toast-and-polling (rounds 1-3), checkout-total and
shipping-insurance (the AI-trap cases). Without `--case`, every case runs.

Results: [RESULTS.md](RESULTS.md).
