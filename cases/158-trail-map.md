# 158. Trail map

The Trail map page links to a separate page, `/embed/trail/<sandbox id>/`, run by a service worker. The test hook `POST /__test__/s/:id/trail-deploy` releases the next version of that page for one sandbox (it starts at version 1).

**Requirements to test:**

- The page always opens from its saved copy, so it opens offline once it has been opened online, and shows "Version N" for the version it runs.
- A new version is found when the page opens and when you press **Check for updates**. When the check finds nothing new, it says "You have the latest version."
- When a new version is ready, the page says "A new version is ready." with **Reload**, also when it was found while the page was closed or in another tab. The page never says this on the first visit, and keeps running the old version until Reload.
- **Reload** moves to the newest version: this tab and every other open tab of the page reload once and show the new version number.
- After the move, the page opens offline at the new version, and copies of older versions are gone from the browser's caches.
