KalaSutra — Additive UI Fix Patch

WHAT THIS PATCH DOES
- Keeps the existing KalaSutra React app and all current features intact.
- Changes Buyer Home presentation toward the supplied reference style.
- Adds functional EXPLORE BY CRAFT cards: Pottery, Textiles, Woodwork, Metalwork, Cane & Bamboo, Jewellery, Home Decor, More.
- Restores a Back button on the main Buyer Cart screen.
- Adds responsive safe-area/layout fixes for Buyer Orders, Artisan Orders & Earnings, Artisan My Reels, Cart, and Buyer Reels.
- Prevents the fixed bottom navigation from covering Reel actions/content.
- Keeps the existing login/OTP/captcha animation logic.

HOW TO INSTALL
1. In the GitHub repo hpaliwal7983-crypto/kalasutra, replace ONLY the root file: kalasutra-login-flow.js
2. Do NOT delete app.tsx, styles.css, index.html, assets, server files, or any existing files.
3. Commit the replacement. Render will redeploy normally; if not, use Manual Deploy -> Deploy latest commit.

WHY ONLY ONE FILE
The GitHub connection available here is read-only for this repository (write attempts return HTTP 403), so this patch is packaged as an additive file that index.html already loads. It avoids overwriting your current 150KB app.tsx / 148KB styles.css and therefore protects your existing designs and features.

The patch is safe to remove: restoring your previous kalasutra-login-flow.js removes the added UI layer without changing app.tsx.
