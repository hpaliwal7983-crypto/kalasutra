KalaSutra FINAL V8 — V6 UI + realtime Karigar AI

BASE
- V6 app/interface is the source of truth. Existing marketplace, artisan dashboard, Add Product, 7 growth modules, buyer UI, reels and profile flows are preserved.

VOICE/COPILOT ADDITION
- Warm welcome overlay with centered Karigar AI avatar.
- OpenAI Realtime API over WebRTC for speech-to-speech conversation.
- Server-side standard OPENAI_API_KEY only; browser never receives the permanent key.
- Semantic VAD for natural turn-taking and interruption.
- Input speech transcription events + spoken AI output.
- Compact copilot remains available after the welcome.
- navigate_app tool can route to real app screens such as Add Product, Orders and Reel.
- Fallback path: recorded microphone -> /api/ai/transcribe -> /api/ai/chat -> /api/ai/tts if Realtime session negotiation fails.

DEPLOY
- Keep OPENAI_API_KEY in Render Environment Variables.
- Optional: OPENAI_REALTIME_MODEL=gpt-realtime-2.1
- Optional: OPENAI_REALTIME_VOICE=marin
- Optional: OPENAI_REALTIME_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
- Start command remains: node server/server.js

IMPORTANT
- Do not place the secret API key inside this ZIP or GitHub source.
