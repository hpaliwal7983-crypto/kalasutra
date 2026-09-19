KALASUTRA — BUYER FINAL RESTORE

This package is the restore intended for the current KalaSutra app.

REPLACE THESE THREE FILES TOGETHER:
1. index.html
2. app.tsx
3. styles.css

DO NOT delete or replace:
- server.js
- assets/
- kalasutra-login-flow.js
- any backend files

What was changed, and only what was changed:
- Removed the automatic permission popup that was covering/intercepting Buyer clicks.
  The permission center still exists and can be opened explicitly with ?permissions=1.
- Made Buyer bottom navigation explicitly touch/click safe.
- Kept the existing Buyer Home, Buyer Reels, Cart, Orders and Buyer Profile components.
- Kept the existing Artisan components/features.
- No Buyer component was replaced with a simplified/new design.
- No diagnostic error overlay is included.

IMPORTANT:
Upload/replace all THREE listed files in the same GitHub commit, then wait for
Render to deploy. Do not mix this package with the earlier diagnostic/clean
index.html files.
