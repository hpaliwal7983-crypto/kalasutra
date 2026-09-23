# KalaSutra V7 — Warm Welcome Center AI Avatar

## What this add-on changes

This is a focused V7 add-on for the restored KalaSutra V6. It is intentionally NOT a replacement V6 project.

It adds:

- Warm Welcome Center AI Avatar overlay
- Natural conversational OpenAI TTS
- Voice input + spoken replies
- Extended Indian-language selector
- OpenAI language-aware fallback
- Natural Hindi/English code-switching
- Voice command → existing V6 Add Product screen
- Add Product flow events for photo/details/video/review guidance
- Server-side OpenAI key handling

## Important

Keep your V6 UI, router, screens and existing files. Attach only these V7 pieces.

## Install

1. Copy `frontend/karigar-copilot-v7.js` and `frontend/karigar-copilot-v7.css` into the V6 frontend assets.
2. Load them after React/ReactDOM and before the V6 screen that mounts the copilot.
3. Use the small integration in `frontend/integration-snippet.js` with your existing V6 `go()` function.
4. Copy `server/openai-routes.js` into the existing Node/Express backend and mount it once:

```js
const mountKalaSutraV7AI = require('./server/openai-routes');
mountKalaSutraV7AI(app);
```

5. Set the server environment variable:

```text
OPENAI_API_KEY=your_server_side_key
```

Optional:

```text
KALASUTRA_AI_MODEL=gpt-5.6-luna
KALASUTRA_TTS_MODEL=gpt-4o-mini-tts
KALASUTRA_TTS_VOICE=coral
```

Do NOT put `OPENAI_API_KEY` in frontend JavaScript, React state, localStorage, or public environment variables.

## First demo flow

Say:

> “Aaj mujhe ek product add karna hai.”

The assistant routes to the existing V6 `addProduct` screen and announces the next step.

For the existing Add Product screen, dispatch the `kalasutra:copilot-flow` events shown in `integration-snippet.js` so the avatar can announce photo → details → making video → review guidance.

## Why the voice should feel less robotic

The V7 TTS request sends a voice-direction instruction to the server instead of relying only on browser `speechSynthesis`. Browser speech remains only as a fallback. The server keeps the OpenAI key private and returns generated audio to the browser.
