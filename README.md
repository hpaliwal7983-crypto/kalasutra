# KalaSutra — Functional Master Update

This version preserves the KalaSutra reference UI and adds/fixes the requested interactions:

- Recently Viewed is live: opening a product records it for the current buyer; newly published artisan products are also added to the browsing trail.
- Buyer Profile Recently Viewed uses real product data and opens Product Detail.
- Explore/search/profile/quick actions navigate to their working screens.
- Product Detail has a visible Back button that uses the app navigation history.
- Add a Piece supports photo Camera + Gallery selection, and making-video Record + Gallery upload.
- 5-second making-proof camera recording remains available.
- Voice-first story supports Hindi and other selected Indian languages through the browser SpeechRecognition API when the browser exposes it; the text box remains available as a fallback.
- Existing checkout, Razorpay/COD, verification, reels, impact hub, login/OTP, and other app flows are retained.

Upload only these files to the repository root:
- app.tsx
- styles.css
- index.html
- kalasutra-login-flow.js

Do not delete or replace the existing assets folder.
