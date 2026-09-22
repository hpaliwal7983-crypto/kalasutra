
/*
 KALASUTRA KARIGAR AI COPILOT V7
 DROP-IN REPLACEMENT FOR THE EXISTING AITalker FUNCTION IN app.js

 IMPORTANT:
 - Keep your existing app.js/router/screens.
 - Replace ONLY the existing function AITalker(...) { ... } block.
 - Do NOT replace index.html.
 - This component is voice-first; it intentionally has no written chat UI.
*/

function AITalker({
    compact = false,
    embedded = false,
    role = "buyer",
    go
}) {
    const LANGS = {
        hi: { locale:"hi-IN", name:"हिन्दी", welcome:"नमस्ते! मैं Karigar AI हूँ। आज क्या करते हैं?" },
        en: { locale:"en-IN", name:"English", welcome:"Hi! I’m Karigar AI. What shall we work on today?" },
        mr: { locale:"mr-IN", name:"मराठी", welcome:"नमस्कार! मी Karigar AI आहे. आज आपण काय करूया?" },
        gu: { locale:"gu-IN", name:"ગુજરાતી", welcome:"નમસ્તે! હું Karigar AI છું. આજે શું કરીએ?" },
        pa: { locale:"pa-IN", name:"ਪੰਜਾਬੀ", welcome:"ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ Karigar AI ਹਾਂ। ਅੱਜ ਕੀ ਕਰੀਏ?" },
        bn: { locale:"bn-IN", name:"বাংলা", welcome:"নমস্কার! আমি Karigar AI। আজ কী করা যাক?" },
        ta: { locale:"ta-IN", name:"தமிழ்", welcome:"வணக்கம்! நான் Karigar AI. இன்று என்ன செய்வோம்?" },
        te: { locale:"te-IN", name:"తెలుగు", welcome:"నమస్తే! నేను Karigar AI. ఈ రోజు ఏం చేద్దాం?" },
        kn: { locale:"kn-IN", name:"ಕನ್ನಡ", welcome:"ನಮಸ್ಕಾರ! ನಾನು Karigar AI. ಇಂದು ಏನು ಮಾಡೋಣ?" },
        ml: { locale:"ml-IN", name:"മലയാളം", welcome:"നമസ്കാരം! ഞാൻ Karigar AI. ഇന്ന് എന്ത് ചെയ്യാം?" },
        or: { locale:"or-IN", name:"ଓଡ଼ିଆ", welcome:"ନମସ୍କାର! ମୁଁ Karigar AI। ଆଜି କଣ କରିବା?" },
        ur: { locale:"ur-IN", name:"اردو", welcome:"السلام علیکم! میں Karigar AI ہوں۔ آج کیا کریں؟" }
    };

    const FALLBACK = {
        hi: {
            listen:"मैं सुन रहा हूँ…",
            add:"बिल्कुल। चलिए नया product add करते हैं। पहले उसकी 2–3 साफ़ photos लेते हैं। मैं आगे आपको guide करूँगा।",
            photo:"बहुत बढ़िया। अब product का एक और साफ़ angle दिखाइए।",
            details:"अब मुझे बस अपने product के बारे में ऐसे बताइए जैसे किसी ग्राहक को बताते हैं। बाकी details मैं समझ लूँगा।",
            video:"अब 15–30 सेकंड का छोटा making video बनाइए। इससे आपके craft की authenticity दिखेगी।",
            review:"मैंने आपकी जानकारी तैयार कर दी है। Publish करने से पहले एक बार आपके साथ review कर लेते हैं।",
            confirm:"सब सही है? अगर आप हाँ बोलें, तभी मैं इसे publish करने के लिए आगे बढ़ाऊँगा।",
            unknown:"हाँ, समझ गया। आप आराम से बताइए कि क्या करना है।"
        },
        en: {
            listen:"I’m listening…",
            add:"Absolutely. Let’s add your new product. We’ll take 2–3 clear photos first, and I’ll guide you from there.",
            photo:"Nice. Show me one more clear angle of the product.",
            details:"Now tell me about the product naturally, like you would tell a customer. I’ll handle the structure.",
            video:"Now record a short 15–30 second making video. It helps show the authenticity of your craft.",
            review:"I’ve prepared the details. Let’s review them together before publishing.",
            confirm:"Does everything look right? I’ll only publish after you confirm.",
            unknown:"Got it. Just tell me naturally what you want to do."
        },
        mr:{listen:"मी ऐकत आहे…",add:"नक्की. चला तुमचं नवीन product add करूया. आधी 2–3 स्पष्ट फोटो घेऊया.",photo:"छान. आता product चा आणखी एक स्पष्ट angle दाखवा.",details:"आता ग्राहकाला सांगाल तसं तुमच्या product बद्दल बोला. बाकी मी सांभाळतो.",video:"आता 15–30 सेकंदांचा making video घ्या.",review:"मी details तयार केल्या आहेत. Publish करण्यापूर्वी एकदा पाहूया.",confirm:"सगळं बरोबर आहे ना? तुमची confirmation मिळाल्यावरच publish करू.",unknown:"समजलं. तुम्हाला काय करायचं आहे ते सहज सांगा."},
        gu:{listen:"હું સાંભળી રહ્યો છું…",add:"ચોક્કસ. ચાલો તમારું નવું product add કરીએ. પહેલા 2–3 સ્પષ્ટ ફોટા લઈએ.",photo:"સરસ. હવે product નો એક વધુ clear angle બતાવો.",details:"હવે customer ને કહો તેમ product વિશે બોલો. બાકી હું સંભાળી લઈશ.",video:"હવે 15–30 સેકન્ડનો making video લો.",review:"મેં details તૈયાર કરી છે. Publish કરતા પહેલા એક વાર review કરીએ.",confirm:"બધું બરાબર છે? તમારી confirmation પછી જ publish કરીશ.",unknown:"સમજી ગયો. તમને શું કરવું છે તે સ્વાભાવિક રીતે કહો."},
        pa:{listen:"ਮੈਂ ਸੁਣ ਰਿਹਾ ਹਾਂ…",add:"ਬਿਲਕੁਲ। ਆਓ ਨਵਾਂ product add ਕਰੀਏ। ਪਹਿਲਾਂ 2–3 ਸਾਫ਼ photos ਲੈਂਦੇ ਹਾਂ।",photo:"ਵਧੀਆ। ਹੁਣ product ਦਾ ਇੱਕ ਹੋਰ ਸਾਫ਼ angle ਦਿਖਾਓ।",details:"ਹੁਣ customer ਨੂੰ ਦੱਸਣ ਵਾਂਗ ਆਪਣੇ product ਬਾਰੇ ਦੱਸੋ। ਬਾਕੀ ਮੈਂ ਕਰ ਲਵਾਂਗਾ।",video:"ਹੁਣ 15–30 ਸਕਿੰਟ ਦੀ making video ਬਣਾਓ।",review:"ਮੈਂ details ਤਿਆਰ ਕਰ ਦਿੱਤੀਆਂ ਹਨ। Publish ਤੋਂ ਪਹਿਲਾਂ ਇਕ ਵਾਰ review ਕਰੀਏ।",confirm:"ਸਭ ਠੀਕ ਹੈ? ਤੁਹਾਡੀ confirmation ਤੋਂ ਬਾਅਦ ਹੀ publish ਕਰਾਂਗਾ।",unknown:"ਸਮਝ ਗਿਆ। ਤੁਸੀਂ ਕੁਦਰਤੀ ਤਰੀਕੇ ਨਾਲ ਦੱਸੋ ਕਿ ਕੀ ਕਰਨਾ ਹੈ।"},
        bn:{listen:"আমি শুনছি…",add:"অবশ্যই। চলুন নতুন product add করি। আগে ২–৩টি পরিষ্কার ছবি নিই।",photo:"দারুণ। এখন product-এর আরেকটি পরিষ্কার angle দেখান।",details:"এখন customer-কে বলার মতো করে product-এর কথা বলুন। বাকিটা আমি সামলে নেব।",video:"এখন ১৫–৩০ সেকেন্ডের একটি making video নিন।",review:"আমি details তৈরি করেছি। Publish করার আগে একবার দেখে নিই।",confirm:"সব ঠিক আছে? আপনার confirmation-এর পরেই publish করব।",unknown:"বুঝেছি। কী করতে চান স্বাভাবিকভাবে বলুন।"},
        ta:{listen:"நான் கேட்கிறேன்…",add:"கண்டிப்பாக. உங்கள் புதிய product-ஐ add செய்வோம். முதலில் 2–3 தெளிவான photos எடுப்போம்.",photo:"சூப்பர். இப்போது product-ன் இன்னொரு தெளிவான angle காட்டுங்கள்.",details:"இப்போது customer-க்கு சொல்வது போல product பற்றி இயல்பாக சொல்லுங்கள். மீதியை நான் பார்த்துக்கொள்கிறேன்.",video:"இப்போது 15–30 விநாடி making video எடுங்கள்.",review:"Details தயார். Publish செய்வதற்கு முன் ஒன்றாக review செய்வோம்.",confirm:"எல்லாம் சரியா? நீங்கள் confirm செய்த பிறகே publish செய்வேன்.",unknown:"புரிந்தது. என்ன செய்ய வேண்டும் என்று இயல்பாக சொல்லுங்கள்."},
        te:{listen:"నేను వింటున్నాను…",add:"ఖచ్చితంగా. మీ కొత్త product add చేద్దాం. ముందుగా 2–3 clear photos తీసుకుందాం.",photo:"బాగుంది. ఇప్పుడు product కి ఇంకో clear angle చూపించండి.",details:"ఇప్పుడు customer కి చెప్పినట్టు product గురించి సహజంగా చెప్పండి. మిగతాది నేను చూసుకుంటాను.",video:"ఇప్పుడు 15–30 seconds making video తీసుకోండి.",review:"Details సిద్ధంగా ఉన్నాయి. Publish చేయడానికి ముందు కలిసి review చేద్దాం.",confirm:"అన్నీ సరిగ్గా ఉన్నాయా? మీరు confirm చేసిన తర్వాతే publish చేస్తాను.",unknown:"అర్థమైంది. ఏం చేయాలో సహజంగా చెప్పండి."},
        kn:{listen:"ನಾನು ಕೇಳುತ್ತಿದ್ದೇನೆ…",add:"ಖಂಡಿತ. ನಿಮ್ಮ ಹೊಸ product add ಮಾಡೋಣ. ಮೊದಲು 2–3 clear photos ತೆಗೆದುಕೊಳ್ಳೋಣ.",photo:"ಚೆನ್ನಾಗಿದೆ. ಈಗ product ನ ಇನ್ನೊಂದು clear angle ತೋರಿಸಿ.",details:"ಈಗ customer ಗೆ ಹೇಳುವಂತೆ product ಬಗ್ಗೆ ಸಹಜವಾಗಿ ಹೇಳಿ. ಉಳಿದದ್ದನ್ನು ನಾನು ನೋಡಿಕೊಳ್ಳುತ್ತೇನೆ.",video:"ಈಗ 15–30 seconds making video ತೆಗೆದುಕೊಳ್ಳಿ.",review:"Details ಸಿದ್ಧವಾಗಿವೆ. Publish ಮಾಡುವ ಮೊದಲು ಒಮ್ಮೆ review ಮಾಡೋಣ.",confirm:"ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆಯೇ? ನೀವು confirm ಮಾಡಿದ ನಂತರವೇ publish ಮಾಡುತ್ತೇನೆ.",unknown:"ಅರ್ಥವಾಯಿತು. ಏನು ಮಾಡಬೇಕೆಂದು ಸಹಜವಾಗಿ ಹೇಳಿ."},
        ml:{listen:"ഞാൻ കേൾക്കുകയാണ്…",add:"തീർച്ചയായും. നിങ്ങളുടെ പുതിയ product add ചെയ്യാം. ആദ്യം 2–3 clear photos എടുക്കാം.",photo:"നന്നായി. ഇനി product-ന്റെ മറ്റൊരു clear angle കാണിക്കൂ.",details:"ഇപ്പോൾ customer-നോട് പറയുന്നതുപോലെ product-നെ കുറിച്ച് സ്വാഭാവികമായി പറയൂ. ബാക്കി ഞാൻ നോക്കാം.",video:"ഇപ്പോൾ 15–30 seconds making video എടുക്കൂ.",review:"Details തയ്യാറാക്കി. Publish ചെയ്യുന്നതിന് മുമ്പ് ഒരിക്കൽ review ചെയ്യാം.",confirm:"എല്ലാം ശരിയാണോ? നിങ്ങൾ confirm ചെയ്തതിന് ശേഷമേ publish ചെയ്യൂ.",unknown:"മനസ്സിലായി. എന്ത് ചെയ്യണമെന്ന് സ്വാഭാവികമായി പറയൂ."},
        or:{listen:"ମୁଁ ଶୁଣୁଛି…",add:"ନିଶ୍ଚିତ। ଚାଲନ୍ତୁ ଆପଣଙ୍କ ନୂଆ product add କରିବା। ପ୍ରଥମେ 2–3ଟି ସ୍ପଷ୍ଟ photo ନେବା।",photo:"ଭଲ। ଏବେ product ର ଆଉ ଗୋଟିଏ clear angle ଦେଖାନ୍ତୁ।",details:"ଏବେ customer କୁ କହିବା ଭଳି product ବିଷୟରେ ସ୍ୱାଭାବିକ ଭାବରେ କହନ୍ତୁ। ବାକି ମୁଁ କରିଦେବି।",video:"ଏବେ 15–30 seconds ର making video ନିଅନ୍ତୁ।",review:"Details ପ୍ରସ୍ତୁତ। Publish ପୂର୍ବରୁ ଥରେ review କରିବା।",confirm:"ସବୁ ଠିକ୍ ଅଛି? ଆପଣ confirm କଲା ପରେ ହିଁ publish କରିବି।",unknown:"ବୁଝିଲି। କଣ କରିବାକୁ ଚାହୁଁଛନ୍ତି ସ୍ୱାଭାବିକ ଭାବରେ କହନ୍ତୁ।"},
        ur:{listen:"میں سن رہا ہوں…",add:"بالکل۔ آئیے آپ کی نئی product add کرتے ہیں۔ پہلے 2–3 صاف photos لیتے ہیں۔",photo:"بہت اچھا۔ اب product کا ایک اور صاف angle دکھائیں۔",details:"اب ایسے بتائیں جیسے آپ customer کو بتاتے ہیں۔ باقی details میں سنبھال لوں گا۔",video:"اب 15–30 سیکنڈ کی making video بنائیں۔",review:"میں نے details تیار کر دی ہیں۔ Publish کرنے سے پہلے ایک بار review کرتے ہیں۔",confirm:"سب ٹھیک ہے؟ آپ کی confirmation کے بعد ہی publish کروں گا۔",unknown:"سمجھ گیا۔ آپ قدرتی انداز میں بتائیں کیا کرنا ہے۔"}
    };

    const [state, setState] = useState("idle");
    const [language, setLanguage] = useState(() => {
        try { return localStorage.getItem("kalasutra_language") || "hi"; }
        catch (_) { return "hi"; }
    });
    const [message, setMessage] = useState("");
    const [showLanguage, setShowLanguage] = useState(false);
    const [flow, setFlow] = useState({
        active:false,
        step:"idle",
        photos:0,
        hasVideo:false,
        detailsCaptured:false
    });

    const recognitionRef = useRef(null);
    const mountedRef = useRef(true);

    function t(key) {
        const pack = FALLBACK[language] || FALLBACK.en;
        return pack[key] || FALLBACK.en[key];
    }

    function setLang(next) {
        if (!LANGS[next]) return;
        setLanguage(next);
        try { localStorage.setItem("kalasutra_language", next); } catch (_) {}
        try {
            window.dispatchEvent(new CustomEvent("kalasutra:language-changed", {
                detail:{ language:next, locale:LANGS[next].locale }
            }));
        } catch (_) {}
    }

    function speak(text) {
        if (!mountedRef.current) return;
        setMessage(text);
        setState("speaking");

        try {
            if (!window.speechSynthesis) {
                setState("idle");
                return;
            }

            window.speechSynthesis.cancel();

            const u = new SpeechSynthesisUtterance(text);
            u.lang = (LANGS[language] || LANGS.en).locale;
            u.rate = 0.94;
            u.pitch = 1.02;
            u.volume = 1;

            u.onend = () => mountedRef.current && setState("idle");
            u.onerror = () => mountedRef.current && setState("idle");

            window.speechSynthesis.speak(u);
        } catch (_) {
            setState("idle");
        }
    }

    async function askServer(transcript, context = {}) {
        try {
            const response = await fetch("/api/karigar-ai/chat", {
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({
                    message:transcript,
                    language:LANGS[language].locale,
                    role,
                    flow,
                    context
                })
            });

            if (!response.ok) throw new Error("AI endpoint unavailable");

            const data = await response.json();

            if (data.language && LANGS[data.language]) {
                setLang(data.language);
            }

            if (data.action) {
                executeAction(data.action, data);
            }

            if (data.reply) {
                speak(data.reply);
                return true;
            }
        } catch (_) {}

        return false;
    }

    function executeAction(action, data = {}) {
        if (!action) return;

        if (action === "ADD_PRODUCT_START") {
            setFlow({
                active:true,
                step:"photos",
                photos:0,
                hasVideo:false,
                detailsCaptured:false
            });

            setTimeout(() => go?.("addProduct"), 250);
            return;
        }

        if (action === "ORDERS") {
            go?.("orders");
            return;
        }

        if (action === "PROFILE") {
            go?.(role === "artisan" ? "profile" : "buyerProfile");
            return;
        }

        if (action === "CREATE_REEL") {
            go?.("createReel");
            return;
        }

        if (action === "HOME") {
            go?.(role === "artisan" ? "dashboard" : "buyerHome");
        }
    }

    async function handleCommand(transcript) {
        const q = String(transcript || "").toLowerCase().trim();

        if (!q) {
            speak(t("unknown"));
            return;
        }

        // Let the server handle natural language first.
        const handled = await askServer(transcript, {
            currentScreen: window.__KALASUTRA_SCREEN || "",
            flow
        });

        if (handled) return;

        // Reliable local fallback.
        if (
            /add product|new product|product add|naya product|naya piece|product banana|नया प्रोडक्ट|नया उत्पाद|नया सामान|نئی product|नवीन product/.test(q)
        ) {
            executeAction("ADD_PRODUCT_START");
            speak(t("add"));
            return;
        }

        if (/order|orders|ऑर्डर|आदेश/.test(q)) {
            speak(language === "en" ? "Sure. I’m opening your orders." : "Bilkul. Main aapke orders khol raha hoon.");
            setTimeout(() => executeAction("ORDERS"), 450);
            return;
        }

        if (/reel|रील|वीडियो बनाना/.test(q)) {
            speak(language === "en" ? "Sure. Let’s create a reel for your craft." : "Bilkul. Chaliye aapke craft ki reel banate hain.");
            setTimeout(() => executeAction("CREATE_REEL"), 450);
            return;
        }

        if (/profile|प्रोफाइल|پروفائل/.test(q)) {
            speak(language === "en" ? "Sure. Let’s open your profile." : "Bilkul. Chaliye aapka profile dekhte hain.");
            setTimeout(() => executeAction("PROFILE"), 450);
            return;
        }

        speak(t("unknown"));
    }

    function startListening() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SR) {
            speak(language === "en"
                ? "Voice input is not available in this browser."
                : "Is browser mein voice input available nahi hai.");
            return;
        }

        try {
            const r = new SR();

            r.lang = (LANGS[language] || LANGS.en).locale;
            r.interimResults = false;
            r.continuous = false;
            r.maxAlternatives = 1;

            r.onstart = () => {
                setState("listening");
                setMessage(t("listen"));
            };

            r.onresult = async (event) => {
                const transcript =
                    event.results?.[0]?.[0]?.transcript || "";

                setState("thinking");

                await handleCommand(transcript);
            };

            r.onerror = () => {
                setState("idle");
                speak(language === "en"
                    ? "I didn’t catch that. Try once more."
                    : "Awaaz clear nahi mili. Ek baar phir boliye.");
            };

            r.onend = () => {
                if (mountedRef.current && state === "listening") {
                    setState("idle");
                }
            };

            recognitionRef.current = r;
            r.start();
        } catch (_) {
            setState("idle");
        }
    }

    function cancelListening() {
        try { recognitionRef.current?.stop(); } catch (_) {}
        try { window.speechSynthesis?.cancel(); } catch (_) {}
        setState("idle");
        setMessage("");
        setFlow({active:false,step:"idle",photos:0,hasVideo:false,detailsCaptured:false});
    }

    function beginConversation() {
        if (role !== "artisan") return;
        setMessage(LANGS[language]?.welcome || LANGS.en.welcome);
        setState("speaking");

        try {
            window.speechSynthesis?.cancel();
            const u = new SpeechSynthesisUtterance(
                LANGS[language]?.welcome || LANGS.en.welcome
            );
            u.lang = LANGS[language]?.locale || "en-IN";
            u.rate = 0.94;
            u.pitch = 1.02;
            u.onend = () => mountedRef.current && setState("idle");
            window.speechSynthesis?.speak(u);
        } catch (_) {
            setState("idle");
        }
    }

    // Add Product events from the host app can keep the copilot in sync.
    useEffect(() => {
        mountedRef.current = true;

        const onLang = (e) => {
            const next = e?.detail?.language;
            if (next && LANGS[next]) setLanguage(next);
        };

        const onFlow = (e) => {
            const detail = e?.detail || {};
            if (detail.step) {
                setFlow(prev => ({...prev, ...detail}));
                if (detail.step === "photos") speak(t("photo"));
                if (detail.step === "details") speak(t("details"));
                if (detail.step === "video") speak(t("video"));
                if (detail.step === "review") speak(t("review"));
                if (detail.step === "confirm") speak(t("confirm"));
            }
        };

        window.addEventListener("kalasutra:language-changed", onLang);
        window.addEventListener("kalasutra:copilot-flow", onFlow);

        const first = setTimeout(() => {
            if (role === "artisan") beginConversation();
        }, 700);

        return () => {
            mountedRef.current = false;
            clearTimeout(first);
            window.removeEventListener("kalasutra:language-changed", onLang);
            window.removeEventListener("kalasutra:copilot-flow", onFlow);
            try { recognitionRef.current?.stop(); } catch (_) {}
            try { window.speechSynthesis?.cancel(); } catch (_) {}
        };
    }, []);

    if (!open) {
        return React.createElement(
            "button",
            {
                className:"ks-copilot-fab",
                onClick:() => setOpen(true),
                "aria-label":"Open Karigar AI"
            },
            React.createElement("img", {
                src:"/assets/avatar-artisan.png",
                alt:"Karigar AI"
            }),
            React.createElement("span", null, "✦")
        );
    }

    const immersive = !compact && !embedded && role === "artisan";

    return React.createElement(
        React.Fragment,
        null,

        React.createElement(
            "div",
            {
                className:
                    "ks-copilot " +
                    (immersive ? "ks-copilot-immersive " : "ks-copilot-compact ") +
                    "ks-copilot-" + state
            },

            immersive && React.createElement("div", {
                className:"ks-copilot-backdrop"
            }),

            React.createElement(
                "div",
                { className:"ks-copilot-card" },

                React.createElement(
                    "div",
                    { className:"ks-copilot-header" },

                    React.createElement(
                        "div",
                        { className:"ks-copilot-brand" },
                        React.createElement("span", null, "✦"),
                        React.createElement("strong", null, "Karigar AI"),
                        React.createElement("small", null, "Your craft companion")
                    ),

                    React.createElement(
                        "button",
                        {
                            className:"ks-copilot-language",
                            onClick:() => setShowLanguage(v => !v)
                        },
                        LANGS[language]?.name || "English",
                        "⌄"
                    )
                ),

                showLanguage && React.createElement(
                    "div",
                    { className:"ks-copilot-language-menu" },
                    Object.keys(LANGS).map(code =>
                        React.createElement(
                            "button",
                            {
                                key:code,
                                className:code === language ? "active" : "",
                                onClick:() => {
                                    setLang(code);
                                    setShowLanguage(false);
                                    speak(LANGS[code].welcome);
                                }
                            },
                            LANGS[code].name
                        )
                    )
                ),

                React.createElement(
                    "div",
                    { className:"ks-copilot-avatar-wrap" },

                    React.createElement(
                        "div",
                        { className:"ks-copilot-rings" }
                    ),

                    React.createElement(
                        "div",
                        { className:"ks-copilot-avatar" },
                        React.createElement("img", {
                            src:"/assets/avatar-artisan.png",
                            alt:"Karigar AI"
                        })
                    ),

                    React.createElement(
                        "div",
                        { className:"ks-copilot-wave" },
                        [1,2,3,4,5,6,7,8,9].map(n =>
                            React.createElement("i", {key:n})
                        )
                    )
                ),

                React.createElement(
                    "div",
                    { className:"ks-copilot-status" },
                    state === "listening"
                        ? "Listening…"
                        : state === "speaking"
                            ? "Speaking…"
                            : state === "thinking"
                                ? "Thinking…"
                                : "Tap to speak"
                ),

                message && React.createElement(
                    "div",
                    { className:"ks-copilot-message" },
                    message
                ),

                flow.active && React.createElement(
                    "div",
                    { className:"ks-copilot-flow" },
                    React.createElement("span", null, "Add Product"),
                    React.createElement("b", null,
                        flow.step === "photos" ? "1 Photos" :
                        flow.step === "details" ? "2 Details" :
                        flow.step === "video" ? "3 Making Video" :
                        flow.step === "review" ? "4 Review" :
                        "Ready"
                    )
                ),

                React.createElement(
                    "button",
                    {
                        className:"ks-copilot-mic",
                        onClick:startListening,
                        "aria-label":"Talk to Karigar AI"
                    },
                    state === "listening" ? "●" : "🎙"
                ),

                React.createElement(
                    "div",
                    { className:"ks-copilot-helper" },
                    role === "artisan"
                        ? "Just speak naturally. I’ll guide you step by step."
                        : "Ask naturally. I’ll help you."
                ),

                immersive && React.createElement(
                    "button",
                    {
                        className:"ks-copilot-cancel",
                        onClick:cancelListening
                    },
                    React.createElement("span", null, "×"),
                    React.createElement("small", null, "Cancel")
                ),

                React.createElement(
                    "button",
                    {
                        className:"ks-copilot-close",
                        onClick:() => setOpen(false),
                        "aria-label":"Minimize Karigar AI"
                    },
                    "—"
                )
            )
        )
    );
}
