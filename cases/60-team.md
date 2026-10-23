# 60. Team

The Team page shows a Roadmap document and its members. Pick who you are with **Signed in as**:
ann is an admin, bob an editor, cy a viewer.

**Requirements to test:**

- Viewers read. Editors also edit the Roadmap. Admins also change anyone's role.
- The server enforces the same rules, whatever the page shows.
- A team always keeps at least one admin.
- If your role changes while the page is open, a refused change says so, shows your new role, and
  keeps the text you typed.
