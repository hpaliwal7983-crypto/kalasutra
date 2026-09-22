
# KalaSutra — Karigar AI Copilot V7

This package is ONLY for the Karigar AI Copilot integration.
It does NOT replace KalaSutra's index.html, dashboard, routing, buyer UI, or existing screens.

## What this version implements

### 1. Reference-style Copilot
- Original KalaSutra app remains visible behind the AI.
- Immersive dark translucent listening overlay for Artisan.
- Centered female Karigar avatar.
- Glowing circular rings.
- Animated voice waveform.
- Listening / Speaking / Thinking states.
- Large microphone.
- Cancel button.
- Compact mode after the task screen is visible.
- No written chat window.

### 2. Natural voice-first behavior
- Warm conversational turns.
- Short responses.
- One question at a time.
- No call-center wording.
- Mixed Hindi-English understanding.
- Selected language controls speech locale.
- Browser speech fallback.
- Optional OpenAI server response for natural conversation.

### 3. 12-language pack
Hindi, English, Marathi, Gujarati, Punjabi, Bengali, Tamil, Telugu, Kannada, Malayalam, Odia and Urdu.

### 4. Add Product flow
Voice:
"Mera naya product add karna hai"

Then:
- open Add Product
- guide 2–3 photos
- ask for product story/details
- guide 15–30 sec making-proof video
- review details
- ask explicit publish confirmation

The host app can send progress events:

window.dispatchEvent(new CustomEvent("kalasutra:copilot-flow", {
  detail:{step:"photos", photos:1}
}));

Valid steps:
photos / details / video / review / confirm

## EXACT INSTALLATION

### A) app.js

Find your existing:

function AITalker(...)

Delete ONLY that function block.

Paste the complete function from:

integration/AITalker.replacement.js

Do NOT delete or replace:
- index.html
- the AUTH / ONBOARDING section
- router
- AddProductScreen
- Buyer screens
- existing dashboard

### B) styles.css

Append the complete contents of:

integration/karigar-ai-copilot.css

Do not delete existing CSS.

### C) server/server.js (optional but recommended)

Copy:

server/karigar-ai-route.js

Then near your Express app initialization:

const { registerKarigarAIRoute } = require("./karigar-ai-route");
registerKarigarAIRoute(app);

If your server already uses a different module system, keep its existing module style and adapt only these two lines.

### D) Render

Keep:
OPENAI_API_KEY = your existing secret

Optional:
OPENAI_TEXT_MODEL = gpt-5.6-luna

Do NOT put the API key in GitHub.

## IMPORTANT ABOUT THE AVATAR

The package includes the reference avatar crop as a visual reference.

The component currently uses:
 /assets/avatar-artisan.png

If your deployed app's existing avatar is the wooden puppet, replace that one asset with the preferred female avatar image OR change the two src values inside AITalker.replacement.js to your preferred avatar path.

No HTML change is required.

## IMPORTANT LIMITATION

Browser SpeechRecognition support differs by browser/device. The 12-language UI and speech locales are included, but reliable production multilingual transcription should eventually move to a server/realtime transcription layer.

This package deliberately does not claim fake business data. If the app has no real orders/earnings/views, Karigar AI will not invent them.
