KalaSutra — Karigar AI upgrade
================================

This ZIP is additive. It does NOT replace app.js or remove your existing screens/features.

What it adds:
- Multilingual Karigar AI speech using the language selected in the KalaSutra welcome screen.
- Same-language voice recognition preference.
- First-run role handoff: the Artisan/Buyer choice from the welcome screen is automatically applied to the existing app role screen after login.
- Voice aliases for Craft Capital and Market Hub, using the existing Growth Hub cards.
- Existing seven artisan systems remain available:
  Fair Price AI, Craft Capital, Market Hub / Material Hub, Design Lab,
  Craft Passport, Direct Market Match, Craft Gurukul.
- A small Language button appears inside Karigar AI so the language can be changed later.
- Existing UI, routes, product IDs, photos, reels, orders, verification, payments, etc. are left untouched.

INSTALL
-------
1. Upload `index.html` from this ZIP to the root of your GitHub repo and replace the existing `index.html`.
2. Upload `kalasutra-ai-welcome.js` to the root of your GitHub repo.
3. Commit both files.
4. Keep your existing `kalasutra-language.js` and `kalasutra-language.css` files in the repo; the included index.html loads them.
5. Render will then load the new Karigar AI enhancement automatically.

Important:
- The browser still controls whether speech recognition / speech synthesis is available.
- Microphone/camera/location permissions remain browser permissions.
- This upgrade does not create a cloud LLM or API key; it enhances the existing in-browser Karigar AI and voice flows.
