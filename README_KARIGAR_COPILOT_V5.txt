KALASUTRA — KARIGAR AI COPILOT V5

What changed
- Added a compact/floating Karigar AI copilot that stays over the app instead of opening a separate AI page.
- Added automatic welcome message when the logged-in Artisan/Buyer experience opens.
- Added voice input, browser speech output, short conversational replies, local conversation memory, and compact/minimize mode.
- Added actual navigation actions for Add Product, Orders, Reels, Profile, My Products and the artisan growth modules.
- Add Product now has a conversational guide that checks the live Add Product UI for photos, story, price and proof before guiding the next step.
- Added a 12-language selector directly below Artisan/Buyer role selection. The old startup language overlay is disabled.
- Added server-side OpenAI Responses API endpoint: POST /api/ai/chat.
- Added artisan-aware Orders API filtering so Karigar AI can use real artisan order data instead of inventing it.
- Fixed render.yaml so Render starts the actual server correctly.

OpenAI setup
- Keep OPENAI_API_KEY only in Render Environment Variables.
- Optional: OPENAI_MODEL (defaults to gpt-5.6-luna).
- Never put the secret key in this ZIP, GitHub, browser code, or chat.

Important
- Browser speech recognition/speech synthesis support varies by browser and iOS version. The copilot always keeps a text input fallback.
- The OpenAI API is server-side; the browser never receives OPENAI_API_KEY.
