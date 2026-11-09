# Testing report

Run with `npm test` (Node's built-in runner, no extra packages).

Covered (server/lib/slots.mjs, 8 tests): image type detection by bytes; 10 empty slots on start; original and anime stored separately under the same number; replacing removes the old file and changes the cache version; rejection of non-images and bad slot/kind; removing one side only; hand-dropped files are picked up; captions saved, trimmed and kept across uploads and restarts.

Not covered by automated tests: the React UI, the 3D scene, and the slideshow timeline. Check them by hand in a browser: upload a pair in Memories → Manage photos, open the slideshow, and test Pause/Play/Previous/Next on desktop and a phone-sized window.
