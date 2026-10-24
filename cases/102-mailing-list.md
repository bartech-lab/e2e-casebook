# 102. Mailing list

The Mailing list page embeds a sign-up form from a mailing service. The form's markup is part of
the page, and a separate script (`/embed/newsletter.js`) loads the list of topics and wires the
form up.

**Requirements to test:**

- Until the form is ready it says "Loading the sign-up form…", and its fields and button cannot
  be used. Once it is ready, that message goes away.
- Nothing the user types after the fields can be used is lost.
- An email address that is not valid shows "Enter an email address like name@example.com.",
  puts focus back on the email field, and subscribes nothing.
- "Weekly news" is chosen by default. Subscribing confirms the address and every chosen topic,
  for example "Subscribed ola@example.com to Weekly news and Offers."
