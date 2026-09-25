/*
 * KalaSutra V7.2 — Warm Welcome Center / Realtime Conversation Add-on
 *
 * IMPORTANT:
 * - This is an add-on. It does NOT replace or rebuild KalaSutra V6.
 * - Keep your V6 router, screens, UI and assets.
 * - The V6 project should already provide React + ReactDOM and /assets/avatar-artisan.png.
 *
 * Primary voice path: OpenAI Realtime API over WebRTC (speech-to-speech).
 * Fallback voice path: existing /api/ai/chat + /api/ai/tts chained pipeline.
 */
(function () {
  "use strict";
  window.__KALASUTRA_ISOLATED_COPILOT__ = true;

  const API = "/api";
  const ADD_PRODUCT_ROUTE = "addProduct";
  const LANGS = [
    ["hi-IN", "हिन्दी"], ["en-IN", "English"], ["mr-IN", "मराठी"],
    ["gu-IN", "ગુજરાતી"], ["pa-IN", "ਪੰਜਾਬੀ"], ["bn-IN", "বাংলা"],
    ["ta-IN", "தமிழ்"], ["te-IN", "తెలుగు"], ["kn-IN", "ಕನ್ನಡ"],
    ["ml-IN", "മലയാളം"], ["or-IN", "ଓଡ଼ିଆ"], ["ur-IN", "اردو"]
  ];

  const COPY = {
    "hi-IN": {
      welcome: "नमस्ते! मैं Karigar AI हूँ। आज आपके साथ क्या करते हैं?",
      listening: "मैं सुन रहा हूँ…",
      thinking: "एक पल, मैं समझ रहा हूँ…",
      addProduct: "बिल्कुल। चलिए आपका product add करते हैं। पहले उसकी 2–3 साफ़ photos ले लेते हैं।",
      generic: "समझ गया। आप बस आराम से बताइए, मैं आपके साथ-साथ करूँगा।",
      ready: "बोलकर बताइए, मैं सुन रहा हूँ।",
    },
    "en-IN": {
      welcome: "Namaste! I’m Karigar AI. What shall we work on today?",
      listening: "I’m listening…",
      thinking: "One moment, I’m with you…",
      addProduct: "Absolutely. Let’s add your product. We’ll start with two or three clear photos, and I’ll guide you through the rest.",
      generic: "Got it. Just tell me naturally what you’d like to do. I’ll stay with you and guide you step by step.",
      ready: "Go ahead. I’m listening.",
    },
  };

  function getLocale() {
    try {
      const saved = localStorage.getItem("kalasutra_language") || "hi";
      return (LANGS.find(x => x[0].slice(0, 2) === saved) || LANGS[0])[0];
    } catch (_) { return "hi-IN"; }
  }

  function setLocale(locale) {
    try { localStorage.setItem("kalasutra_voice_lang", locale); localStorage.setItem("kalasutra_language", locale.slice(0, 2)); } catch (_) {}
    document.documentElement.setAttribute("data-kalasutra-lang", locale.slice(0, 2));
    window.dispatchEvent(new CustomEvent("kalasutra:language-changed", { detail: { locale, code: locale.slice(0, 2), voice: locale } }));
  }

  function localeName(locale) {
    return (LANGS.find(x => x[0] === locale) || LANGS[0])[1];
  }

  function copy(locale, key) {
    const base = COPY[locale] || COPY["en-IN"];
    return base[key] || COPY["en-IN"][key];
  }

  function emitState(state, extra) {
    try {
      window.dispatchEvent(new CustomEvent("kalasutra:copilot-state", {
        detail: Object.assign({ state }, extra || {})
      }));
    } catch (_) {}
  }

  function emitFlow(detail) {
    try {
      window.dispatchEvent(new CustomEvent("kalasutra:copilot-flow", { detail: detail || {} }));
    } catch (_) {}
  }

  async function fetchWithTimeout(url, init, timeoutMs = 25000) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try { return await fetch(url, Object.assign({}, init || {}, { signal: controller.signal })); }
    catch (error) { if (error?.name === "AbortError") throw new Error("That took too long. Please try again."); throw error; }
    finally { window.clearTimeout(timer); }
  }

  async function postJSON(path, body) {
    const r = await fetchWithTimeout(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
    const contentType = r.headers.get("content-type") || "";
    if (r.ok && contentType.startsWith("audio/")) return r.blob();
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || "AI request failed");
    return data;
  }

  async function fallbackChat(transcript, locale) {
    const data = await postJSON("/ai/chat", {
      message: transcript,
      locale,
      language: localeName(locale),
      screen: window.__KALASUTRA_SCREEN__ || "dashboard",
      role: window.__KALASUTRA_ROLE__ || "artisan",
      history: window.__KALASUTRA_V7_HISTORY__ || []
    });
    if (data?.locale && LANGS.some(x => x[0] === data.locale) && data.locale !== locale) {
      setLocale(data.locale);
    }
    return data;
  }

  async function fallbackSpeak(text, locale) {
    if (!text) return false;
    emitState("speaking", { text });
    let spoken = false;
    let objectUrl = "";
    try {
      const data = await postJSON("/ai/tts", { text, locale });
      const src = data instanceof Blob ? (objectUrl = URL.createObjectURL(data)) : (data.audioUrl || (data.audioBase64 ? `data:audio/mpeg;base64,${data.audioBase64}` : ""));
      if (!src) throw new Error("No audio returned");
      try { window.__KALASUTRA_V7_AUDIO__?.pause?.(); } catch (_) {}
      const audio = new Audio(src);
      window.__KALASUTRA_V7_AUDIO__ = audio;
      spoken = await new Promise(resolve => {
        const timeout = window.setTimeout(() => done(false), 45000);
        const done = value => { window.clearTimeout(timeout); resolve(value); };
        audio.onended = () => done(true);
        audio.onerror = () => done(false);
        audio.play().catch(() => done(false));
      });
      if (!spoken) throw new Error("Voice playback failed");
    } catch (_) {
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = locale || "hi-IN";
        u.rate = 0.96;
        u.pitch = 1.0;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
        spoken = await new Promise(resolve => {
          const timeout = window.setTimeout(resolve, 30000);
          const done = value => { window.clearTimeout(timeout); resolve(value); };
          u.onend = () => done(true); u.onerror = () => done(false);
        });
      } catch (_) {}
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
    if (!spoken) {
      emitState("error", { text: "I understood you. Voice playback isn’t available right now. Please try again." });
      return false;
    }
    emitState("idle", { text });
    return true;
  }

  function mount(options) {
    options = options || {};
    const go = options.go || window.__KALASUTRA_GO__;
    if (typeof go !== "function") {
      console.warn("KalaSutra V7.2: no V6 go(screen) function was supplied.");
      return null;
    }

    const React = window.React;
    const ReactDOM = window.ReactDOM;
    if (!React || !ReactDOM) throw new Error("KalaSutra V7.2 requires the existing V6 React runtime.");
    const { useEffect, useRef, useState } = React;

    function WarmWelcomeCenter() {
      const [open, setOpen] = useState(options.open === true);
      const [state, setState] = useState("idle");
      const [locale, setLocaleState] = useState(getLocale());
      const [message, setMessage] = useState(copy(getLocale(), "welcome"));
      const [interim, setInterim] = useState("");
      const [showLang, setShowLang] = useState(false);
      const [connected, setConnected] = useState(false);
      const [realtimeUnavailable, setRealtimeUnavailable] = useState(false);
      const localeRef = useRef(locale);
      localeRef.current = locale;

      const pcRef = useRef(null);
      const dcRef = useRef(null);
      const micStreamRef = useRef(null);
      const audioElRef = useRef(null);
      const fallbackAudioRequiredRef = useRef(false);
      const pendingAddProductRef = useRef(false);
      const publishConfirmationPendingRef = useRef(false);
      const publishConfirmationAtRef = useRef(0);
      const publishConfirmationAwaitingVoiceRef = useRef(false);
      const fallbackBusyRef = useRef(false);
      const fallbackListeningRef = useRef(false);
      const fallbackRecorderRef = useRef(null);
      const fallbackStreamRef = useRef(null);
      const fallbackAudioContextRef = useRef(null);
      const fallbackSilenceTimerRef = useRef(null);
      const fallbackDiscardRef = useRef(false);
      const realtimeTurnTimerRef = useRef(null);
      const role = options.role || window.__KALASUTRA_ROLE__ || "artisan";

      function runAction(action) {
        const artisan = role === "artisan";
        const routes = { ADD_PRODUCT: artisan ? "addProduct" : null, ORDERS: "orders", REELS: artisan ? "myReels" : "buyerReels", PROFILE: artisan ? "profile" : "buyerProfile", HOME: artisan ? "dashboard" : "buyerHome", WISHLIST: artisan ? null : "wishlist", CART: artisan ? null : "cart", MY_PRODUCTS: artisan ? "myProducts" : null, REVIEWS: artisan ? "reviews" : null };
        const target = routes[action];
        if (!target) return false;
        try { go(target); return true; } catch (_) { return false; }
      }

      function setUIState(next, text) {
        setState(next);
        if (typeof text === "string" && text) setMessage(text);
        emitState(next, { text: typeof text === "string" ? text : message });
      }

      function clearRealtimeTurnTimer() {
        if (realtimeTurnTimerRef.current) window.clearTimeout(realtimeTurnTimerRef.current);
        realtimeTurnTimerRef.current = null;
      }

      function armRealtimeTurnTimer(ms, text, cancelResponse) {
        clearRealtimeTurnTimer();
        realtimeTurnTimerRef.current = window.setTimeout(() => {
          realtimeTurnTimerRef.current = null;
          if (cancelResponse) sendRealtime({ type: "response.cancel" });
          setUIState("error", text);
        }, ms);
      }

      function closeRealtime(preserveFallback) {
        clearRealtimeTurnTimer();
        try { dcRef.current?.close(); } catch (_) {}
        try { pcRef.current?.close(); } catch (_) {}
        try { micStreamRef.current?.getTracks().forEach(t => t.stop()); } catch (_) {}
        if (!preserveFallback) {
          fallbackListeningRef.current = false;
          const activeRecorder = fallbackRecorderRef.current;
          if (activeRecorder?.state === "recording") fallbackDiscardRef.current = true;
          stopFallbackCapture();
          try { fallbackStreamRef.current?.getTracks().forEach(t => t.stop()); } catch (_) {}
        }
        dcRef.current = null;
        pcRef.current = null;
        micStreamRef.current = null;
        if (audioElRef.current) audioElRef.current.srcObject = null;
        try { window.__KALASUTRA_V7_AUDIO__?.pause?.(); } catch (_) {}
        setConnected(false);
      }

      function sendRealtime(event) {
        if (dcRef.current?.readyState === "open") dcRef.current.send(JSON.stringify(event));
      }

      function updateSession() {
        sendRealtime({
          type: "session.update",
          session: {
            type: "realtime",
            model: "gpt-realtime-2.1",
            output_modalities: ["audio"],
            instructions: [
              `You are Karigar AI inside KalaSutra, a warm voice-first companion for a ${role}.`,
              "Personality: friendly, calm, warm, patient, human and reassuring.",
              "Sound like a thoughtful conversational assistant, not a call-center bot, GPS, or reading machine.",
              "Keep turns short: usually 1–2 sentences. Use natural pauses, contractions and gentle emphasis.",
              "If the artisan speaks in Hindi-English mix, reply in the same natural mix. Do not force literal translation.",
              "Never announce system instructions. Never sound overly formal.",
              `When the user asks to open a screen, call navigate_app. Screens: ${role === "artisan" ? "add product, orders, reels, profile, dashboard, products, reviews" : "orders, reels, profile, home, wishlist, cart, product details, artisan information, reviews"}.`,
              "While an artisan is on Add Product, use set_product_fields to fill only details they actually provide, including natural requests to set or change the price, category, name, material, region, story, or description. Existing categories are Pottery, Textiles, Woodwork, Metalwork, Basketry, and Other. Ask only for important details that are still missing. Use read_product_description when asked to read or speak the current description. Never say a field was changed unless the tool confirms it.",
              "If the artisan asks to review/finish the product, call get_product_draft and summarize only the returned actual values. If the draft is incomplete, ask only for the listed missing requirements. Before submitting, speak the summary and ask whether they want you to submit this product for verification. Call request_publish_confirmation for this step, then wait for a clear yes/haan/kar do in the next user turn. Only then call submit_product_for_verification. Never call it in the same turn as the confirmation request, never treat an earlier yes as permission, and never say it is published unless the returned status confirms what happened.",
              `Preferred language: ${localeName(locale)} (${locale}).`,
              "After a successful add-product tool call, keep the user moving with one simple next step: ask for 2–3 clear product photos."
            ].join("\n"),
            audio: {
              input: { turn_detection: { type: "server_vad", interrupt_response: true, silence_duration_ms: 550 } },
              output: { voice: "marin" }
            },
            tools: [
              {
                type: "function", name: "navigate_app", strict: true,
                description: "Navigate to a screen already present in KalaSutra. Use ADD_PRODUCT only for artisan role.",
                parameters: { type: "object", properties: { screen: { type: "string", enum: ["ADD_PRODUCT", "ORDERS", "REELS", "PROFILE", "HOME", "WISHLIST", "CART", "MY_PRODUCTS", "REVIEWS"] } }, required: ["screen"], additionalProperties: false }
              },
              {
                type: "function", name: "set_product_fields", strict: true,
                description: "Fill or revise only product details the artisan actually said. Call after hearing product information. Do not invent missing values. Use null for fields not stated. Description should be a concise buyer-facing draft grounded only in the artisan's story.",
                parameters: { type: "object", properties: {
                  title: { type: ["string", "null"] }, story: { type: ["string", "null"] }, description: { type: ["string", "null"] },
                  price: { type: ["string", "null"] }, category: { type: ["string", "null"], enum: ["Pottery", "Textiles", "Woodwork", "Metalwork", "Basketry", "Other", null] }, material: { type: ["string", "null"] }, region: { type: ["string", "null"] },
                  reply: { type: "string" }
                }, required: ["title", "story", "description", "price", "category", "material", "region", "reply"], additionalProperties: false }
              },
              { type: "function", name: "read_product_description", strict: true, description: "Speak the current product description aloud using Karigar AI's voice.", parameters: { type: "object", properties: {}, required: [], additionalProperties: false } },
              { type: "function", name: "get_product_draft", strict: true, description: "Read the current values and required missing steps from the existing Add Product form. Use this before giving a product summary.", parameters: { type: "object", properties: {}, required: [], additionalProperties: false } },
              { type: "function", name: "request_publish_confirmation", strict: true, description: "Mark that you have asked the artisan to confirm submission of the complete product draft. Wait for their clear yes in a later turn before submitting.", parameters: { type: "object", properties: {}, required: [], additionalProperties: false } },
              { type: "function", name: "submit_product_for_verification", strict: true, description: "Submit the current Add Product draft through the existing V6 verification flow, only after explicit spoken confirmation was requested and received.", parameters: { type: "object", properties: {}, required: [], additionalProperties: false } }
            ],
            tool_choice: "auto",
          }
        });
      }

      async function connectRealtime() {
        fallbackAudioRequiredRef.current = false;
        if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) throw new Error("WebRTC voice is not available here.");
        const tokenRes = await fetchWithTimeout(API + "/ai/realtime-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale, role }) });
        const tokenData = await tokenRes.json().catch(() => ({}));
        if (!tokenRes.ok) throw new Error(tokenData?.error || "Voice service is temporarily unavailable.");
        if (!tokenData?.client_secret?.value) throw new Error(tokenData?.error || "Realtime session token unavailable");

        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        const audio = document.createElement("audio");
        audio.autoplay = true;
        audio.playsInline = true;
        audioElRef.current = audio;
        audio.style.display = "none";
        document.body.appendChild(audio);

        pc.ontrack = (event) => {
          audio.srcObject = event.streams[0];
          audio.play().catch(() => { fallbackAudioRequiredRef.current = true; });
        };

        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        micStreamRef.current = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const dc = pc.createDataChannel("oai-events");
        dcRef.current = dc;

        dc.onmessage = async (e) => {
          let event;
          try { event = JSON.parse(e.data); } catch (_) { return; }
          if (!event?.type) return;

          const type = event.type;
          const nested = event.response?.event;
          const actualType = type === "response.event" && nested?.type ? nested.type : type;

          if (actualType === "session.created" || actualType === "session.updated") {
            setConnected(true);
          }

          if (actualType === "input_audio_buffer.speech_started") {
            armRealtimeTurnTimer(45000, "I couldn't hear the full request. Tap the mic and try again.", false);
            setUIState("listening", copy(locale, "listening"));
            setInterim("");
          }

          if (actualType === "input_audio_buffer.speech_stopped") {
            armRealtimeTurnTimer(30000, "That took too long. Tap the mic and try again.", false);
            setUIState("thinking", copy(locale, "thinking"));
          }

          if (actualType === "response.created") {
            armRealtimeTurnTimer(35000, "Karigar AI is taking a little longer. Tap the mic to try again.", true);
            setUIState("thinking", copy(locale, "thinking"));
          }

          if (actualType === "response.output_audio_transcript.delta" || actualType === "response.audio_transcript.delta") {
            const delta = event.delta || nested?.delta || "";
            if (delta) setInterim(v => v + delta);
            setState("speaking");
          }

          if (actualType === "response.output_audio_transcript.done" || actualType === "response.audio_transcript.done") {
            const text = event.transcript || nested?.transcript || interim;
            if (text) setMessage(text);
            setInterim("");
            setState("speaking");
            if (text && fallbackAudioRequiredRef.current) {
              fallbackAudioRequiredRef.current = false;
              fallbackSpeak(text, localeRef.current);
            }
          }

          if (actualType === "response.done") {
            clearRealtimeTurnTimer();
            const output = event.response?.output || nested?.response?.output || [];
            const calls = output.filter(item => item?.type === "function_call");
            if (!calls.length && publishConfirmationAwaitingVoiceRef.current) {
              const spokeConfirmation = output.some(item => item?.type === "message" && (item.content || []).some(part => part?.type === "audio" || part?.type === "audio_transcript" || part?.transcript));
              publishConfirmationAwaitingVoiceRef.current = false;
              if (spokeConfirmation) {
                publishConfirmationPendingRef.current = true;
                publishConfirmationAtRef.current = Date.now();
              }
            }
            if (calls.length) {
              const confirmationWasAlreadyPending = publishConfirmationPendingRef.current;
              const results = [];
              for (const call of calls) {
                let args = {}; try { args = JSON.parse(call.arguments || "{}"); } catch (_) {}
                let result = { status: "not_available" };
                if (call.name === "navigate_app") {
                  if (args.screen === "ADD_PRODUCT" && role === "artisan") {
                    pendingAddProductRef.current = true;
                    emitFlow({ step: "photos" });
                  }
                  const opened = runAction(args.screen);
                  result = { status: opened ? "opened" : "not_available_for_role", screen: args.screen };
                  if (opened) { setOpen(false); if (args.screen !== "ADD_PRODUCT") { publishConfirmationPendingRef.current = false; publishConfirmationAtRef.current = 0; } }
                } else if (call.name === "set_product_fields") {
                  const apply = window.__KALASUTRA_PRODUCT_ACTIONS__?.applyFields;
                  const fields = { title: args.title, story: args.story, description: args.description, price: args.price, category: args.category, material: args.material, region: args.region };
                  const applied = role === "artisan" && typeof apply === "function" && apply(fields);
                  result = { status: applied ? "updated" : "add_product_screen_not_open" };
                  if (applied && args.reply) setMessage(args.reply);
                } else if (call.name === "read_product_description") {
                  const read = window.__KALASUTRA_PRODUCT_ACTIONS__?.readDescription;
                  const description = role === "artisan" && typeof read === "function" ? read() : "";
                  result = description ? { status: "ready", description } : { status: "description_unavailable" };
                } else if (call.name === "get_product_draft") {
                  const getDraft = window.__KALASUTRA_PRODUCT_ACTIONS__?.getDraft;
                  result = role === "artisan" && typeof getDraft === "function" ? { status: "ready", draft: getDraft() } : { status: "add_product_screen_not_open" };
                } else if (call.name === "request_publish_confirmation") {
                  const draft = window.__KALASUTRA_PRODUCT_ACTIONS__?.getDraft?.();
                  if (role === "artisan" && draft?.complete) {
                    publishConfirmationPendingRef.current = false;
                    publishConfirmationAtRef.current = 0;
                    publishConfirmationAwaitingVoiceRef.current = true;
                    result = { status: "waiting_for_explicit_confirmation" };
                  } else result = { status: "draft_incomplete", missing: draft?.missing || ["Open Add Product"] };
                } else if (call.name === "submit_product_for_verification") {
                  const submit = window.__KALASUTRA_PRODUCT_ACTIONS__?.submitProduct;
                  if (role === "artisan" && confirmationWasAlreadyPending && publishConfirmationPendingRef.current && Date.now() - publishConfirmationAtRef.current < 120000 && typeof submit === "function") {
                    publishConfirmationPendingRef.current = false;
                    publishConfirmationAtRef.current = 0;
                    result = await submit();
                  } else result = { status: "confirmation_required", message: "Ask for confirmation, then wait for the user's next turn before submitting." };
                }
                results.push({ call_id: call.call_id, result });
              }
              for (const item of results) sendRealtime({ type: "conversation.item.create", item: { type: "function_call_output", call_id: item.call_id, output: JSON.stringify(item.result) } });
              sendRealtime({ type: "response.create" });
              armRealtimeTurnTimer(35000, "Karigar AI is taking a little longer. Tap the mic to try again.", true);
            } else setUIState("idle", message || copy(locale, "ready"));
          }

          if (actualType === "error") {
            clearRealtimeTurnTimer();
            setRealtimeUnavailable(true);
            closeRealtime();
            setUIState("error", "Voice connection stopped. Tap the microphone to retry.");
          }
          if (actualType === "response.failed" || actualType === "input_audio_transcription.failed") {
            clearRealtimeTurnTimer();
            setUIState("error", "I couldn't understand that. Tap the mic and say it once more.");
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const answerRes = await fetchWithTimeout("https://api.openai.com/v1/realtime/calls", {
          method: "POST",
          body: offer.sdp,
          headers: {
            "Authorization": `Bearer ${tokenData.client_secret.value}`,
            "Content-Type": "application/sdp"
          }
        });
        if (!answerRes.ok) throw new Error(await answerRes.text());
        await pc.setRemoteDescription({ type: "answer", sdp: await answerRes.text() });

        // The data channel may still be connecting when the SDP answer arrives.
        // Sending session.update before it opens silently drops the session and
        // leaves the UI stuck at “Listening…” with no assistant audio.
        if (dc.readyState !== "open") {
          await new Promise((resolve, reject) => {
            const timeout = window.setTimeout(() => reject(new Error("Voice channel timed out while connecting.")), 15000);
            dc.addEventListener("open", () => { window.clearTimeout(timeout); resolve(); }, { once: true });
            dc.addEventListener("error", () => { window.clearTimeout(timeout); reject(new Error("Voice channel could not connect.")); }, { once: true });
          });
        }

        setConnected(true);
        updateSession();
        sendRealtime({
          type: "response.create",
          response: { instructions: `Greet the user warmly in ${localeName(locale)}. Say: “${copy(locale, "welcome") }” Then invite them to tell you what they need, and listen for their reply.` }
        });
        armRealtimeTurnTimer(35000, "Karigar AI is taking a little longer. Tap the mic to try again.", true);
      }

      async function speakWelcome() {
        setUIState("speaking", copy(locale, "welcome"));
        const spoken = await fallbackSpeak(copy(locale, "welcome"), locale);
        if (spoken) setUIState("idle", copy(locale, "ready"));
        else setUIState("error", "I understood you. Voice playback isn’t available right now. Please try again.");
      }

      async function startConversation() {
        fallbackListeningRef.current = true;
        setOpen(true);
        setRealtimeUnavailable(false);
        setUIState("thinking", copy(locale, "thinking"));
        try {
          await connectRealtime();
          setUIState("listening", copy(locale, "listening"));
        } catch (error) {
          setRealtimeUnavailable(true);
          closeRealtime(true);
          if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
            fallbackListeningRef.current = false;
            setUIState("idle", "Microphone permission is off. Please allow microphone access and try again.");
            return;
          }
          await speakWelcome();
          if (fallbackCaptureAudio()) return;
          setUIState("idle", "Voice input is unavailable here. You can still use the app buttons, or try Chrome with microphone access enabled.");
        }
      }

      async function fallbackCommand(transcript) {
        if (fallbackBusyRef.current) return;
        fallbackBusyRef.current = true;
        try {
          setUIState("thinking", copy(locale, "thinking"));
          if (role === "artisan" && window.__KALASUTRA_SCREEN__ === ADD_PRODUCT_ROUTE) {
            const history = window.__KALASUTRA_V7_HISTORY__ || (window.__KALASUTRA_V7_HISTORY__ = []);
            const data = await postJSON("/ai/product-assist", { message: transcript, locale, role, history: history.slice(-8), draft: window.__KALASUTRA_PRODUCT_ACTIONS__?.getDraft?.() || {} });
            if (data.action === "READ_DESCRIPTION") {
              const description = window.__KALASUTRA_PRODUCT_ACTIONS__?.readDescription?.();
              if (description) await fallbackSpeak(description, "en-IN");
              else await fallbackSpeak(data.reply || "Description abhi taiyaar nahi hai. Pehle product ki story bata dijiye.", data.locale || locale);
              history.push({ role: "user", content: transcript }, { role: "assistant", content: description ? "I read the current product description aloud." : data.reply });
              window.__KALASUTRA_V7_HISTORY__ = history.slice(-16);
              return;
            }
            if (data.action === "SUBMIT_PRODUCT") {
              const confirmationIsFresh = publishConfirmationPendingRef.current && Date.now() - publishConfirmationAtRef.current < 120000;
              if (!confirmationIsFresh) {
                publishConfirmationPendingRef.current = false;
                publishConfirmationAtRef.current = 0;
                const retry = "Pehle main product ka summary suna kar aapse dobara confirmation le loon?";
                await fallbackSpeak(retry, locale);
                history.push({ role: "user", content: transcript }, { role: "assistant", content: retry });
                window.__KALASUTRA_V7_HISTORY__ = history.slice(-16);
                return;
              }
              publishConfirmationPendingRef.current = false;
              publishConfirmationAtRef.current = 0;
              const outcome = await window.__KALASUTRA_PRODUCT_ACTIONS__?.submitProduct?.();
              const statusText = outcome?.status === "verification_complete"
                ? outcome.verificationStatus === "verified" ? "Ho gaya—product verification mein verified hai. My Products mein status dekh sakte hain." : "Product verification ke liye submit ho gaya. Is par extra review chahiye, My Products mein status dekh sakte hain."
                : outcome?.status === "draft_incomplete" ? `Abhi submit nahi hua. ${String(outcome.missing?.join(", ") || "kuch details")} baaki hain.`
                : "Product abhi submit nahi ho saka. Main aapke details save rakhti hoon; chalo phir se try karte hain.";
              await fallbackSpeak(statusText, data.locale || locale);
              history.push({ role: "user", content: transcript }, { role: "assistant", content: statusText });
              window.__KALASUTRA_V7_HISTORY__ = history.slice(-16);
              return;
            }
            const applied = window.__KALASUTRA_PRODUCT_ACTIONS__?.applyFields?.(data.fields || {});
            const reply = data.reply || (applied ? "Details update kar diye." : copy(locale, "generic"));
            const spoken = await fallbackSpeak(reply, data.locale || locale);
            if (data.action === "REQUEST_SUBMIT_CONFIRMATION" && spoken && window.__KALASUTRA_PRODUCT_ACTIONS__?.getDraft?.()?.complete) {
              publishConfirmationPendingRef.current = true;
              publishConfirmationAtRef.current = Date.now();
            }
            history.push({ role: "user", content: transcript }, { role: "assistant", content: reply });
            window.__KALASUTRA_V7_HISTORY__ = history.slice(-16);
            return;
          }
          const data = await fallbackChat(transcript, locale);
          const reply = data?.reply || copy(locale, "generic");
          await fallbackSpeak(reply, data?.locale || locale);
          const history = window.__KALASUTRA_V7_HISTORY__ || (window.__KALASUTRA_V7_HISTORY__ = []);
          history.push({ role: "user", content: transcript }, { role: "assistant", content: reply });
          window.__KALASUTRA_V7_HISTORY__ = history.slice(-16);
          if (data?.action && data.action !== "NONE") {
            const opened = runAction(data.action);
            if (opened) {
              if (data.action === "ADD_PRODUCT") emitFlow({ step: "photos" });
              setOpen(false);
            }
          }
        } catch (error) {
          if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
            fallbackListeningRef.current = false;
            setUIState("idle", "Microphone permission is off. Please allow microphone access and try again.");
            return;
          }
          const reply = locale.slice(0, 2) === "en"
            ? "I heard you. My AI connection is unavailable right now, but I can still open Home, Orders, Reels, Profile, or Add Product."
            : "Aapki baat samajh aayi. AI connection abhi available nahi hai, par main Home, Orders, Reels, Profile ya Add Product khol sakta hoon.";
          await fallbackSpeak(reply, locale);
        } finally {
          fallbackBusyRef.current = false;
          if (fallbackListeningRef.current) window.setTimeout(() => fallbackCaptureAudio(), 350);
        }
      }

      function stopFallbackCapture() {
        if (fallbackSilenceTimerRef.current) window.clearInterval(fallbackSilenceTimerRef.current);
        fallbackSilenceTimerRef.current = null;
        try { if (fallbackRecorderRef.current?.state === "recording") fallbackRecorderRef.current.stop(); } catch (_) {}
      }

      function fallbackCaptureAudio() {
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
          const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (SR) return fallbackSpeechRecognition();
          fallbackListeningRef.current = false;
          setUIState("idle", "Voice input is not supported here. Please use an HTTPS browser with microphone access.");
          return false;
        }
        if (fallbackRecorderRef.current?.state === "recording") return true;
        navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }).then(stream => {
          if (!fallbackListeningRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
          fallbackStreamRef.current = stream;
          const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(type => MediaRecorder.isTypeSupported?.(type));
          const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
          fallbackRecorderRef.current = recorder;
          const chunks = [];
          let heardSpeech = false;
          let lastVoiceAt = Date.now();
          const stop = () => stopFallbackCapture();
          recorder.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
          recorder.onerror = () => { fallbackListeningRef.current = false; setUIState("idle", "I couldn’t record that clearly. Please try again."); };
          recorder.onstop = async () => {
            stream.getTracks().forEach(track => track.stop());
            try { await fallbackAudioContextRef.current?.close(); } catch (_) {}
            fallbackAudioContextRef.current = null;
            fallbackRecorderRef.current = null;
            fallbackStreamRef.current = null;
            if (fallbackDiscardRef.current) { fallbackDiscardRef.current = false; return; }
            if (!heardSpeech || !chunks.length) {
              fallbackListeningRef.current = false;
              setUIState("idle", "I couldn’t hear that clearly. Tap the mic and try again.");
              return;
            }
            try {
              setUIState("thinking", copy(localeRef.current, "thinking"));
              const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
              if (blob.size > 8 * 1024 * 1024) throw new Error("That recording was too long. Please try a shorter sentence.");
              const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = () => reject(new Error("Audio could not be prepared.")); reader.readAsDataURL(blob); });
              const data = await postJSON("/ai/transcribe", { audioBase64: dataUrl.split(",")[1], mimeType: blob.type, locale: localeRef.current });
              const transcript = String(data.text || "").trim();
              if (!transcript) throw new Error("I couldn’t understand that. Please say it once more.");
              await fallbackCommand(transcript);
            } catch (error) {
              fallbackListeningRef.current = false;
              setUIState("idle", error?.message || "AI connection is temporarily unavailable. Please try again.");
            }
          };
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
              const context = new AudioCtx();
              fallbackAudioContextRef.current = context;
              const analyser = context.createAnalyser(); analyser.fftSize = 512;
              context.createMediaStreamSource(stream).connect(analyser);
              const samples = new Uint8Array(analyser.fftSize);
              fallbackSilenceTimerRef.current = window.setInterval(() => {
                analyser.getByteTimeDomainData(samples);
                let energy = 0;
                for (let i = 0; i < samples.length; i++) { const v = (samples[i] - 128) / 128; energy += v * v; }
                const level = Math.sqrt(energy / samples.length);
                if (level > 0.02) { heardSpeech = true; lastVoiceAt = Date.now(); }
                if (heardSpeech && Date.now() - lastVoiceAt > 1250) stop();
              }, 140);
            }
            recorder.start(300);
            setUIState("listening", copy(localeRef.current, "listening"));
            window.setTimeout(() => { if (recorder.state === "recording") { if (heardSpeech) stop(); else { stop(); setUIState("idle", "I couldn’t hear that clearly. Tap the mic and try again."); } } }, 18000);
          } catch (error) {
            stream.getTracks().forEach(track => track.stop());
            fallbackListeningRef.current = false;
            setUIState("idle", "Voice recording couldn’t start. Please check microphone access and try again.");
          }
        }).catch(error => {
          fallbackListeningRef.current = false;
          const message = error?.name === "NotAllowedError" ? "Microphone permission is off. Please allow microphone access and try again." : "Voice input is temporarily unavailable. Please try again.";
          setUIState("idle", message);
        });
        return true;
      }

      function fallbackSpeechRecognition() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return false;
        const r = new SR();
        r.lang = locale;
        r.interimResults = false;
        r.continuous = false;
        r.maxAlternatives = 1;
        let received = false;
        r.onstart = () => setUIState("listening", copy(locale, "listening"));
        r.onresult = e => { received = true; fallbackCommand(e.results?.[0]?.[0]?.transcript || ""); };
        r.onerror = () => { fallbackListeningRef.current = false; setUIState("idle", "I couldn’t hear that clearly. Tap the microphone and try once more."); };
        r.onend = () => { if (!received) { fallbackListeningRef.current = false; setUIState("idle", copy(locale, "ready")); } };
        try { r.start(); return true; }
        catch (_) { setUIState("idle", copy(locale, "generic")); return false; }
      }

      function listenOnce() {
        setOpen(true);
        if (connected) {
          fallbackListeningRef.current = false;
          armRealtimeTurnTimer(20000, "I didn't hear anything. Tap the mic and try again.", false);
          setUIState("listening", copy(locale, "listening"));
          return;
        }
        fallbackListeningRef.current = true;
        startConversation();
      }

      const latestHandlers = useRef({});
      latestHandlers.current = { startConversation, fallbackCommand };

      function selectLanguage(next) {
        setLocaleState(next);
        setLocale(next);
        setShowLang(false);
        try { updateSession(); } catch (_) {}
        speakWelcome().catch(() => {});
      }

      useEffect(() => {
        const stateListener = e => {
          if (e.detail?.state) setState(e.detail.state);
          if (e.detail?.text) setMessage(e.detail.text);
        };
        const langListener = e => {
          if (e.detail?.locale) setLocaleState(e.detail.locale);
        };
        const openListener = () => setOpen(true);
        const commandListener = async e => {
          setOpen(true);
          const text = e.detail?.text || "";
          if (text) await latestHandlers.current.fallbackCommand(text);
          else await latestHandlers.current.startConversation();
        };
        const startListener = async () => {
          setOpen(true);
          await latestHandlers.current.startConversation();
        };
        const v6MessageListener = async e => {
          const text = String(e.detail?.text || "");
          if (!text) return;
          setOpen(true);
          setUIState("speaking", text);
          await fallbackSpeak(text, localeRef.current);
        };
        const productProgressListener = async e => {
          if (role !== "artisan") return;
          const step = e.detail?.step;
          const prompt = step === "photos" ? "A photo was just added to the existing product draft. Congratulate the artisan briefly, then ask what the product is and how it was made. Continue listening for their answer." : step === "proof" ? "The artisan has added making proof. Acknowledge it briefly and ask whether they want to review the draft." : step === "verification" ? `The existing verification flow finished with status ${String(e.detail?.status || "unknown")}. Briefly report this actual status only; do not claim it was published unless the status confirms verification.` : "The product draft changed. Acknowledge the change briefly and continue the conversation.";
          if (connected) {
            sendRealtime({ type: "response.create", response: { instructions: prompt } });
            armRealtimeTurnTimer(35000, "Karigar AI is taking a little longer. Tap the mic to try again.", true);
          }
          else await fallbackSpeak(step === "photos" ? "Bahut badhiya, photo aa gayi. Ab apni language mein batao—ye product kya hai aur kaise banaya?" : step === "verification" ? e.detail?.status === "verified" ? "Verification complete ho gaya. Product My Products mein verified dikh raha hai." : "Verification ne is product ko extra review ke liye bheja hai. My Products mein status dekh sakte hain." : "Bahut badhiya. Chalo agla step dekhte hain.", localeRef.current);
        };
        const closeListener = () => {
          publishConfirmationPendingRef.current = false;
          publishConfirmationAtRef.current = 0;
          publishConfirmationAwaitingVoiceRef.current = false;
          closeRealtime();
          setOpen(false);
        };
        const productCloseListener = () => { publishConfirmationPendingRef.current = false; publishConfirmationAtRef.current = 0; publishConfirmationAwaitingVoiceRef.current = false; };
        window.addEventListener("kalasutra:copilot-state", stateListener);
        window.addEventListener("kalasutra:language-changed", langListener);
        window.addEventListener("kalasutra:warm-welcome-open", openListener);
        window.addEventListener("kalasutra:warm-welcome-command", commandListener);
        window.addEventListener("kalasutra:warm-welcome-start", startListener);
        window.addEventListener("kalasutra:copilot:start", startListener);
        window.addEventListener("kalasutra:copilot:message", v6MessageListener);
        window.addEventListener("kalasutra:product-progress", productProgressListener);
        window.addEventListener("kalasutra:warm-welcome-close", closeListener);
        window.addEventListener("kalasutra:add-product-screen-closed", productCloseListener);
        if (options.autoWelcome) setTimeout(() => startConversation(), 250);
        return () => {
          window.removeEventListener("kalasutra:copilot-state", stateListener);
          window.removeEventListener("kalasutra:language-changed", langListener);
          window.removeEventListener("kalasutra:warm-welcome-open", openListener);
          window.removeEventListener("kalasutra:warm-welcome-command", commandListener);
          window.removeEventListener("kalasutra:warm-welcome-start", startListener);
          window.removeEventListener("kalasutra:copilot:start", startListener);
          window.removeEventListener("kalasutra:copilot:message", v6MessageListener);
          window.removeEventListener("kalasutra:product-progress", productProgressListener);
          window.removeEventListener("kalasutra:warm-welcome-close", closeListener);
          window.removeEventListener("kalasutra:add-product-screen-closed", productCloseListener);
          closeRealtime();
          if (audioElRef.current?.parentNode) audioElRef.current.parentNode.removeChild(audioElRef.current);
        };
      }, []);

      const shownMessage = interim || message || copy(locale, "welcome");
      const compactOnAddProduct = !open && role === "artisan" && window.__KALASUTRA_SCREEN__ === ADD_PRODUCT_ROUTE;

      return React.createElement(React.Fragment, null,
        open ? React.createElement("div", { className: "ks-v72-overlay" },
          React.createElement("div", { className: "ks-v72-backdrop", onClick: () => { if (state !== "speaking" && state !== "thinking") setOpen(false); } }),
          React.createElement("section", { className: "ks-v72-center" },
            React.createElement("button", { className: "ks-v72-close", onClick: () => { closeRealtime(); setOpen(false); } }, "×"),
            React.createElement("div", { className: "ks-v72-top" },
              React.createElement("div", { className: "ks-v72-brand" },
                React.createElement("span", { className: "ks-v72-brand-mark" }, "✦"),
                React.createElement("span", null,
                  React.createElement("b", null, "Karigar AI"),
                  React.createElement("small", null, "Warm Welcome Center"))),
              React.createElement("button", { className: "ks-v72-lang", onClick: () => setShowLang(v => !v) }, localeName(locale) + " ▾")),
            showLang && React.createElement("div", { className: "ks-v72-lang-menu" },
              LANGS.map(([code, name]) => React.createElement("button", {
                key: code,
                className: code === locale ? "active" : "",
                onClick: () => selectLanguage(code)
              }, name))),

            React.createElement("div", { className: "ks-v72-avatar-zone" },
              React.createElement("div", { className: "ks-v72-orbit orbit-a" }),
              React.createElement("div", { className: "ks-v72-orbit orbit-b" }),
              React.createElement("div", { className: "ks-v72-orbit orbit-c" }),
              React.createElement("div", { className: "ks-v72-glow" }),
              React.createElement("img", { className: "ks-v72-avatar", src: "/ai-avatar.png", alt: "Karigar AI" }),
              React.createElement("div", { className: `ks-v72-wave ks-v72-wave-${state}` }, [1,2,3,4,5,6,7,8,9].map(i => React.createElement("i", { key: i }))),
              React.createElement("div", { className: `ks-v72-speech-bubble ks-v72-bubble-${state}` }, shownMessage)),

            React.createElement("div", { className: "ks-v72-state" },
              state === "listening" ? "Listening…" :
              state === "thinking" ? "Thinking…" :
              state === "speaking" ? "Speaking…" :
              state === "error" ? "Let’s try again" :
              "I’m here with you"),

            React.createElement("div", { className: "ks-v72-helper" },
              realtimeUnavailable
                ? (navigator.mediaDevices?.getUserMedia && window.MediaRecorder
                  ? "Realtime is unavailable. Tap the mic for the audio fallback."
                  : (window.SpeechRecognition || window.webkitSpeechRecognition)
                    ? "Realtime is unavailable. Tap the mic for browser voice input."
                    : "Voice input isn’t supported here. Please open KalaSutra over HTTPS in Safari or Chrome.")
                : "Talk naturally — Hindi, English, Hinglish and more are welcome."),

            React.createElement("button", { className: `ks-v72-mic ${state === "listening" ? "listening" : ""}`, onClick: listenOnce, "aria-label": "Talk to Karigar AI" },
              state === "listening" ? "●" : "🎙"),

            React.createElement("button", { className: "ks-v72-cancel", onClick: () => { closeRealtime(); setOpen(false); } },
              React.createElement("span", null, "×"), React.createElement("small", null, "Cancel")),

            React.createElement("div", { className: "ks-v72-action-hint" },
              "Try: “Aaj mujhe ek product add karna hai”"),

            connected && React.createElement("div", { className: "ks-v72-live-dot" }, "● Live voice"))
          ) : compactOnAddProduct ? React.createElement("div", { className: `ks-v72-compact ks-v72-compact-${state}` },
            React.createElement("img", { src: "/ai-avatar.png", alt: "Karigar AI" }),
            React.createElement("span", null, React.createElement("b", null, "Karigar AI"), React.createElement("small", null,
              state === "listening" ? "Listening…" : state === "thinking" ? "Thinking…" : state === "speaking" ? "Speaking…" : state === "error" ? "Tap to retry" : "Here with you")),
            React.createElement("button", { onClick: () => setOpen(true), "aria-label": "Open Karigar AI" }, "🎙"))
          : React.createElement("button", { className: "ks-v72-fab", onClick: () => { setOpen(true); startConversation(); }, "aria-label": "Open Karigar AI" },
          React.createElement("img", { src: "/ai-avatar.png", alt: "Karigar AI" }),
          React.createElement("span", null, "✦"))
      );
    }

    const root = document.getElementById("kalasutra-v72-warm-welcome-root") || document.createElement("div");
    root.id = "kalasutra-v72-warm-welcome-root";
    if (!root.parentNode) document.body.appendChild(root);
    if (!document.getElementById("ks-v72-style-link")) {
      const link = document.createElement("link"); link.id = "ks-v72-style-link"; link.rel = "stylesheet"; link.href = "/karigar-warm-welcome-v7.css?v=20260925-add-product-copilot-2"; document.head.appendChild(link);
    }
    if (!document.getElementById("ks-v72-hide-old-copilot")) {
      const style = document.createElement("style"); style.id = "ks-v72-hide-old-copilot";
      style.textContent = ".ks-v72-active .ai-talker,.ks-v72-active .karigar-v3-card{display:none!important}.ks-v72-center{height:min(92dvh,760px);min-height:0;max-height:calc(100dvh - 18px);overflow-y:auto}.ks-v72-avatar{object-position:center 42%}@media(max-width:600px){.ks-v72-center{height:calc(100dvh - 20px);min-height:0}}";
      document.head.appendChild(style);
    }
    document.body.classList.add("ks-v72-active");

    const reactRoot = ReactDOM.createRoot ? ReactDOM.createRoot(root) : null;
    if (reactRoot) reactRoot.render(React.createElement(WarmWelcomeCenter));
    else ReactDOM.render(React.createElement(WarmWelcomeCenter), root);

    // Expose a tiny stable API for the existing V6 button/voice handler.
    const api = {
      open: () => window.dispatchEvent(new CustomEvent("kalasutra:warm-welcome-open")),
      startConversation: () => window.dispatchEvent(new CustomEvent("kalasutra:warm-welcome-start")),
      runCommand: text => window.dispatchEvent(new CustomEvent("kalasutra:warm-welcome-command", { detail: { text: String(text || "") } })),
      speak: (text, loc) => fallbackSpeak(String(text || ""), loc || getLocale()),
      setLanguage: loc => setLocale(loc),
      LANGS,
      unmount: () => { closeRealtimeFromOutside(); try { reactRoot?.unmount?.(); } catch (_) {} root.remove(); document.body.classList.remove("ks-v72-active"); }
    };

    function closeRealtimeFromOutside() {
      try { window.dispatchEvent(new CustomEvent("kalasutra:warm-welcome-close")); } catch (_) {}
    }

    window.KalaSutraV7 = Object.assign(window.KalaSutraV7 || {}, api);
    return api;
  }

  // Safe helper for the existing V6 Start Talking button.
  window.addEventListener("kalasutra:v6-start-talking", () => {
    try { window.KalaSutraV7?.startConversation?.(); } catch (_) {}
  });

  window.KalaSutraV7 = window.KalaSutraV7 || { mount, LANGS, setLanguage: setLocale };
  window.KalaSutraV7.mount = mount;
  window.KalaSutraV7.runCommand = text => window.dispatchEvent(new CustomEvent("kalasutra:warm-welcome-command", { detail: { text } }));
})();
