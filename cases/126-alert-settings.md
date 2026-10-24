# 126. Alert settings

The Alert settings page has three switches (Email, Text messages, Push notifications) and a choice
of summary email: Daily, Weekly or Never. Email and Weekly start on.
**Requirements to test:**

- Each switch turns on or off with a click, Space or Enter, and tells assistive technology
  whether it is on.
- The summary choice works like radio buttons: Tab reaches it, and the arrow keys change it.
- Whether each switch is on, which summary is chosen, and which control has keyboard focus can
  be seen, also in a high-contrast mode where the system replaces the page's colours (Windows
  contrast themes, `forced-colors: active`).
- The settings are kept in this browser across reloads.
