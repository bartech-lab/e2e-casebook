# 175. Close account

The Close account page links to `/embed/account/<sandbox id>/`, two server pages that close the account: **Continue** leads to a confirmation page where the person types CLOSE and presses **Close my account**. The Close account page also shows the first page in a frame titled "Close account preview". The test hook `GET /__test__/s/:id/account-closed` answers `{ "closed": true }` once the account is closed.

**Requirements to test:**

- Neither page can be shown inside a frame on another site (another origin): the browser refuses to show it there, so no other site can trick someone into clicking **Close my account**.
- Both pages can be shown in a frame on this site, as the preview does.
- The account closes only after CLOSE is typed in capitals; anything else says "Type CLOSE in capitals to confirm." and closes nothing.
- After closing, the page says "Your account is closed."
