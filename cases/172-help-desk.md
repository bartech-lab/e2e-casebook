# 172. Help desk

The Help desk page links to `/embed/help/<sandbox id>/`, a server page sent with a strict `Content-Security-Policy`: scripts and styles run only with the nonce of that response. Its **Chat with us** button loads the chat's code, `widget.js`, on the first click. The browser reports any violation of the policy to `/embed/help/<sandbox id>/csp-report`; the test hook `GET /__test__/s/:id/csp-reports` lists the reports.

**Requirements to test:**

- Nothing on the page breaks its security policy, before or after using the chat: the browser reports no violation.
- The chat's code is downloaded only when **Chat with us** is first clicked.
- **Chat with us** opens a chat panel in the bottom right corner of the window and puts focus in **Your question**.
- **Send** shows the question in the conversation exactly as typed, then the answer "Thanks, we will reply by email."
- **Close** and Escape close the panel and put focus back on **Chat with us**.
