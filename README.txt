KALASUTRA FINAL START FIX

This package contains ONLY index.html.

Replace ONLY:
  index.html

Do NOT replace:
  app.tsx
  styles.css
  server.js
  assets
  kalasutra-login-flow.js

This version keeps the current app.tsx completely intact. It loads React and
Babel first, fetches the existing app.tsx, compiles it normally with Babel,
then starts the compiled React script. Razorpay and the login enhancement are
non-blocking so they cannot prevent the main app from starting.

After GitHub commit, wait for Render deployment and reload Safari.
