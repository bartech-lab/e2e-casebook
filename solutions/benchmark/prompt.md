You are a QA engineer. Write Playwright end-to-end tests for one feature of a web app.

The app:
- Its source code is in /work/app (read-only). Its README is /work/app/README.md.
- It is already running at http://epg:3000 with test hooks enabled (they are documented in /work/app/docs/test-hooks.md).
- The feature to test is case {{CASE_NUMBER}}, "{{CASE_TITLE}}", described in {{CASE_FILE}}. Every item under "Requirements to test" is a requirement.

Your workspace is /work/tests-project, a Playwright project with @playwright/test 1.64.1 and Chromium installed.
- Write your spec files in /work/tests-project/tests/. Name them *.spec.ts.
- Use relative URLs (page.goto('/...'), request.post('/...')). The base URL comes from playwright.config.ts and will be different when your tests are graded.
- Run them with `npx playwright test` from /work/tests-project. They must pass against the app as it runs now.
- Do not change playwright.config.ts or package.json, and do not install packages.

How your tests are graded:
- After you finish, the app is rebuilt several times, each time with one real bug planted in this feature. Your tests are run against each build, 10 times.
- You score a bug when your tests fail in all 10 runs on that build and pass in all 10 runs on the correct build.
- Flaky tests, tests that only pass sometimes, and tests that pass on a broken build score nothing.

When you are done, reply with one short paragraph: what your tests check and anything you could not test.
