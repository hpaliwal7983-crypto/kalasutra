const LANGS = {
  hi: ["Hindi", "hi-IN"], en: ["English", "en-IN"], mr: ["Marathi", "mr-IN"],
  gu: ["Gujarati", "gu-IN"], pa: ["Punjabi", "pa-IN"], bn: ["Bengali", "bn-IN"],
  ta: ["Tamil", "ta-IN"], te: ["Telugu", "te-IN"], kn: ["Kannada", "kn-IN"],
  ml: ["Malayalam", "ml-IN"], or: ["Odia", "or-IN"], ur: ["Urdu", "ur-IN"],
  "hi-IN": ["Hindi", "hi-IN"], "en-IN": ["English", "en-IN"], "mr-IN": ["Marathi", "mr-IN"],
  "gu-IN": ["Gujarati", "gu-IN"], "pa-IN": ["Punjabi", "pa-IN"], "bn-IN": ["Bengali", "bn-IN"],
  "ta-IN": ["Tamil", "ta-IN"], "te-IN": ["Telugu", "te-IN"], "kn-IN": ["Kannada", "kn-IN"],
  "ml-IN": ["Malayalam", "ml-IN"], "or-IN": ["Odia", "or-IN"], "ur-IN": ["Urdu", "ur-IN"]
};
const actions = ["ADD_PRODUCT", "ORDERS", "REELS", "PROFILE", "HOME", "WISHLIST", "CART", "MY_PRODUCTS", "REVIEWS", "NONE"];
const json = (res, code, data) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(JSON.stringify(data)); };
function localeInfo(value) { return LANGS[value] || LANGS.hi; }
function instructions(role, language) {
  return `You are Karigar AI inside KalaSutra, a warm, human, voice-first companion. Speak naturally and briefly in ${language}; understand mixed Hindi-English and the user's chosen language. Current role: ${role === "artisan" ? "artisan" : "buyer"}. For artisan, help with products, orders, reels, profile and dashboard. For buyer, help with product details, artisan information, reviews, orders, profile, wishlist and cart. When the user asks to open a screen, return its action. Actions: ${actions.join(", ")}. Never claim you opened something unless action is set. Keep the answer warm and conversational.`;
}
async function openai(path, payload, contentType = "application/json") {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw Object.assign(new Error("AI voice needs OPENAI_API_KEY in the server environment."), { status: 503 });
  const r = await fetch(`https://api.openai.com/v1/${path}`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": contentType }, body: contentType === "application/sdp" ? payload : JSON.stringify(payload) });
  if (!r.ok) throw Object.assign(new Error((await r.text()).slice(0, 800) || "OpenAI request failed"), { status: r.status });
  return r;
}
module.exports = async function aiRoute(req, res, url, b) {
  try {
    if (url.pathname === "/api/ai/realtime-token" || url.pathname === "/api/ai/realtime") {
      const [language] = localeInfo(b.locale || b.language);
      const r = await openai("realtime/client_secrets", { session: { type: "realtime", model: process.env.KALASUTRA_REALTIME_MODEL || "gpt-realtime-2.1", instructions: instructions(b.role, language), audio: { output: { voice: process.env.KALASUTRA_TTS_VOICE || "marin" } }, tools: [{ type: "function", name: "navigate_app", description: "Navigate an existing KalaSutra screen", parameters: { type: "object", properties: { screen: { type: "string", enum: actions.filter(x => x !== "NONE") } }, required: ["screen"], additionalProperties: false } }], tool_choice: "auto" } });
      return json(res, 200, await r.json());
    }
    if (url.pathname === "/api/ai/chat") {
      const [language, locale] = localeInfo(b.locale || b.language);
      const message = String(b.message || b.messages?.at?.(-1)?.content || "").slice(0, 4000);
      if (!message) return json(res, 400, { error: "message is required" });
      const schema = { type: "object", properties: { reply: { type: "string" }, action: { type: "string", enum: actions }, locale: { type: "string", enum: Object.keys(LANGS) } }, required: ["reply", "action", "locale"], additionalProperties: false };
      const sourceHistory = b.history || b.messages || [];
      const historyItems = b.message && b.messages ? sourceHistory.slice(0, -1) : sourceHistory;
      const history = historyItems.slice(-8).map(x => ({ role: x.role === "assistant" ? "assistant" : "user", content: String(x.content || "").slice(0, 1200) }));
      const r = await openai("responses", { model: process.env.KALASUTRA_AI_MODEL || "gpt-5.6-luna", input: [{ role: "system", content: instructions(b.role, language) }, ...history, { role: "user", content: message }], text: { format: { type: "json_schema", name: "kalasutra_copilot_reply", strict: true, schema } } });
      const out = await r.json(); let data = {};
      try { data = JSON.parse(out.output_text || "{}"); } catch (_) {}
      if (!LANGS[data.locale]) data.locale = locale;
      if (!actions.includes(data.action)) data.action = "NONE";
      return json(res, 200, { reply: String(data.reply || "I’m here with you. Tell me what you’d like to do."), action: data.action, locale: data.locale });
    }
    if (url.pathname === "/api/ai/translate") {
      const [language] = localeInfo(b.locale || b.language);
      const texts = Array.isArray(b.texts) ? b.texts.slice(0, 60).map(x => String(x || "").slice(0, 180)) : [];
      if (!texts.length) return json(res, 200, { translations: [] });
      const r = await openai("responses", { model: process.env.KALASUTRA_AI_MODEL || "gpt-5.6-luna", input: [{ role: "system", content: `Translate the supplied KalaSutra app interface strings to ${language}. Preserve meaning and keep the same count and order. Preserve brand names, prices, IDs, emojis and placeholders such as {name}. Return only the translated strings.` }, { role: "user", content: JSON.stringify(texts) }], text: { format: { type: "json_schema", name: "ui_translations", strict: true, schema: { type: "object", properties: { translations: { type: "array", items: { type: "string" } } }, required: ["translations"], additionalProperties: false } } } });
      let translated = []; try { translated = JSON.parse((await r.json()).output_text || "{}").translations || []; } catch (_) {}
      return json(res, 200, { translations: texts.map((_, i) => String(translated[i] || texts[i])) });
    }
    if (url.pathname === "/api/ai/tts") {
      const [language] = localeInfo(b.locale || b.language);
      const text = String(b.text || "").slice(0, 4096);
      if (!text) return json(res, 400, { error: "text is required" });
      const r = await openai("audio/speech", { model: process.env.KALASUTRA_TTS_MODEL || "gpt-4o-mini-tts", voice: process.env.KALASUTRA_TTS_VOICE || "marin", input: text, instructions: `Speak naturally and warmly in ${language}, like a helpful person beside the user.`, response_format: "mp3", speed: 0.97 });
      const audio = Buffer.from(await r.arrayBuffer());
      res.writeHead(200, { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" }); return res.end(audio);
    }
    return json(res, 404, { error: "AI route not found" });
  } catch (e) { return json(res, e.status || 502, { error: e.message || "AI request failed" }); }
};
