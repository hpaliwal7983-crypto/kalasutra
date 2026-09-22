KalaSutra — Karigar AI V3

This is an additive upgrade built from the supplied current app snapshot. Existing screens/assets are kept; the new AI layer sits on top of them.

Flow
- Existing splash → Get Started → Login → OTP → Name/Role remains.
- Language selection is inline directly below Artisan/Buyer. It does NOT appear as a startup overlay.
- After Artisan opens, a warm KalaSutra/ Karigar AI welcome opens automatically.
- AI supports voice + typing, remembers short conversation history, and replies in the selected language.
- AI can perform real app navigation through action events: Add Product, Orders, Reel, Fair Price, Market Match, Craft Passport, Material Hub, Design Lab, Craft Gurukul, profile, buyer cart/wishlist/home/search.
- Today’s order/earnings numbers are read from the existing demo database when available; the AI is instructed not to invent metrics.
- Natural voice is generated server-side through OpenAI TTS when OPENAI_API_KEY is configured; otherwise the browser TTS fallback is used.

Files changed
- app.js — small integration hooks for modern AI actions/user context; legacy AITalker is suppressed when the modern layer is active.
- index.html — loads language + modern AI before app.js.
- kalasutra-language.js / .css — role-first inline language selector.
- kalasutra-ai-welcome.js — modern conversational UI/orb + voice/text + action routing.
- server.js — /api/ai/status, /api/ai/chat, /api/ai/tts and OpenAI proxy helpers.
- server/server.js — Render/local entrypoint wrapper.
- package.json / render.yaml — corrected start/build commands.
- .env.example + AI-KEY-SETUP.txt — secret setup guidance.

No API key is included in this ZIP.
