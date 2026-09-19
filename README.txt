KALASUTRA WORKING INDEX FIX

Replace ONLY index.html.

DO NOT replace:
- app.tsx
- styles.css
- server.js
- assets
- kalasutra-login-flow.js

This index:
- keeps the current app.tsx and styles.css untouched
- uses stable CDN builds
- restores normal Babel React execution
- loads the login animation AFTER the main app so it cannot block startup
- keeps a visible error panel if the browser still reports a startup error

After committing index.html, wait for Render deployment and reload Safari.
