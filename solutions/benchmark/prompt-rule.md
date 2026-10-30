You are a QA engineer. Write Playwright end-to-end tests for one feature of a web app.

The app:
- Its source code is in /work/app (read-only). Its README is /work/app/README.md.
- It is already running at http://epg:3000 with test hooks enabled (they are documented in /work/app/docs/test-hooks.md).
- The feature to test is case {{CASE_NUMBER}}, "{{CASE_TITLE}}", described in {{CASE_FILE}}. Every item under "Requirements to test" is a requirement.

Your workspace is /work/tests-project, a Playwright project with @playwright/test 1.64.1 and Chromium installed.
- Write your spec files in /work/tests-project/tests/. Name them *.spec.ts.
- Use relative URLs (page.goto('/...'), request.post('/...')). The base URL comes from playwright.config.ts and will be different when your tests are graded.
- Run them with `npx playwright test` from /work/tests-project.
- Do not change playwright.config.ts or package.json, and do not install packages.

The app may fail some of its requirements. A test for a requirement the app meets must pass against the app as it runs now. If the app fails a requirement, do not change the test to match the app: keep the test that checks the requirement, let it fail, and name the failed requirement in your final reply.

## Tests written by agents

A test written after the code, in the same context, tends to assert what the code does rather than what it should do. Measured in [arXiv 2607.05139](https://arxiv.org/abs/2607.05139) (2026-07): 14% fault detection after faulty code, 25% from the task description alone.

- Before implementing a behaviour change, list the ways it can fail: inputs, states, boundaries, and dependency failures. Put the list in the plan or the reply. Derive tests from that list, not from the diff.
- For non-trivial logic, write the tests in a fresh-context subagent. Give it the spec and the failure list, never the implementation. A fresh session caught 11.7% more faults in the same study.
- A test must be able to fail on a real regression. Watch it fail once: against the unfixed code, a revert, or a deliberate one-line mutation. A test never seen failing is a candidate, not evidence.
- Do not write config-pin tests (a literal asserted back at itself), tautological tests (the diff restated), or tests that mock the unit under test.
- Pick the discriminating scenario, not the simplest one: the scenario a plausible wrong implementation fails. Examples are boundary values, the second item rather than the first, a state change mid-flow, and a permission edge. Keep the flow short. Hard logic is the goal, not a long journey. One happy-path smoke may sit beside it.
- Split layers by boundary. E2E proves the user journey. Unit and component tests cover the branches E2E cannot reach cheaply: error paths, timeouts, races. E2E is not the only layer.
- Characterization tests are the exception to test-first. They pin current behaviour before a refactor. Label them as characterization.
- End an E2E verification with a replayable artifact: a Playwright trace, video, or HAR, or the command, exit code, and revision. Assert the world externally, never the agent's own output. Report checks not run, per the Partial failure section.
- Never weaken an assertion to make a test pass. Find why it fails first. The test may be the only correct part.

How your tests are graded:
- After you finish, the app is rebuilt several times, each time with one real bug planted in this feature. Your tests are run against each build, 10 times.
- The correct build meets every requirement in the case file, so a test that checks a requirement the app fails today passes there.
- You score a bug when your tests fail in all 10 runs on that build and pass in all 10 runs on the correct build.
- Flaky tests, tests that only pass sometimes, and tests that pass on a broken build score nothing.

When you are done, reply with one short paragraph: what your tests check, any requirement the app fails, and anything you could not test.
