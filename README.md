KALASUTRA — PRODUCTION UI FIX V2

This V2 is an additive responsive-layout patch built on the existing KalaSutra production UI fix.

PRESERVED:
- Existing KalaSutra design language and screens
- Existing Artisan Impact Hub + all 7 modules
- Fair Price AI calculation and CTA
- Craft Capital, Material Hub, Design Lab, Craft Passport, Direct Market Match, Craft Gurukul
- Buyer marketplace, Recently Viewed, Reels, cart/checkout, Bulk/B2B, Razorpay/COD
- Profiles, Add Product, verification, AI Talker and bottom navigation
- Existing logo/assets and camera/reel functionality

FIXED:
- Mobile bottom-nav content collision by reserving real document space
- Artisan greeting/switch-button flow
- Buyer Switch to Artisan top spacing
- Profile mobile stacking
- Product Detail mobile Back button overlap with logo
- Impact Hub one-column accordion flow; expanded panels stay in normal document flow
- Add Product verification CTA safe-area spacing
- AI Talker/floating controls moved to a safer rail above bottom navigation
- Mobile width/overflow constraints and safe-area handling

IMPORTANT:
Only replace app.tsx, styles.css, index.html and kalasutra-login-flow.js in the repo root.
Do NOT delete or replace the assets folder.
