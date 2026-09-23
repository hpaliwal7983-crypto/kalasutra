/*
 * KalaSutra V7 server adapter
 * Mount these two routes into the EXISTING V6 Express server.
 * Never expose OPENAI_API_KEY to browser code.
 * Requires Node 18+ (global fetch).
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AI_MODEL = process.env.KALASUTRA_AI_MODEL || "gpt-5.6-luna";
const TTS_MODEL = process.env.KALASUTRA_TTS_MODEL || "gpt-4o-mini-tts";
const TTS_VOICE = process.env.KALASUTRA_TTS_VOICE || "coral";

const LANGUAGE_NAMES = {
  "hi-IN":"Hindi", "en-IN":"English", "mr-IN":"Marathi", "gu-IN":"Gujarati",
  "pa-IN":"Punjabi", "bn-IN":"Bengali", "ta-IN":"Tamil", "te-IN":"Telugu",
  "kn-IN":"Kannada", "ml-IN":"Malayalam", "or-IN":"Odia", "ur-IN":"Urdu"
};

function requireKey(res) {
  if (!OPENAI_API_KEY) {
    res.status(500).json({ error: "OPENAI_API_KEY is not configured on the server." });
    return false;
  }
  return true;
}

const SYSTEM = `You are Karigar AI inside KalaSutra, a warm voice-first companion for Indian artisans.
Speak like a patient, friendly human assistant: natural, short, encouraging, never robotic, never overly formal.
Use the user's selected language when possible. Hindi-English mixing is okay when the artisan naturally mixes languages.
Do not dump long paragraphs. Usually answer in 1-3 short sentences.
You can understand natural commands and help the artisan complete app tasks.
If the user wants to add/create/list a new product, return the exact action ADD_PRODUCT.
For other requests, return action NONE.
Return JSON only: {"reply":"...","action":"ADD_PRODUCT|NONE","locale":"..."}.`;

module.exports = function mountKalaSutraV7AI(app) {
  app.post("/api/ai/chat", async (req, res) => {
    if (!requireKey(res)) return;
    try {
      const locale = req.body?.locale || "hi-IN";
      const language = LANGUAGE_NAMES[locale] || "English";
      const message = String(req.body?.message || "").slice(0, 4000);
      const history = Array.isArray(req.body?.history) ? req.body.history.slice(-8) : [];

      const input = [
        { role: "system", content: SYSTEM },
        ...history.map(x => ({ role: x.role === "assistant" ? "assistant" : "user", content: String(x.content || "").slice(0, 1200) })),
        { role: "user", content: `Selected language: ${language} (${locale})\nArtisan says: ${message}` }
      ];

      const r = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: AI_MODEL, input, text: { format: { type: "json_object" } } })
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || "OpenAI request failed" });

      const raw = data.output_text || data.output?.flatMap(x => x.content || []).map(x => x.text || "").join("") || "{}";
      let parsed;
      try { parsed = JSON.parse(raw); } catch (_) { parsed = { reply: raw, action: "NONE", locale }; }
      if (!parsed.locale || !LANGUAGE_NAMES[parsed.locale]) parsed.locale = locale;
      res.json({ reply: String(parsed.reply || "I’m here with you."), action: parsed.action === "ADD_PRODUCT" ? "ADD_PRODUCT" : "NONE", locale: parsed.locale });
    } catch (e) {
      res.status(500).json({ error: e.message || "AI chat failed" });
    }
  });

  app.post("/api/ai/tts", async (req, res) => {
    if (!requireKey(res)) return;
    try {
      const text = String(req.body?.text || "").slice(0, 1500);
      const locale = req.body?.locale || "hi-IN";
      const language = LANGUAGE_NAMES[locale] || "English";
      if (!text) return res.status(400).json({ error: "text is required" });

      const r = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: TTS_MODEL,
          voice: TTS_VOICE,
          input: text,
          instructions: `Warm Indian artisan-assistant voice. Speak naturally and conversationally in ${language}. Friendly, calm, supportive, lightly expressive. Do not sound like a navigation robot. Match the user's language and natural Hindi-English code switching when present.`,
          response_format: "mp3"
        })
      });
      if (!r.ok) {
        const err = await r.text();
        return res.status(r.status).json({ error: err || "OpenAI TTS failed" });
      }
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "no-store");
      const buf = Buffer.from(await r.arrayBuffer());
      res.send(buf);
    } catch (e) {
      res.status(500).json({ error: e.message || "TTS failed" });
    }
  });
};
