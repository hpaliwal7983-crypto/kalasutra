(() => {
  const LANGS = [
    { code: "hi", label: "हिंदी", voice: "hi-IN" },
    { code: "en", label: "English", voice: "en-IN" },
    { code: "mr", label: "मराठी", voice: "mr-IN" },
    { code: "gu", label: "ગુજરાતી", voice: "gu-IN" },
    { code: "pa", label: "ਪੰਜਾਬੀ", voice: "pa-IN" },
    { code: "bn", label: "বাংলা", voice: "bn-IN" },
    { code: "ta", label: "தமிழ்", voice: "ta-IN" },
    { code: "te", label: "తెలుగు", voice: "te-IN" },
    { code: "kn", label: "ಕನ್ನಡ", voice: "kn-IN" },
    { code: "ml", label: "മലയാളം", voice: "ml-IN" },
    { code: "or", label: "ଓଡ଼ିଆ", voice: "or-IN" },
    { code: "ur", label: "اردو", voice: "ur-IN" },
  ];

  const text = {
    hi: {
      title: "Welcome to KalaSutra",
      subtitle: "अपनी भाषा चुनें",
      artisan: "मैं Artisan हूँ",
      buyer: "मैं Buyer हूँ",
      saved: "भाषा चुनें",
    },
    en: {
      title: "Welcome to KalaSutra",
      subtitle: "Choose your language",
      artisan: "I'm an Artisan",
      buyer: "I'm a Buyer",
      saved: "Choose language",
    },
    mr: {
      title: "KalaSutra मध्ये स्वागत आहे",
      subtitle: "तुमची भाषा निवडा",
      artisan: "मी कारागीर आहे",
      buyer: "मी खरेदीदार आहे",
      saved: "भाषा निवडा",
    },
    gu: {
      title: "KalaSutra માં આપનું સ્વાગત છે",
      subtitle: "તમારી ભાષા પસંદ કરો",
      artisan: "હું Artisan છું",
      buyer: "હું Buyer છું",
      saved: "ભાષા પસંદ કરો",
    },
    pa: {
      title: "KalaSutra ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ",
      subtitle: "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ",
      artisan: "ਮੈਂ Artisan ਹਾਂ",
      buyer: "ਮੈਂ Buyer ਹਾਂ",
      saved: "ਭਾਸ਼ਾ ਚੁਣੋ",
    },
    bn: {
      title: "KalaSutra-তে স্বাগতম",
      subtitle: "আপনার ভাষা বেছে নিন",
      artisan: "আমি Artisan",
      buyer: "আমি Buyer",
      saved: "ভাষা বেছে নিন",
    },
    ta: {
      title: "KalaSutra-க்கு வரவேற்கிறோம்",
      subtitle: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
      artisan: "நான் Artisan",
      buyer: "நான் Buyer",
      saved: "மொழியைத் தேர்ந்தெடுக்கவும்",
    },
    te: {
      title: "KalaSutra కు స్వాగతం",
      subtitle: "మీ భాషను ఎంచుకోండి",
      artisan: "నేను Artisan",
      buyer: "నేను Buyer",
      saved: "భాషను ఎంచుకోండి",
    },
    kn: {
      title: "KalaSutra ಗೆ ಸ್ವಾಗತ",
      subtitle: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
      artisan: "ನಾನು Artisan",
      buyer: "ನಾನು Buyer",
      saved: "ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ",
    },
    ml: {
      title: "KalaSutra-യിലേക്ക് സ്വാഗതം",
      subtitle: "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക",
      artisan: "ഞാൻ Artisan",
      buyer: "ഞാൻ Buyer",
      saved: "ഭാഷ തിരഞ്ഞെടുക്കുക",
    },
    or: {
      title: "KalaSutra କୁ ସ୍ୱାଗତ",
      subtitle: "ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ",
      artisan: "ମୁଁ Artisan",
      buyer: "ମୁଁ Buyer",
      saved: "ଭାଷା ବାଛନ୍ତୁ",
    },
    ur: {
      title: "KalaSutra میں خوش آمدید",
      subtitle: "اپنی زبان منتخب کریں",
      artisan: "میں Artisan ہوں",
      buyer: "میں Buyer ہوں",
      saved: "زبان منتخب کریں",
    }
  };

  function getLanguage() {
    return localStorage.getItem("kalasutra_language") || "hi";
  }

  function setLanguage(code) {
    localStorage.setItem("kalasutra_language", code);
    localStorage.setItem("kalasutra_voice_lang", (LANGS.find(x => x.code === code) || LANGS[0]).voice);
    document.documentElement.setAttribute("data-kalasutra-lang", code);
    window.dispatchEvent(new CustomEvent("kalasutra:language-changed", {
      detail: { code, voice: (LANGS.find(x => x.code === code) || LANGS[0]).voice }
    }));
  }

  function speak(textValue) {
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const code = getLanguage();
      const voiceLang = (LANGS.find(x => x.code === code) || LANGS[0]).voice;
      const u = new SpeechSynthesisUtterance(textValue);
      u.lang = voiceLang;
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  function mountLanguagePicker() {
    if (document.getElementById("kalasutra-language-overlay")) return;

    const selected = getLanguage();
    const t = text[selected] || text.hi;

    const overlay = document.createElement("div");
    overlay.id = "kalasutra-language-overlay";
    overlay.innerHTML = `
      <div class="ks-lang-card" role="dialog" aria-modal="true">
        <div class="ks-lang-brand">✦ KalaSutra</div>
        <h1 id="ks-lang-title">${t.title}</h1>
        <p id="ks-lang-subtitle">${t.subtitle}</p>
        <div class="ks-lang-grid">
          ${LANGS.map(l => `<button type="button" data-lang="${l.code}" class="${l.code === selected ? "active" : ""}">${l.label}</button>`).join("")}
        </div>
        <div class="ks-lang-actions">
          <button type="button" id="ks-artisan-btn">${t.artisan}</button>
          <button type="button" id="ks-buyer-btn">${t.buyer}</button>
        </div>
        <small id="ks-lang-note">${t.saved}</small>
      </div>
    `;

    document.body.appendChild(overlay);

    function rerenderLabels(code) {
      const tx = text[code] || text.hi;
      document.getElementById("ks-lang-title").textContent = tx.title;
      document.getElementById("ks-lang-subtitle").textContent = tx.subtitle;
      document.getElementById("ks-artisan-btn").textContent = tx.artisan;
      document.getElementById("ks-buyer-btn").textContent = tx.buyer;
      document.getElementById("ks-lang-note").textContent = tx.saved;
    }

    overlay.querySelectorAll("[data-lang]").forEach(btn => {
      btn.addEventListener("click", () => {
        const code = btn.getAttribute("data-lang");
        setLanguage(code);
        overlay.querySelectorAll("[data-lang]").forEach(x => x.classList.toggle("active", x === btn));
        rerenderLabels(code);
        speak((text[code] || text.hi).title + ". " + (text[code] || text.hi).subtitle);
      });
    });

    const finish = role => {
      setLanguage(getLanguage());
      localStorage.setItem("kalasutra_role_preference", role);
      overlay.classList.add("closing");
      window.setTimeout(() => overlay.remove(), 220);
      window.dispatchEvent(new CustomEvent("kalasutra:role-selected", { detail: { role, language: getLanguage() }}));
      const tx = text[getLanguage()] || text.hi;
      speak((getLanguage() === "en" ? "Welcome to KalaSutra. I am Karigar AI." : getLanguage() === "hi" ? "Welcome to KalaSutra. Main Karigar AI hoon." : tx.title));
    };

    document.getElementById("ks-artisan-btn").addEventListener("click", () => finish("artisan"));
    document.getElementById("ks-buyer-btn").addEventListener("click", () => finish("buyer"));
  }

  window.KalaSutraLanguage = { LANGS, getLanguage, setLanguage, speak, mount: mountLanguagePicker };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountLanguagePicker, { once: true });
  } else {
    mountLanguagePicker();
  }
})();
