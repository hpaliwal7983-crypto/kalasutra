/*
 * KalaSutra V7.2 server adapter.
 * Mount into the existing V6 Node/Express backend.
 * Never expose OPENAI_API_KEY to the browser.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHAT_MODEL = process.env.KALASUTRA_AI_MODEL || "gpt-5.6-luna";
const TTS_MODEL = process.env.KALASUTRA_TTS_MODEL || "gpt-4o-mini-tts";
const TTS_VOICE = process.env.KALASUTRA_TTS_VOICE || "marin";
const REALTIME_MODEL = process.env.KALASUTRA_REALTIME_MODEL || "gpt-realtime-2.1";

const LANGS = {
  "hi-IN":"Hindi", "en-IN":"English", "mr-IN":"Marathi", "gu-IN":"Gujarati",
  "pa-IN":"Punjabi", "bn-IN":"Bengali", "ta-IN":"Tamil", "te-IN":"Telugu",
  "kn-IN":"Kannada", "ml-IN":"Malayalam", "or-IN":"Odia", "ur-IN":"Urdu"
};

function ensureKey(res) {
  if (!OPENAI_API_KEY) {
    res.status(500).json({ error: "OPENAI_API_KEY is not configured on the server." });
    return false;
  }
  return true;
}

function shortInstructions(language) {
  return [
    "You are Karigar AI inside KalaSutra, a warm voice-first companion for Indian artisans.",
    "Personality: friendly, calm, warm, patient, human and reassuring.",
    "Speak like a thoughtful conversational assistant — not a call-center bot, GPS, or reading machine.",
    "Keep turns short: usually 1–2 sentences.",
    "Use natural pauses, contractions, gentle emphasis and varied intonation.",
    "When the artisan naturally mixes Hindi and English, you may naturally mix too.",
    `Preferred language: ${language}.`,
    "If the user asks to add/create/list a product, call open_add_product.",
    "After the product screen opens, guide only the next immediate step instead of giving a long checklist."
  ].join("\n");
}

module.exports = function mountKalaSutraV7AI(app) {
  app.post("/api/ai/realtime-token", async (req, res) => {
    if (!ensureKey(res)) return;
    try {
      const locale = req.body?.locale || "hi-IN";
      const language = LANGS[locale] || "Hindi";
      const sessionConfig = {
        session: {
          type: "realtime",
          model: REALTIME_MODEL,
          instructions: shortInstructions(language),
          audio: {
            output: { voice: TTS_VOICE }
          },
          tools: [{
            type: "function",
            name: "open_add_product",
            description: "Open the existing KalaSutra V6 Add Product screen.",
            parameters: {
              type: "object",
              properties: {},
              required: [],
              additionalProperties: false
            }
          }],
          tool_choice: "auto",
          turn_detection: { type: "server_vad", interrupt_response: true, silence_duration_ms: 550 }
        }
      };

      const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(sessionConfig)
      });

      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || "Could not create realtime session" });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message || "Realtime session failed" });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    if (!ensureKey(res)) return;
    try {
      const locale = req.body?.locale || "hi-IN";
      const language = LANGS[locale] || "Hindi";
      const message = String(req.body?.message || "").slice(0, 4000);
      const history = Array.isArray(req.body?.history) ? req.body.history.slice(-8) : [];
      const input = [
        {
          role: "system",
          content: shortInstructions(language) + "\nReturn JSON with reply, action and locale. action must be ADD_PRODUCT or NONE."
        },
        ...history.map(x => ({ role: x.role === "assistant" ? "assistant" : "user", content: String(x.content || "").slice(0, 1200) })),
        { role: "user", content: message }
      ];

      const r = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: CHAT_MODEL,
          input,
          text: {
            format: {
              type: "json_schema",
              name: "kalasutra_voice_reply",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  reply: { type: "string" },
                  action: { type: "string", enum: ["ADD_PRODUCT", "NONE"] },
                  locale: { type: "string", enum: Object.keys(LANGS) }
                },
                required: ["reply", "action", "locale"],
                additionalProperties: false
              }
            }
          }
        })
      });

      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || "OpenAI request failed" });
      let parsed = {};
      try { parsed = JSON.parse(data.output_text || "{}"); } catch (_) {}
      if (!LANGS[parsed.locale]) parsed.locale = locale;
      if (parsed.action !== "ADD_PRODUCT") parsed.action = "NONE";
      res.json({ reply: String(parsed.reply || "I’m here with you."), action: parsed.action, locale: parsed.locale });
    } catch (e) {
      res.status(500).json({ error: e.message || "AI chat failed" });
    }
  });

  app.post("/api/ai/tts", async (req, res) => {
    if (!ensureKey(res)) return;
    try {
      const text = String(req.body?.text || "").slice(0, 4096);
      const locale = req.body?.locale || "hi-IN";
      const language = LANGS[locale] || "Hindi";
      if (!text) return res.status(400).json({ error: "text is required" });

      const instructions = [
        `Speak naturally in ${language}.`,
        "Warm, human, conversational delivery.",
        "Friendly and calm, with gentle emotional expression.",
        "Use subtle pauses between ideas.",
        "Do not sound like a GPS, IVR, audiobook, or announcement.",
        "Do not over-enunciate every word.",
        "Keep the delivery intimate and helpful, as if you are guiding one person right beside you."
      ].join(" ");

      const r = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: TTS_MODEL,
          voice: TTS_VOICE,
          input: text,
          instructions,
          response_format: "mp3",
          speed: 0.97
        })
      });
      if (!r.ok) return res.status(r.status).json({ error: await r.text() || "OpenAI TTS failed" });
      const buf = Buffer.from(await r.arrayBuffer());
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "no-store");
      res.send(buf);
    } catch (e) {
      res.status(500).json({ error: e.message || "TTS failed" });
    }
  });
};
