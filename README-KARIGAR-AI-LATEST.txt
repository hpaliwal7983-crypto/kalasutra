KalaSutra — Karigar AI V2 additive upgrade

What this does
- Keeps the existing KalaSutra opening, Get Started, Login, OTP, name and role screens.
- Adds the language selector directly BELOW Artisan/Buyer role selection.
- Supports: Hindi, English, Marathi, Gujarati, Punjabi, Bengali, Tamil, Telugu, Kannada, Malayalam, Odia, Urdu.
- After Artisan opens, shows a warm KalaSutra/“Welcome to KalaSutra” Karigar AI experience automatically.
- Adds the reference-inspired AI orb overlay with voice + typing fallback.
- Uses the selected language for speech recognition and text-to-speech.
- Keeps existing Add Product, Orders, Reels, Fair Price AI, Material Hub, Design Lab, Craft Passport, Market Match and Craft Gurukul screens; the AI routes into those existing actions instead of replacing them.
- Adds a small proactive artisan insight card for today’s orders/earnings where the existing API provides the data.
- Adds a matching KalaSutra AI entry point on the buyer home.

IMPORTANT
- Replace ONLY the existing root file named: kalasutra-ai-welcome.js
- Do NOT replace index.html.
- Do NOT replace app.js.
- Do NOT delete any existing assets or files.
- Your current index.html already loads /kalasutra-ai-welcome.js, so no extra script line is needed.

After upload
1. Commit the file.
2. Deploy on Render as you already do.
3. Open the app, go through the normal flow, choose Artisan/Buyer, then choose language under the role buttons.

Browser note
Voice recognition and microphone behaviour are controlled by the browser. If the browser blocks automatic microphone start, the AI screen still opens automatically and the user can tap the voice button once.
