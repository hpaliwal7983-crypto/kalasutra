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
  return `You are Karigar AI inside KalaSutra, a warm, human, voice-first companion. Speak naturally and briefly in ${language}; understand mixed Hindi-English and the user's chosen language. Current role: ${role === "artisan" ? "artisan" : "buyer"}. For artisan, help with products, orders, reels, profile and dashboard. For buyer, help with product details, artisan information, reviews, orders, profile, wishlist and cart. When the user asks to open a screen, return its action. Actions: ${actions.join(", ")}. Never claim you opened something unless action is set. Keep the answer warm and conversational. When helping create a product, use only facts the artisan stated; never invent its material, region, making process, price or origin.`;
}
async function openai(path, payload, contentType = "application/json") {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw Object.assign(new Error("AI voice needs OPENAI_API_KEY in the server environment."), { status: 503 });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);
  let r;
  try {
    const headers = { Authorization: `Bearer ${key}` };
    if (contentType !== "multipart/form-data") headers["Content-Type"] = contentType;
    const body = contentType === "application/sdp" || contentType === "multipart/form-data" ? payload : JSON.stringify(payload);
    r = await fetch(`https://api.openai.com/v1/${path}`, { method: "POST", headers, body, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") throw Object.assign(new Error("AI took too long to respond. Please try again."), { status: 504 });
    throw error;
  } finally { clearTimeout(timeout); }
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
    if (url.pathname === "/api/ai/transcribe") {
      const encoded = String(b.audioBase64 || "");
      if (!encoded || encoded.length > 12 * 1024 * 1024 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) return json(res, 400, { error: "A valid, short audio recording is required." });
      const mime = String(b.mimeType || "audio/webm").split(";")[0].toLowerCase();
      const extensions = { "audio/webm": "webm", "audio/mp4": "mp4", "audio/ogg": "ogg", "audio/wav": "wav", "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/flac": "flac" };
      if (!extensions[mime]) return json(res, 415, { error: "This audio format is not supported by the voice fallback." });
      const bytes = Buffer.from(encoded, "base64");
      if (!bytes.length || bytes.length > 9 * 1024 * 1024) return json(res, 400, { error: "The audio recording is empty or too large." });
      const form = new FormData();
      form.append("file", new Blob([bytes], { type: mime }), `karigar-voice.${extensions[mime]}`);
      form.append("model", process.env.KALASUTRA_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe");
      form.append("language", String(b.locale || "hi-IN").slice(0, 2));
      form.append("response_format", "json");
      const r = await openai("audio/transcriptions", form, "multipart/form-data");
      const result = await r.json();
      return json(res, 200, { text: String(result.text || "").slice(0, 4000) });
    }
    if (url.pathname === "/api/ai/product-assist") {
      const [language, locale] = localeInfo(b.locale || b.language);
      const message = String(b.message || "").trim().slice(0, 3000);
      if (!message) return json(res, 400, { error: "message is required" });
      if (b.role && b.role !== "artisan") return json(res, 403, { error: "Product assistance is for artisan accounts." });
      const draft = b.draft && typeof b.draft === "object" ? b.draft : {};
      const fieldsSchema = Object.fromEntries(["title", "story", "description", "price", "category", "material", "region"].map(key => [key, { type: ["string", "null"] }]));
      const schema = { type: "object", properties: { reply: { type: "string" }, action: { type: "string", enum: ["NONE", "READ_DESCRIPTION", "REVIEW_PRODUCT", "REQUEST_SUBMIT_CONFIRMATION", "SUBMIT_PRODUCT"] }, locale: { type: "string", enum: Object.keys(LANGS) }, fields: { type: "object", properties: fieldsSchema, required: Object.keys(fieldsSchema), additionalProperties: false } }, required: ["reply", "action", "locale", "fields"], additionalProperties: false };
      const prompt = [
        { role: "system", content: `${instructions("artisan", language)}\nYou are helping fill the artisan's existing Add Product draft. Use READ_DESCRIPTION when asked to read or speak the current description. Use REVIEW_PRODUCT when asked to review an incomplete draft, and name only the actual missing requirements. Use REQUEST_SUBMIT_CONFIRMATION only when the provided draft says complete=true; reply with a concise exact summary of its real values and ask whether the artisan wants to submit it for verification. Use SUBMIT_PRODUCT only if conversation history shows the immediately previous assistant turn clearly asked for submission confirmation and the current user turn is an unambiguous yes/haan/okay-do-it confirmation. An unrelated yes is never sufficient. Otherwise use NONE. Extract only details explicitly stated in this turn; preserve current values for unstated fields. For each returned field, use its current draft value if present, otherwise null. Never infer a price, material, region, craft process, or product fact. If the artisan asks to revise the description, rewrite it using only known facts. Write description in concise, natural English for buyers; keep reply short in ${language}.` },
        ...((Array.isArray(b.history) ? b.history : []).slice(-6).map(x => ({ role: x.role === "assistant" ? "assistant" : "user", content: String(x.content || "").slice(0, 800) }))),
        { role: "user", content: JSON.stringify({ current_draft: Object.fromEntries(["title", "story", "description", "price", "category", "material", "region"].map(k => [k, String(draft[k] || "").slice(0, 1200)])), complete: draft.complete === true, missing: Array.isArray(draft.missing) ? draft.missing.slice(0, 6) : [], photoCount: Math.max(0, Number(draft.photoCount) || 0), hasMakingProof: draft.hasMakingProof === true, artisan_utterance: message }) }
      ];
      const r = await openai("responses", { model: process.env.KALASUTRA_AI_MODEL || "gpt-5.6-luna", input: prompt, text: { format: { type: "json_schema", name: "kalasutra_product_assist", strict: true, schema } }, max_output_tokens: 700 }, "application/json");
      let data = {}; try { data = JSON.parse((await r.json()).output_text || "{}"); } catch (_) {}
      if (!LANGS[data.locale]) data.locale = locale;
      const fields = Object.fromEntries(Object.keys(fieldsSchema).map(k => [k, typeof data.fields?.[k] === "string" ? data.fields[k].slice(0, k === "story" ? 3000 : 1200) : null]));
      if (fields.category && !["Pottery", "Textiles", "Woodwork", "Metalwork", "Basketry", "Other"].includes(fields.category)) fields.category = null;
      if (fields.price && !/^\d+(\.\d{1,2})?$/.test(fields.price.replace(/[^0-9.]/g, ""))) fields.price = null;
      const productActions = ["NONE", "READ_DESCRIPTION", "REVIEW_PRODUCT", "REQUEST_SUBMIT_CONFIRMATION", "SUBMIT_PRODUCT"];
      return json(res, 200, { reply: String(data.reply || "Theek hai. Batao, main kaunsi detail update karoon?"), action: productActions.includes(data.action) ? data.action : "NONE", locale: data.locale, fields });
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
