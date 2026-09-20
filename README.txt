KalaSutra — BUYER BLANK FIX / SAFE RUNTIME PACKAGE

Upload/replace these files in the same public/static folder used by the live app:
- index.html
- app.js (new compiled runtime; removes in-browser Babel/TSX compilation)
- app.tsx (source copy with hook-order fix)
- styles.css
- kalasutra-login-flow.js

What this fixes:
1. React no longer depends on Babel compiling app.tsx in the browser.
2. App hooks are always declared in a stable order.
3. Buyer permission UI no longer automatically blocks the app; use ?permissions=1 only when needed.
4. Buyer Home/Reels/Cart/Orders/Profile navigation is preserved.
5. Existing artisan features/design are kept; this is an additive runtime fix.
6. If a browser/runtime error still occurs, the page now shows a visible loading error instead of a blank cream screen.

IMPORTANT: Do not delete the existing backend/API files or assets. Keep the existing /assets folder and server configuration unchanged.
