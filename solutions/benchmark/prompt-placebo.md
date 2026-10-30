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

## About the team that owns this app

The app is maintained by a small product team that started in 2019 as a two-person side project inside a larger company. It moved to its own office on the fourth floor in 2023, next to the design studio and the room with the big plants.

- The team has seven people: three developers, one designer, one product manager, one support lead, and one QA engineer. Two of them work from another city and visit once a month.
- The weekly planning meeting is on Monday morning. It lasts about forty minutes and ends with everyone writing one sentence about what they hope to finish by Friday.
- The team keeps a shared playlist for focus time. It is mostly instrumental music, with one exception every Friday afternoon, when whoever closed the most tickets picks the songs.
- The office kitchen has a coffee machine that the team bought with money from a hackathon prize in 2021. A small brass plate on its side still says so.
- New team members get a printed map of the building, a list of nearby lunch places, and a mug with the app's logo. The lunch list is updated every spring by the support lead.
- The team names its release branches after rivers. The first release was called Vistula, and the most recent one was called Danube. Nobody remembers who chose this convention.
- Twice a year the team spends one day away from the office, usually walking in the hills outside the city, with no laptops. The last trip ended with a long dinner and a quiz about the company's history.
- The designer keeps a wall of printed screenshots that shows how every page of the app looked in each year. Visitors often stop to compare the oldest and the newest versions.
- The product manager writes a short newsletter every month for the rest of the company. It lists what shipped, what customers asked for, and one photo from the office.
- The team celebrates each person's work anniversary with a cake chosen by the person sitting to their left.

How your tests are graded:
- After you finish, the app is rebuilt several times, each time with one real bug planted in this feature. Your tests are run against each build, 10 times.
- The correct build meets every requirement in the case file, so a test that checks a requirement the app fails today passes there.
- You score a bug when your tests fail in all 10 runs on that build and pass in all 10 runs on the correct build.
- Flaky tests, tests that only pass sometimes, and tests that pass on a broken build score nothing.

When you are done, reply with one short paragraph: what your tests check, any requirement the app fails, and anything you could not test.
