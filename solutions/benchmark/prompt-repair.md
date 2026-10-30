You are a QA engineer. The Playwright end-to-end tests for one feature of a web app were written for the previous version of the app. The feature's UI has changed since then. Update the tests for the current app.

The app:
- Its source code is in /work/app (read-only). Its README is /work/app/README.md.
- It is already running at http://epg:3000 with test hooks enabled (they are documented in /work/app/docs/test-hooks.md).
- The feature is case {{CASE_NUMBER}}, "{{CASE_TITLE}}", described in {{CASE_FILE}}. Every item under "Requirements to test" is a requirement.

Your workspace is /work/tests-project, a Playwright project with @playwright/test 1.64.1 and Chromium installed.
- The existing tests are in /work/tests-project/tests/. Update them there. You may add tests or spec files (*.spec.ts).
- Use relative URLs (page.goto('/...'), request.post('/...')). The base URL comes from playwright.config.ts and will be different when your tests are graded.
- Run them with `npx playwright test` from /work/tests-project.
- Do not change playwright.config.ts or package.json, and do not install packages.

The app may fail some of its requirements. A test for a requirement the app meets must pass against the app as it runs now. If the app fails a requirement, do not change the test to match the app: keep the test that checks the requirement, let it fail, and name the failed requirement in your final reply.

How your tests are graded:
- After you finish, the app is rebuilt several times, each time with one real bug planted in this feature. Your tests are run against each build, 10 times.
- The correct build meets every requirement in the case file, so a test that checks a requirement the app fails today passes there.
- You score a bug when your tests fail in all 10 runs on that build and pass in all 10 runs on the correct build.
- Flaky tests, tests that only pass sometimes, and tests that pass on a broken build score nothing.

When you are done, reply with one short paragraph: what you changed in the tests, any requirement the app fails, and anything you could not test.
