# 163. Members

The Members page is a rowing club's members area: a home page, **Meeting minutes** (`/s/:id/members/minutes`) and **Club accounts** (`/s/:id/members/accounts`). Everyone shares the club password `rowing`. Signing in happens at `/s/:id/members/sign-in`, which takes the page to go to next as `?next=`.

**Requirements to test:**

- Opening a members page while signed out goes to the sign-in form, and after signing in to that exact page, with its query and `#` part.
- `next` is followed only to a page of this sandbox's members area. Anything else goes to the members home: another site in any spelling (`https://…`, `//…`, `/\…`, encoded), `javascript:` and other schemes, and other pages or other sandboxes of this app.
- After signing in, the browser's Back button does not return to the sign-in form. Opening the sign-in form while signed in goes straight on, by the same rules.
- A wrong password says "Wrong password." **Sign out** ends the session; members pages then ask to sign in again.
