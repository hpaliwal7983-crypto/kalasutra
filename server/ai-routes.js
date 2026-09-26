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
const actions = ["ADD_PRODUCT", "ORDERS", "REELS", "PROFILE", "HOME", "WISHLIST", "CART", "MY_PRODUCTS", "REVIEWS", "PRODUCT_DETAILS", "ARTISAN_INFO", "PRODUCT_REVIEWS", "FAIR_PRICE", "CRAFT_CAPITAL", "MATERIAL_HUB", "DESIGN_LAB", "CRAFT_PASSPORT", "MARKET_MATCH", "CRAFT_GURUKUL", "NONE"];
const json = (res, code, data) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(JSON.stringify(data)); };
function localeInfo(value) { return LANGS[value] || LANGS.hi; }
function indiaDate(value) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}
function orderContext(db, userId, role) {
  const user = db?.users?.find(item => String(item.id) === String(userId) && item.role === role);
  if (!user) return { available: false, reason: "Current user's order data is unavailable.", todayDate: indiaDate(Date.now()), today: [], recent: [] };
  const catalog = new Map((db.products || []).map(p => [String(p.id), p]));
  const orders = (db.orders || []).map(order => {
    if (role === "buyer" && String(order.buyerId) !== String(userId)) return null;
    const products = (order.products || []).filter(item => role !== "artisan" || String(catalog.get(String(item.productId))?.artisanId) === String(userId));
    if (role === "artisan" && !products.length) return null;
    return {
      id: String(order.id || ""), status: String(order.status || "unknown"), date: order.date || null,
      items: products.map(item => ({ product: String(item.title || catalog.get(String(item.productId))?.title || "Handmade product"), quantity: Number(item.qty) || 0, price: Number(item.price) || 0 }))
    };
  }).filter(Boolean);
  const todayDate = indiaDate(Date.now());
  return { available: true, todayDate, today: orders.filter(order => order.date && indiaDate(order.date) === todayDate), recent: orders.slice(0, 30) };
}
function productContext(db, productId) {
  const product = db?.products?.find(item => String(item.id) === String(productId));
  if (!product) return { available: false };
  const artisan = db.users?.find(user => String(user.id) === String(product.artisanId));
  return { available: true, product: { id: product.id, title: product.title, description: product.description, price: product.price, category: product.category, craftInfo: { material: product.craftInfo?.material, region: product.craftInfo?.region, size: product.craftInfo?.size, productionCost: product.craftInfo?.productionCost, originalStory: product.craftInfo?.originalStory }, verificationStatus: product.verificationStatus }, artisan: artisan ? { name: artisan.name, profile: { craft: artisan.profile?.craft, location: artisan.profile?.location, bio: artisan.profile?.bio, trustScore: artisan.profile?.trustScore } } : null, reviews: (db.reviews || []).filter(review => String(review.productId) === String(product.id)).map(review => ({ rating: review.stars, text: review.text, date: review.createdAt })).slice(0, 20) };
}
function instructions(role, language) {
  return `You are Karigar AI, the single voice-first artisan copilot inside the existing KalaSutra V6 app. The selected conversation language is ${language}. Keep every reply, follow-up, confirmation, and error in that language. Understand natural Indian-language speech, code-switching, and Romanized Hindi. Do not greet again after the session has begun.

Your job is to understand intent and entities, use conversation history and supplied current app context, remember details already given, ask only for missing information, analyze with existing application data and logic, fill existing workflows, explain the result, and leave final publishing/verification under the artisan's control. Do not create duplicate workflows or invent facts.

For artisans:
- Add Product: extract only stated product facts. Fill existing product fields from those facts. Generate a concise buyer-facing English description only from verified draft/conversation facts; write the Tell Your Story field only when the artisan actually shares a personal/craft story. Ask one focused question at a time for the next important missing field. Guide the artisan to use existing photo and making-proof controls. Never submit or bypass the existing verification/final confirmation.
- Fair Price: use the current product and module context. Ask only for missing actual inputs (production cost, material cost, hours, hourly rate, overhead). Return only values the artisan stated. The existing app calculates the planning estimate; never invent a market price.
- Craft Capital, Material Hub, Design Lab, Craft Passport, Direct Market Match, and Craft Gurukul: consult the supplied live module context or use the matching existing module action. Explain only actual available records and clearly say when records/data are unavailable. Do not make up matches, buyers, trends, financing, materials, credentials, designs, lessons, members, or activities. Offer the next action supported by the existing UI.
- Orders: use only the supplied real order data; answer counts/lists and follow-up references from it. Never guess an order or count.

Voice function-call mode must use the existing tools as the action bridge: call get_orders for order questions; call get_module_context before explaining artisan modules; call set_fair_price_inputs only with artisan-provided cost values and rely on its returned estimate; call set_capital_planning_need only for an explicitly stated planning amount; call set_product_fields for stated product facts, then get_product_draft to inspect missing required fields. Call read_product_description only to read the saved/current description. For submission, summarize the complete real draft, call request_publish_confirmation, wait for a clear confirmation in the next user turn, then call submit_product_for_verification. Never skip this confirmation. In structured chat mode, return the equivalent action and productFields/fairPriceInputs/capitalNeed values for the existing client workflow to apply; do not claim a field changed until the client reports success.

For buyers, answer product, artisan, review, order, profile, wishlist, and cart questions only from supplied app data.

For structured chat responses, set moduleContextRequired=true when the user wants an answer or analysis about an artisan module and the supplied context is absent or is for a different module. Set it false for a request that only asks to open a screen. The client may open/read the existing module and make one follow-up call with that actual context before speaking. Use a navigation action only when the user wants to open/navigate to a screen. A question or work request about a module means help with the task and relevant data, not merely open its screen. If you cannot confidently identify intent or a reference, ask a short clarification instead of guessing. Never claim a change succeeded unless the app action/result confirms it. Keep spoken replies concise. Current role: ${role === "artisan" ? "artisan" : "buyer"}. Available actions: ${actions.join(", ")}.`;
}
function responseLocale(value, fallback) {
  const entry = LANGS[String(value || "")];
  return entry ? entry[1] : fallback;
}
async function openai(path, payload, contentType = "application/json") {
  // Text generation can run through OpenRouter's free-model router. Keep OpenAI
  // for Realtime, transcription and speech endpoints, which OpenRouter does not
  // provide through this chat-completions path.
  const useOpenRouter = path === "responses" && Boolean(process.env.OPENROUTER_API_KEY);
  const provider = useOpenRouter ? "OpenRouter" : "OpenAI";
  const key = useOpenRouter ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY;
  if (!key) {
    const variable = useOpenRouter ? "OPENROUTER_API_KEY" : "OPENAI_API_KEY";
    throw Object.assign(new Error(`The KalaSutra server cannot see ${variable}. Add it to the Render Web Service environment and redeploy.`), { status: 503, code: "missing_api_key" });
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);
  let r;
  try {
    const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
    let endpoint = `https://api.openai.com/v1/${path}`;
    let body = contentType === "application/sdp" || contentType === "multipart/form-data" ? payload : JSON.stringify(payload);
    if (useOpenRouter) {
      const format = payload.text?.format;
      const request = {
        model: process.env.KALASUTRA_OPENROUTER_MODEL || "openrouter/free",
        messages: Array.isArray(payload.input) ? payload.input : [],
        ...(format?.type === "json_schema" ? { response_format: { type: "json_schema", json_schema: { name: format.name || "kalasutra_response", strict: format.strict !== false, schema: format.schema } } } : {}),
        ...(payload.max_output_tokens ? { max_tokens: payload.max_output_tokens } : {}),
        temperature: 0.2
      };
      headers["HTTP-Referer"] = process.env.KALASUTRA_SITE_URL || "https://kalasutra.onrender.com";
      headers["X-Title"] = "KalaSutra";
      endpoint = "https://openrouter.ai/api/v1/chat/completions";
      body = JSON.stringify(request);
    }
    r = await fetch(endpoint, { method: "POST", headers, body, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") throw Object.assign(new Error("AI took too long to respond. Please try again."), { status: 504 });
    throw error;
  } finally { clearTimeout(timeout); }
  if (!r.ok) {
    const raw = await r.text();
    let details = {};
    try { details = JSON.parse(raw).error || {}; } catch (_) {}
    const code = String(details.code || details.type || (r.status === 429 ? "rate_limited" : "ai_request_failed"));
    const message = useOpenRouter
      ? r.status === 401
        ? "The OpenRouter API key on the Render service is invalid or inactive. Check OPENROUTER_API_KEY in the service environment."
        : r.status === 429
          ? "OpenRouter's free AI limit is temporarily reached. Please wait and try again."
          : r.status === 402
            ? "OpenRouter has no free model available for this request right now. Please try again shortly."
            : "OpenRouter could not complete this AI request. Please try again shortly."
      : code === "credit_balance_exhausted" || code === "insufficient_quota"
        ? "OpenAI API billing has no credits remaining. Add API credits in the OpenAI Platform billing settings, then try again."
        : r.status === 401
          ? "The OpenAI API key on the Render service is invalid or inactive. Check the key in the service environment."
          : r.status === 429
            ? "The OpenAI API is temporarily rate-limited. Please wait a moment and try again."
            : "The OpenAI voice service is temporarily unavailable. Please try again shortly.";
    throw Object.assign(new Error(message), { status: r.status, code });
  }
  if (useOpenRouter) {
    const result = await r.json();
    const content = result.choices?.[0]?.message?.content;
    const outputText = typeof content === "string" ? content : Array.isArray(content) ? content.map(part => part.text || "").join("") : "";
    return { json: async () => ({ output_text: outputText }) };
  }
  return r;
}
module.exports = async function aiRoute(req, res, url, b, context = {}) {
  try {
    if (url.pathname === "/api/ai/instructions") {
      const [language, locale] = localeInfo(b.locale || b.language);
      return json(res, 200, { instructions: instructions(b.role, language), locale });
    }
    if (url.pathname === "/api/ai/realtime-token" || url.pathname === "/api/ai/realtime") {
      const [language] = localeInfo(b.locale || b.language);
      const r = await openai("realtime/client_secrets", { session: { type: "realtime", model: process.env.KALASUTRA_REALTIME_MODEL || "gpt-realtime-2.1", instructions: instructions(b.role, language), audio: { output: { voice: process.env.KALASUTRA_TTS_VOICE || "marin" } }, tools: [
        { type: "function", name: "navigate_app", description: "Navigate an existing KalaSutra screen or open an existing artisan dashboard panel", parameters: { type: "object", properties: { screen: { type: "string", enum: actions.filter(x => x !== "NONE") } }, required: ["screen"], additionalProperties: false } },
        { type: "function", name: "get_orders", description: "Read real, privacy-filtered order records for the current user. Use for order counts, lists and follow-up questions; never guess.", parameters: { type: "object", properties: { period: { type: "string", enum: ["today", "recent"] } }, required: ["period"], additionalProperties: false } }
      ], tool_choice: "auto" } });
      return json(res, 200, await r.json());
    }
    if (url.pathname === "/api/ai/chat") {
      const [language, locale] = localeInfo(b.locale || b.language);
      const message = String(b.message || b.messages?.at?.(-1)?.content || "").slice(0, 4000);
      if (!message) return json(res, 400, { error: "message is required" });
      const productFieldsSchema = { type: "object", properties: { title: { type: ["string", "null"] }, story: { type: ["string", "null"] }, description: { type: ["string", "null"] }, price: { type: ["string", "null"] }, category: { type: ["string", "null"] }, material: { type: ["string", "null"] }, region: { type: ["string", "null"] }, size: { type: ["string", "null"] }, productionCost: { type: ["string", "null"] } }, required: ["title","story","description","price","category","material","region","size","productionCost"], additionalProperties: false };
      const fairPriceInputsSchema = { type: "object", properties: { productionCost: { type: ["string", "null"] }, materialCost: { type: ["string", "null"] }, hours: { type: ["string", "null"] }, hourlyRate: { type: ["string", "null"] }, overhead: { type: ["string", "null"] } }, required: ["productionCost","materialCost","hours","hourlyRate","overhead"], additionalProperties: false };
      const schema = { type: "object", properties: { reply: { type: "string" }, action: { type: "string", enum: actions }, locale: { type: "string", enum: Object.keys(LANGS) }, productFields: productFieldsSchema, fairPriceInputs: fairPriceInputsSchema, capitalNeed: { type: ["string", "null"] }, moduleContextRequired: { type: "boolean" } }, required: ["reply", "action", "locale", "productFields", "fairPriceInputs", "capitalNeed", "moduleContextRequired"], additionalProperties: false };
      const sourceHistory = b.history || b.messages || [];
      const historyItems = b.message && b.messages ? sourceHistory.slice(0, -1) : sourceHistory;
      const history = historyItems.slice(-8).map(x => ({ role: x.role === "assistant" ? "assistant" : "user", content: String(x.content || "").slice(0, 1200) }));
      const facts = orderContext(context.db, b.userId, b.role === "artisan" ? "artisan" : "buyer");
      const draftSource = b.productDraft && typeof b.productDraft === "object" ? b.productDraft : {};
      const productDraft = Object.fromEntries(["title","story","description","price","category","material","region","size","productionCost"].map(key => [key, String(draftSource[key] || "").slice(0, key === "story" || key === "description" ? 1200 : 180)]));
      const moduleName = String(b.activeModule || "").slice(0, 24);
      const moduleContext = b.moduleContext && typeof b.moduleContext === "object" ? JSON.stringify(b.moduleContext).slice(0, 6000) : "";
      const appFacts = { user: { id: String(b.userId || ""), role: b.role || "buyer" }, currentScreen: String(b.screen || ""), activeModule: moduleName, currentProductDraft: productDraft, moduleContext: moduleContext || null, orders: facts, selectedProduct: productContext(context.db, b.productId) };
      const r = await openai("responses", { model: process.env.KALASUTRA_AI_MODEL || "gpt-5.6-luna", input: [{ role: "system", content: instructions(b.role, language) }, { role: "system", content: `Verified KalaSutra data for this turn (never infer missing records): ${JSON.stringify(appFacts)}` }, ...history, { role: "user", content: message }], text: { format: { type: "json_schema", name: "kalasutra_copilot_reply", strict: true, schema } } });
      const out = await r.json(); let data = {};
      try { data = JSON.parse(out.output_text || "{}"); } catch (_) {}
      const replyLocale = locale;
      if (!actions.includes(data.action)) data.action = "NONE";
      const cleanFields = source => Object.fromEntries(["title","story","description","price","category","material","region","size","productionCost"].map(key => [key, typeof source?.[key] === "string" ? source[key].trim().slice(0, key === "story" || key === "description" ? 1800 : 180) : null]));
      const cleanCosts = source => Object.fromEntries(["productionCost","materialCost","hours","hourlyRate","overhead"].map(key => [key, typeof source?.[key] === "string" ? source[key].replace(/[^0-9.]/g, "").slice(0, 24) || null : null]));
      return json(res, 200, { reply: String(data.reply || "I’m here with you. Tell me what you’d like to do.").slice(0, 3000), action: data.action, locale: replyLocale, productFields: cleanFields(data.productFields), fairPriceInputs: cleanCosts(data.fairPriceInputs), capitalNeed: typeof data.capitalNeed === "string" ? data.capitalNeed.replace(/[^0-9]/g, "").slice(0, 18) || null : null, moduleContextRequired: data.moduleContextRequired === true });
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
      // Respect the language selected in the app so speech recognition follows the active conversation.
      const selectedLocale = String(b.locale || b.language || "hi-IN").slice(0, 5);
      const transcriptionLanguage = selectedLocale.slice(0, 2);
      form.append("language", transcriptionLanguage);
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
      const fieldsSchema = Object.fromEntries(["title", "story", "description", "price", "category", "material", "region", "size", "productionCost"].map(key => [key, { type: ["string", "null"] }]));
      const schema = { type: "object", properties: { reply: { type: "string" }, action: { type: "string", enum: ["NONE", "READ_DESCRIPTION", "REVIEW_PRODUCT", "REQUEST_SUBMIT_CONFIRMATION", "SUBMIT_PRODUCT"] }, locale: { type: "string", enum: Object.keys(LANGS) }, fields: { type: "object", properties: fieldsSchema, required: Object.keys(fieldsSchema), additionalProperties: false } }, required: ["reply", "action", "locale", "fields"], additionalProperties: false };
      const prompt = [
        { role: "system", content: `${instructions("artisan", language)}\nYou are helping fill the artisan's existing Add Product draft. Use READ_DESCRIPTION when asked to read or speak the current description. Use REVIEW_PRODUCT when asked to review an incomplete draft, and name only the actual missing requirements. Use REQUEST_SUBMIT_CONFIRMATION only when the provided draft says complete=true; reply with a concise exact summary of its real values and ask whether the artisan wants to submit it for verification. Use SUBMIT_PRODUCT only if conversation history shows the immediately previous assistant turn clearly asked for submission confirmation and the current user turn is an unambiguous yes/haan/okay-do-it confirmation. An unrelated yes is never sufficient. Otherwise use NONE. Extract details stated in this turn or prior conversation; preserve current values for unstated fields. Extract size and productionCost only when the artisan provides them; never infer these values. For each returned field, use its current draft value if present, otherwise null. Never infer a price, material, region, craft process, or product fact. If the artisan asks to revise the description, rewrite it using only known facts. Write the buyer-facing description in concise, natural English using only known product facts; keep the spoken assistant reply in the selected language ${language}, including during code-switching, and return that selected locale.` },
        ...((Array.isArray(b.history) ? b.history : []).slice(-6).map(x => ({ role: x.role === "assistant" ? "assistant" : "user", content: String(x.content || "").slice(0, 800) }))),
        { role: "user", content: JSON.stringify({ current_draft: Object.fromEntries(["title", "story", "description", "price", "category", "material", "region", "size", "productionCost"].map(k => [k, String(draft[k] || "").slice(0, 1200)])), complete: draft.complete === true, missing: Array.isArray(draft.missing) ? draft.missing.slice(0, 6) : [], photoCount: Math.max(0, Number(draft.photoCount) || 0), hasMakingProof: draft.hasMakingProof === true, artisan_utterance: message }) }
      ];
      const r = await openai("responses", { model: process.env.KALASUTRA_AI_MODEL || "gpt-5.6-luna", input: prompt, text: { format: { type: "json_schema", name: "kalasutra_product_assist", strict: true, schema } }, max_output_tokens: 700 }, "application/json");
      let data = {}; try { data = JSON.parse((await r.json()).output_text || "{}"); } catch (_) {}
      const replyLocale = responseLocale(data.locale, locale);
      const fields = Object.fromEntries(Object.keys(fieldsSchema).map(k => [k, typeof data.fields?.[k] === "string" ? data.fields[k].slice(0, k === "story" ? 3000 : 1200) : null]));
      if (fields.category && !["Pottery", "Textiles", "Woodwork", "Metalwork", "Basketry", "Other"].includes(fields.category)) fields.category = null;
      for (const key of ["price", "productionCost"]) if (fields[key] && !/^\d+(\.\d{1,2})?$/.test(fields[key].replace(/[^0-9.]/g, ""))) fields[key] = null;
      const productActions = ["NONE", "READ_DESCRIPTION", "REVIEW_PRODUCT", "REQUEST_SUBMIT_CONFIRMATION", "SUBMIT_PRODUCT"];
      return json(res, 200, { reply: String(data.reply || "Theek hai. Batao, main kaunsi detail update karoon?"), action: productActions.includes(data.action) ? data.action : "NONE", locale: replyLocale, fields });
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
  } catch (e) { return json(res, e.status || 502, { error: e.message || "AI request failed", code: e.code || "ai_request_failed" }); }
};
