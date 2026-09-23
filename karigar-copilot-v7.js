/*
 * KalaSutra V7 — Warm Welcome Center AI Avatar
 * Focused drop-in addon. Does NOT replace the V6 app.
 *
 * Assumes the existing V6 app exposes React globals and a navigation function `go`.
 * If your router uses a different Add Product screen id, change ADD_PRODUCT_ROUTE.
 */
(function () {
  "use strict";

  const ADD_PRODUCT_ROUTE = "addProduct";
  const API = "/api";
  const LANGS = [
    ["hi-IN", "हिन्दी"], ["en-IN", "English"], ["mr-IN", "मराठी"],
    ["gu-IN", "ગુજરાતી"], ["pa-IN", "ਪੰਜਾਬੀ"], ["bn-IN", "বাংলা"],
    ["ta-IN", "தமிழ்"], ["te-IN", "తెలుగు"], ["kn-IN", "ಕನ್ನಡ"],
    ["ml-IN", "മലയാളം"], ["or-IN", "ଓଡ଼ିଆ"], ["ur-IN", "اردو"]
  ];

  const WELCOME = {
    "hi-IN": "नमस्ते! मैं Karigar AI हूँ। आज आपके साथ क्या बनाएं?",
    "en-IN": "Namaste! I’m Karigar AI. What shall we work on today?",
    "mr-IN": "नमस्कार! मी Karigar AI आहे. आज आपण काय करूया?",
    "gu-IN": "નમસ્તે! હું Karigar AI છું. આજે શું કરીએ?",
    "pa-IN": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ Karigar AI ਹਾਂ। ਅੱਜ ਕੀ ਕਰੀਏ?",
    "bn-IN": "নমস্কার! আমি Karigar AI। আজ কী করা যাক?",
    "ta-IN": "வணக்கம்! நான் Karigar AI. இன்று என்ன செய்வோம்?",
    "te-IN": "నమస్తే! నేను Karigar AI. ఈ రోజు ఏం చేద్దాం?",
    "kn-IN": "ನಮಸ್ಕಾರ! ನಾನು Karigar AI. ಇಂದು ಏನು ಮಾಡೋಣ?",
    "ml-IN": "നമസ്കാരം! ഞാൻ Karigar AI. ഇന്ന് എന്ത് ചെയ്യാം?",
    "or-IN": "ନମସ୍କାର! ମୁଁ Karigar AI। ଆଜି କଣ କରିବା?",
    "ur-IN": "السلام علیکم! میں Karigar AI ہوں۔ آج کیا کرتے ہیں؟"
  };

  const FALLBACK = {
    "hi-IN": "समझ गया। आप बस आराम से बताइए कि क्या करना है, मैं साथ-साथ कराऊँगा।",
    "en-IN": "Got it. Just tell me naturally what you want to do, and I’ll guide you step by step.",
    "mr-IN": "समजलं. तुम्हाला काय करायचं आहे ते सहज सांगा; मी step by step मदत करतो.",
    "gu-IN": "સમજી ગયો. તમે સ્વાભાવિક રીતે કહો કે શું કરવું છે, હું step by step મદદ કરીશ.",
    "pa-IN": "ਸਮਝ ਗਿਆ। ਤੁਸੀਂ ਕੁਦਰਤੀ ਤਰੀਕੇ ਨਾਲ ਦੱਸੋ, ਮੈਂ step by step ਮਦਦ ਕਰਾਂਗਾ.",
    "bn-IN": "বুঝেছি। কী করতে চান স্বাভাবিকভাবে বলুন, আমি ধাপে ধাপে সাহায্য করব।",
    "ta-IN": "புரிந்தது. என்ன செய்ய வேண்டும் என்று இயல்பாக சொல்லுங்கள்; நான் step by step உதவுகிறேன்.",
    "te-IN": "అర్థమైంది. ఏం చేయాలో సహజంగా చెప్పండి; నేను step by step సహాయం చేస్తాను.",
    "kn-IN": "ಅರ್ಥವಾಯಿತು. ಏನು ಮಾಡಬೇಕೆಂದು ಸಹಜವಾಗಿ ಹೇಳಿ; ನಾನು step by step ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.",
    "ml-IN": "മനസ്സിലായി. എന്ത് ചെയ്യണമെന്ന് സ്വാഭാവികമായി പറയൂ; ഞാൻ step by step സഹായിക്കാം.",
    "or-IN": "ବୁଝିଲି। କଣ କରିବାକୁ ଚାହୁଁଛନ୍ତି ସହଜରେ କହନ୍ତୁ; ମୁଁ step by step ସାହାଯ୍ୟ କରିବି।",
    "ur-IN": "سمجھ گیا۔ آپ قدرتی انداز میں بتائیں کیا کرنا ہے، میں step by step مدد کروں گا۔"
  };

  function lang() {
    try { return localStorage.getItem("kalasutra_voice_lang") || "hi-IN"; } catch (_) { return "hi-IN"; }
  }
  function setLang(v) {
    try { localStorage.setItem("kalasutra_voice_lang", v); } catch (_) {}
    window.dispatchEvent(new CustomEvent("kalasutra:language-changed", { detail: { locale: v } }));
  }
  function languageName(locale) {
    return (LANGS.find(x => x[0] === locale) || LANGS[1])[1];
  }

  async function post(path, body) {
    const r = await fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
    if (!r.ok) throw new Error("AI service unavailable");
    return r;
  }

  async function speak(text, locale) {
    if (!text) return;
    window.dispatchEvent(new CustomEvent("kalasutra:copilot-state", { detail: { state: "speaking", text } }));
    try {
      const r = await post("/ai/tts", { text, locale: locale || lang() });
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        window.dispatchEvent(new CustomEvent("kalasutra:copilot-state", { detail: { state: "idle", text } }));
      };
      await audio.play();
      return;
    } catch (_) {
      // Browser fallback only if the secure server TTS endpoint is unavailable.
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = locale || lang();
        u.rate = 0.96;
        u.pitch = 1.02;
        u.onend = () => window.dispatchEvent(new CustomEvent("kalasutra:copilot-state", { detail: { state: "idle", text } }));
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      } catch (_) {}
    }
  }

  function localAction(transcript, go) {
    const q = String(transcript || "").toLowerCase();
    if (/add product|new product|product add|naya product|naya item|नया प्रोडक्ट|नया उत्पाद|नई चीज|نئی product/.test(q)) {
      go(ADD_PRODUCT_ROUTE);
      const reply = lang() === "en-IN"
        ? "Bilkul. Let’s add your product. I’ll stay with you while we do the photos and description."
        : "Bilkul. Chaliye aapka product add karte hain. Photos aur description mein main aapke saath rahunga.";
      speak(reply, lang());
      window.dispatchEvent(new CustomEvent("kalasutra:copilot-flow", { detail: { step: "photos" } }));
      return true;
    }
    return false;
  }

  function mount(options) {
    options = options || {};
    const go = options.go || window.__KALASUTRA_GO__;
    if (typeof go !== "function") {
      console.warn("KalaSutra V7: pass the existing V6 go(screen) function to mount().");
      return null;
    }

    const React = window.React;
    if (!React) throw new Error("KalaSutra V7 requires the existing V6 React runtime.");
    const { useState, useEffect, useRef } = React;

    function WarmWelcomeCenter() {
      const [open, setOpen] = useState(options.open !== false);
      const [state, setState] = useState("idle");
      const [message, setMessage] = useState("");
      const [locale, setLocale] = useState(lang());
      const [showLang, setShowLang] = useState(false);
      const recognition = useRef(null);
      const history = useRef([]);

      useEffect(() => {
        const onState = e => { setState(e.detail?.state || "idle"); if (e.detail?.text) setMessage(e.detail.text); };
        const onLang = e => { if (e.detail?.locale) { setLocale(e.detail.locale); setLang(e.detail.locale); } };
        window.addEventListener("kalasutra:copilot-state", onState);
        window.addEventListener("kalasutra:language-changed", onLang);
        if (options.autoWelcome !== false) setTimeout(() => speak(WELCOME[locale] || WELCOME["en-IN"], locale), 450);
        return () => {
          window.removeEventListener("kalasutra:copilot-state", onState);
          window.removeEventListener("kalasutra:language-changed", onLang);
          try { recognition.current?.stop(); } catch (_) {}
        };
      }, []);

      async function handle(transcript) {
        if (!transcript) return;
        setMessage(transcript);
        setState("thinking");
        if (localAction(transcript, go)) return;

        try {
          const r = await post("/ai/chat", {
            message: transcript,
            locale,
            language: languageName(locale),
            history: history.current.slice(-8),
            screen: window.__KALASUTRA_SCREEN__ || "dashboard",
            role: "artisan"
          });
          const data = await r.json();
          if (data.locale && data.locale !== locale && LANGS.some(x => x[0] === data.locale)) {
            setLocale(data.locale); setLang(data.locale);
          }
          if (data.action === "ADD_PRODUCT") {
            go(ADD_PRODUCT_ROUTE);
            window.dispatchEvent(new CustomEvent("kalasutra:copilot-flow", { detail: { step: "photos" } }));
          }
          const reply = data.reply || FALLBACK[locale] || FALLBACK["en-IN"];
          history.current.push({ role: "user", content: transcript }, { role: "assistant", content: reply });
          setMessage(reply);
          await speak(reply, data.locale || locale);
        } catch (_) {
          const handled = localAction(transcript, go);
          if (!handled) await speak(FALLBACK[locale] || FALLBACK["en-IN"], locale);
        }
      }

      function listen() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { speak("Voice input is not available in this browser.", locale); return; }
        try { recognition.current?.stop(); } catch (_) {}
        const r = new SR();
        r.lang = locale;
        r.interimResults = false;
        r.continuous = false;
        r.maxAlternatives = 1;
        r.onstart = () => { setState("listening"); setMessage(locale === "en-IN" ? "I’m listening…" : "मैं सुन रहा हूँ…"); };
        r.onresult = e => handle(e.results?.[0]?.[0]?.transcript || "");
        r.onerror = () => { setState("idle"); speak(locale === "en-IN" ? "I didn’t catch that. Try once more." : "Awaaz clear nahi mili. Ek baar phir boliye.", locale); };
        r.onend = () => setState(s => s === "listening" ? "idle" : s);
        recognition.current = r;
        r.start();
      }

      if (!open) return React.createElement("button", { className: "ks-v7-fab", onClick: () => setOpen(true), "aria-label": "Open Karigar AI" },
        React.createElement("img", { src: "/assets/avatar-artisan.png", alt: "Karigar AI" }));

      return React.createElement("div", { className: "ks-v7-overlay" },
        React.createElement("div", { className: "ks-v7-backdrop", onClick: () => setOpen(false) }),
        React.createElement("section", { className: "ks-v7-center" },
          React.createElement("button", { className: "ks-v7-close", onClick: () => setOpen(false) }, "×"),
          React.createElement("div", { className: "ks-v7-top" },
            React.createElement("div", { className: "ks-v7-brand" }, "✦", React.createElement("span", null, React.createElement("b", null, "Karigar AI"), React.createElement("small", null, "Warm Welcome Center"))),
            React.createElement("button", { className: "ks-v7-lang", onClick: () => setShowLang(v => !v) }, languageName(locale) + " ▾")),
          showLang && React.createElement("div", { className: "ks-v7-lang-menu" }, LANGS.map(([code, name]) => React.createElement("button", { key: code, onClick: () => { setLocale(code); setLang(code); setShowLang(false); speak(WELCOME[code] || WELCOME["en-IN"], code); } }, name))),
          React.createElement("div", { className: "ks-v7-avatar-wrap" },
            React.createElement("div", { className: "ks-v7-rings" }),
            React.createElement("img", { className: "ks-v7-avatar", src: "/assets/avatar-artisan.png", alt: "Karigar AI" }),
            React.createElement("div", { className: "ks-v7-wave" }, [1,2,3,4,5,6,7,8,9].map(i => React.createElement("i", { key: i })))),
          React.createElement("div", { className: "ks-v7-state" }, state === "listening" ? "Listening…" : state === "thinking" ? "Thinking…" : state === "speaking" ? "Speaking…" : "I’m here with you"),
          React.createElement("div", { className: "ks-v7-message" }, message || WELCOME[locale] || WELCOME["en-IN"]),
          React.createElement("button", { className: "ks-v7-mic", onClick: listen, "aria-label": "Talk to Karigar AI" }, state === "listening" ? "●" : "🎙"),
          React.createElement("div", { className: "ks-v7-helper" }, "Speak naturally. I’ll listen, reply, and help you move through KalaSutra."),
          React.createElement("div", { className: "ks-v7-action-hint" }, "Try: “Aaj mujhe ek product add karna hai”"))
      );
    }

    const root = document.createElement("div");
    root.id = "kalasutra-v7-warm-welcome-root";
    document.body.appendChild(root);
    ReactDOM.createRoot(root).render(React.createElement(WarmWelcomeCenter));
    return { unmount: () => root.remove() };
  }

  window.KalaSutraV7 = { mount, speak, setLang, LANGS };
})();
