# 141. Library card

The Library card page applies for a library card. `GET /api/s/:id/library-cards` lists the
applications as `{ "applications": [{ "birthDate": "2010-03-07", "parentEmail": "..." }] }`.
**Requirements to test:**

- The date of birth is typed day first: `7.3.2010`, `07.03.2010`, `7/3/2010` and `7-3-2010` all
  mean 7 March 2010. `2010-03-07` works too.
- A date that does not exist, such as `31.4.2010` or `29.2.2011`, gets "Enter a real date, like
  7.3.2010." A date after today gets "Your date of birth cannot be in the future."
- For a valid date the page says "You are N." with your age in whole years today, by your own
  calendar. Your age goes up on your birthday; someone born on 29 February gets a year older on
  1 March in years without one.
- Under 16 you must also give a parent's email; at 16 or older it is not asked for.
- **Apply for a card** sends the date as `YYYY-MM-DD`, and the parent's email only when it was
  asked for, then says "Application sent."
