KalaSutra additive UI + routing fix

Replace ONLY these two files in the existing GitHub repository:
1. app.tsx
2. styles.css

Keep the existing index.html and kalasutra-login-flow.js unchanged.

Included fixes:
- defensive route/user fallback to prevent a blank cream screen
- runtime error recovery screen instead of a silent blank page
- Buyer Home Explore by Craft section
- Cart back button preserved
- safer Orders / My Reels header spacing
- Buyer Reels spacing above the floating bottom navigation
- existing features and API flows retained; changes are additive
