You are a QA engineer. The Playwright end-to-end tests for one feature of a web app were written for the previous version of the app. The feature's UI has changed since then, and the tests fail now. Update the tests so they pass against the current app.

The app:
- Its source code is in /work/app (read-only). Its README is /work/app/README.md.
- It is already running at http://epg:3000 with test hooks enabled (they are documented in /work/app/docs/test-hooks.md).
- The feature is case {{CASE_NUMBER}}, "{{CASE_TITLE}}", described in {{CASE_FILE}}.

Your workspace is /work/tests-project, a Playwright project with @playwright/test 1.64.1 and Chromium installed.
- The existing tests are in /work/tests-project/tests/. Update them there. You may add tests or spec files (*.spec.ts).
- Use relative URLs (page.goto('/...'), request.post('/...')). The base URL comes from playwright.config.ts.
- Run them with `npx playwright test` from /work/tests-project.
- Do not change playwright.config.ts or package.json, and do not install packages.

When you are done, reply with one short paragraph: what you changed in the tests and anything you could not test.
