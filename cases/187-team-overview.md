# 187. Team overview

The Team overview page signs in by itself (`POST /api/s/:id/team-auth/sign-in` answers an access token and a refresh token) and loads three panels at once (Rota, Holidays, Announcements) from `GET /api/s/:id/team-panels/<panel>` with the access token. An expired access token gets `401`. `POST /api/s/:id/team-auth/refresh` with `{ "refresh" }` answers a new access token and a new refresh token; each refresh token works once, and using an old one again ends the whole session, for safety. The test hooks `POST /__test__/s/:id/team-expire-access` and `POST /__test__/s/:id/team-end-session` expire the access token or end the session, and `GET /__test__/s/:id/team-auth-stats` answers `{ "refreshes", "ended" }`.

**Requirements to test:**

- When the access token has expired, **Refresh panels** still shows all three panels; the person notices nothing.
- The page renews the token once, however many panels found it expired at the same moment, and again the next time it expires.
- When the session has ended on the server, the page says "Your session has ended. Sign in again." once, the panels say "Could not load.", and the page does not keep trying.
