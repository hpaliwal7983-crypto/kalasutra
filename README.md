# KalaSutra V7.2 — Warm Welcome Center Conversation Add-on

This package is a **focused add-on for the restored V6**. It does not rebuild, replace, or merge the V6 UI.

## What was changed for the exact problem in the reference

The previous compact Karigar AI card is **not** the main experience in this add-on.

This version makes the **Warm Welcome Center** the conversation surface:

- dark soft backdrop + central artisan avatar
- layered warm rings/glow around the avatar
- speech bubble around the avatar, matching the reference behavior
- clear `Listening…`, `Thinking…`, `Speaking…` states
- large microphone + cancel controls
- extended language selector
- the voice assistant can stay conversational while the V6 screen remains untouched

## Voice architecture

Primary: **OpenAI Realtime API over WebRTC** for speech-to-speech conversation and natural turn-taking.

Fallback: the existing chained `/api/ai/chat` + `/api/ai/tts` flow.

The Realtime session uses `gpt-realtime-2.1` with `marin` voice. The fallback TTS uses `gpt-4o-mini-tts` with explicit style instructions for warm, natural conversation.

## First required flow

User says:

> “Aaj mujhe ek product add karna hai.”

The V7 assistant should:

1. show the Warm Welcome Center
2. respond naturally in voice
3. call `open_add_product`
4. open the **existing V6 `addProduct` route**
5. announce the immediate next step: 2–3 clear product photos

No V6 screen is recreated.

## Server install

Mount once in your existing Node/Express server:

```js
const mountKalaSutraV7AI = require('./server/openai-realtime-routes');
mountKalaSutraV7AI(app);
```

Set only on the server:

```text
OPENAI_API_KEY=your_server_side_key
```

Optional:

```text
KALASUTRA_AI_MODEL=gpt-5.6-luna
KALASUTRA_TTS_MODEL=gpt-4o-mini-tts
KALASUTRA_TTS_VOICE=marin
KALASUTRA_REALTIME_MODEL=gpt-realtime-2.1
```

Never put the OpenAI key in frontend JavaScript or localStorage.

## Frontend install

Load:

```text
frontend/karigar-warm-welcome-v7.js
frontend/karigar-warm-welcome-v7.css
```

Then use the small integration snippet in:

```text
frontend/integration-snippet.js
```

## Important V6 preservation rule

Do **not** attach the older `KalaSutra_app_js_KarigarCopilot_V7_READY.js` at the same time as this add-on. That older file contains a separate Karigar Copilot experience. Load only this V7.2 Warm Welcome add-on for the focused test.
