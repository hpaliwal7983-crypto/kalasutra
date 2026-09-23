KalaSutra V9 FINAL — V6 UI + Realtime Karigar AI

BASE:
- V6 application is the source of truth. Existing UI/features are preserved.

ADDED/FIXED:
- Center warm Karigar AI welcome overlay for artisan mode.
- OpenAI Realtime WebRTC voice-to-voice conversation.
- Natural Indian conversational prompt, selected-language support, interruptions/turn-taking.
- navigate_app function for real screen navigation.
- Existing V6 TTS/transcription fallback remains.
- Fallback chat model uses gpt-5.5 (valid current OpenAI API model).
- Render start command fixed to node server/server.js because all assets are already packaged.

RENDER: set OPENAI_API_KEY in Environment. Never put the key in this ZIP.

START:
node server/server.js
