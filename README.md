# KalaSutra V4 — Full Functional Update (ADD-ONLY)

This package is built on the existing KalaSutra master functional version. Existing UI, checkout, Razorpay/COD, login/OTP, verification, Impact Hub, Reels, profiles, product pages and bulk checkout are preserved.

## Added / fixed
- Product Detail back button + mobile floating back navigation.
- Buyer and Artisan profile back navigation.
- Settings / Switch role overlap fix on both profiles.
- Compact, polished Safety & Review card styling.
- Recently Viewed remains real and tied to opened products.
- Explore/Profile actions remain working.
- Add Product: camera/gallery photo upload, making-proof record/gallery, Hindi voice story + AI English draft.
- Product customization: Hindi/English voice request input.
- Separate Buyer Delivery Location and Artisan Craft Location sections using current-device location + manual save.
- AI Talker remains available throughout logged-in flows (dashboard already has its embedded version).
- Reel camera studio: front/back camera switch, Video/Photo modes, camera photo capture, video/gallery upload, music upload/player, timer, speed control, filters, beautify toggle, effects action and working back navigation.
- Existing Razorpay/COD checkout preserved.
- Existing Bulk/B2B checkout preserved with 20+/50+/100+ tiers, quantity and discount/request flow.

## Upload to GitHub
Replace only these four files in the repo root:
- app.tsx
- styles.css
- index.html
- kalasutra-login-flow.js

Do NOT delete or replace the `assets/` folder.
After committing, deploy the latest commit on Render if auto-deploy does not start.
