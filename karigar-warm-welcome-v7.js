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

  function normalizeCommand(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[।?!,]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function looksLikeAddProduct(text) {
    const q = normalizeCommand(text);
    return /(?:add product|new product|product add|add a product|naya product|naya item|nayi cheez|product banana|product jod|product जोड़|नया प्रोडक्ट|नया उत्पाद|नई चीज|نئی product|new item)/i.test(q);
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

  async function postJSON(path, body) {
    const r = await fetch(API + path, {
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
    if (!text) return;
    emitState("speaking", { text });
    try {
      const data = await postJSON("/ai/tts", { text, locale });
      const src = data instanceof Blob ? URL.createObjectURL(data) : (data.audioUrl || (data.audioBase64 ? `data:audio/mpeg;base64,${data.audioBase64}` : ""));
      if (!src) throw new Error("No audio returned");
      const audio = new Audio(src);
      window.__KALASUTRA_V7_AUDIO__ = audio;
      await audio.play();
      await new Promise(resolve => {
        const timeout = window.setTimeout(resolve, 45000);
        const done = () => { window.clearTimeout(timeout); resolve(); };
        audio.onended = done;
        audio.onerror = done;
      });
    } catch (_) {
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = locale || "hi-IN";
        u.rate = 0.96;
        u.pitch = 1.0;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
        await new Promise(resolve => {
          const timeout = window.setTimeout(resolve, 30000);
          const done = () => { window.clearTimeout(timeout); resolve(); };
          u.onend = done; u.onerror = done;
        });
      } catch (_) {}
    }
    emitState("idle", { text });
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
      const pendingAddProductRef = useRef(false);
      const fallbackBusyRef = useRef(false);
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

      function closeRealtime() {
        try { dcRef.current?.close(); } catch (_) {}
        try { pcRef.current?.close(); } catch (_) {}
        try { micStreamRef.current?.getTracks().forEach(t => t.stop()); } catch (_) {}
        dcRef.current = null;
        pcRef.current = null;
        micStreamRef.current = null;
        if (audioElRef.current) audioElRef.current.srcObject = null;
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
              `Preferred language: ${localeName(locale)} (${locale}).`,
              "After a successful add-product tool call, keep the user moving with one simple next step: ask for 2–3 clear product photos."
            ].join("\n"),
            audio: {
              input: { turn_detection: { type: "server_vad", interrupt_response: true, silence_duration_ms: 550 } },
              output: { voice: "marin" }
            },
            tools: [{
              type: "function",
              name: "navigate_app",
              description: "Navigate to a screen already present in this KalaSutra V6 app.",
              parameters: {
                type: "object",
                properties: { screen: { type: "string", enum: ["ADD_PRODUCT", "ORDERS", "REELS", "PROFILE", "HOME", "WISHLIST", "CART", "MY_PRODUCTS", "REVIEWS"] } },
                required: ["screen"],
                additionalProperties: false
              }
            }],
            tool_choice: "auto",
          }
        });
      }

      async function connectRealtime() {
        if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) throw new Error("WebRTC voice is not available here.");
        const tokenData = await fetch(API + "/ai/realtime-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale }) }).then(r => r.json());
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
          audio.play().catch(() => {});
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
            setUIState("listening", copy(locale, "listening"));
            setInterim("");
          }

          if (actualType === "response.created") {
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
          }

          if (actualType === "response.done") {
            const output = event.response?.output || nested?.response?.output || [];
            const call = output.find(item => item?.type === "function_call" && item?.name === "navigate_app");
            if (call) {
              let args = {}; try { args = JSON.parse(call.arguments || "{}"); } catch (_) {}
              if (args.screen === "ADD_PRODUCT") { pendingAddProductRef.current = true; setMessage(copy(locale, "addProduct")); emitFlow({ step: "photos" }); }
              const opened = runAction(args.screen);
              sendRealtime({
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: call.call_id,
                  output: JSON.stringify({ status: opened ? "opened" : "not_available_for_role", screen: args.screen })
                }
              });
              sendRealtime({ type: "response.create" });
            }
            if (!call) setUIState("idle", message || copy(locale, "ready"));
          }

          if (actualType === "error") {
            setRealtimeUnavailable(true);
            setUIState("idle", "Voice connection needs a retry. I’m ready when you are.");
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const answerRes = await fetch("https://api.openai.com/v1/realtime/calls", {
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
      }

      async function speakWelcome() {
        setUIState("speaking", copy(locale, "welcome"));
        try {
          await fallbackSpeak(copy(locale, "welcome"), locale);
        } catch (_) {}
        setUIState("idle", copy(locale, "ready"));
      }

      async function startConversation() {
        setOpen(true);
        setRealtimeUnavailable(false);
        setUIState("thinking", copy(locale, "thinking"));
        try {
          await connectRealtime();
          setUIState("listening", copy(locale, "listening"));
        } catch (_) {
          setRealtimeUnavailable(true);
          closeRealtime();
          await speakWelcome();
          if (fallbackSpeechRecognition()) return;
          setUIState("idle", "Voice input is unavailable here. You can still use the app buttons, or try Chrome with microphone access enabled.");
        }
      }

      async function fallbackCommand(transcript) {
        if (fallbackBusyRef.current) return;
        fallbackBusyRef.current = true;
        try {
          setUIState("thinking", copy(locale, "thinking"));
          if (looksLikeAddProduct(transcript) && role === "artisan") {
            const reply = copy(locale, "addProduct");
            await fallbackSpeak(reply, locale);
            emitFlow({ step: "photos" });
            go(ADD_PRODUCT_ROUTE);
            return;
          }
          const q = normalizeCommand(transcript);
          const quickActions = [
            [/\b(order|orders|ऑर्डर|آرڈر)\b/i, "ORDERS"], [/\b(reel|reels|रील)\b/i, "REELS"],
            [/\b(profile|प्रोफाइल)\b/i, "PROFILE"], [/\b(home|dashboard|घर|होम)\b/i, "HOME"],
            [/\b(wishlist|favorites|पसंद)\b/i, "WISHLIST"], [/\b(cart|basket|कार्ट)\b/i, "CART"],
            [/\b(products|my products|उत्पाद|प्रोडक्ट)\b/i, "MY_PRODUCTS"]
          ];
          const quick = quickActions.find(([pattern]) => pattern.test(q));
          if (quick && runAction(quick[1])) {
            const reply = locale.slice(0, 2) === "en" ? "Sure, opening that for you." : "Bilkul, abhi khol raha hoon.";
            await fallbackSpeak(reply, locale);
            return;
          }
          const data = await fallbackChat(transcript, locale);
          const reply = data?.reply || copy(locale, "generic");
          await fallbackSpeak(reply, data?.locale || locale);
          if (data?.action && data.action !== "NONE") runAction(data.action);
        } catch (_) {
          const reply = locale.slice(0, 2) === "en"
            ? "I heard you. My AI connection is unavailable right now, but I can still open Home, Orders, Reels, Profile, or Add Product."
            : "Aapki baat samajh aayi. AI connection abhi available nahi hai, par main Home, Orders, Reels, Profile ya Add Product khol sakta hoon.";
          await fallbackSpeak(reply, locale);
          setUIState("idle", reply);
        } finally {
          fallbackBusyRef.current = false;
        }
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
        r.onerror = () => setUIState("idle", copy(locale, "generic"));
        r.onend = () => { if (!received) setUIState("idle", copy(locale, "ready")); };
        try { r.start(); return true; }
        catch (_) { setUIState("idle", copy(locale, "generic")); return false; }
      }

      function listenOnce() {
        setOpen(true);
        if (connected) {
          setUIState("listening", copy(locale, "listening"));
          return;
        }
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
        const closeListener = () => {
          closeRealtime();
          setOpen(false);
        };
        window.addEventListener("kalasutra:copilot-state", stateListener);
        window.addEventListener("kalasutra:language-changed", langListener);
        window.addEventListener("kalasutra:warm-welcome-open", openListener);
        window.addEventListener("kalasutra:warm-welcome-command", commandListener);
        window.addEventListener("kalasutra:warm-welcome-start", startListener);
        window.addEventListener("kalasutra:copilot:start", startListener);
        window.addEventListener("kalasutra:copilot:message", v6MessageListener);
        window.addEventListener("kalasutra:warm-welcome-close", closeListener);
        if (options.autoWelcome) setTimeout(() => startConversation(), 250);
        const welcomeTimer = options.greetOnOpen && !options.autoWelcome
          ? setTimeout(() => speakWelcome().catch(() => {}), 350)
          : null;
        return () => {
          if (welcomeTimer) clearTimeout(welcomeTimer);
          window.removeEventListener("kalasutra:copilot-state", stateListener);
          window.removeEventListener("kalasutra:language-changed", langListener);
          window.removeEventListener("kalasutra:warm-welcome-open", openListener);
          window.removeEventListener("kalasutra:warm-welcome-command", commandListener);
          window.removeEventListener("kalasutra:warm-welcome-start", startListener);
          window.removeEventListener("kalasutra:copilot:start", startListener);
          window.removeEventListener("kalasutra:copilot:message", v6MessageListener);
          window.removeEventListener("kalasutra:warm-welcome-close", closeListener);
          closeRealtime();
          if (audioElRef.current?.parentNode) audioElRef.current.parentNode.removeChild(audioElRef.current);
        };
      }, []);

      const shownMessage = interim || message || copy(locale, "welcome");

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
              "I’m here with you"),

            React.createElement("div", { className: "ks-v72-helper" },
              realtimeUnavailable
                ? ((window.SpeechRecognition || window.webkitSpeechRecognition)
                  ? "AI connection is unavailable. Tap the mic to use your browser’s voice input."
                  : "Voice input isn’t supported in this browser. Please open KalaSutra in Chrome.")
                : "Talk naturally — Hindi, English, Hinglish and more are welcome."),

            React.createElement("button", { className: `ks-v72-mic ${state === "listening" ? "listening" : ""}`, onClick: listenOnce, "aria-label": "Talk to Karigar AI" },
              state === "listening" ? "●" : "🎙"),

            React.createElement("button", { className: "ks-v72-cancel", onClick: () => { closeRealtime(); setOpen(false); } },
              React.createElement("span", null, "×"), React.createElement("small", null, "Cancel")),

            React.createElement("div", { className: "ks-v72-action-hint" },
              "Try: “Aaj mujhe ek product add karna hai”"),

            connected && React.createElement("div", { className: "ks-v72-live-dot" }, "● Live voice"))
          ) : React.createElement("button", { className: "ks-v72-fab", onClick: () => { setOpen(true); startConversation(); }, "aria-label": "Open Karigar AI" },
          React.createElement("img", { src: "/ai-avatar.png", alt: "Karigar AI" }),
          React.createElement("span", null, "✦"))
      );
    }

    const root = document.getElementById("kalasutra-v72-warm-welcome-root") || document.createElement("div");
    root.id = "kalasutra-v72-warm-welcome-root";
    if (!root.parentNode) document.body.appendChild(root);
    if (!document.getElementById("ks-v72-style-link")) {
      const link = document.createElement("link"); link.id = "ks-v72-style-link"; link.rel = "stylesheet"; link.href = "/karigar-warm-welcome-v7.css"; document.head.appendChild(link);
    }
    if (!document.getElementById("ks-v72-hide-old-copilot")) {
      const style = document.createElement("style"); style.id = "ks-v72-hide-old-copilot";
      style.textContent = ".ai-talker,.karigar-v3-card{display:none!important}.ks-v72-center{height:min(92dvh,760px);min-height:0;max-height:calc(100dvh - 18px);overflow-y:auto}.ks-v72-avatar{object-position:center 42%}@media(max-width:600px){.ks-v72-center{height:calc(100dvh - 20px);min-height:0}}";
      document.head.appendChild(style);
    }

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
      unmount: () => { closeRealtimeFromOutside(); try { reactRoot?.unmount?.(); } catch (_) {} root.remove(); }
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
