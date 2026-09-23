// KalaSutra frontend — React, written with light TypeScript annotations,
// compiled in-browser by Babel standalone (see index.html). No build step.
const { useState, useEffect, useRef } = React;
// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
const API = "/api";
async function apiGet(path) {
    const res = await fetch(`${API}${path}`);
    if (!res.ok)
        throw new Error((await res.json()).error || "Request failed");
    return res.json();
}
async function apiPost(path, body = {}) {
    const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok)
        throw new Error((await res.json()).error || "Request failed");
    return res.json();
}
async function apiPut(path, body = {}) {
    const res = await fetch(`${API}${path}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok)
        throw new Error((await res.json()).error || "Request failed");
    return res.json();
}
async function apiDelete(path, body = {}) {
    const res = await fetch(`${API}${path}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok)
        throw new Error((await res.json()).error || "Request failed");
    return res.json();
}
// Convert a File (from an <input type="file">) into a base64 data URL.
// This lets the demo "upload" images/video without needing a multipart
// file-upload library on the server.
function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
// Shared browsing trail: keeps Recently Viewed consistent when the demo switches
// between Buyer and Artisan roles on the same device.
function saveRecentProduct(userId, productId) {
    try {
        const globalKey = "kalasutra_recent_products_global";
        const userKey = userId ? `kalasutra_recent_products_${userId}` : null;
        const read = (key) => { try {
            return JSON.parse(localStorage.getItem(key) || "[]");
        }
        catch (_) {
            return [];
        } };
        const next = [String(productId), ...read(globalKey).filter((x) => String(x) !== String(productId))].slice(0, 12);
        localStorage.setItem(globalKey, JSON.stringify(next));
        if (userKey)
            localStorage.setItem(userKey, JSON.stringify(next));
        window.dispatchEvent(new Event("kalasutra:recent-product"));
    }
    catch (_) { }
}
function getRecentProductIds(userId) {
    try {
        const global = JSON.parse(localStorage.getItem("kalasutra_recent_products_global") || "[]");
        const own = userId ? JSON.parse(localStorage.getItem(`kalasutra_recent_products_${userId}`) || "[]") : [];
        return [...own, ...global].map(String).filter((id, i, a) => a.indexOf(id) === i).slice(0, 12);
    }
    catch (_) {
        return [];
    }
}
const CATEGORY_EMOJI = {
    Pottery: "🏺", Textiles: "🧣", Woodwork: "🐘", Metalwork: "🪔",
    Basketry: "🧺", Other: "🎨",
};
// ---------------------------------------------------------------------------
// Small shared UI pieces
// ---------------------------------------------------------------------------
function Toast({ message }) {
    if (!message)
        return null;
    return React.createElement("div", { className: "toast" }, message);
}
function BadgeLabel({ status }) {
    const map = {
        verified: "🟢 Verified Handmade",
        needs_review: "🟡 Needs Verification",
        rejected: "🔴 Not Eligible",
        unverified: "⚪ Not Verified Yet",
    };
    return React.createElement("span", { className: `badge ${status}` }, map[status] || status);
}
function ErrorBanner({ message }) {
    if (!message)
        return null;
    return React.createElement("div", { className: "error-banner" },
        "\u26A0 ",
        message);
}
function Icon({ name }) {
    const icons = {
        home: React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("path", { d: "M3 11.5 12 4l9 7.5" }),
            React.createElement("path", { d: "M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" })),
        add: React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("circle", { cx: "12", cy: "12", r: "8.5" }),
            React.createElement("path", { d: "M12 8v8M8 12h8" })),
        reels: React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("rect", { x: "3.5", y: "5", width: "17", height: "14", rx: "3" }),
            React.createElement("path", { d: "M10.2 9.3v5.4l4.6-2.7z", fill: "currentColor", stroke: "none" })),
        orders: React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("path", { d: "M6.5 7h11l-.8 12.1a2 2 0 0 1-2 1.9H9.3a2 2 0 0 1-2-1.9L6.5 7Z" }),
            React.createElement("path", { d: "M9 7V5.5a3 3 0 0 1 6 0V7" })),
        profile: React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("circle", { cx: "12", cy: "8", r: "3.6" }),
            React.createElement("path", { d: "M4.5 20c0-4 3.5-6.5 7.5-6.5s7.5 2.5 7.5 6.5" })),
        search: React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("circle", { cx: "10.5", cy: "10.5", r: "6.5" }),
            React.createElement("path", { d: "m20 20-4.3-4.3" })),
        heart: React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7" },
            React.createElement("path", { d: "M12 20s-7-4.35-9.5-8.5C.9 8.1 2.7 5 6 5c2 0 3.5 1.2 4 2.3.5-1.1 2-2.3 4-2.3 3.3 0 5.1 3.1 3.5 6.5C19 15.65 12 20 12 20Z" })),
        bell: React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("path", { d: "M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" }),
            React.createElement("path", { d: "M10 21h4" })),
        cart: React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("circle", { cx: "9", cy: "20", r: "1.4" }),
            React.createElement("circle", { cx: "18", cy: "20", r: "1.4" }),
            React.createElement("path", { d: "M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H5.2" })),
    };
    return icons[name] || null;
}
// ---------------------------------------------------------------------------
// DEVICE PERMISSIONS — location, notifications and microphone/voice
// ---------------------------------------------------------------------------
function savedLocation() {
    try {
        return JSON.parse(localStorage.getItem('kalasutra_location') || 'null');
    }
    catch (_) {
        return null;
    }
}
async function requestVoicePermission() {
    try {
        if (!navigator.mediaDevices?.getUserMedia)
            return false;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        localStorage.setItem('kalasutra_voice_allowed', '1');
        return true;
    }
    catch (_) {
        return false;
    }
}
async function requestNotifications() {
    try {
        if (!('Notification' in window))
            return 'unsupported';
        const result = await Notification.requestPermission();
        if (result === 'granted')
            localStorage.setItem('kalasutra_notifications_allowed', '1');
        return result;
    }
    catch (_) {
        return 'unsupported';
    }
}
function isLocalHost() {
    return ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
}
function securePhoneLocationUrl() {
    return `https://${window.location.hostname}:3443${window.location.pathname}${window.location.search}`;
}
function requestCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation)
            return reject(new Error('Location is not available in this browser.'));
        if (!window.isSecureContext && !isLocalHost()) {
            reject(new Error('Phone browsers block location on an HTTP network address. Please open the secure KalaSutra link.'));
            return;
        }
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const data = await apiGet(`/location/reverse?lat=${encodeURIComponent(pos.coords.latitude)}&lon=${encodeURIComponent(pos.coords.longitude)}`);
                const location = { ...data, lat: pos.coords.latitude, lon: pos.coords.longitude };
                localStorage.setItem('kalasutra_location', JSON.stringify(location));
                resolve(location);
            }
            catch (_) {
                const location = { area: '', city: '', pincode: '', lat: pos.coords.latitude, lon: pos.coords.longitude };
                localStorage.setItem('kalasutra_location', JSON.stringify(location));
                resolve(location);
            }
        }, (err) => reject(new Error(err?.code === 1 ? 'Location permission was denied.' : 'Could not get your location.')), { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 });
    });
}
function notifyUser(title, body) {
    try {
        if ('Notification' in window && Notification.permission === 'granted')
            new Notification(title, { body, icon: '/assets/avatar-artisan.png' });
    }
    catch (_) { }
}
function PermissionCenter({ onClose }) {
    const [locationState, setLocationState] = useState(savedLocation() ? 'allowed' : 'idle');
    const [notificationState, setNotificationState] = useState(() => ('Notification' in window && Notification.permission === 'granted') ? 'allowed' : 'idle');
    const [voiceState, setVoiceState] = useState(() => localStorage.getItem('kalasutra_voice_allowed') === '1' ? 'allowed' : 'idle');
    const [busy, setBusy] = useState(null);
    async function allowLocation() {
        setBusy('location');
        try {
            if (!window.isSecureContext && !isLocalHost()) {
                window.location.href = securePhoneLocationUrl();
                return;
            }
            await requestCurrentLocation();
            setLocationState('allowed');
        }
        catch (_) {
            setLocationState('denied');
        }
        finally {
            setBusy(null);
        }
    }
    async function allowNotifications() {
        setBusy('notification');
        const r = await requestNotifications();
        setNotificationState(r === 'granted' ? 'allowed' : r === 'denied' ? 'denied' : 'unsupported');
        if (r === 'unsupported' && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            setTimeout(() => alert('iPhone notifications work after KalaSutra is added to the Home Screen. Open Share → Add to Home Screen, then open KalaSutra again and tap Allow.'), 0);
        }
        setBusy(null);
    }
    async function allowVoice() {
        setBusy('voice');
        const ok = await requestVoicePermission();
        setVoiceState(ok ? 'allowed' : 'denied');
        setBusy(null);
    }
    return React.createElement("div", { className: "permission-overlay" },
        React.createElement("div", { className: "permission-sheet" },
            React.createElement("div", { className: "permission-glow" }),
            React.createElement("div", { className: "permission-avatar" },
                React.createElement("img", { src: "/assets/avatar-artisan.png", alt: "KalaSutra" })),
            React.createElement("div", { className: "permission-kicker" }, "WELCOME TO KALASUTRA"),
            React.createElement("h2", null, "Make your experience easier \u2728"),
            React.createElement("p", null, "Allow these permissions once and KalaSutra can fill delivery details, send order updates and listen to your voice."),
            React.createElement("div", { className: "permission-list" },
                React.createElement("button", { onClick: allowLocation, disabled: busy !== null, className: "permission-row" },
                    React.createElement("span", { className: "permission-icon" }, "\u2316"),
                    React.createElement("span", null,
                        React.createElement("strong", null, "Location"),
                        React.createElement("small", null, "Auto-fill area, city & pincode")),
                    React.createElement("b", null, busy === 'location' ? '…' : locationState === 'allowed' ? '✓' : 'Allow')),
                React.createElement("button", { onClick: allowNotifications, disabled: busy !== null, className: "permission-row" },
                    React.createElement("span", { className: "permission-icon" }, "\u2667"),
                    React.createElement("span", null,
                        React.createElement("strong", null, "Notifications"),
                        React.createElement("small", null, "Order & payment updates")),
                    React.createElement("b", null, busy === 'notification' ? '…' : notificationState === 'allowed' ? '✓' : 'Allow')),
                React.createElement("button", { onClick: allowVoice, disabled: busy !== null, className: "permission-row" },
                    React.createElement("span", { className: "permission-icon" }, "\u2669"),
                    React.createElement("span", null,
                        React.createElement("strong", null, "Voice & microphone"),
                        React.createElement("small", null, "Voice search & AI Talker")),
                    React.createElement("b", null, busy === 'voice' ? '…' : voiceState === 'allowed' ? '✓' : 'Allow'))),
            React.createElement("button", { className: "permission-skip", onClick: () => { localStorage.setItem('kalasutra_permission_seen', '1'); onClose(); } }, "Not now \u2014 continue to KalaSutra"),
            !window.isSecureContext && !isLocalHost() && React.createElement("div", { className: "permission-secure-note" },
                "\uD83D\uDCCD Phone location needs the secure KalaSutra link. Tap ",
                React.createElement("b", null, "Allow"),
                " and KalaSutra will open it automatically."),
            React.createElement("div", { className: "permission-note" }, "You can change these permissions later in your browser settings.")));
}
// ---------------------------------------------------------------------------
// AI TALKER — voice-first assistant used across the prototype/demo
// ---------------------------------------------------------------------------// ---------------------------------------------------------------------------
function AITalker({ compact = false, embedded = false, role = 'buyer', go }) {
    const [open, setOpen] = useState(true);
    const [listening, setListening] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [message, setMessage] = useState(
        role === 'artisan'
            ? "Namaste! Main Karigar AI hoon. Aaj kya karna hai?"
            : "Namaste! Main KalaSutra mein aapke saath hoon. Kya dhoondh rahe ho?"
    );

    const recognitionRef = useRef(null);
    const historyRef = useRef([]);

    const LANGS = {
        Hindi: "hi-IN",
        English: "en-IN",
        Marathi: "mr-IN",
        Gujarati: "gu-IN",
        Punjabi: "pa-IN",
        Bengali: "bn-IN",
        Tamil: "ta-IN",
        Telugu: "te-IN",
        Kannada: "kn-IN",
        Malayalam: "ml-IN",
        Odia: "or-IN",
        Urdu: "ur-IN"
    };

    const [language] = useState(() => {
        try {
            return localStorage.getItem("kalasutra_language_name") || "Hindi";
        } catch (_) {
            return "Hindi";
        }
    });

    const speechLanguage = LANGS[language] || "hi-IN";

    function speak(text) {
        setMessage(text);
        setSpeaking(true);

        try {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();

                const voice = new SpeechSynthesisUtterance(text);
                voice.lang = speechLanguage;
                voice.rate = 0.96;
                voice.pitch = 1;

                voice.onend = () => setSpeaking(false);
                voice.onerror = () => setSpeaking(false);

                window.speechSynthesis.speak(voice);
                return;
            }
        } catch (_) {}

        setSpeaking(false);
    }

    async function askKarigarAI(heard) {
        if (!heard) return;

        setMessage("Samajh raha hoon…");

        const newMessages = [
            ...historyRef.current,
            {
                role: "user",
                content: heard
            }
        ].slice(-8);

        historyRef.current = newMessages;

        try {
            const response = await fetch("/api/karigar-ai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    role,
                    language,
                    messages: newMessages
                })
            });

            if (!response.ok) {
                throw new Error("AI service unavailable");
            }

            const data = await response.json();

            const reply =
                data.reply ||
                "Haan, main yahin hoon. Batao kya karna hai?";

            historyRef.current = [
                ...newMessages,
                {
                    role: "assistant",
                    content: reply
                }
            ].slice(-8);

            speak(reply);

            if (data.action && data.action !== "none") {
                setTimeout(() => {
                    if (go) go(data.action);
                }, 500);
            }

        } catch (_) {

            const lower = heard.toLowerCase();

            if (
                lower.includes("add product") ||
                lower.includes("product add") ||
                lower.includes("naya product") ||
                lower.includes("product banana") ||
                lower.includes("उत्पाद")
            ) {
                speak(
                    "Bilkul. Chalo naya product add karte hain. Main tumhe step by step guide karunga."
                );

                if (role === "artisan" && go) {
                    setTimeout(() => go("addProduct"), 600);
                }

                return;
            }

            if (
                lower.includes("order") ||
                lower.includes("orders") ||
                lower.includes("ऑर्डर")
            ) {
                speak("Bilkul, tumhare orders khol raha hoon.");

                if (go) {
                    setTimeout(() => go("orders"), 600);
                }

                return;
            }

            if (
                lower.includes("reel") ||
                lower.includes("रील")
            ) {
                speak("Chalo, product ki Reel banate hain.");

                if (role === "artisan" && go) {
                    setTimeout(() => go("createReel"), 600);
                }

                return;
            }

            if (
                lower.includes("profile") ||
                lower.includes("प्रोफाइल")
            ) {
                speak("Bilkul, profile khol raha hoon.");

                if (go) {
                    setTimeout(
                        () => go(role === "artisan" ? "profile" : "buyerProfile"),
                        600
                    );
                }

                return;
            }

            speak(
                language === "English"
                    ? "I am here with you. Tell me what you want to do."
                    : "Haan bhai, main yahin hoon. Batao kya karna hai."
            );
        }
    }

    function startListening() {
        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            speak(
                language === "English"
                    ? "Voice input is not available in this browser."
                    : "Is browser mein voice input available nahi hai."
            );
            return;
        }

        try {
            recognitionRef.current?.stop();
        } catch (_) {}

        const recognition = new SpeechRecognition();

        recognition.lang = speechLanguage;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setListening(true);
            setMessage("Sun raha hoon…");
        };

        recognition.onend = () => {
            setListening(false);
        };

        recognition.onerror = () => {
            setListening(false);

            speak(
                language === "English"
                    ? "I didn't catch that. Try again."
                    : "Main samajh nahi paaya. Ek baar phir bolo."
            );
        };

        recognition.onresult = event => {
            const heard =
                event.results?.[0]?.[0]?.transcript || "";

            setListening(false);

            if (heard) {
                askKarigarAI(heard);
            }
        };

        recognitionRef.current = recognition;

        requestVoicePermission().then(ok => {
            if (!ok) {
                speak(
                    language === "English"
                        ? "Please allow microphone access first."
                        : "Pehle microphone permission allow kar do."
                );
                return;
            }

            try {
                recognition.start();
            } catch (_) {}
        });
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            speak(
                role === "artisan"
                    ? language === "English"
                        ? "Hi! I'm Karigar AI. What would you like to work on today?"
                        : "Namaste! Main Karigar AI hoon. Aaj kya karna hai?"
                    : language === "English"
                        ? "Hi! I'm here with you on KalaSutra. What are you looking for?"
                        : "Namaste! Main KalaSutra mein aapke saath hoon. Kya dhoondh rahe ho?"
            );
        }, 700);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        return () => {
            try {
                recognitionRef.current?.stop();
            } catch (_) {}
        };
    }, []);

    if (!open) {
        return React.createElement(
            "button",
            {
                className: "ai-fab",
                onClick: () => setOpen(true),
                "aria-label": "Open Karigar AI"
            },
            React.createElement("img", {
                src: "/assets/avatar-artisan.png",
                alt: "Karigar AI"
            }),
            React.createElement("span", {
                className: "ai-fab-dot"
            })
        );
    }

    return React.createElement(
        "div",
        {
            className:
                "ai-talker ai-talker-compact " +
                (listening ? "ai-is-listening" : "")
        },

        React.createElement(
            "div",
            { className: "ai-talker-head" },

            React.createElement(
                "div",
                { className: "ai-talker-avatar-wrap" },

                React.createElement("img", {
                    src: "/assets/avatar-artisan.png",
                    alt: "Karigar AI"
                }),

                React.createElement("span", {
                    className:
                        "ai-live-dot " +
                        (speaking ? "ai-speaking" : "")
                })
            ),

            React.createElement(
                "div",
                { className: "ai-talker-title" },

                React.createElement(
                    "strong",
                    null,
                    "Karigar AI"
                ),

                React.createElement(
                    "span",
                    null,
                    listening
                        ? "Listening…"
                        : speaking
                            ? "Speaking…"
                            : "I'm here with you"
                )
            ),

            React.createElement(
                "button",
                {
                    className: "ai-close",
                    onClick: () => setOpen(false)
                },
                "×"
            )
        ),

        React.createElement(
            "div",
            { className: "ai-talker-body" },

            React.createElement(
                "div",
                { className: "ai-message" },
                message
            ),

            React.createElement(
                "div",
                {
                    className: "ai-wave",
                    "aria-hidden": "true"
                },

                React.createElement("i"),
                React.createElement("i"),
                React.createElement("i"),
                React.createElement("i"),
                React.createElement("i"),
                React.createElement("i"),
                React.createElement("i")
            ),

            React.createElement(
                "div",
                { className: "ai-talker-actions" },

                React.createElement(
                    "button",
                    {
                        className:
                            "ai-mic " +
                            (listening ? "listening" : ""),
                        onClick: startListening,
                        "aria-label": "Talk to Karigar AI"
                    },
                    listening ? "●" : "🎙️"
                )
            ),

            React.createElement(
                "div",
                { className: "ai-quick-row" },

                role === "artisan"

                    ? React.createElement(
                        React.Fragment,
                        null,

                        React.createElement(
                            "button",
                            {
                                onClick: () => {
                                    speak(
                                        "Chalo, naya product add karte hain. Main step by step guide karunga."
                                    );

                                    if (go) {
                                        go("addProduct");
                                    }
                                }
                            },
                            "Add Product"
                        ),

                        React.createElement(
                            "button",
                            {
                                onClick: () => {
                                    speak(
                                        "Aapke orders khol raha hoon."
                                    );

                                    if (go) {
                                        go("orders");
                                    }
                                }
                            },
                            "My Orders"
                        )
                    )

                    : React.createElement(
                        React.Fragment,
                        null,

                        React.createElement(
                            "button",
                            {
                                onClick: () =>
                                    speak(
                                        "Kis type ka craft dhoondh rahe ho?"
                                    )
                            },
                            "Find a Craft"
                        ),

                        React.createElement(
                            "button",
                            {
                                onClick: () => {
                                    speak("Cart khol raha hoon.");

                                    if (go) {
                                        go("cart");
                                    }
                                }
                            },
                            "Open Cart"
                        )
                    )
            )
        )
    );
}
// AUTH / ONBOARDING SCREENS
// ---------------------------------------------------------------------------
function SplashScreen({ onNext }) {
    return (React.createElement("div", { className: "splash-screen" },
        React.createElement("div", { className: "splash-glow glow-one" }),
        React.createElement("div", { className: "splash-glow glow-two" }),
        React.createElement("div", { className: "walking-artisan", "aria-hidden": "true" },
            React.createElement("span", { className: "craft-spark spark-one" }, "\u2726"),
            React.createElement("span", { className: "craft-spark spark-two" }, "\u2727"),
            React.createElement("img", { src: "/assets/avatar-artisan.png", alt: "" }),
            React.createElement("span", { className: "walking-shadow" })),
        React.createElement("img", { className: "splash-logo", src: "/assets/logo.png", alt: "Kala Sutra" }),
        React.createElement("p", { className: "splash-tagline" }, "Take a photo. Tell your story. AI does the rest."),
        React.createElement("div", { className: "splash-hindi" }, "\u201CNamaste! \u091A\u0932\u093F\u090F \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902\u0964\u201D"),
        React.createElement("div", { className: "splash-cta" },
            React.createElement("button", { className: "btn splash-btn", onClick: onNext },
                "Get Started ",
                React.createElement("span", null, "\u2192")))));
}
function RoleSelectScreen({ name, onPick }) {
    const [menuOpen, setMenuOpen] = useState(false);
    return (React.createElement("div", { className: "role-landing" },
        React.createElement("div", { className: "role-mandala mandala-one" }),
        React.createElement("div", { className: "role-mandala mandala-two" }),
        React.createElement("div", { className: "role-topbar" },
            React.createElement("img", { src: "/assets/logo.png", alt: "Kala Sutra", className: "role-logo" }),
            React.createElement("button", { className: "role-menu", "aria-label": "Open menu", onClick: () => setMenuOpen(v => !v) },
                React.createElement("span", null),
                React.createElement("span", null),
                React.createElement("span", null))),
        menuOpen && (React.createElement("div", { className: "role-menu-panel" },
            React.createElement("strong", null, "KalaSutra"),
            React.createElement("span", null, "Crafting a Better Tomorrow"),
            React.createElement("small", null, "Take a photo. Tell your story. AI does the rest."))),
        React.createElement("div", { className: "role-hero-copy" },
            React.createElement("div", { className: "role-script" },
                "Art",
                React.createElement("br", null),
                React.createElement("b", null, "Lives"),
                React.createElement("br", null),
                "Here \u2661"),
            React.createElement("h1", null,
                "Namaste, ",
                name,
                "! ",
                React.createElement("span", null, "\uD83D\uDE4F")),
            React.createElement("p", null, "How will you use Kala Sutra?")),
        React.createElement("div", { className: "role-options" },
            React.createElement("button", { className: "role-card role-card-premium artisan", onClick: () => onPick("artisan") },
                React.createElement("span", { className: "role-card-icon" },
                    React.createElement(Icon, { name: "add" })),
                React.createElement("span", { className: "role-card-copy" },
                    React.createElement("strong", null, "I'm an Artisan"),
                    React.createElement("em", null, "List your craft, verify it, tell its story in Reels")),
                React.createElement("span", { className: "role-arrow" }, "\u2192")),
            React.createElement("button", { className: "role-card role-card-premium buyer", onClick: () => onPick("buyer") },
                React.createElement("span", { className: "role-card-icon" },
                    React.createElement(Icon, { name: "search" })),
                React.createElement("span", { className: "role-card-copy" },
                    React.createElement("strong", null, "I'm a Buyer"),
                    React.createElement("em", null, "Discover verified handmade pieces, meet the makers")),
                React.createElement("span", { className: "role-arrow" }, "\u2192"))),
        React.createElement("div", { className: "role-bottom-note" },
            React.createElement("span", null, "\u2726 Small Creations \u00B7 Big Stories \u2661"),
            React.createElement("span", null, "Made with respect for every maker."))));
}
function LoginScreen({ onLoggedIn }) {
    const [step, setStep] = useState("contact"); // contact -> otp -> name
    const [contact, setContact] = useState("");
    const [otp, setOtp] = useState("");
    const [name, setName] = useState("");
    const [err, setErr] = useState(null);
    const makeCaptcha = () => Math.random().toString(36).slice(2, 7).toUpperCase().replace(/[O0I1]/g, "X");
    const [captcha, setCaptcha] = useState(makeCaptcha);
    const [captchaInput, setCaptchaInput] = useState("");
    const [humanChecked, setHumanChecked] = useState(false);
    function refreshCaptcha() {
        setCaptcha(makeCaptcha());
        setCaptchaInput("");
        setHumanChecked(false);
        setErr(null);
    }
    return (React.createElement("div", { className: "centered-screen login-screen", style: { justifyContent: "flex-start", paddingTop: 36 } },
        React.createElement("div", { className: "login-art-wrap" },
            React.createElement("img", { src: "/assets/avatar-artisan.png", alt: "KalaSutra artisan" }),
            React.createElement("span", { className: "login-art-glow" })),
        React.createElement("div", { style: { width: "100%", textAlign: "left" } },
            React.createElement("h2", { className: "serif", style: { margin: "0 0 4px" } }, "Welcome"),
            React.createElement("p", { style: { fontSize: 12.5, color: "#5a4f45", marginBottom: 22 } }, "Login to continue to Kala Sutra"),
            React.createElement(ErrorBanner, { message: err }),
            step === "contact" && (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "field" },
                    React.createElement("div", { className: "field-label" }, "Mobile number"),
                    React.createElement("input", { value: contact, onChange: (e) => setContact(e.target.value), placeholder: "Enter 10-digit mobile number" })),
                React.createElement("div", { className: "captcha-card" },
                    React.createElement("div", { className: "captcha-head" },
                        React.createElement("label", { className: "captcha-check" },
                            React.createElement("input", { type: "checkbox", checked: humanChecked, onChange: (e) => { setHumanChecked(e.target.checked); setErr(null); } }),
                            React.createElement("span", { className: "captcha-box" }, humanChecked ? "✓" : ""),
                            React.createElement("span", null, "I'm not a robot")),
                        React.createElement("span", { className: "captcha-mini" }, "SECURE LOGIN")),
                    humanChecked && (React.createElement("div", { className: "captcha-challenge" },
                        React.createElement("div", { className: "captcha-code", "aria-label": "Captcha code" }, captcha),
                        React.createElement("button", { type: "button", className: "captcha-refresh", onClick: refreshCaptcha, "aria-label": "Refresh captcha" }, "\u21BB"),
                        React.createElement("div", { className: "captcha-input-row" },
                            React.createElement("input", { value: captchaInput, onChange: (e) => setCaptchaInput(e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 5)), placeholder: "Enter the code above", maxLength: 5 }),
                            React.createElement("span", { className: captchaInput === captcha ? "captcha-ok" : "captcha-pending" }, captchaInput === captcha ? "✓" : "")))),
                    React.createElement("div", { className: "captcha-note" }, "Quick human verification before OTP")),
                React.createElement("button", { className: "btn", onClick: () => {
                        if (!contact.trim()) {
                            setErr("Please enter your mobile number");
                            return;
                        }
                        if (!humanChecked) {
                            setErr("Please confirm that you are not a robot");
                            return;
                        }
                        if (captchaInput !== captcha) {
                            setErr("Please enter the captcha correctly");
                            return;
                        }
                        setErr(null);
                        setStep("otp");
                    } }, "Send OTP"),
                React.createElement("p", { style: { fontSize: 10.5, color: "#8a7d6e", marginTop: 10 } }, "Demo mode: any 4 digits will work as the OTP \u2014 no real SMS is sent."))),
            step === "otp" && (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "field" },
                    React.createElement("div", { className: "field-label" },
                        "Enter the 4-digit code sent to ",
                        contact),
                    React.createElement("input", { value: otp, maxLength: 4, onChange: (e) => setOtp(e.target.value.replace(/\D/g, "")), placeholder: "\u2022\u2022\u2022\u2022", style: { letterSpacing: 8, fontSize: 20, textAlign: "center" } })),
                React.createElement("button", { className: "btn", onClick: () => {
                        if (otp.length < 4) {
                            setErr("Enter the 4-digit demo code");
                            return;
                        }
                        setErr(null);
                        setStep("name");
                    } }, "Verify & Continue"),
                React.createElement("button", { className: "btn secondary", style: { marginTop: 10 }, onClick: () => setStep("contact") }, "Back"))),
            step === "name" && (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "field" },
                    React.createElement("div", { className: "field-label" }, "What should we call you?"),
                    React.createElement("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "Your full name" })),
                React.createElement("button", { className: "btn", onClick: () => {
                        if (!name.trim()) {
                            setErr("Please enter your name");
                            return;
                        }
                        onLoggedIn(contact, name.trim());
                    } }, "Continue"))))));
}
// ---------------------------------------------------------------------------
// ARTISAN NAV
// ---------------------------------------------------------------------------
function ArtisanNav({ screen, go }) {
    const items = [
        { id: "dashboard", label: "Home", icon: "home" },
        { id: "addProduct", label: "Add", icon: "add" },
        { id: "myReels", label: "Reels", icon: "reels" },
        { id: "orders", label: "Orders", icon: "orders" },
        { id: "profile", label: "Profile", icon: "profile" },
    ];
    return (React.createElement("div", { className: "bottom-nav" }, items.map((it) => (React.createElement("button", { key: it.id, className: `nav-btn ${screen === it.id ? "active" : ""}`, onClick: () => go(it.id) },
        React.createElement(Icon, { name: it.icon }),
        React.createElement("span", null, it.label))))));
}
function ArtisanGrowthHub({ user, featured, products, setToast }) {
    const [open, setOpen] = useState(null);
    const [materialCost, setMaterialCost] = useState("450");
    const [hours, setHours] = useState("6");
    const [hourlyRate, setHourlyRate] = useState("180");
    const [overhead, setOverhead] = useState("150");
    const [capitalNeed, setCapitalNeed] = useState("25000");
    const [materialJoin, setMaterialJoin] = useState({});
    const [designCraft, setDesignCraft] = useState("Pottery");
    const [passportMade, setPassportMade] = useState(false);
    const [lessonSaved, setLessonSaved] = useState({});
    const fairBase = Number(materialCost || 0) + Number(hours || 0) * Number(hourlyRate || 0) + Number(overhead || 0);
    const fairPrice = Math.round(fairBase * 1.20);
    const productTitle = featured?.title || "Your handmade piece";
    const productPrice = Number(featured?.price || fairPrice || 0);
    const modules = [
        { id: "price", icon: "₹", title: "Fair Price AI", problem: "Low margins", desc: "Estimate a fair maker price from real time, material and overhead.", accent: "money" },
        { id: "capital", icon: "◈", title: "Craft Capital", problem: "Limited capital", desc: "Prepare an order-ready funding plan without relying on informal lenders.", accent: "capital" },
        { id: "material", icon: "✦", title: "Material Hub", problem: "Raw material scarcity", desc: "See collective-buy opportunities for silk, clay, wood, dyes and more.", accent: "material" },
        { id: "design", icon: "✺", title: "Design Lab", problem: "Outdated designs", desc: "Turn traditional skills into contemporary, market-ready product directions.", accent: "design" },
        { id: "passport", icon: "▣", title: "Craft Passport", problem: "Factory-copy competition", desc: "Create a traceable identity for the artisan, process and handmade origin.", accent: "passport" },
        { id: "market", icon: "↗", title: "Direct Market Match", problem: "Middlemen & isolation", desc: "Match your craft with buyer needs so demand can reach the maker directly.", accent: "market" },
        { id: "gurukul", icon: "⌘", title: "Craft Gurukul", problem: "Youth brain drain", desc: "Preserve techniques and pass practical craft knowledge to the next generation.", accent: "gurukul" },
    ];
    const materials = [
        ["Natural dyes", "18 artisans", "62% funded"],
        ["Terracotta clay", "31 artisans", "78% funded"],
        ["Eri silk yarn", "12 artisans", "45% funded"]
    ];
    const designs = {
        Pottery: ["Stackable serving set for modern kitchens", "Minimal terracotta planter with regional motif", "Giftable chai + snack set with artisan story"],
        Weaving: ["Lightweight everyday stole with heritage border", "Contemporary cushion series using traditional weave", "Small-batch table runner for premium homes"],
        Woodcraft: ["Modular desk organiser with local carving", "Modern wall accent with traditional geometry", "Compact gifting box with maker mark"],
        "Metal Craft": ["Minimal statement diya set", "Modern table centrepiece with traditional form", "Collector's mini decor series"]
    };
    const demand = [
        ["Boutique home stores", "Pottery & tableware", "92% match"],
        ["Conscious gifting brands", "Small handcrafted sets", "86% match"],
        ["Hotels & cafés", "Regional decor pieces", "79% match"]
    ];
    const lessons = [
        ["01", "Record a technique", "Capture one signature step before it is lost."],
        ["02", "Teach a family member", "Create a simple repeatable learning lesson."],
        ["03", "Build a craft archive", "Save stories, tools and process notes with each piece."]
    ];
    function toggle(id) { setOpen(open === id ? null : id); }
    return React.createElement("section", { className: "artisan-growth-hub" },
        React.createElement("div", { className: "growth-hub-heading" },
            React.createElement("div", null,
                React.createElement("span", { className: "field-label" }, "KALASUTRA \u2022 ARTISAN IMPACT HUB"),
                React.createElement("h3", null, "We solve the system around the artisan."),
                React.createElement("p", null, "Not just a storefront \u2014 tools for fair pricing, materials, capital, demand and craft legacy.")),
            React.createElement("span", { className: "growth-hub-pill" }, "7 challenges \u2192 7 solutions")),
        React.createElement("div", { className: "problem-solution-strip" },
            React.createElement("span", null, "Middlemen \u2192 Direct market"),
            React.createElement("span", null, "Low margins \u2192 Fair price"),
            React.createElement("span", null, "Raw materials \u2192 Collective buy"),
            React.createElement("span", null, "Youth loss \u2192 Craft Gurukul")),
        React.createElement("div", { className: "growth-module-grid" }, modules.map(m => React.createElement("button", { key: m.id, className: `growth-module-card ${m.accent} ${open === m.id ? 'open' : ''}`, onClick: () => toggle(m.id) },
            React.createElement("span", { className: "growth-module-icon" }, m.icon),
            React.createElement("span", { className: "growth-module-copy" },
                React.createElement("small", null, m.problem),
                React.createElement("strong", null, m.title),
                React.createElement("em", null, m.desc)),
            React.createElement("span", { className: "growth-module-arrow" }, open === m.id ? '⌃' : '→')))),
        open === "price" && React.createElement("div", { className: "growth-module-panel" },
            React.createElement("div", { className: "panel-kicker" }, "FAIR PRICE AI"),
            React.createElement("h4", null, "Price the craft, not just the material."),
            React.createElement("div", { className: "growth-form-grid" },
                React.createElement("label", null,
                    "Material cost \u20B9",
                    React.createElement("input", { value: materialCost, onChange: e => setMaterialCost(e.target.value.replace(/\D/g, "")) })),
                React.createElement("label", null,
                    "Making hours",
                    React.createElement("input", { value: hours, onChange: e => setHours(e.target.value.replace(/\D/g, "")) })),
                React.createElement("label", null,
                    "Fair hourly rate \u20B9",
                    React.createElement("input", { value: hourlyRate, onChange: e => setHourlyRate(e.target.value.replace(/\D/g, "")) })),
                React.createElement("label", null,
                    "Overhead \u20B9",
                    React.createElement("input", { value: overhead, onChange: e => setOverhead(e.target.value.replace(/\D/g, "")) }))),
            React.createElement("div", { className: "growth-result-card" },
                React.createElement("span", null, "Suggested fair maker price"),
                React.createElement("strong", null,
                    "\u20B9",
                    fairPrice.toLocaleString("en-IN")),
                React.createElement("small", null, "Includes a 20% craft-value buffer over direct cost. Use it as a planning benchmark.")),
            React.createElement("button", { className: "growth-action", onClick: () => setToast(`Fair price benchmark saved: ₹${fairPrice.toLocaleString("en-IN")}`) }, "Use this price benchmark \u2192")),
        open === "capital" && React.createElement("div", { className: "growth-module-panel" },
            React.createElement("div", { className: "panel-kicker" }, "CRAFT CAPITAL"),
            React.createElement("h4", null, "Prepare for the next order."),
            React.createElement("p", { className: "panel-copy" }, "Build a simple working-capital plan for materials and production. KalaSutra does not promise or issue a loan here."),
            React.createElement("label", { className: "wide-field" },
                "Working capital needed \u20B9",
                React.createElement("input", { value: capitalNeed, onChange: e => setCapitalNeed(e.target.value.replace(/\D/g, "")) })),
            React.createElement("div", { className: "capital-readiness" },
                React.createElement("span", null,
                    "Order readiness ",
                    React.createElement("b", null, "78%")),
                React.createElement("div", null,
                    React.createElement("i", { style: { width: "78%" } })),
                React.createElement("small", null, "Strong product proof + artisan profile + verified craft can improve finance-readiness.")),
            React.createElement("button", { className: "growth-action", onClick: () => setToast(`Capital plan prepared for ₹${Number(capitalNeed || 0).toLocaleString("en-IN")}`) }, "Prepare capital plan \u2192")),
        open === "material" && React.createElement("div", { className: "growth-module-panel" },
            React.createElement("div", { className: "panel-kicker" }, "MATERIAL HUB"),
            React.createElement("h4", null, "Buy better together."),
            React.createElement("p", { className: "panel-copy" }, "Collective demand can make quality raw materials more accessible to rural makers."),
            React.createElement("div", { className: "material-list" }, materials.map(([name, people, progress]) => React.createElement("div", { className: "material-row", key: name },
                React.createElement("div", null,
                    React.createElement("strong", null, name),
                    React.createElement("small", null,
                        people,
                        " already interested")),
                React.createElement("span", null, progress),
                React.createElement("button", { onClick: () => setMaterialJoin(p => ({ ...p, [name]: !p[name] })) }, materialJoin[name] ? "Joined ✓" : "Join"))))),
        open === "design" && React.createElement("div", { className: "growth-module-panel" },
            React.createElement("div", { className: "panel-kicker" }, "DESIGN LAB"),
            React.createElement("h4", null, "Keep the tradition. Refresh the use."),
            React.createElement("div", { className: "design-tabs" }, Object.keys(designs).map(c => React.createElement("button", { key: c, className: designCraft === c ? "active" : "", onClick: () => setDesignCraft(c) }, c))),
            React.createElement("div", { className: "design-suggestions" }, designs[designCraft].map((d, i) => React.createElement("div", { key: d },
                React.createElement("span", null,
                    "0",
                    i + 1),
                React.createElement("strong", null, d),
                React.createElement("small", null,
                    "Built around your existing ",
                    designCraft.toLowerCase(),
                    " skill.")))),
            React.createElement("button", { className: "growth-action", onClick: () => setToast(`${designCraft} design directions saved for your next collection`) }, "Save collection ideas \u2192")),
        open === "passport" && React.createElement("div", { className: "growth-module-panel" },
            React.createElement("div", { className: "panel-kicker" }, "CRAFT PASSPORT"),
            React.createElement("h4", null, "Give every piece a traceable story."),
            React.createElement("div", { className: "passport-mini" },
                React.createElement("div", { className: "passport-code" }, passportMade ? "KS✓" : "KS"),
                React.createElement("div", null,
                    React.createElement("small", null, "KALASUTRA CRAFT PASSPORT"),
                    React.createElement("strong", null, productTitle),
                    React.createElement("span", null,
                        user.name,
                        " \u2022 ",
                        featured?.category || "Traditional craft",
                        " \u2022 ",
                        featured?.region || "India"))),
            React.createElement("div", { className: "passport-points" },
                React.createElement("span", null, "\u2713 Artisan identity"),
                React.createElement("span", null, "\u2713 Material & origin"),
                React.createElement("span", null, "\u2713 Making process"),
                React.createElement("span", null, "\u2713 Verification status")),
            React.createElement("button", { className: "growth-action", onClick: () => { setPassportMade(true); setToast("Digital Craft Passport prepared for this piece"); } }, "Generate Craft Passport \u2192")),
        open === "market" && React.createElement("div", { className: "growth-module-panel" },
            React.createElement("div", { className: "panel-kicker" }, "DIRECT MARKET MATCH"),
            React.createElement("h4", null, "Find buyers who need your craft."),
            React.createElement("div", { className: "demand-list" }, demand.map(([who, need, match]) => React.createElement("div", { className: "demand-row", key: who },
                React.createElement("div", null,
                    React.createElement("strong", null, who),
                    React.createElement("small", null, need)),
                React.createElement("b", null, match),
                React.createElement("button", { onClick: () => setToast(`Interest signal sent to ${who}`) }, "Match")))),
            React.createElement("div", { className: "panel-note" }, "Buyer matches are presented as prototype demand signals; no buyer commitment is implied until an order is confirmed.")),
        open === "gurukul" && React.createElement("div", { className: "growth-module-panel" },
            React.createElement("div", { className: "panel-kicker" }, "CRAFT GURUKUL"),
            React.createElement("h4", null, "Make your knowledge outlive you."),
            React.createElement("div", { className: "lesson-list" }, lessons.map(([n, title, desc]) => React.createElement("div", { className: "lesson-row", key: n },
                React.createElement("span", null, n),
                React.createElement("div", null,
                    React.createElement("strong", null, title),
                    React.createElement("small", null, desc)),
                React.createElement("button", { onClick: () => setLessonSaved(p => ({ ...p, [n]: !p[n] })) }, lessonSaved[n] ? "Saved ✓" : "Start")))),
            React.createElement("button", { className: "growth-action", onClick: () => setToast("Your craft legacy workspace is ready") }, "Open craft legacy \u2192")));
}
// ---------------------------------------------------------------------------
// ARTISAN: DASHBOARD
// ---------------------------------------------------------------------------
function ArtisanDashboard({ user, go, setToast }) {
    const [products, setProducts] = useState([]);
    const [err, setErr] = useState(null);
    useEffect(() => {
        apiGet(`/products`).then((all) => {
            const mine = all.filter((p) => p.artisanId === user.id);
            // Keep the demo storefront populated with the featured real cane product.
            setProducts(mine.length ? mine : all.filter((p) => p.id === "p5"));
        }).catch((e) => setErr(e.message));
    }, [user.id]);
    const verifiedCount = products.filter((p) => p.verificationStatus === "verified").length;
    const featured = products[0];
    return (React.createElement("div", { className: "artisan-home" },
        React.createElement("div", { className: "artisan-topbar" },
            React.createElement("img", { className: "artisan-logo", src: "/assets/logo.png", alt: "Kala Sutra" }),
            React.createElement("div", { className: "art-lives" },
                "Art",
                React.createElement("br", null),
                "Lives",
                React.createElement("br", null),
                "Here \u2661"),
            React.createElement("button", { className: "menu-circle", "aria-label": "Menu" }, "\u2630")),
        React.createElement("div", { className: "artisan-greeting" },
            React.createElement("div", null,
                React.createElement("h2", null,
                    "Hello, ",
                    user.name,
                    " ",
                    React.createElement("span", null, "\uD83D\uDE4F")),
                React.createElement("div", { className: "sub" }, "Your artisan journey is live \u2728")),
            React.createElement("button", { className: "home-switch", onClick: () => {
                    const next = user.role === "artisan" ? "buyer" : "artisan";
                    apiPost("/users", { name: user.name, contact: "demo", role: next }).then((u) => { window.location.reload(); });
                } }, "\u21C4 Switch to Buyer")),
        React.createElement("div", { className: "content artisan-content" },
            React.createElement(ErrorBanner, { message: err }),
            React.createElement("div", { className: "home-stats" },
                React.createElement("div", null,
                    React.createElement("span", { className: "stat-icon pot" }, "\u25B1"),
                    React.createElement("strong", null, products.length),
                    React.createElement("small", null, "Products Listed")),
                React.createElement("div", null,
                    React.createElement("span", { className: "stat-icon check" }, "\u2713"),
                    React.createElement("strong", null, verifiedCount),
                    React.createElement("small", null, "Verified")),
                React.createElement("div", null,
                    React.createElement("span", { className: "stat-icon star" }, "\u2605"),
                    React.createElement("strong", null, user.profile?.trustScore ?? 100),
                    React.createElement("small", null, "Trust score"))),
            React.createElement("div", { className: "artisan-growth-card", onClick: () => go('orders') },
                React.createElement("div", null,
                    React.createElement("span", { className: "field-label" }, "ARTISAN GROWTH DASHBOARD"),
                    React.createElement("strong", null, "Orders, earnings & business insights"),
                    React.createElement("small", null, "Track New Orders \u2192 Processing \u2192 Shipped \u2192 Delivered")),
                React.createElement("button", { className: "btn secondary", style: { marginTop: 10 }, onClick: () => go("reviews") }, "\uD83D\uDEE1\uFE0F Safety & Review Center"),
                React.createElement("span", { className: "growth-arrow" }, "\u2192")),
            React.createElement(ArtisanGrowthHub, { user: user, featured: featured, products: products, setToast: setToast }),
            React.createElement("div", { className: "section-row home-section-row" },
                React.createElement("div", { className: "section-title" }, "Your craft, on the grid"),
                React.createElement("span", { className: "view-all", onClick: () => go("myProducts") }, "View all \u2192")),
            products.length ? (React.createElement("div", { className: "home-products-grid" }, products.slice(0, 4).map((p) => (React.createElement("div", { key: p.id, className: "home-product-card", onClick: () => go("product", p.id) },
                React.createElement("div", { className: "home-product-image", style: { backgroundImage: `url(${p.image})` } },
                    React.createElement("span", { className: "featured-badge" }, "\u25CF Verified Handmade")),
                React.createElement("div", { className: "home-product-info" },
                    React.createElement("strong", null, p.title),
                    React.createElement("div", { className: "home-product-bottom" },
                        React.createElement("span", { className: "featured-price" },
                            "\u20B9",
                            Number(p.price).toLocaleString("en-IN")),
                        React.createElement("button", { onClick: (e) => { e.stopPropagation(); setToast("Product is ready on your storefront"); } }, "\uFF0B Cart")))))))) : (React.createElement("div", { className: "craft-empty" },
                React.createElement("div", { className: "plus-circle" }, "\uFF0B"),
                React.createElement("strong", null, "You haven\u2019t added any products yet."),
                React.createElement("span", null, "Tap \u201CAdd\u201D below to list your first piece."))),
            React.createElement(AITalker, { embedded: true, role: "artisan", go: go }))));
}
// ---------------------------------------------------------------------------
// CONSISTENT ARTISAN IDENTITY — shared visual across buyer/product/add/reel
// ---------------------------------------------------------------------------
function ArtisanIdentityChip({ artisan, user, compact = false, tone = "light" }) {
    const id = artisan?.id || user?.id || "default";
    let stored = null;
    try { stored = localStorage.getItem(`kalasutra_avatar_${id}`); } catch (_) {}
    const avatar = stored || artisan?.profile?.avatar || artisan?.profile?.photo || user?.profile?.avatar || user?.profile?.photo || "/assets/avatar-artisan.png";
    const name = artisan?.name || user?.name || "KalaSutra Artisan";
    const location = artisan?.profile?.location || user?.profile?.location || "Jaipur, Rajasthan";
    return React.createElement("div", { className: `artisan-identity-chip ${compact ? "compact" : ""} ${tone}` },
        React.createElement("img", { src: avatar, alt: name }),
        React.createElement("div", { className: "artisan-identity-copy" },
            React.createElement("strong", null, name),
            React.createElement("span", null, location),
            !compact && React.createElement("small", null, "✓ Verified Artisan")),
        compact && React.createElement("span", { className: "artisan-identity-check" }, "✓")
    );
}

// ---------------------------------------------------------------------------
// ARTISAN: ADD PRODUCT  →  SCAN/VERIFY
// ---------------------------------------------------------------------------
function AddProductScreen({ user, go, setToast, setLastVerifiedProductId }) {
    const [step, setStepState] = useState("form");
    const [title, setTitle] = useState("");
    const [story, setStory] = useState("");
    const [englishDescription, setEnglishDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("Pottery");
    const [material, setMaterial] = useState("");
    const [region, setRegion] = useState("");
    const [storyLang, setStoryLang] = useState("hi-IN");
    const [galleryImages, setGalleryImages] = useState([]);
    const [imageDataUrl, setImageDataUrl] = useState(null);
    const [proofVideo, setProofVideo] = useState(null);
    const [recording, setRecording] = useState(false);
    const [storyRecording, setStoryRecording] = useState(false);
    const [err, setErr] = useState(null);
    const [product, setProduct] = useState(null);
    const [verifyResult, setVerifyResult] = useState(null);
    const proofRecorderRef = useRef(null);
    const proofStreamRef = useRef(null);
    const proofChunksRef = useRef([]);
    const storyRecognitionRef = useRef(null);
    async function handleImagePick(e) {
        const files = Array.from(e.target.files || []);
        if (!files.length)
            return;
        try {
            const urls = await Promise.all(files.slice(0, 6).map(fileToDataURL));
            setGalleryImages(prev => [...prev, ...urls].slice(0, 6));
            setImageDataUrl(prev => prev || urls[0]);
            setErr(null);
        }
        catch {
            setErr("Couldn't read that image — please try another file.");
        }
        e.target.value = "";
    }
    function removeImage(index) {
        setGalleryImages(prev => {
            const next = prev.filter((_, i) => i !== index);
            setImageDataUrl(next[0] || null);
            return next;
        });
    }
    function generateEnglishDescription(transcript) {
        const clean = transcript.trim();
        if (!clean)
            return;
        const titleGuess = clean.split(/\s+/).slice(0, 5).join(" ");
        if (!title.trim())
            setTitle(`${category} — ${titleGuess}`.slice(0, 70));
        setEnglishDescription(`Handcrafted ${category.toLowerCase()} created by an artisan. Story shared in ${storyLang === "hi-IN" ? "Hindi" : storyLang === "mr-IN" ? "Marathi" : storyLang === "ta-IN" ? "Tamil" : storyLang === "bn-IN" ? "Bangla" : "the artisan's language"}: “${clean}”. KalaSutra AI has prepared this English listing draft for buyers.`);
    }
    function startStoryRecording() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            setErr("Voice story is not supported in this browser. Please use Chrome on the phone/laptop.");
            return;
        }
        try {
            const rec = new SR();
            rec.lang = storyLang;
            rec.interimResults = false;
            rec.continuous = false;
            rec.maxAlternatives = 1;
            rec.onstart = () => { setStoryRecording(true); setErr(null); };
            rec.onend = () => setStoryRecording(false);
            rec.onerror = () => { setStoryRecording(false); setErr("I couldn't hear the story. Please try again."); };
            rec.onresult = (event) => {
                const heard = event.results?.[0]?.[0]?.transcript || "";
                if (heard) {
                    setStory(heard);
                    generateEnglishDescription(heard);
                }
            };
            storyRecognitionRef.current = rec;
            rec.start();
        }
        catch (e) {
            setErr(e.message || "Voice story could not start.");
        }
    }
    function stopStoryRecording() { try {
        storyRecognitionRef.current?.stop();
    }
    catch (_) { } setStoryRecording(false); }
    async function startProofRecording() {
        setErr(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            proofStreamRef.current = stream;
            proofChunksRef.current = [];
            const recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (e) => { if (e.data.size > 0)
                proofChunksRef.current.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(proofChunksRef.current, { type: "video/webm" });
                const reader = new FileReader();
                reader.onload = () => setProofVideo(reader.result);
                reader.readAsDataURL(blob);
                stream.getTracks().forEach((t) => t.stop());
            };
            recorder.start();
            proofRecorderRef.current = recorder;
            setRecording(true);
            setTimeout(() => { if (proofRecorderRef.current?.state === "recording")
                proofRecorderRef.current.stop(); setRecording(false); }, 5000);
        }
        catch (e) {
            setErr("Camera/microphone permission is needed for the 5-second making-proof clip. " + e.message);
        }
    }
    function stopProofRecording() { if (proofRecorderRef.current?.state === "recording")
        proofRecorderRef.current.stop(); proofStreamRef.current?.getTracks().forEach((t) => t.stop()); setRecording(false); }
    async function handleProofUpload(e) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        try {
            setProofVideo(await fileToDataURL(file));
            setErr(null);
        }
        catch {
            setErr("Couldn't read that video. Please try another clip.");
        }
        e.target.value = "";
    }
    async function handleCreateAndScan() {
        if (!imageDataUrl) {
            setErr("First upload/take a photo of the piece.");
            return;
        }
        if (!story.trim()) {
            setErr("Please tell your craft story by voice before verification.");
            return;
        }
        if (!price || !/^\d+(\.\d{1,2})?$/.test(price)) {
            setErr("Please enter a valid price in ₹.");
            return;
        }
        if (!proofVideo) {
            setErr("The 5-second making-proof video is required before verification.");
            return;
        }
        setErr(null);
        try {
            const finalTitle = title.trim() || `${category} Handmade Piece`;
            const finalDescription = englishDescription || `Handcrafted ${category.toLowerCase()} made by a traditional artisan. Story: “${story.trim()}”.`;
            const created = await apiPost("/products", {
                artisanId: user.id, title: finalTitle, description: finalDescription, price: price,
                category, image: imageDataUrl, craftInfo: { material, region, storyLanguage: storyLang, originalStory: story, verificationProof: proofVideo, gallery: galleryImages },
            });
            setProduct(created);
            setStepState("scanning");
            await new Promise((r) => setTimeout(r, 900));
            const result = await apiPost("/scan", { productId: created.id });
            const safety = await apiPost("/risk", { productId: created.id });
            result.riskScore = safety.riskScore;
            result.riskLevel = safety.level;
            result.riskReasons = safety.reasons;
            setVerifyResult(result);
            await new Promise((r) => setTimeout(r, 700));
            setStepState("result");
            setLastVerifiedProductId(created.id);
            saveRecentProduct(user.id, created.id);
        }
        catch (e) {
            setErr(e.message || "Verification failed.");
        }
    }
    useEffect(() => () => { try {
        storyRecognitionRef.current?.stop();
    }
    catch (_) { } proofStreamRef.current?.getTracks().forEach((t) => t.stop()); }, []);
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "addpiece-page" },
            React.createElement("header", { className: "addpiece-topbar" },
                React.createElement("button", { className: "addpiece-back", onClick: () => go("dashboard"), "aria-label": "Back" }, "\u2039"),
                React.createElement("img", { src: "/assets/logo.png", className: "addpiece-logo", alt: "KalaSutra" }),
                React.createElement("button", { className: "addpiece-switch", onClick: () => go("buyerHome") }, "Switch to Buyer")),
            React.createElement("div", { className: "addpiece-content" },
                React.createElement(ArtisanIdentityChip, { user: user, tone: "addpiece-identity" }),
                React.createElement(ErrorBanner, { message: err }),
                step === "form" && React.createElement(React.Fragment, null,
                    React.createElement("section", { className: "addpiece-heading" },
                        React.createElement("span", { className: "addpiece-eyebrow" }, "FOR ARTISANS"),
                        React.createElement("h1", null, "Add a New Piece"),
                        React.createElement("p", null,
                            "Take a photo. Tell your story. ",
                            React.createElement("b", null, "AI does the rest."))),
                    React.createElement("div", { className: "addpiece-steps" },
                        React.createElement("div", { className: "active" },
                            React.createElement("span", null, "1"),
                            React.createElement("b", null, "Capture")),
                        React.createElement("i", null),
                        React.createElement("div", null,
                            React.createElement("span", null, "2"),
                            React.createElement("b", null, "Add Details")),
                        React.createElement("i", null),
                        React.createElement("div", null,
                            React.createElement("span", null, "3"),
                            React.createElement("b", null, "Verify")),
                        React.createElement("i", null),
                        React.createElement("div", null,
                            React.createElement("span", null, "4"),
                            React.createElement("b", null, "Publish"))),
                    React.createElement("section", { className: "addpiece-card capture-card" },
                        React.createElement("div", { className: "addpiece-section-head" },
                            React.createElement("div", null,
                                React.createElement("span", { className: "addpiece-num" }, "01"),
                                React.createElement("div", null,
                                    React.createElement("h2", null, "Show us your piece"),
                                    React.createElement("p", null, "Upload clear photos and a short making proof."))),
                            React.createElement("span", null, "\uD83D\uDCF7")),
                        React.createElement("div", { className: "photo-grid" },
                            galleryImages.map((src, i) => React.createElement("div", { className: "photo-tile", key: i },
                                React.createElement("img", { src: src, alt: `Piece ${i + 1}` }),
                                React.createElement("button", { onClick: () => removeImage(i), "aria-label": "Remove photo" }, "\u00D7"))),
                            galleryImages.length < 6 && React.createElement("div", { className: "photo-add photo-add-choice" },
                                React.createElement("span", null, "\uFF0B"),
                                React.createElement("b", null, "Add Photos"),
                                React.createElement("small", null,
                                    galleryImages.length,
                                    "/6 added"),
                                React.createElement("div", { className: "media-choice-row" },
                                    React.createElement("label", null,
                                        React.createElement("input", { type: "file", accept: "image/*", capture: "environment", multiple: true, onChange: handleImagePick }),
                                        "\uD83D\uDCF7 Camera"),
                                    React.createElement("label", null,
                                        React.createElement("input", { type: "file", accept: "image/*", multiple: true, onChange: handleImagePick }),
                                        "\uD83D\uDDBC Gallery"))),
                            React.createElement("div", { className: "proof-upload-tile proof-upload-choice" },
                                React.createElement("span", null, "\uD83C\uDFA5"),
                                React.createElement("b", null, proofVideo ? "Proof Added" : "Making Video"),
                                React.createElement("small", null, proofVideo ? "Replace or record again" : "Upload or record 5-sec proof"),
                                React.createElement("div", { className: "media-choice-row" },
                                    React.createElement("label", null,
                                        React.createElement("input", { type: "file", accept: "video/*", capture: "environment", onChange: handleProofUpload }),
                                        "\uD83D\uDCF9 Record"),
                                    React.createElement("label", null,
                                        React.createElement("input", { type: "file", accept: "video/*", onChange: handleProofUpload }),
                                        "\uD83C\uDF9E Gallery")))),
                        proofVideo && React.createElement("video", { src: proofVideo, controls: true, className: "proof-preview" }),
                        React.createElement("div", { className: "capture-actions" },
                            React.createElement("button", { className: `record-proof-btn ${recording ? "recording" : ""}`, onClick: recording ? stopProofRecording : startProofRecording }, recording ? "⏹ Recording… auto-stops in 5s" : "🔴 Record 5-sec Making Proof"))),
                    React.createElement("section", { className: "addpiece-card story-card-new" },
                        React.createElement("div", { className: "addpiece-section-head" },
                            React.createElement("div", null,
                                React.createElement("span", { className: "addpiece-num" }, "02"),
                                React.createElement("div", null,
                                    React.createElement("h2", null, "Tell Your Story"),
                                    React.createElement("p", null, "Voice first \u2014 speak naturally in your language."))),
                            React.createElement("span", null, "\uD83C\uDF99\uFE0F")),
                        React.createElement("div", { className: "story-controls" },
                            React.createElement("select", { value: storyLang, onChange: (e) => setStoryLang(e.target.value) },
                                React.createElement("option", { value: "hi-IN" }, "Hindi"),
                                React.createElement("option", { value: "mr-IN" }, "Marathi"),
                                React.createElement("option", { value: "ta-IN" }, "Tamil"),
                                React.createElement("option", { value: "bn-IN" }, "Bangla"),
                                React.createElement("option", { value: "en-IN" }, "English")),
                            React.createElement("button", { className: `story-big-mic ${storyRecording ? "recording" : ""}`, onClick: storyRecording ? stopStoryRecording : startStoryRecording }, storyRecording ? "■ Stop listening" : "🎙 Start speaking")),
                        React.createElement("textarea", { className: "story-box-new", value: story, onChange: (e) => setStory(e.target.value), placeholder: "Or type your story here\u2026" }),
                        englishDescription && React.createElement("div", { className: "ai-draft-new" },
                            React.createElement("b", null, "\u2728 AI buyer description"),
                            React.createElement("span", null, englishDescription))),
                    React.createElement("section", { className: "addpiece-card details-card-new" },
                        React.createElement("div", { className: "addpiece-section-head" },
                            React.createElement("div", null,
                                React.createElement("span", { className: "addpiece-num" }, "03"),
                                React.createElement("div", null,
                                    React.createElement("h2", null, "Product Details"),
                                    React.createElement("p", null, "Simple details help buyers discover your craft."))),
                            React.createElement("span", null, "\uD83E\uDDF5")),
                        React.createElement("div", { className: "detail-grid-new" },
                            React.createElement("label", null,
                                "Product Name",
                                React.createElement("input", { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "e.g. Blue Pottery Vase" })),
                            React.createElement("label", null,
                                "Category",
                                React.createElement("select", { value: category, onChange: (e) => setCategory(e.target.value) }, Object.keys(CATEGORY_EMOJI).map(c => React.createElement("option", { key: c }, c)))),
                            React.createElement("label", null,
                                "Price (\u20B9)",
                                React.createElement("input", { value: price, onChange: (e) => setPrice(e.target.value.replace(/[^0-9.]/g, "")), placeholder: "2000", inputMode: "decimal" })),
                            React.createElement("label", null,
                                "Material",
                                React.createElement("input", { value: material, onChange: (e) => setMaterial(e.target.value), placeholder: "Terracotta clay" })),
                            React.createElement("label", null,
                                "Region",
                                React.createElement("input", { value: region, onChange: (e) => setRegion(e.target.value), placeholder: "Rajasthan" })),
                            React.createElement("label", null,
                                "Tags",
                                React.createElement("input", { placeholder: "Handmade, traditional, sustainable" })))),
                    React.createElement("section", { className: "addpiece-card verification-card-new" },
                        React.createElement("div", { className: "addpiece-section-head" },
                            React.createElement("div", null,
                                React.createElement("span", { className: "addpiece-num" }, "04"),
                                React.createElement("div", null,
                                    React.createElement("h2", null, "Verification"),
                                    React.createElement("p", null, "Your piece is checked before it goes live."))),
                            React.createElement("span", null, "\uD83D\uDEE1\uFE0F")),
                        React.createElement("div", { className: "verification-points" },
                            React.createElement("span", null, "\u2713"),
                            React.createElement("div", null,
                                React.createElement("b", null, "Authenticity & safety check"),
                                React.createElement("small", null, "Photo + making proof + craft story are reviewed by KalaSutra's verification flow."))),
                        React.createElement("div", { className: "verification-points" },
                            React.createElement("span", null, "\u2713"),
                            React.createElement("div", null,
                                React.createElement("b", null, "Your price stays yours"),
                                React.createElement("small", null, "No middleman markup is added to your artisan listing.")))),
                    React.createElement("button", { className: "addpiece-main-btn", onClick: handleCreateAndScan },
                        "Add Piece & Start Verification ",
                        React.createElement("span", null, "\u2192"))),
                step === "scanning" && React.createElement("div", { className: "addpiece-result-wrap" },
                    React.createElement("span", { className: "demo-tag" }, "Demo verification"),
                    React.createElement("div", { className: "section-title" }, "\uD83D\uDEE1\uFE0F Authenticity Check Running"),
                    React.createElement("div", { className: "verify-row" },
                        React.createElement("div", { className: "verify-icon pending" }, "\u23F3"),
                        React.createElement("div", null,
                            React.createElement("div", { className: "verify-title" }, "Micro-Texture + Image Analysis"),
                            React.createElement("div", { className: "verify-note" }, "Checking the uploaded piece and making-proof clip\u2026"))),
                    React.createElement("div", { className: "verify-row" },
                        React.createElement("div", { className: "verify-icon pending" }, "\u23F3"),
                        React.createElement("div", null,
                            React.createElement("div", { className: "verify-title" }, "Making-Process Proof"),
                            React.createElement("div", { className: "verify-note" }, "Confirming that proof was supplied before listing."))),
                    React.createElement("div", { className: "verify-row" },
                        React.createElement("div", { className: "verify-icon pending" }, "\u23F3"),
                        React.createElement("div", null,
                            React.createElement("div", { className: "verify-title" }, "Authenticity Decision"),
                            React.createElement("div", { className: "verify-note" }, "Generating a confidence score.")))),
                step === "result" && verifyResult && React.createElement("div", { className: "addpiece-result-wrap" },
                    React.createElement("span", { className: "demo-tag" }, "Demo verification"),
                    React.createElement("div", { className: `badge-result ${verifyResult.status}` },
                        React.createElement("div", { className: "big" }, verifyResult.status === "verified" ? "🟢 Verified Handmade" : verifyResult.status === "needs_review" ? "🟡 Needs Verification" : "🔴 Not Eligible"),
                        React.createElement("div", { className: "small" },
                            "Confidence score: ",
                            (verifyResult.confidence * 100).toFixed(0),
                            "%")),
                    React.createElement("div", { className: "section-title" },
                        "Listing saved \u2022 Price locked at \u20B9",
                        Number(price).toLocaleString("en-IN")),
                    React.createElement("div", { className: "card" },
                        React.createElement("div", { className: "thumb", style: { backgroundImage: `url(${product.image})` } },
                            React.createElement(BadgeLabel, { status: verifyResult.status })),
                        React.createElement("div", { className: "info" },
                            React.createElement("div", { className: "t" }, product.title),
                            React.createElement("div", { className: "p" },
                                "\u20B9",
                                Number(product.price).toLocaleString("en-IN")))))),
            React.createElement("div", { className: "addpiece-bottom-actions" },
                step === "result" && verifyResult?.status !== "rejected" && React.createElement("button", { className: "btn green", onClick: () => go("createReel") }, "Create a Reel for this product"),
                step === "result" && React.createElement("button", { className: "btn secondary", onClick: () => { setToast("Saved to your products"); go("myProducts"); } }, "My Products")))));
}
// ---------------------------------------------------------------------------
// ARTISAN: MY PRODUCTS
// ---------------------------------------------------------------------------
function MyProductsScreen({ user, go }) {
    const [products, setProducts] = useState([]);
    useEffect(() => { apiGet(`/products`).then((all) => setProducts(all.filter((p) => p.artisanId === user.id))); }, []);
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "app-header" },
            React.createElement("button", { className: "header-back", onClick: () => go('dashboard'), "aria-label": "Back" }, "\u2039"),
            React.createElement("div", null,
                React.createElement("h2", null, "My Products"),
                React.createElement("div", { className: "sub" },
                    products.length,
                    " listed"))),
        React.createElement("div", { className: "content" }, products.length === 0 ? React.createElement("div", { className: "empty-note" }, "No products yet.") : (React.createElement("div", { className: "grid" }, products.map((p) => (React.createElement("div", { key: p.id, className: "card" },
            React.createElement("div", { className: "thumb", style: { backgroundImage: `url(${p.image})` } },
                React.createElement(BadgeLabel, { status: p.verificationStatus }),
                React.createElement("span", { className: "emoji" }, CATEGORY_EMOJI[p.category] || "🎨")),
            React.createElement("div", { className: "info" },
                React.createElement("div", { className: "t" }, p.title),
                React.createElement("div", { className: "p" },
                    "\u20B9",
                    p.price.toLocaleString("en-IN")),
                React.createElement("div", { className: "product-id-mini" }, p.uniqueProductId || 'KS-ART-000001'))))))))));
}
// ---------------------------------------------------------------------------
// ARTISAN: CREATE REEL  (record via camera OR upload from gallery)
// ---------------------------------------------------------------------------
function CreateReelScreen({ user, go, setToast, prefillProductId }) {
    const [products, setProducts] = useState([]), [productId, setProductId] = useState(prefillProductId || ""), [caption, setCaption] = useState(""), [category, setCategory] = useState("Pottery"), [tags, setTags] = useState("");
    const [videoDataUrl, setVideoDataUrl] = useState(null), [photoDataUrl, setPhotoDataUrl] = useState(null), [mode, setMode] = useState('video'), [recording, setRecording] = useState(false), [facing, setFacing] = useState('environment');
    const [err, setErr] = useState(null), [cameraReady, setCameraReady] = useState(false), [timer, setTimer] = useState(0), [speed, setSpeed] = useState(1), [filter, setFilter] = useState('none'), [beautify, setBeautify] = useState(false), [music, setMusic] = useState(null), [musicName, setMusicName] = useState('');
    const [mediaPicker, setMediaPicker] = useState(false), [musicPicker, setMusicPicker] = useState(false), [musicQuery, setMusicQuery] = useState(''), [musicResults, setMusicResults] = useState([]), [musicLoading, setMusicLoading] = useState(false), [cameraSettings, setCameraSettings] = useState(false);
    const [savedMusic, setSavedMusic] = useState(() => { try {
        return JSON.parse(localStorage.getItem('kalasutra_saved_music') || '[]');
    }
    catch (_) {
        return [];
    } });
    const videoRef = useRef(null), streamRef = useRef(null), recorderRef = useRef(null), chunksRef = useRef([]), musicRef = useRef(null), timerRef = useRef(null);
    const photoInputRef = useRef(null), videoInputRef = useRef(null), fileInputRef = useRef(null);
    useEffect(() => {
        apiGet("/products").then((all) => { const mine = all.filter((p) => p.artisanId === user.id && p.verificationStatus !== "rejected"); setProducts(mine); const p = prefillProductId ? mine.find((x) => x.id === prefillProductId) : mine[0]; if (p) {
            setProductId(p.id);
            setCategory(p.category);
            setCaption(`Making of: ${p.title}`);
        } }).catch((e) => setErr(e.message));
        const t = setTimeout(() => openCamera('environment'), 350);
        return () => { clearTimeout(t); stopCamera(); clearTimeout(timerRef.current); };
    }, []);
    async function openCamera(cameraFacing = facing) {
        stopCamera();
        setErr(null);
        try {
            if (!navigator.mediaDevices?.getUserMedia)
                throw new Error('Live camera is not supported in this browser.');
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: cameraFacing }, width: { ideal: 1080 }, height: { ideal: 1920 } }, audio: true });
            streamRef.current = stream;
            setCameraReady(true);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        }
        catch (e) {
            setErr('Camera permission is needed. Please allow camera + microphone and try again. ' + (e.message || ''));
        }
    }
    function stopCamera() { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; if (videoRef.current)
        videoRef.current.srcObject = null; }
    async function flipCamera() { if (recording)
        stopRecording(); const next = facing === 'environment' ? 'user' : 'environment'; setFacing(next); await new Promise(r => setTimeout(r, 80)); openCamera(next); }
    async function startRecording() {
        if (mode === 'photo') {
            if (!streamRef.current)
                await openCamera();
            if (streamRef.current)
                capturePhoto();
            return;
        }
        setErr(null);
        if (!streamRef.current)
            await openCamera();
        if (!streamRef.current)
            return;
        const begin = () => { try {
            chunksRef.current = [];
            const rec = new MediaRecorder(streamRef.current);
            rec.ondataavailable = e => { if (e.data.size)
                chunksRef.current.push(e.data); };
            rec.onstop = () => { const blob = new Blob(chunksRef.current, { type: 'video/webm' }); const r = new FileReader(); r.onload = () => setVideoDataUrl(r.result); r.readAsDataURL(blob); stopCamera(); };
            rec.start();
            recorderRef.current = rec;
            setRecording(true);
            if (timerRef.current)
                clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => stopRecording(), 60000);
        }
        catch (e) {
            setErr(e.message || 'Could not start recording');
        } };
        if (timer > 0) {
            setToast(`Timer set: ${timer}s`);
            timerRef.current = setTimeout(begin, timer * 1000);
        }
        else
            begin();
    }
    function stopRecording() { if (recorderRef.current?.state === 'recording')
        recorderRef.current.stop(); setRecording(false); if (timerRef.current)
        clearTimeout(timerRef.current); }
    function capturePhoto() { const v = videoRef.current; if (!v)
        return; const c = document.createElement('canvas'); c.width = v.videoWidth || 720; c.height = v.videoHeight || 1280; const ctx = c.getContext('2d'); if (!ctx)
        return; if (facing === 'user') {
        ctx.translate(c.width, 0);
        ctx.scale(-1, 1);
    } ctx.drawImage(v, 0, 0, c.width, c.height); setPhotoDataUrl(c.toDataURL('image/jpeg', .9)); setVideoDataUrl(null); setMode('photo'); setToast('Photo captured 📸'); }
    async function uploadVideo(e) { const f = e.target.files?.[0]; if (!f)
        return; try {
        setVideoDataUrl(await fileToDataURL(f));
        setPhotoDataUrl(null);
        setMode('video');
        setMediaPicker(false);
        setToast('Video added from gallery');
    }
    catch (_) {
        setErr('Could not load that video.');
    } }
    async function uploadPhoto(e) { const f = e.target.files?.[0]; if (!f)
        return; try {
        setPhotoDataUrl(await fileToDataURL(f));
        setVideoDataUrl(null);
        setMode('photo');
        setMediaPicker(false);
        setToast('Photo added from gallery');
    }
    catch (_) {
        setErr('Could not load that photo.');
    } }
    async function uploadAny(e) { const f = e.target.files?.[0]; if (!f)
        return; if (f.type.startsWith('video/'))
        return uploadVideo(e); return uploadPhoto(e); }
    async function uploadMusic(e) { const f = e.target.files?.[0]; if (!f)
        return; try {
        const u = await fileToDataURL(f);
        setMusic(u);
        setMusicName(f.name);
        setMusicPicker(false);
        setTimeout(() => musicRef.current?.play().catch(() => { }), 80);
        setToast('Music added 🎵');
    }
    catch (_) {
        setErr('Could not load that audio file.');
    } }
    async function searchMusic(q = musicQuery) {
        const term = (q || 'handmade instrumental').trim();
        setMusicLoading(true);
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=25`);
            const data = await res.json();
            setMusicResults(data.results || []);
        }
        catch (_) {
            setMusicResults([]);
            setErr('Music search is unavailable right now. You can still import audio from your device.');
        }
        finally {
            setMusicLoading(false);
        }
    }
    function chooseMusic(track) { if (!track.previewUrl) {
        setToast('Preview unavailable for this track');
        return;
    } setMusic(track.previewUrl); setMusicName(`${track.trackName} · ${track.artistName}`); setMusicPicker(false); setTimeout(() => musicRef.current?.play().catch(() => { }), 80); const item = { trackName: track.trackName, artistName: track.artistName, previewUrl: track.previewUrl, artworkUrl100: track.artworkUrl100 }; const next = [item, ...savedMusic.filter((x) => x.previewUrl !== item.previewUrl)].slice(0, 12); setSavedMusic(next); localStorage.setItem('kalasutra_saved_music', JSON.stringify(next)); setToast('Music selected 🎵'); }
    function chooseSavedMusic(track) { setMusic(track.previewUrl); setMusicName(`${track.trackName} · ${track.artistName}`); setMusicPicker(false); setTimeout(() => musicRef.current?.play().catch(() => { }), 80); }
    function cycleTimer() { setTimer(t => t === 0 ? 3 : t === 3 ? 5 : t === 5 ? 10 : 0); }
    function cycleSpeed() { setSpeed(s => s === 1 ? 0.5 : s === 0.5 ? 1.5 : s === 1.5 ? 2 : 1); }
    function cycleFilter() { setFilter(f => f === 'none' ? 'warm' : f === 'warm' ? 'mono' : f === 'mono' ? 'soft' : 'none'); }
    function filterStyle() { return { filter: `${filter === 'warm' ? 'sepia(.18) saturate(1.15)' : filter === 'mono' ? 'grayscale(1)' : filter === 'soft' ? 'brightness(1.06) contrast(.92)' : 'none'} ${beautify ? 'brightness(1.03) saturate(1.05)' : ''}` }; }
    async function postReel() { if (!videoDataUrl && !photoDataUrl) {
        setErr('Record or upload your Reel first.');
        return;
    } try {
        await apiPost('/reels', { artisanId: user.id, productId: productId || null, caption: caption || 'Stories behind my handmade craft', category, tags, video: videoDataUrl || photoDataUrl });
        setToast('Reel posted successfully ✨');
        go('myReels');
    }
    catch (e) {
        setErr(e.message || 'Could not post Reel.');
    } }
    return React.createElement("div", { className: "reel-create-page" },
        React.createElement("header", { className: "reel-create-topbar" },
            React.createElement("button", { onClick: () => { stopCamera(); go('dashboard'); }, "aria-label": "Back" }, "\u2039"),
            React.createElement("img", { src: "/assets/logo.png", alt: "KalaSutra" }),
            React.createElement("div", null,
                React.createElement("b", null, "KalaSutra"),
                React.createElement("span", null, "Artisans to the World")),
            React.createElement("button", { onClick: () => setCameraSettings(v => !v), title: "Camera settings" }, "\u2699"),
            React.createElement("button", { onClick: flipCamera, title: "Flip camera" }, "\u21BB"),
            React.createElement("button", { onClick: () => setToast('Draft saved locally') }, "Save Draft")),
        React.createElement("div", { className: "reel-create-identity-wrap" },
            React.createElement(ArtisanIdentityChip, { user: user, tone: "reel-identity" })),
        React.createElement("div", { className: "reel-create-layout" },
            React.createElement("section", { className: "reel-camera-panel" },
                React.createElement("div", { className: "reel-viewfinder" },
                    (videoDataUrl || photoDataUrl) ? (videoDataUrl ? React.createElement("video", { src: videoDataUrl, controls: true, playsInline: true, className: "reel-preview", style: { ...filterStyle(), transform: speed !== 1 ? 'scale(1)' : 'none' } }) : React.createElement("img", { src: photoDataUrl, className: "reel-preview", style: filterStyle() })) : React.createElement(React.Fragment, null,
                        React.createElement("video", { ref: videoRef, className: "reel-preview", autoPlay: true, muted: true, playsInline: true, style: { ...filterStyle(), transform: facing === 'user' ? 'scaleX(-1)' : 'none' } }),
                        !cameraReady && React.createElement("div", { className: "reel-empty-visual" },
                            React.createElement("div", { className: "reel-caption-art" },
                                "Capture",
                                React.createElement("br", null),
                                "Your Craft",
                                React.createElement("br", null),
                                "Share Your Story \u2661"),
                            React.createElement("div", { className: "reel-placeholder" }, recording ? 'Recording your craft…' : 'Your craft camera appears here'))),
                    React.createElement("div", { className: "viewfinder-corners" }),
                    React.createElement("div", { className: "reel-live-status" },
                        "\u25CF ",
                        facing === 'user' ? 'FRONT CAMERA' : 'BACK CAMERA'),
                    React.createElement("div", { className: "reel-side-tools" },
                        React.createElement("button", { onClick: () => { setMusicPicker(true); if (!musicResults.length)
                                searchMusic('handmade instrumental'); } },
                            "\u266B",
                            React.createElement("small", null, musicName ? 'Music ✓' : 'Music')),
                        React.createElement("button", { onClick: cycleTimer },
                            "\u25F7",
                            React.createElement("small", null,
                                "Timer ",
                                timer ? timer + 's' : 'Off')),
                        React.createElement("button", { onClick: cycleSpeed },
                            "1\u00D7",
                            React.createElement("small", null,
                                "Speed ",
                                speed,
                                "\u00D7")),
                        React.createElement("button", { onClick: cycleFilter },
                            "\u2726",
                            React.createElement("small", null,
                                "Filter ",
                                filter)),
                        React.createElement("button", { className: beautify ? 'tool-active' : '', onClick: () => setBeautify(v => !v) },
                            "\u2667",
                            React.createElement("small", null,
                                "Beautify ",
                                beautify ? 'On' : 'Off'))),
                    React.createElement("div", { className: "reel-mode-toggle" },
                        React.createElement("button", { className: mode === 'video' ? 'active' : '', onClick: () => { setMode('video'); if (!streamRef.current)
                                openCamera(); } }, "Video"),
                        React.createElement("button", { className: mode === 'photo' ? 'active' : '', onClick: () => { setMode('photo'); if (!streamRef.current)
                                openCamera(); } }, "Photo")),
                    React.createElement("button", { className: `record-button ${recording ? 'recording' : ''}`, onClick: recording ? stopRecording : startRecording }, recording ? '■' : '●'),
                    React.createElement("span", { className: "record-hint" },
                        recording ? 'Tap to stop' : mode === 'photo' ? 'Tap for photo' : 'Tap to record',
                        React.createElement("small", null, timer ? 'Timer ready' : '')),
                    React.createElement("button", { className: "gallery-upload", onClick: () => setMediaPicker(true) },
                        React.createElement("span", null, "\u25A7"),
                        React.createElement("small", null, "Gallery")),
                    React.createElement("button", { className: "photo-gallery-upload", onClick: () => { setMediaPicker(true); } },
                        React.createElement("span", null, "\u25A3"),
                        React.createElement("small", null, "Photo")),
                    React.createElement("button", { className: "effects-btn", onClick: cycleFilter },
                        "\u2727",
                        React.createElement("small", null, "Effects")),
                    music && React.createElement("audio", { ref: musicRef, src: music, loop: true, controls: true, className: "reel-music-player" }),
                    cameraSettings && React.createElement("div", { className: "reel-settings-sheet" },
                        React.createElement("div", { className: "reel-sheet-head" },
                            React.createElement("b", null, "Camera settings"),
                            React.createElement("button", { onClick: () => setCameraSettings(false) }, "\u00D7")),
                        React.createElement("button", { onClick: flipCamera },
                            "\u21BB Switch to ",
                            facing === 'environment' ? 'front' : 'back',
                            " camera"),
                        React.createElement("button", { onClick: () => { setBeautify(v => !v); setCameraSettings(false); } },
                            "\u2667 Beautify: ",
                            beautify ? 'On' : 'Off'),
                        React.createElement("button", { onClick: () => { cycleFilter(); setCameraSettings(false); } },
                            "\u2726 Filter: ",
                            filter),
                        React.createElement("button", { onClick: () => { cycleTimer(); setCameraSettings(false); } },
                            "\u25F7 Timer: ",
                            timer ? timer + 's' : 'Off'))),
                React.createElement("div", { className: "reel-camera-controls" },
                    React.createElement("button", { onClick: flipCamera },
                        "\u21BB ",
                        facing === 'environment' ? 'Front camera' : 'Back camera'),
                    React.createElement("button", { onClick: () => { setMusicPicker(true); if (!musicResults.length)
                            searchMusic('handmade instrumental'); } }, "\u266B Add music"),
                    React.createElement("button", { onClick: () => { setMusic(null); setMusicName(''); musicRef.current?.pause(); } }, "Remove music")),
                React.createElement("div", { className: "reel-bottom-tools" },
                    React.createElement("span", null,
                        "\u2667",
                        React.createElement("b", null, "Tips")),
                    React.createElement("span", null,
                        "\u25A3",
                        React.createElement("b", null, "Inspiration")),
                    React.createElement("span", null,
                        "\u25A4",
                        React.createElement("b", null, "Guidelines")))),
            React.createElement("section", { className: "reel-details-panel" },
                React.createElement("div", { className: "reel-panel-title" },
                    React.createElement("div", null,
                        React.createElement("h1", null, "Almost Ready!"),
                        React.createElement("p", null, "Add a few details and let the world see your creation")),
                    React.createElement("span", null, "\u2667")),
                React.createElement("div", { className: "reel-story-card" },
                    videoDataUrl ? React.createElement("video", { src: videoDataUrl, controls: true, playsInline: true, style: filterStyle() }) : photoDataUrl ? React.createElement("img", { src: photoDataUrl, style: filterStyle() }) : React.createElement("div", { className: "no-clip" },
                        React.createElement("span", null, "\u25C9"),
                        React.createElement("b", null, "No clip yet"),
                        React.createElement("small", null, "Use live camera, front/back flip, or gallery upload")),
                    React.createElement("div", null,
                        React.createElement("em", null,
                            "Stories",
                            React.createElement("br", null),
                            "Behind",
                            React.createElement("br", null),
                            "Handmade",
                            React.createElement("br", null),
                            "Matter \u2661"))),
                err && React.createElement(ErrorBanner, { message: err }),
                React.createElement("label", { className: "reel-field" },
                    React.createElement("b", null, "\u270E Caption"),
                    React.createElement("textarea", { value: caption, maxLength: 300, onChange: e => setCaption(e.target.value), placeholder: "e.g. Making this piece takes days of hard work, patience and love. \u2764\uFE0F" })),
                React.createElement("label", { className: "reel-field" },
                    React.createElement("b", null,
                        "\u25A3 Attach Product ",
                        React.createElement("small", null, "(Optional)")),
                    React.createElement("select", { value: productId, onChange: e => setProductId(e.target.value) },
                        React.createElement("option", { value: "" }, "No product \u2014 just my process"),
                        products.map((p) => React.createElement("option", { key: p.id, value: p.id },
                            p.title,
                            " \u00B7 \u20B9",
                            p.price)))),
                React.createElement("label", { className: "reel-field" },
                    React.createElement("b", null, "\u2662 Category"),
                    React.createElement("select", { value: category, onChange: e => setCategory(e.target.value) }, ['Pottery', 'Textiles', 'Woodwork', 'Metalwork', 'Basketry', 'Other'].map(x => React.createElement("option", { key: x }, x)))),
                React.createElement("label", { className: "reel-field" },
                    React.createElement("b", null,
                        "# Tags ",
                        React.createElement("small", null, "(comma separated)")),
                    React.createElement("input", { value: tags, onChange: e => setTags(e.target.value), placeholder: "pottery, handmade, rajasthan, traditional" })),
                React.createElement("button", { className: "post-reel-btn", onClick: postReel }, "\u2601 \u00A0 Post Reel"),
                React.createElement("div", { className: "reel-footer-note" }, "Show the world your craft \u2728"),
                React.createElement("div", { className: "reel-bottom-quote" }, "\u201CEvery craft has a story. Tell yours.\u201D \u2665"))),
        React.createElement("input", { ref: photoInputRef, type: "file", accept: "image/*", onChange: uploadPhoto, className: "hidden-media-input" }),
        React.createElement("input", { ref: videoInputRef, type: "file", accept: "video/*", onChange: uploadVideo, className: "hidden-media-input" }),
        React.createElement("input", { ref: fileInputRef, type: "file", accept: "image/*,video/*", onChange: uploadAny, className: "hidden-media-input" }),
        mediaPicker && React.createElement("div", { className: "reel-modal-backdrop", onClick: () => setMediaPicker(false) },
            React.createElement("div", { className: "reel-media-sheet", onClick: e => e.stopPropagation() },
                React.createElement("div", { className: "reel-sheet-handle" }),
                React.createElement("div", { className: "reel-sheet-head" },
                    React.createElement("b", null, "Add to your Reel"),
                    React.createElement("button", { onClick: () => setMediaPicker(false) }, "\u00D7")),
                React.createElement("button", { onClick: () => photoInputRef.current?.click() },
                    "\u25A3 ",
                    React.createElement("span", null,
                        React.createElement("strong", null, "Photo Library"),
                        React.createElement("small", null, "Choose photos from your device"))),
                React.createElement("button", { onClick: () => videoInputRef.current?.click() },
                    "\u25A3 ",
                    React.createElement("span", null,
                        React.createElement("strong", null, "Take Video"),
                        React.createElement("small", null, "Open your camera to record"))),
                React.createElement("button", { onClick: () => fileInputRef.current?.click() },
                    "\u25B1 ",
                    React.createElement("span", null,
                        React.createElement("strong", null, "Choose File"),
                        React.createElement("small", null, "Select a photo or video file"))))),
        musicPicker && React.createElement("div", { className: "reel-modal-backdrop", onClick: () => setMusicPicker(false) },
            React.createElement("div", { className: "reel-music-sheet", onClick: e => e.stopPropagation() },
                React.createElement("div", { className: "reel-sheet-handle" }),
                React.createElement("div", { className: "reel-sheet-head" },
                    React.createElement("b", null, "\uD83C\uDFB5 Add music"),
                    React.createElement("button", { onClick: () => setMusicPicker(false) }, "\u00D7")),
                React.createElement("div", { className: "music-search-row" },
                    React.createElement("input", { value: musicQuery, onChange: e => setMusicQuery(e.target.value), onKeyDown: e => { if (e.key === 'Enter')
                            searchMusic(); }, placeholder: "Search songs, artists, sounds\u2026" }),
                    React.createElement("button", { onClick: () => searchMusic() }, "Search")),
                React.createElement("div", { className: "music-tabs" },
                    React.createElement("button", { className: "active" }, "For you"),
                    React.createElement("button", null, "Trending"),
                    React.createElement("button", null, "Original audio"),
                    React.createElement("button", null, "Saved")),
                React.createElement("button", { className: "music-import-btn", onClick: () => document.getElementById('reelMusicFile')?.click() }, "\uD83C\uDFB5 Import audio from device"),
                React.createElement("input", { id: "reelMusicFile", type: "file", accept: "audio/*", onChange: uploadMusic, className: "hidden-media-input" }),
                savedMusic.length > 0 && React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "music-section-label" }, "Saved on this device"),
                    savedMusic.slice(0, 5).map((t, i) => React.createElement("button", { className: "music-row", key: 'saved' + i, onClick: () => chooseSavedMusic(t) },
                        React.createElement("img", { src: t.artworkUrl100 || '/assets/logo.png' }),
                        React.createElement("span", null,
                            React.createElement("strong", null, t.trackName),
                            React.createElement("small", null,
                                t.artistName,
                                " \u00B7 Saved")),
                        React.createElement("b", null, "\u25B6")))),
                musicLoading ? React.createElement("div", { className: "music-loading" }, "Finding music\u2026") : React.createElement(React.Fragment, null,
                    musicResults.length > 0 && React.createElement("div", { className: "music-section-label" }, "Search results"),
                    musicResults.map((t, i) => React.createElement("button", { className: "music-row", key: t.trackId || i, onClick: () => chooseMusic(t) },
                        React.createElement("img", { src: t.artworkUrl100 || '/assets/logo.png' }),
                        React.createElement("span", null,
                            React.createElement("strong", null, t.trackName),
                            React.createElement("small", null,
                                t.artistName,
                                " \u00B7 ",
                                t.trackTimeMillis ? Math.round(t.trackTimeMillis / 60000) + ':' + String(Math.round(t.trackTimeMillis / 1000) % 60).padStart(2, '0') : '')),
                        React.createElement("b", null, "\u25B6")))),
                !musicLoading && !musicResults.length && React.createElement("div", { className: "music-empty" },
                    "Search for a song or use ",
                    React.createElement("b", null, "Import audio"),
                    " to add your own track."))));
}
// ---------------------------------------------------------------------------
// ARTISAN: MY REELS
// ---------------------------------------------------------------------------
function MyReelsScreen({ user, go, setToast }) {
    const [reels, setReels] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editCaption, setEditCaption] = useState("");
    function load() { apiGet(`/reels?artisanId=${user.id}`).then(setReels); }
    useEffect(load, []);
    async function handleDelete(id) {
        await apiDelete(`/reels/${id}`);
        setToast("Reel deleted");
        load();
    }
    async function handleSaveCaption(id) {
        await apiPut(`/reels/${id}`, { caption: editCaption });
        setEditingId(null);
        load();
    }
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "app-header" },
            React.createElement("button", { className: "header-back", onClick: () => go('dashboard'), "aria-label": "Back" }, "\u2039"),
            React.createElement("div", null,
                React.createElement("h2", null, "My Reels"),
                React.createElement("div", { className: "sub" },
                    reels.length,
                    " posted")),
            React.createElement("div", { className: "fab", style: { position: "static", width: 40, height: 40, fontSize: 18 }, onClick: () => go("createReel") }, "\uD83C\uDFAC")),
        React.createElement("div", { className: "content" }, reels.length === 0 ? React.createElement("div", { className: "empty-note" }, "You haven't posted any Reels yet.") : reels.map((r) => (React.createElement("div", { className: "my-reel-row", key: r.id },
            React.createElement("div", { className: "thumb-sm", style: { background: "#e4d9bd" } }, r.thumbEmoji),
            React.createElement("div", { style: { flex: 1 } }, editingId === r.id ? (React.createElement(React.Fragment, null,
                React.createElement("textarea", { value: editCaption, onChange: (e) => setEditCaption(e.target.value), style: { width: "100%", fontSize: 12, border: "1.5px solid var(--ink)", padding: 6 } }),
                React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 6 } },
                    React.createElement("button", { className: "btn", style: { padding: "6px 10px", fontSize: 11 }, onClick: () => handleSaveCaption(r.id) }, "Save"),
                    React.createElement("button", { className: "btn secondary", style: { padding: "6px 10px", fontSize: 11 }, onClick: () => setEditingId(null) }, "Cancel")))) : (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { fontSize: 12.5, fontWeight: 600 } }, r.caption),
                React.createElement("div", { style: { fontSize: 10.5, color: "#6b6055", marginTop: 3 } },
                    r.product ? `Linked: ${r.product.title}` : "No product linked",
                    " \u00B7 \u2764\uFE0F ",
                    r.likes,
                    " \u00B7 \uD83D\uDCAC ",
                    r.comments),
                React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 6 } },
                    React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "var(--indigo)", cursor: "pointer" }, onClick: () => { setEditingId(r.id); setEditCaption(r.caption); } }, "Edit caption"),
                    React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "var(--madder)", cursor: "pointer" }, onClick: () => handleDelete(r.id) }, "Delete")))))))))));
}
// ---------------------------------------------------------------------------
// LOCATION TOOLS — separate buyer delivery location + artisan craft location
// ---------------------------------------------------------------------------
function LocationTools({ mode, initial }) {
    const key = `kalasutra_${mode}_location`;
    const saved = (() => { try {
        return JSON.parse(localStorage.getItem(key) || 'null');
    }
    catch (_) {
        return null;
    } })();
    const [loc, setLoc] = useState(saved || null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [manual, setManual] = useState(initial || saved?.label || saved?.city || '');
    async function detect() {
        setBusy(true);
        setMessage('');
        try {
            const x = await requestCurrentLocation();
            const next = { ...x, label: [x.area, x.city, x.pincode].filter(Boolean).join(', ') || 'Current location' };
            setLoc(next);
            setManual(next.label);
            localStorage.setItem(key, JSON.stringify(next));
            setMessage(mode === 'buyer' ? '✓ Current delivery location detected' : '✓ Craft location verified from this device');
        }
        catch (e) {
            setMessage(e.message || 'Could not detect location');
        }
        finally {
            setBusy(false);
        }
    }
    function saveManual() {
        const next = { ...(loc || {}), label: manual.trim() || 'Location saved manually', manual: true };
        setLoc(next);
        localStorage.setItem(key, JSON.stringify(next));
        setMessage('✓ Location saved');
    }
    return React.createElement("section", { className: `location-tools-card ${mode === 'artisan' ? 'artisan-location-card' : 'buyer-location-card'}` },
        React.createElement("div", { className: "location-tools-icon" }, "\u2316"),
        React.createElement("div", { className: "location-tools-main" },
            React.createElement("span", { className: "field-label" }, mode === 'buyer' ? 'BUYER DELIVERY LOCATION' : 'ARTISAN CRAFT LOCATION'),
            React.createElement("h3", null, mode === 'buyer' ? 'Where should we deliver?' : 'Where is this craft made?'),
            React.createElement("p", null, loc?.label || manual || (mode === 'buyer' ? 'Use your current location for faster checkout.' : 'Verify the place connected to your handmade work.')),
            React.createElement("div", { className: "location-tools-actions" },
                React.createElement("button", { onClick: detect, disabled: busy }, busy ? 'Detecting…' : '⌖ Use current location'),
                React.createElement("input", { value: manual, onChange: e => setManual(e.target.value), placeholder: "City / locality" }),
                React.createElement("button", { className: "location-save-btn", onClick: saveManual }, "Save")),
            message && React.createElement("small", { className: "location-tools-message" }, message)),
        React.createElement("span", { className: "location-tools-status" }, loc ? '✓' : '○'));
}
// ---------------------------------------------------------------------------
// ARTISAN: PROFILE
// ---------------------------------------------------------------------------
function ArtisanProfileScreen({ user, onLogout, go }) {
    const profile = user.profile || {};
    const [editing, setEditing] = useState(false);
    const [location, setLocation] = useState(profile.location || "Jaipur, Rajasthan");
    const [bio, setBio] = useState(profile.bio || "Keeping our traditions alive, one creation at a time.");
    const [avatar, setAvatar] = useState(() => localStorage.getItem(`kalasutra_avatar_${user.id}`) || profile.avatar || "/assets/avatar-artisan.png");
    async function handleAvatarPick(e) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        try {
            const data = await fileToDataURL(file);
            setAvatar(data);
            localStorage.setItem(`kalasutra_avatar_${user.id}`, data);
        }
        catch (_) { }
        e.target.value = "";
    }
    function saveProfile() { setEditing(false); }
    return (React.createElement("div", { className: "profile-page artisan-profile-page" },
        React.createElement("header", { className: "profile-topbar profile-topbar-with-back" },
            React.createElement("button", { className: "profile-back-btn", onClick: () => go("dashboard"), "aria-label": "Back" }, "\u2039"),
            React.createElement("img", { src: "/assets/logo.png", className: "profile-logo", alt: "KalaSutra" }),
            React.createElement("div", { className: "profile-top-actions" },
                React.createElement("button", { "aria-label": "Search" },
                    React.createElement(Icon, { name: "search" })),
                React.createElement("button", { "aria-label": "Notifications" },
                    React.createElement(Icon, { name: "bell" }),
                    React.createElement("span", { className: "notification-dot" })),
                React.createElement("button", { "aria-label": "Settings", onClick: () => { setEditing(v => !v); window.scrollTo({ top: 0, behavior: "smooth" }); } }, "\u2699"),
                React.createElement("span", { className: "profile-top-slogan" },
                    "Handmade",
                    React.createElement("br", null),
                    "Stories",
                    React.createElement("br", null),
                    "Brighter Tomorrows \u2661"))),
        React.createElement("main", { className: "profile-container" },
            React.createElement("section", { className: "profile-hero artisan-hero" },
                React.createElement("div", { className: "profile-avatar-wrap" },
                    React.createElement("img", { src: avatar, className: "profile-avatar", alt: "Artisan profile" }),
                    React.createElement("input", { id: "artisanAvatarInput", className: "avatar-file-input", type: "file", accept: "image/*", capture: "user", onChange: handleAvatarPick }),
                    React.createElement("label", { htmlFor: "artisanAvatarInput", className: "avatar-camera", title: "Upload profile photo" }, "\u233E")),
                React.createElement("div", { className: "profile-identity" },
                    React.createElement("h1", null,
                        user.name,
                        " ",
                        React.createElement("span", { className: "verified-check" }, "\u2713")),
                    React.createElement("h3", null, "Master Artisan"),
                    React.createElement("p", { className: "profile-location" },
                        "\u2316 ",
                        location),
                    React.createElement("p", { className: "profile-quote" },
                        "\u201C",
                        bio,
                        "\u201D"),
                    React.createElement("div", { className: "profile-tags" },
                        React.createElement("span", null, "\u25C9 Handcrafted"),
                        React.createElement("span", null, "\u265F Traditional"),
                        React.createElement("span", null, "\u25C9 Sustainable"))),
                React.createElement("div", { className: "profile-hero-art" },
                    React.createElement("div", { className: "handmade-script" },
                        "Crafting",
                        React.createElement("br", null),
                        "A Better",
                        React.createElement("br", null),
                        "Tomorrow \u2661"),
                    React.createElement("div", { className: "hero-craft-image" })),
                React.createElement("button", { className: "profile-edit-btn", onClick: () => setEditing(v => !v) },
                    "\u270E ",
                    editing ? "Close" : "Edit Profile")),
            editing && (React.createElement("section", { className: "profile-edit-panel" },
                React.createElement("label", null,
                    "Craft location",
                    React.createElement("input", { value: location, onChange: e => setLocation(e.target.value) })),
                React.createElement("label", null,
                    "Artisan story / bio",
                    React.createElement("textarea", { value: bio, onChange: e => setBio(e.target.value) })),
                React.createElement("button", { className: "profile-primary-btn", onClick: saveProfile }, "Save artisan profile"))),
            React.createElement(LocationTools, { mode: "artisan", initial: location }),
            React.createElement("section", { className: "trust-row" },
                React.createElement("div", { className: "trust-score-card" },
                    React.createElement("div", null,
                        React.createElement("b", null, "TRUST SCORE"),
                        React.createElement("small", null, "Build trust. Reach the world.")),
                    React.createElement("div", { className: "trust-progress" },
                        React.createElement("span", { style: { width: `${Math.min(100, Number(profile.trustScore ?? 100))}%` } })),
                    React.createElement("strong", null,
                        profile.trustScore ?? 100,
                        "/100"),
                    React.createElement("span", { className: "trust-crown" }, "\u265B")),
                React.createElement("div", { className: "trust-side" },
                    React.createElement("span", { className: "trust-icon" }, "\u265B"),
                    React.createElement("div", null,
                        React.createElement("b", null, "Top Artisan"),
                        React.createElement("small", null, "Keep creating magic!")),
                    React.createElement("span", null, "\u203A"))),
            React.createElement("section", { className: "profile-stat-grid artisan-stats" },
                React.createElement("div", null,
                    React.createElement("b", null, "12"),
                    React.createElement("span", null, "Products Listed")),
                React.createElement("div", null,
                    React.createElement("b", null, "248"),
                    React.createElement("span", null, "Profile Views")),
                React.createElement("div", null,
                    React.createElement("b", null, "36"),
                    React.createElement("span", null, "Orders Received")),
                React.createElement("div", null,
                    React.createElement("b", null, "4.9"),
                    React.createElement("span", null, "Buyer Rating")),
                React.createElement("div", { className: "impact-stat" },
                    React.createElement("b", null, "\uD83C\uDF3F"),
                    React.createElement("div", null,
                        React.createElement("strong", null, "You are making an impact!"),
                        React.createElement("span", null, "Your art supports culture, communities and a sustainable future.")),
                    React.createElement("span", null, "\u203A"))),
            React.createElement("button", { className: "safety-center", onClick: () => go("reviews") },
                React.createElement("span", null, "\u2713"),
                React.createElement("div", null,
                    React.createElement("strong", null, "Safety & Review Center"),
                    React.createElement("small", null, "Your safety and trust matter to us. View guidelines, report issues and read reviews.")),
                React.createElement("b", null, "\u203A")),
            React.createElement("div", { className: "profile-switch-row" },
                React.createElement("button", { onClick: () => apiPost("/users", { name: user.name, contact: user.contact || "demo", role: "buyer" }).then(() => window.location.reload()) }, "\u21C4 \u00A0Switch to Buyer View"),
                React.createElement("button", { onClick: onLogout }, "\u21E5 \u00A0Log out")),
            React.createElement("div", { className: "quick-heading" },
                React.createElement("h2", null, "Quick Actions"),
                React.createElement("span", null,
                    "Create",
                    React.createElement("br", null),
                    "Share",
                    React.createElement("br", null),
                    "Grow \u2661")),
            React.createElement("section", { className: "quick-actions artisan-quick-actions" },
                React.createElement("button", { onClick: () => go("addProduct") },
                    React.createElement("span", null, "\uFF0B"),
                    React.createElement("b", null, "Add a Piece"),
                    React.createElement("small", null,
                        "Take a photo,",
                        React.createElement("br", null),
                        "tell your story")),
                React.createElement("button", { onClick: () => go("createReel") },
                    React.createElement("span", null, "\u25A3"),
                    React.createElement("b", null, "Upload Reel"),
                    React.createElement("small", null,
                        "Show your craft",
                        React.createElement("br", null),
                        "to the world")),
                React.createElement("button", { onClick: () => go("myProducts") },
                    React.createElement("span", null, "\u25A5"),
                    React.createElement("b", null, "My Portfolio"),
                    React.createElement("small", null,
                        "Manage your",
                        React.createElement("br", null),
                        "creations")),
                React.createElement("button", { onClick: () => go("orders") },
                    React.createElement("span", null, "\u25A4"),
                    React.createElement("b", null, "Orders"),
                    React.createElement("small", null,
                        "Track & manage",
                        React.createElement("br", null),
                        "orders")),
                React.createElement("div", { className: "quick-banner artisan-banner" },
                    React.createElement("div", null,
                        React.createElement("em", null,
                            "Your Craft",
                            React.createElement("br", null),
                            "Inspires the World"),
                        React.createElement("small", null,
                            "Keep creating.",
                            React.createElement("br", null),
                            "We'll handle the rest."),
                        React.createElement("button", { onClick: () => go("myProducts") }, "View My Creations \u2192")))))));
}
// ---------------------------------------------------------------------------
// BUYER NAV
// ---------------------------------------------------------------------------
function BuyerNav({ screen, go, cartCount }) {
    const items = [
        { id: "buyerHome", label: "Home", icon: "home" },
        { id: "buyerReels", label: "Reels", icon: "reels" },
        { id: "cart", label: "Cart", icon: "cart" },
        { id: "orders", label: "Orders", icon: "orders" },
        { id: "buyerProfile", label: "Profile", icon: "profile" },
    ];
    return (React.createElement("div", { className: "bottom-nav buyer-bottom-nav" }, items.map((it) => (React.createElement("button", { key: it.id, className: `nav-btn ${screen === it.id ? "active" : ""}`, onClick: () => go(it.id) },
        React.createElement("span", { className: "nav-icon-wrap" },
            React.createElement(Icon, { name: it.icon }),
            it.id === "cart" && cartCount > 0 && React.createElement("b", { className: "nav-badge" }, cartCount > 9 ? "9+" : cartCount)),
        React.createElement("span", null, it.label))))));
}
// ---------------------------------------------------------------------------
// BUYER: HOME / EXPLORE
// ---------------------------------------------------------------------------
function BuyerHomeScreen({ user, go, openProduct, wishlist, toggleWishlist, cartCount, addToCart, setToast }) {
    const [products, setProducts] = useState([]), [query, setQuery] = useState(""), [err, setErr] = useState(null), [listening, setListening] = useState(false), [recentIds, setRecentIds] = useState([]);
    const recentKey = `kalasutra_recent_products_${user.id}`;
    const loadRecent = () => setRecentIds(getRecentProductIds(user.id));
    useEffect(() => { apiGet(`/products`).then(setProducts).catch(e => setErr(e.message)); loadRecent(); const f = () => loadRecent(); window.addEventListener("kalasutra:recent-product", f); return () => window.removeEventListener("kalasutra:recent-product", f); }, [user.id]);
    const filtered = products.filter(p => !query.trim() || query.toLowerCase().split(" ").filter(Boolean).every(w => `${p.title} ${p.category} ${p.craftInfo?.material || ""} ${p.craftInfo?.region || ""}`.toLowerCase().includes(w)));
    const recent = recentIds.map(id => products.find(p => String(p.id) === String(id))).filter(Boolean).slice(0, 4);
    const viewProduct = (id) => { saveRecentProduct(user.id, id); setRecentIds(getRecentProductIds(user.id)); openProduct(id); };
    async function voiceSearch() { const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { setErr("Voice search is not supported in this browser."); return; } const ok = await requestVoicePermission(); if (!ok) { setErr("Please allow microphone access for voice search."); return; } const r = new SR(); r.lang = "hi-IN"; r.interimResults = false; r.maxAlternatives = 1; r.onstart = () => setListening(true); r.onend = () => setListening(false); r.onerror = () => { setListening(false); setErr("Voice search could not start. Please try again."); }; r.onresult = (ev) => setQuery(ev.results[0][0].transcript); try { r.start(); } catch (_) {} }
    const craftItems = [["Pottery", "/assets/explore-pottery.jpg"], ["Textiles", "/assets/explore-textiles.jpg"], ["Woodwork", "/assets/explore-woodwork.jpg"], ["Metalwork", "/assets/explore-metalwork.jpg"], ["Cane & Bamboo", "/assets/explore-cane.jpg"], ["Jewellery", "/assets/explore-jewellery.jpg"], ["Home Decor", "/assets/explore-home-decor.jpg"]];
    const craftQuery = name => { setQuery(name); document.getElementById("buyer-explore-craft")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
    const scrollToCraft = () => document.getElementById("buyer-explore-craft")?.scrollIntoView({ behavior: "smooth", block: "start" });
    const storyCards = ["Cane Lamps from Jaipur", "The Art of Pottery", "Block Printing Tradition", "Meet the Maker", "From Forest to Home", "Handcrafted Jewellery"];
    const e = React.createElement;
    const craftTiles = craftItems.map(([name, img]) => e("button", { className: "buyer-craft-tile", key: name, onClick: () => craftQuery(name) }, e("span", null, e("img", { src: img, alt: name })), e("b", null, name)));
    craftTiles.push(e("button", { className: "buyer-craft-more", key: "more", onClick: () => setQuery("") }, e("span", null, "›"), e("b", null, "More")));
    const storyTiles = storyCards.map((title, i) => e("button", { key: title, onClick: () => go("buyerReels") }, e("img", { src: `/assets/craft-story-${i + 1}.jpg`, alt: "" }), e("span", { className: "play" }, "▶"), e("b", null, title)));
    const productCards = filtered.map(p => e("div", { key: p.id, className: "card buyer-product-card", onClick: () => viewProduct(p.id) },
        e("div", { className: "thumb", style: { backgroundImage: `url(${p.image})` } }, e(BadgeLabel, { status: p.verificationStatus }), e("button", { className: "card-icon-btn card-heart", onClick: ev => { ev.stopPropagation(); toggleWishlist(p.id); } }, wishlist.includes(p.id) ? "❤️" : "🤍")),
        e("div", { className: "info" }, e("div", { className: "t" }, p.title), e("div", { className: "buyer-card-artisan" }, `by ${p.artisan?.name || "Verified artisan"}`), e("div", { className: "buyer-card-bottom" }, e("div", { className: "p" }, `₹${p.price.toLocaleString("en-IN")}`), e("button", { className: "quick-cart-btn", onClick: ev => { ev.stopPropagation(); addToCart(p.id); setToast("Added to cart 🛍️"); } }, "＋ Add to cart")))));
    const recentSection = recent.length > 0 ? e("section", { className: "recent-viewed-section" },
        e("div", { className: "recent-viewed-head" }, e("div", null, e("span", { className: "field-label" }, "YOUR BROWSING TRAIL"), e("h3", null, "Recently Viewed")), e("button", { onClick: () => { localStorage.removeItem(recentKey); setRecentIds([]); } }, "Clear")),
        e("div", { className: "recent-viewed-grid" }, recent.map(p => e("button", { className: "recent-product-card", key: `recent-${p.id}`, onClick: () => viewProduct(p.id) }, e("div", { className: "recent-product-image", style: { backgroundImage: `url(${p.image})` } }, e(BadgeLabel, { status: p.verificationStatus })), e("div", { className: "recent-product-info" }, e("strong", null, p.title), e("span", null, `₹${Number(p.price || 0).toLocaleString("en-IN")}`)))))
    ) : null;
    return e(React.Fragment, null,
        e("div", { className: "buyer-reference-home" },
            e("div", { className: "buyer-ref-top" }, e("div", { className: "buyer-ref-brand" }, e("img", { src: "/assets/buyer-logo.jpg", alt: "KalaSutra" }), e("div", { className: "buyer-ref-art" }, "Art", e("br"), "Lives", e("br"), "Here ♡")), e("div", { className: "buyer-ref-top-actions" }, e("button", { "aria-label": "Search", onClick: () => document.querySelector('.buyer-ref-search input')?.focus() }, e(Icon, { name: "search" })), e("button", { "aria-label": "Notifications", onClick: () => setToast("You're all caught up ♡") }, "♧"), e("button", { "aria-label": "Settings", onClick: () => go("buyerProfile") }, "⚙"))),
            e("div", { className: "buyer-ref-hero" }, e("div", { className: "buyer-ref-copy" }, e("h1", null, "Hello, ", user.name, " ", e("span", null, "✦")), e("p", null, "Discover something made by hand,", e("br"), "made with a story."), e("button", { className: "buyer-ref-cta", onClick: scrollToCraft }, "Explore Handmade ", e("b", null, "→"))), e("div", { className: "buyer-ref-hero-image" }, e("img", { src: "/assets/buyer-hero.jpg", alt: "Artisan making pottery" }), e("div", { className: "buyer-ref-hero-script" }, "People", e("br"), "Crafts", e("br"), "Stories", e("br"), "A Better Tomorrow ♡")), e("div", { className: "buyer-ref-quote" }, "“Handmade", e("br"), "things carry", e("br"), "pieces of", e("br"), "people’s hearts.”", e("span", null, "—"))),
            e("div", { className: "buyer-ref-search" }, e(Icon, { name: "search" }), e("input", { value: query, onChange: ev => setQuery(ev.target.value), placeholder: "Search crafts, materials, makers…" }), e("button", { className: listening ? "listening" : "", onClick: voiceSearch }, "🎙")),
            e("div", { className: "buyer-ref-shortcuts" }, e("button", { onClick: () => go("wishlist") }, e(Icon, { name: "heart" }), " Saved"), e("button", { onClick: () => go("buyerReels") }, e(Icon, { name: "reels" }), " Craft Stories"), e("button", { onClick: () => go("cart") }, e(Icon, { name: "cart" }), " Cart", cartCount ? ` (${cartCount})` : "")),
            e("section", { id: "buyer-explore-craft", className: "buyer-ref-section buyer-explore-section" }, e("div", { className: "buyer-ref-section-head" }, e("h3", null, "EXPLORE BY CRAFT"), e("button", { onClick: () => setQuery("") }, "See all →")), e("div", { className: "buyer-craft-scroller" }, craftTiles)),
            e("section", { className: "buyer-ref-story" }, e("div", { className: "buyer-ref-story-copy" }, e("span", { className: "buyer-ref-eyebrow" }, "TODAY’S CRAFT STORY"), e("h2", null, "From Jaipur, with hands", e("br"), "that have carried a", e("br"), "tradition forward."), e("p", null, "Meet Radha Devi, a cane craft artisan from Jaipur who turns simple materials into timeless pieces."), e("div", { className: "buyer-story-artisan-row" }, e("img", { src: "/assets/avatar-artisan.png", alt: "Radha Devi" }), e("div", null, e("strong", null, "Radha Devi"), e("span", null, "Jaipur, Rajasthan · ✓ Verified Artisan"))), e("button", { onClick: () => go("buyerReels") }, "View Story →")), e("div", { className: "buyer-ref-story-image" }, e("img", { src: "/assets/buyer-story.jpg", alt: "Artisan weaving cane" }), e("div", { className: "buyer-ref-story-quote" }, "“Every weave", e("br"), "tells a story", e("br"), "of resilience.”", e("br"), e("small", null, "— Radha Devi")), e("div", { className: "buyer-ref-verified" }, "● Verified Artisan"))),
            e("section", { className: "buyer-ref-section buyer-craft-stories" }, e("div", { className: "buyer-ref-section-head" }, e("h3", null, "CRAFT STORIES ", e("small", null, "See how it’s made.")), e("button", { onClick: () => go("buyerReels") }, "Explore Reels →")), e("div", { className: "buyer-story-scroller" }, storyTiles)),
            e("section", { className: "buyer-ref-section buyer-curated" }, e("div", { className: "buyer-ref-section-head" }, e("h3", null, "CURATED FOR YOU ", e("small", null, "Handpicked pieces from verified artisans.")), e("button", { onClick: () => setQuery("") }, "See all →")), e(ErrorBanner, { message: err }), filtered.length === 0 ? e("div", { className: "empty-note" }, "No pieces match your search — try a different craft, material, or region.") : e("div", { className: "grid buyer-reference-grid" }, productCards)),
            e("section", { className: "buyer-why-handmade" }, e("div", null, e("span", null, "WHY BUY HANDMADE"), e("b", null, "More than products — a better tomorrow.")), e("div", null, e("i", null, "✓"), e("b", null, "Verified Handmade"), e("small", null, "Craft authenticity checked.")), e("div", null, e("i", null, "₹"), e("b", null, "Fair Price"), e("small", null, "Help makers earn fairly.")), e("div", null, e("i", null, "♟"), e("b", null, "Meet the Maker"), e("small", null, "Know the person behind your piece.")), e("div", null, e("i", null, "⌁"), e("b", null, "Craft Legacy"), e("small", null, "Every purchase keeps traditions alive."))),
            recentSection
        ),
        e("div", { className: "floating-cart-wrap" }, cartCount > 0 && e("button", { className: "floating-cart", onClick: () => go("cart") }, e("span", { className: "mini-cart-icon" }, e(Icon, { name: "cart" })), e("span", null, e("strong", null, "View cart"), e("small", null, `${cartCount} item${cartCount > 1 ? "s" : ""}`)), e("b", null, "›")))
    );
}
// ---------------------------------------------------------------------------
// BUYER: PRODUCT DETAIL
// ---------------------------------------------------------------------------
function ProductDetailScreen({ productId, go, back, setToast, wishlist, toggleWishlist, addToCart, userId }) {
    const [product, setProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [err, setErr] = useState(null);
    const [reported, setReported] = useState(false);
    const [customOpen, setCustomOpen] = useState(false);
    const [customRequest, setCustomRequest] = useState("");
    const [customId, setCustomId] = useState("");
    const [customizing, setCustomizing] = useState(false);
    const [customListening, setCustomListening] = useState(false);
    const customRecRef = useRef(null);
    useEffect(() => {
        apiGet(`/products/${productId}`).then((p) => {
            setProduct(p);
            setSelectedImage(p.image || null);
            if (userId)
                saveRecentProduct(userId, productId);
        }).catch((e) => setErr(e.message));
    }, [productId, userId]);
    function startCustomizationVoice() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            setToast('Voice input is not supported here — type your request instead.');
            return;
        }
        const run = async () => {
            const ok = await requestVoicePermission();
            if (!ok) {
                setToast('Please allow microphone access for voice customization.');
                return;
            }
            try {
                const rec = new SR();
                rec.lang = 'hi-IN';
                rec.interimResults = false;
                rec.continuous = false;
                rec.onstart = () => setCustomListening(true);
                rec.onend = () => setCustomListening(false);
                rec.onerror = () => { setCustomListening(false); setToast('I could not hear that. Please try again.'); };
                rec.onresult = (e) => { const heard = e.results?.[0]?.[0]?.transcript || ''; if (heard)
                    setCustomRequest(prev => (prev ? prev + ' ' : '') + heard); };
                customRecRef.current = rec;
                rec.start();
            }
            catch (_) {
                setCustomListening(false);
            }
        };
        run();
    }
    function stopCustomizationVoice() { try {
        customRecRef.current?.stop();
    }
    catch (_) { } setCustomListening(false); }
    if (err)
        return React.createElement("div", { className: "content" },
            React.createElement(ErrorBanner, { message: err }),
            React.createElement("button", { className: "btn secondary", onClick: back }, "\u2190 Go back"));
    if (!product)
        return React.createElement("div", { className: "content" },
            React.createElement("div", { className: "empty-note" }, "Loading\u2026"));
    const gallery = Array.isArray(product.gallery) && product.gallery.length ? product.gallery : [product.image];
    const mediaSrc = (img) => img ? (img.startsWith("http") || img.startsWith("data:") || img.startsWith("/") ? img : `/${img}`) : "";
    const delivery = 99, total = Number(product.price) + delivery, makerPct = 74;
    return React.createElement("div", { className: "product-page" },
        React.createElement("header", { className: "product-topbar" },
            React.createElement("button", { className: "product-back-btn product-back-primary", onClick: back, "aria-label": "Go back" },
                "\u2039 ",
                React.createElement("span", null, "Back")),
            React.createElement("div", { className: "product-brand" },
                React.createElement("img", { src: "/assets/logo.png", alt: "KalaSutra" }),
                React.createElement("span", null, "Handmade. Heartfelt. Home.")),
            React.createElement("div", { className: "product-search" },
                React.createElement(Icon, { name: "search" }),
                React.createElement("input", { placeholder: "Search for handmade, artisans, home decor\u2026" })),
            React.createElement("nav", null,
                React.createElement("button", { onClick: () => go("buyerHome") }, "Explore"),
                React.createElement("button", { onClick: () => go("buyerReels") }, "Artisans"),
                React.createElement("button", { onClick: () => go("orders") }, "Orders"),
                React.createElement("button", { onClick: () => go("cart") }, "Cart"))),
        React.createElement("button", { className: "mobile-floating-back", onClick: back },
            "\u2039 ",
            React.createElement("span", null, "Back")),
        React.createElement("main", { className: "product-container" },
            React.createElement("div", { className: "breadcrumb" },
                "Home\u3000\u203A\u3000Home Decor\u3000\u203A\u3000Lighting\u3000\u203A\u3000",
                product.title),
            React.createElement("div", { className: "product-main" },
                React.createElement("section", { className: "product-gallery-main" },
                    React.createElement("div", { className: "product-thumbs" }, gallery.slice(0, 5).map((img, i) => React.createElement("button", { key: img + i, className: selectedImage === img ? "active" : "", onClick: () => setSelectedImage(img) },
                        React.createElement("img", { src: mediaSrc(img), alt: `Craft ${i + 1}` })))),
                    React.createElement("div", { className: "product-hero-image", style: { backgroundImage: `url(${selectedImage || product.image})` } },
                        React.createElement("span", { className: "photo-badge" }, "\uD83C\uDF3F Handcrafted"),
                        React.createElement("span", { className: "eco-badge" }, "\u25C9 Eco-Friendly"),
                        React.createElement("button", { className: "gallery-arrow left", onClick: () => setSelectedImage(gallery[Math.max(0, gallery.indexOf(selectedImage || gallery[0]) - 1)]) }, "\u2039"),
                        React.createElement("button", { className: "gallery-arrow right", onClick: () => setSelectedImage(gallery[Math.min(gallery.length - 1, gallery.indexOf(selectedImage || gallery[0]) + 1)]) }, "\u203A"),
                        React.createElement("span", { className: "light-story" },
                            "Light",
                            React.createElement("br", null),
                            "Stories",
                            React.createElement("br", null),
                            "from \u2661",
                            React.createElement("br", null),
                            "Indian Hands \u2661")),
                    React.createElement("div", { className: "gallery-dots" }, gallery.slice(0, 5).map((_, i) => React.createElement("i", { key: i, className: gallery[i] === selectedImage ? "active" : "" }))),
                    React.createElement("div", { className: "story-card" },
                        React.createElement("div", { className: "story-card-head" },
                            React.createElement("em", null, "\u201CEvery weave tells a story of tradition, creativity and a brighter tomorrow.\u201D"),
                            React.createElement(ArtisanIdentityChip, { artisan: product.artisan, compact: true, tone: "story-identity" })),
                        React.createElement("div", { className: "story-benefits" },
                            React.createElement("span", null,
                                "\u2301",
                                React.createElement("b", null, "Eco-Friendly")),
                            React.createElement("span", null,
                                "\u2667",
                                React.createElement("b", null, "Empowers Artisans")),
                            React.createElement("span", null,
                                "\u2662",
                                React.createElement("b", null, "Adds Warmth"))))),
                React.createElement("section", { className: "product-info-panel" },
                    React.createElement("div", { className: "artisan-line" },
                        React.createElement(ArtisanIdentityChip, { artisan: product.artisan, compact: true, tone: "product-identity" }),
                        React.createElement("span", { className: "verified-pill" }, "\u2713 Verified Artisan")),
                    React.createElement("h1", null, product.title),
                    React.createElement("div", { className: "rating-line" },
                        React.createElement("strong", null, "\u2605\u2605\u2605\u2605\u2605"),
                        " ",
                        React.createElement("b", null, "4.8"),
                        " ",
                        React.createElement("span", null, "(120 reviews)"),
                        " ",
                        React.createElement("i", null, "289 sold"),
                        " ",
                        React.createElement("em", null, "\u2665 Handmade with love")),
                    React.createElement("p", { className: "product-description" }, product.description),
                    React.createElement("div", { className: "certificate-card large-certificate" },
                        React.createElement("div", { className: "qr-big" },
                            React.createElement("img", { alt: "Product QR", src: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + '/?certificate=' + (product.uniqueProductId || product.id))}` })),
                        React.createElement("div", null,
                            React.createElement("span", { className: "field-label" }, "DIGITAL PRODUCT ID"),
                            React.createElement("strong", null, product.uniqueProductId || "KS-ART-000001"),
                            React.createElement("small", null, "\u2713 Verified identity linked to this handmade piece"),
                            React.createElement("button", { onClick: () => setToast("Certificate story opened") }, "\u25EB Scan to know the artisan\u2019s story \u203A"))),
                    React.createElement("div", { className: "customize-card product-custom-card" },
                        React.createElement("div", null,
                            React.createElement("span", { className: "field-label" }, "MAKE IT YOURS"),
                            React.createElement("strong", null, "Customize this unique piece"),
                            React.createElement("small", null, "Personalize with a name, colour, size or small design change.")),
                        React.createElement("button", { className: "customize-price", onClick: () => setCustomOpen(v => !v) }, "Customize for \u20B9100 \u2192"),
                        customOpen && React.createElement("div", { className: "customize-form" },
                            React.createElement("div", { className: "custom-voice-row" },
                                React.createElement("span", null, "Tell us naturally in Hindi or English"),
                                React.createElement("button", { onClick: customListening ? stopCustomizationVoice : startCustomizationVoice }, customListening ? '⏹ Stop speaking' : '🎙 Speak request')),
                            React.createElement("textarea", { value: customRequest, onChange: e => setCustomRequest(e.target.value), placeholder: "e.g. mera naam Rahul likh do aur colour blue kar do" }),
                            React.createElement("button", { className: "btn", disabled: customizing, onClick: async () => { if (!customRequest.trim()) {
                                    setToast("Please describe your customization");
                                    return;
                                } setCustomizing(true); try {
                                    const c = await apiPost("/customizations", { productId: product.id, buyerId: userId, request: customRequest, charge: 100 });
                                    setCustomId(c.customizationId);
                                    setToast(`Customization ${c.customizationId} created • ₹100`);
                                    setCustomRequest("");
                                }
                                catch (e) {
                                    setToast(e.message || "Customization failed");
                                }
                                finally {
                                    setCustomizing(false);
                                } } }, customizing ? "Saving…" : "Request customization • ₹100"),
                            customId && React.createElement("small", null,
                                "\u2713 ",
                                customId))),
                    React.createElement("div", { className: "feature-strip" },
                        React.createElement("span", null,
                            "\u2301",
                            React.createElement("b", null,
                                "Sustainable",
                                React.createElement("br", null),
                                "Materials")),
                        React.createElement("span", null,
                            "\u2667",
                            React.createElement("b", null,
                                "100%",
                                React.createElement("br", null),
                                "Handmade")),
                        React.createElement("span", null,
                            "\u25B1",
                            React.createElement("b", null,
                                "Supports",
                                React.createElement("br", null),
                                "Rural Artisans")),
                        React.createElement("span", null,
                            "\u2661",
                            React.createElement("b", null,
                                makerPct,
                                "% Goes",
                                React.createElement("br", null),
                                "to the Maker"))),
                    React.createElement("div", { className: "checkout-box product-checkout" },
                        React.createElement("div", { className: "checkout-row" },
                            React.createElement("span", null, "Product price"),
                            React.createElement("b", null,
                                "\u20B9",
                                Number(product.price).toLocaleString("en-IN"))),
                        React.createElement("div", { className: "checkout-row" },
                            React.createElement("span", null, "Delivery charge"),
                            React.createElement("b", null,
                                "\u20B9",
                                delivery)),
                        React.createElement("div", { className: "checkout-row total" },
                            React.createElement("span", null, "Final price"),
                            React.createElement("b", null,
                                "\u20B9",
                                total.toLocaleString("en-IN")))),
                    React.createElement("button", { className: "product-add-btn", onClick: () => { addToCart(product.id); setToast("Added to cart 🛍️"); } }, "\uD83D\uDED2 Add to Cart"),
                    React.createElement("div", { className: "product-secondary-actions" },
                        React.createElement("button", null, "\uD83C\uDF81 Buy as Gift"),
                        React.createElement("button", { onClick: () => toggleWishlist(product.id) }, "\u2661 Save for Later")),
                    React.createElement("div", { className: "report-link", onClick: () => { if (!reported) {
                            setReported(true);
                            setToast("Reported — our trust & safety team will review this listing");
                        } } }, reported ? "✓ Reported — under review" : "🚩 Report Product: Not Handmade"))),
            React.createElement("section", { className: "buyer-reviews" },
                React.createElement("span", { className: "field-label" }, "BUYER REVIEWS"),
                React.createElement("h2", null, "What buyers say"),
                React.createElement("div", { className: "review-item" },
                    React.createElement("strong", null, "\u2605\u2605\u2605\u2605\u2605\u3000 Ananya"),
                    React.createElement("p", null, "Beautifully made and the craft story made the purchase feel personal.")),
                React.createElement("div", { className: "review-write" },
                    React.createElement("div", null, "\u2605\u2605\u2605\u2605\u2605"),
                    React.createElement("textarea", { placeholder: "Share your experience\u2026" }),
                    React.createElement("button", { onClick: () => setToast("Review posted") }, "Post review"))),
            React.createElement("section", { className: "you-may-like" },
                React.createElement("h2", null, "You May Also Like"),
                React.createElement("div", null, gallery.concat(gallery).slice(0, 6).map((img, i) => React.createElement("button", { key: i },
                    React.createElement("img", { src: mediaSrc(img), alt: "" }),
                    React.createElement("span", null, "\u2661")))))));
}
// ---------------------------------------------------------------------------
// BUYER: WISHLIST
// ---------------------------------------------------------------------------
function WishlistScreen({ user, openProduct, toggleWishlist }) {
    const [items, setItems] = useState([]);
    useEffect(() => { apiGet(`/wishlist?userId=${user.id}`).then(setItems); }, []);
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "app-header" },
            React.createElement("div", null,
                React.createElement("h2", null, "Wishlist"),
                React.createElement("div", { className: "sub" },
                    items.length,
                    " saved"))),
        React.createElement("div", { className: "content" }, items.length === 0 ? React.createElement("div", { className: "empty-note" }, "Nothing saved yet \u2014 tap the heart on any piece.") : (React.createElement("div", { className: "grid" }, items.map((p) => (React.createElement("div", { key: p.id, className: "card", onClick: () => openProduct(p.id) },
            React.createElement("div", { className: "thumb", style: { backgroundImage: `url(${p.image})` } },
                React.createElement(BadgeLabel, { status: p.verificationStatus }),
                React.createElement("span", { className: "emoji" }, CATEGORY_EMOJI[p.category] || "🎨")),
            React.createElement("div", { className: "info" },
                React.createElement("div", { className: "t" }, p.title),
                React.createElement("div", { className: "p" },
                    "\u20B9",
                    p.price.toLocaleString("en-IN")),
                React.createElement("div", { className: "product-id-mini" }, p.uniqueProductId || 'KS-ART-000001'))))))))));
}
// ---------------------------------------------------------------------------
// BUYER: CART / CHECKOUT
// ---------------------------------------------------------------------------
function CartScreen({ user, go, setToast, refreshCartCount }) {
    const [items, setItems] = useState([]);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [method, setMethod] = useState('razorpay');
    const [orderType, setOrderType] = useState('retail');
    const [bulkQty, setBulkQty] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [phone, setPhone] = useState(user.contact || '');
    const [area, setArea] = useState('');
    const [city, setCity] = useState('');
    const [pincode, setPincode] = useState('');
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationMessage, setLocationMessage] = useState('');
    function fillSavedLocation() {
        const loc = savedLocation();
        if (loc) {
            setArea(loc.area || '');
            setCity(loc.city || '');
            setPincode(loc.pincode || '');
            return true;
        }
        return false;
    }
    async function useMyLocation() {
        setLocationLoading(true);
        setLocationMessage('');
        try {
            if (!window.isSecureContext && !isLocalHost()) {
                window.location.href = securePhoneLocationUrl();
                return;
            }
            const loc = await requestCurrentLocation();
            setArea(loc.area || '');
            setCity(loc.city || '');
            setPincode(loc.pincode || '');
            setLocationMessage('✓ Location detected and address filled automatically');
        }
        catch (e) {
            setLocationMessage(e.message || 'Could not get location');
        }
        finally {
            setLocationLoading(false);
        }
    }
    function openCheckout() {
        setError(null);
        const hasSaved = fillSavedLocation();
        setCheckoutOpen(true);
        window.history.pushState({ kalasutraCheckout: true }, '', window.location.href);
        if (!hasSaved)
            useMyLocation();
    }
    function closeCheckout() {
        if (window.history.state?.kalasutraCheckout)
            window.history.back();
        else
            setCheckoutOpen(false);
    }
    useEffect(() => {
        const onPopState = () => setCheckoutOpen(false);
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);
    async function load() {
        try {
            const next = await apiGet(`/cart?userId=${user.id}`);
            setItems(next);
            const initial = {};
            next.forEach((i, index) => {
                initial[String(i.productId)] = i.qty + (index === 0 ? Math.max(0, 20 - i.qty) : 0);
            });
            setBulkQty(initial);
        }
        catch (e) {
            setError(e.message);
        }
    }
    useEffect(() => { load(); }, []);
    async function remove(productId) {
        await apiDelete('/cart', { userId: user.id, productId });
        load();
        refreshCartCount();
    }
    const total = items.reduce((s, i) => s + (i.product?.price || 0) * i.qty, 0);
    const retailQty = items.reduce((s, i) => s + i.qty, 0);
    const bulkTotalQty = items.reduce((s, i) => s + Math.max(1, Number(bulkQty[String(i.productId)] || i.qty || 1)), 0);
    const bulkSubtotal = items.reduce((s, i) => s + (i.product?.price || 0) * Math.max(1, Number(bulkQty[String(i.productId)] || i.qty || 1)), 0);
    const bulkDiscountRate = bulkTotalQty >= 100 ? 0.20 : bulkTotalQty >= 50 ? 0.15 : bulkTotalQty >= 20 ? 0.10 : 0;
    const bulkDiscount = Math.round(bulkSubtotal * bulkDiscountRate);
    const bulkTotal = bulkSubtotal - bulkDiscount;
    const bulkUnitAverage = bulkTotalQty ? Math.round(bulkTotal / bulkTotalQty) : 0;
    const address = { phone, area, city, pincode };
    function validateAddress() {
        if (!phone.trim() || !area.trim() || !city.trim() || !pincode.trim()) {
            setError('Please fill phone, area, city and pincode');
            return false;
        }
        if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
            setError('Please enter a valid 10-digit phone number');
            return false;
        }
        if (!/^\d{6}$/.test(pincode.trim())) {
            setError('Please enter a valid 6-digit pincode');
            return false;
        }
        return true;
    }
    function updateBulkQuantity(productId, delta) {
        setBulkQty(prev => {
            const current = Math.max(1, Number(prev[String(productId)] || 1));
            return { ...prev, [String(productId)]: Math.max(1, current + delta) };
        });
    }
    function chooseBulkTier(min) {
        if (!items.length)
            return;
        const firstId = String(items[0].productId);
        setBulkQty(prev => ({ ...prev, [firstId]: Math.max(min, Number(prev[firstId] || 1)) }));
    }
    function requestBulkOrder() {
        setError(null);
        if (!validateAddress())
            return;
        if (bulkTotalQty < 20) {
            setError('Bulk / B2B orders start at 20 pieces. Increase the quantity to continue.');
            return;
        }
        const request = {
            id: `BULK-${Date.now().toString(36).toUpperCase()}`,
            buyerId: user.id,
            buyerName: user.name,
            address,
            items: items.map(i => ({
                productId: i.productId,
                title: i.product?.title,
                quantity: Math.max(1, Number(bulkQty[String(i.productId)] || i.qty || 1)),
                unitPrice: i.product?.price || 0
            })),
            pieces: bulkTotalQty,
            subtotal: bulkSubtotal,
            discountRate: bulkDiscountRate,
            estimatedTotal: bulkTotal,
            createdAt: new Date().toISOString(),
            status: 'quote_requested'
        };
        localStorage.setItem('kalasutra_last_bulk_request', JSON.stringify(request));
        setToast(`Bulk request ${request.id} saved • ${bulkTotalQty} pieces`);
        notifyUser('KalaSutra bulk request received', `Your ${bulkTotalQty}-piece B2B request is saved for follow-up.`);
        closeCheckout();
    }
    async function placeCOD() {
        if (!validateAddress())
            return;
        setLoading(true);
        setError(null);
        try {
            await apiPost('/checkout/cod', { buyerId: user.id, address });
            setToast('COD order placed successfully 🎉');
            notifyUser('KalaSutra order confirmed', 'Your Cash on Delivery order has been placed successfully.');
            load();
            refreshCartCount();
            closeCheckout();
            go('orders');
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    }
    async function payOnline() {
        if (!validateAddress())
            return;
        setLoading(true);
        setError(null);
        try {
            const config = await apiGet('/payment/config');
            if (!config.configured)
                throw new Error('Razorpay is not configured on the server yet. Add your Razorpay API keys first.');
            const data = await apiPost('/payment/create-order', { buyerId: user.id });
            if (!window.Razorpay)
                throw new Error('Razorpay checkout could not load. Please check your internet connection.');
            const options = {
                key: data.keyId, amount: Math.round(data.amount * 100), currency: data.currency,
                name: 'KalaSutra', description: 'Handcrafted artisan products', order_id: data.orderId,
                prefill: { name: user.name, contact: phone },
                notes: { buyerId: String(user.id) },
                theme: { color: '#c93f78' },
                handler: async (response) => {
                    try {
                        setLoading(true);
                        await apiPost('/payment/verify', { buyerId: user.id, address, ...response });
                        setToast('Payment successful — order confirmed 🎉');
                        notifyUser('KalaSutra payment successful', 'Your payment was verified and your order is confirmed.');
                        load();
                        refreshCartCount();
                        closeCheckout();
                        go('orders');
                    }
                    catch (e) {
                        setError(e.message);
                    }
                    finally {
                        setLoading(false);
                    }
                },
                modal: { ondismiss: () => setLoading(false) }
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response) => { setError(response?.error?.description || 'Payment failed. Please try again.'); setLoading(false); });
            rzp.open();
        }
        catch (e) {
            setError(e.message);
            setLoading(false);
        }
    }
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "app-header" },
            React.createElement("div", null,
                React.createElement("h2", null, "Your Cart"),
                React.createElement("div", { className: "sub" },
                    items.length,
                    " item(s)"))),
        React.createElement("div", { className: "content" }, items.length === 0 ? React.createElement("div", { className: "empty-note" }, "Your cart is empty.") : (React.createElement(React.Fragment, null,
            items.map((i) => (React.createElement("div", { className: "order-item", key: i.productId },
                React.createElement("div", null,
                    React.createElement("strong", { style: { fontSize: 12.5 } },
                        i.product?.title,
                        " \u00D7 ",
                        i.qty),
                    React.createElement("div", { style: { fontSize: 11, color: '#6b6055' } },
                        "\u20B9",
                        i.product?.price.toLocaleString('en-IN'))),
                React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: 'var(--madder)', cursor: 'pointer' }, onClick: () => remove(i.productId) }, "Remove")))),
            React.createElement("div", { className: "checkout-row total", style: { margin: '16px 0' } },
                React.createElement("span", null, "Total"),
                React.createElement("span", null,
                    "\u20B9",
                    total.toLocaleString('en-IN'))),
            React.createElement("button", { className: "btn", onClick: openCheckout }, "Continue to payment")))),
        checkoutOpen && React.createElement("div", { className: "payment-overlay" },
            React.createElement("div", { className: "payment-sheet bulk-checkout-sheet" },
                React.createElement("div", { className: "payment-topbar" },
                    React.createElement("button", { onClick: closeCheckout, "aria-label": "Back" }, "\u2039"),
                    React.createElement("div", null,
                        React.createElement("small", null, "SECURE CHECKOUT"),
                        React.createElement("h2", null, "Delivery and payment")),
                    React.createElement("button", { onClick: closeCheckout, "aria-label": "Close" }, "\u00D7")),
                React.createElement("div", { className: "payment-body" },
                    React.createElement("div", { className: "payment-section-title" }, "Delivery details"),
                    React.createElement("div", { className: "payment-field" },
                        React.createElement("span", null, "\u260E"),
                        React.createElement("input", { value: phone, onChange: e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)), placeholder: "10-digit mobile number" })),
                    React.createElement("div", { className: "payment-field" },
                        React.createElement("span", null, "\u2302"),
                        React.createElement("input", { value: area, onChange: e => setArea(e.target.value), placeholder: "Area / locality" })),
                    React.createElement("div", { className: "payment-field" },
                        React.createElement("span", null, "\u2316"),
                        React.createElement("input", { value: city, onChange: e => setCity(e.target.value), placeholder: "City" })),
                    React.createElement("div", { className: "payment-field" },
                        React.createElement("span", null, "\u27A4"),
                        React.createElement("input", { value: pincode, onChange: e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)), placeholder: "6-digit pincode" })),
                    React.createElement("button", { className: "location-fill-btn", onClick: useMyLocation, disabled: locationLoading },
                        "\u2316 ",
                        locationLoading ? 'Detecting your location…' : 'Use my current location & auto-fill'),
                    locationMessage && React.createElement("div", { className: "location-fill-note" }, locationMessage),
                    React.createElement("div", { className: "bulk-order-card" },
                        React.createElement("div", { className: "bulk-order-head" },
                            React.createElement("div", { className: "bulk-order-icon" }, "\u25A6"),
                            React.createElement("div", null,
                                React.createElement("div", { className: "bulk-order-kicker" }, "ORDER TYPE"),
                                React.createElement("h3", null, "How do you want to order?"),
                                React.createElement("p", null, "For shops, studios, hotels and larger craft collections."))),
                        React.createElement("div", { className: "bulk-order-tabs" },
                            React.createElement("button", { className: orderType === 'retail' ? 'active' : '', onClick: () => setOrderType('retail') },
                                React.createElement("span", null, "Retail"),
                                React.createElement("small", null, "Regular purchase")),
                            React.createElement("button", { className: orderType === 'bulk' ? 'active' : '', onClick: () => setOrderType('bulk') },
                                React.createElement("span", null, "Bulk / B2B"),
                                React.createElement("small", null, "20+ pieces"))),
                        orderType === 'bulk' ? (React.createElement("div", { className: "bulk-order-panel" },
                            React.createElement("div", { className: "bulk-benefit-row" },
                                React.createElement("span", null, "\uD83E\uDDF5 Direct artisan sourcing"),
                                React.createElement("span", null, "\uD83D\uDCE6 Volume pricing")),
                            React.createElement("div", { className: "bulk-tier-row" },
                                React.createElement("button", { onClick: () => chooseBulkTier(20), className: bulkTotalQty >= 20 ? 'chosen' : '' },
                                    React.createElement("b", null, "20+"),
                                    React.createElement("small", null, "10% off")),
                                React.createElement("button", { onClick: () => chooseBulkTier(50), className: bulkTotalQty >= 50 ? 'chosen' : '' },
                                    React.createElement("b", null, "50+"),
                                    React.createElement("small", null, "15% off")),
                                React.createElement("button", { onClick: () => chooseBulkTier(100), className: bulkTotalQty >= 100 ? 'chosen' : '' },
                                    React.createElement("b", null, "100+"),
                                    React.createElement("small", null, "20% off"))),
                            React.createElement("div", { className: "bulk-items-list" }, items.map(i => {
                                const q = Math.max(1, Number(bulkQty[String(i.productId)] || i.qty || 1));
                                return React.createElement("div", { className: "bulk-item-row", key: `bulk-${i.productId}` },
                                    React.createElement("div", null,
                                        React.createElement("strong", null, i.product?.title),
                                        React.createElement("small", null,
                                            "\u20B9",
                                            Number(i.product?.price || 0).toLocaleString('en-IN'),
                                            " / piece")),
                                    React.createElement("div", { className: "bulk-qty-control" },
                                        React.createElement("button", { onClick: () => updateBulkQuantity(i.productId, -1), "aria-label": "Decrease quantity" }, "\u2212"),
                                        React.createElement("b", null, q),
                                        React.createElement("button", { onClick: () => updateBulkQuantity(i.productId, 1), "aria-label": "Increase quantity" }, "+")));
                            })),
                            React.createElement("div", { className: "bulk-price-box" },
                                React.createElement("div", null,
                                    React.createElement("span", null, "Total pieces"),
                                    React.createElement("strong", null, bulkTotalQty)),
                                React.createElement("div", null,
                                    React.createElement("span", null, "Volume discount"),
                                    React.createElement("strong", null,
                                        Math.round(bulkDiscountRate * 100),
                                        "%")),
                                React.createElement("div", { className: "bulk-final-price" },
                                    React.createElement("span", null, "Estimated total"),
                                    React.createElement("strong", null,
                                        "\u20B9",
                                        bulkTotal.toLocaleString('en-IN'))),
                                React.createElement("small", null,
                                    "Approx. \u20B9",
                                    bulkUnitAverage.toLocaleString('en-IN'),
                                    " per piece after volume discount.")),
                            React.createElement("div", { className: "bulk-note" }, "Bulk requests are reviewed with the artisan so larger orders can be confirmed at a fair, direct-to-maker price."))) : (React.createElement("div", { className: "bulk-retail-note" },
                            "Regular checkout for individual purchases. Switch to ",
                            React.createElement("b", null, "Bulk / B2B"),
                            " when you need 20+ pieces."))),
                    orderType === 'retail' && React.createElement(React.Fragment, null,
                        React.createElement("div", { className: "payment-section-title payment-method-title" }, "Payment method"),
                        React.createElement("button", { className: `payment-method-card ${method === 'razorpay' ? 'selected' : ''}`, onClick: () => setMethod('razorpay') },
                            React.createElement("span", { className: "payment-method-icon" }, "\u25A3"),
                            React.createElement("span", null,
                                React.createElement("strong", null, "Razorpay secure payment"),
                                React.createElement("small", null, "Google Pay, PhonePe, UPI, cards and netbanking")),
                            React.createElement("i", null, method === 'razorpay' ? '●' : '○')),
                        React.createElement("button", { className: `payment-method-card ${method === 'cod' ? 'selected' : ''}`, onClick: () => setMethod('cod') },
                            React.createElement("span", { className: "payment-method-icon" }, "\u25A4"),
                            React.createElement("span", null,
                                React.createElement("strong", null, "Cash on delivery"),
                                React.createElement("small", null, "Pay when your order arrives")),
                            React.createElement("i", null, method === 'cod' ? '●' : '○')),
                        React.createElement("div", { className: "payment-trust" },
                            "\u2713 ",
                            method === 'razorpay' ? 'Payment is completed on Razorpay and verified before your order is created.' : 'Your order is confirmed now. Pay in cash when the artisan order arrives.')),
                    error && React.createElement("div", { className: "payment-error" }, error),
                    orderType === 'bulk' ? (React.createElement("div", { className: "payment-summary bulk-summary" },
                        React.createElement("span", null,
                            React.createElement("small", null,
                                bulkTotalQty,
                                " pieces \u2022 ",
                                Math.round(bulkDiscountRate * 100),
                                "% volume discount"),
                            React.createElement("strong", null,
                                "\u20B9",
                                bulkTotal.toLocaleString('en-IN'))),
                        React.createElement("button", { onClick: requestBulkOrder, disabled: loading || bulkTotalQty < 20 }, loading ? 'Saving…' : `Request bulk order • ${bulkTotalQty} pieces`))) : (React.createElement("div", { className: "payment-summary" },
                        React.createElement("span", null,
                            React.createElement("small", null,
                                retailQty,
                                " items"),
                            React.createElement("strong", null,
                                "\u20B9",
                                total.toLocaleString('en-IN'))),
                        React.createElement("button", { onClick: method === 'razorpay' ? payOnline : placeCOD, disabled: loading }, loading ? 'Processing…' : method === 'razorpay' ? `Pay ₹${total.toLocaleString('en-IN')} securely` : `Place COD order • ₹${total.toLocaleString('en-IN')}`))))))));
}
// ---------------------------------------------------------------------------
// ORDERS (shared shape, buyer-focused)
// ---------------------------------------------------------------------------
function SafetyReviewScreen({ go, setToast }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    async function load() { setLoading(true); try {
        setItems(await apiGet('/reviews'));
    }
    finally {
        setLoading(false);
    } }
    useEffect(() => { load(); }, []);
    async function decide(id, status) {
        await apiPut(`/reviews/${id}`, { status, note: status === 'approved' ? 'Human reviewer approved after checking evidence.' : 'Human reviewer rejected after checking evidence.' });
        setToast(status === 'approved' ? 'Listing approved by human review.' : 'Listing rejected by human review.');
        load();
    }
    return React.createElement("div", { className: "content" },
        React.createElement("div", { className: "app-header" },
            React.createElement("button", { className: "header-back", onClick: () => go('dashboard') }, "\u2039"),
            React.createElement("div", null,
                React.createElement("h2", null, "Safety & Review Center"),
                React.createElement("div", { className: "sub" }, "AI flags suspicious activity \u2014 humans decide"))),
        React.createElement("div", { className: "trust-box", style: { marginBottom: 14 } },
            React.createElement("strong", null, "AI Risk Protection"),
            React.createElement("small", { style: { display: 'block', marginTop: 5 } }, "Risk signals include missing proof, duplicate images and suspicious listing patterns. AI never makes the final decision.")),
        loading ? React.createElement("div", { className: "empty-note" }, "Loading review queue\u2026") : items.length === 0 ? React.createElement("div", { className: "empty-note" }, "\uD83D\uDFE2 No suspicious listings waiting for review.") : items.map((r) => React.createElement("div", { className: "card", key: r.id, style: { marginBottom: 12 } },
            React.createElement("div", { className: "thumb", style: { backgroundImage: `url(${r.product?.image || ''})` } }),
            React.createElement("div", { className: "info" },
                React.createElement("div", { className: "t" }, r.product?.title || 'Unknown listing'),
                React.createElement("div", { className: "p" },
                    "AI Risk Score: ",
                    r.riskScore,
                    "/100"),
                React.createElement("div", { style: { fontSize: 11, color: '#8a2f25', marginTop: 5 } }, r.reason),
                React.createElement("div", { className: "btn-row", style: { marginTop: 10 } },
                    React.createElement("button", { className: "btn green", onClick: () => decide(r.id, 'approved') }, "Human Approve"),
                    React.createElement("button", { className: "btn secondary", onClick: () => decide(r.id, 'rejected') }, "Reject"))))));
}
function OrdersScreen({ user, go }) {
    const [orders, setOrders] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    useEffect(() => { apiGet(`/orders?userId=${user.id}`).then(setOrders); }, [user.id]);
    const isArtisan = user.role === 'artisan';
    const statusLabel = { placed: 'New Orders', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', paid: 'New Orders' };
    const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
    const earnings = isArtisan ? orders.reduce((sum, o) => sum + (o.artisanItems || []).reduce((s, p) => s + Number(p.price || 0) * Number(p.qty || 0), 0), 0) : 0;
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "app-header" },
            React.createElement("button", { className: "header-back", onClick: () => go ? go(isArtisan ? 'dashboard' : 'buyerHome') : null, "aria-label": "Back" }, "\u2039"),
            React.createElement("div", null,
                React.createElement("h2", null, isArtisan ? 'Orders & Earnings' : 'Your Orders'),
                React.createElement("div", { className: "sub" }, isArtisan ? 'Manage your artisan business' : 'Track your purchases'))),
        React.createElement("div", { className: "content" },
            isArtisan && React.createElement("div", { className: "artisan-order-summary" },
                React.createElement("div", null,
                    React.createElement("small", null, "EARNINGS"),
                    React.createElement("strong", null,
                        "\u20B9",
                        earnings.toLocaleString('en-IN'))),
                React.createElement("div", null,
                    React.createElement("small", null, "NEW ORDERS"),
                    React.createElement("strong", null, orders.filter(o => ['placed', 'paid'].includes(o.status)).length)),
                React.createElement("div", null,
                    React.createElement("small", null, "DELIVERED"),
                    React.createElement("strong", null, orders.filter(o => o.status === 'delivered').length))),
            isArtisan && React.createElement("div", { className: "order-filter-row" }, [['all', 'All'], ['placed', 'New Orders'], ['processing', 'Processing'], ['shipped', 'Shipped'], ['delivered', 'Delivered']].map(([v, l]) => React.createElement("button", { key: v, className: statusFilter === v ? 'active' : '', onClick: () => setStatusFilter(v) }, l))),
            filtered.length === 0 ? React.createElement("div", { className: "empty-note" }, isArtisan ? 'No artisan orders yet. Orders will appear here when buyers purchase your products.' : 'No orders yet.') : filtered.map((o) => (React.createElement("div", { className: "order-item", key: o.id },
                React.createElement("div", null,
                    React.createElement("strong", { style: { fontSize: 12.5 } }, (isArtisan ? o.artisanItems : o.products).map((p) => p.title).join(', ')),
                    React.createElement("div", { style: { fontSize: 11, color: '#6b6055' } },
                        "\u20B9",
                        Number(isArtisan ? (o.artisanItems || []).reduce((s, p) => s + p.price * p.qty, 0) : o.amount).toLocaleString('en-IN'),
                        " \u00B7 ",
                        new Date(o.date).toLocaleDateString())),
                React.createElement("span", { className: "st" }, isArtisan ? (statusLabel[o.status] || o.status) : o.status)))))));
}
// ---------------------------------------------------------------------------
// BUYER: PROFILE
// ---------------------------------------------------------------------------
function BuyerProfileScreen({ user, onLogout, go, openProduct }) {
    const profile = user.profile || {};
    const [editing, setEditing] = useState(false);
    const [city, setCity] = useState(profile.location || "");
    const [saved, setSaved] = useState(false);
    const [avatar, setAvatar] = useState(() => localStorage.getItem(`kalasutra_avatar_${user.id}`) || profile.avatar || "/assets/avatar-artisan.png");
    const [products, setProducts] = useState([]);
    const [recentIds, setRecentIds] = useState([]);
    const recentKey = `kalasutra_recent_products_${user.id}`;
    async function handleAvatarPick(e) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        try {
            const data = await fileToDataURL(file);
            setAvatar(data);
            localStorage.setItem(`kalasutra_avatar_${user.id}`, data);
        }
        catch (_) { }
        e.target.value = "";
    }
    function loadRecent() {
        setRecentIds(getRecentProductIds(user.id));
    }
    useEffect(() => {
        apiGet(`/products`).then(setProducts).catch(() => setProducts([]));
        loadRecent();
        const refresh = () => loadRecent();
        window.addEventListener("kalasutra:recent-product", refresh);
        return () => window.removeEventListener("kalasutra:recent-product", refresh);
    }, [user.id]);
    const recent = recentIds.map(id => products.find(p => String(p.id) === String(id))).filter(Boolean).slice(0, 4);
    function saveBuyer() { setSaved(true); setEditing(false); }
    return (React.createElement("div", { className: "profile-page buyer-profile-page" },
        React.createElement("header", { className: "profile-topbar profile-topbar-with-back" },
            React.createElement("button", { className: "profile-back-btn", onClick: () => go("buyerHome"), "aria-label": "Back" }, "\u2039"),
            React.createElement("button", { className: "profile-logo-button", onClick: () => go("buyerHome"), "aria-label": "Go home" },
                React.createElement("img", { src: "/assets/logo.png", className: "profile-logo", alt: "KalaSutra" })),
            React.createElement("div", { className: "profile-top-actions" },
                React.createElement("button", { onClick: () => go("buyerHome"), "aria-label": "Explore" },
                    React.createElement(Icon, { name: "search" })),
                React.createElement("button", { onClick: () => go("orders"), "aria-label": "Orders" },
                    React.createElement(Icon, { name: "bell" }),
                    React.createElement("span", { className: "notification-dot" })),
                React.createElement("button", { onClick: () => setEditing(v => !v), "aria-label": "Settings" }, "\u2699"),
                React.createElement("span", { className: "profile-top-slogan" },
                    "Good Choices",
                    React.createElement("br", null),
                    "Create Greater Impact \u2661"))),
        React.createElement("main", { className: "profile-container" },
            React.createElement("section", { className: "profile-hero buyer-hero" },
                React.createElement("div", { className: "profile-avatar-wrap buyer-avatar-wrap" },
                    React.createElement("img", { src: avatar, className: "profile-avatar buyer-avatar", alt: "Buyer profile" }),
                    React.createElement("input", { id: "buyerAvatarInput", className: "avatar-file-input", type: "file", accept: "image/*", capture: "user", onChange: handleAvatarPick }),
                    React.createElement("label", { htmlFor: "buyerAvatarInput", className: "avatar-camera", title: "Upload profile photo" }, "\u233E")),
                React.createElement("div", { className: "profile-identity" },
                    React.createElement("h1", null, user.name),
                    React.createElement("h3", null, "\uD83C\uDF3F Conscious buyer"),
                    React.createElement("p", { className: "profile-quote" },
                        "\u201CSupporting artisans, preserving traditions",
                        React.createElement("br", null),
                        "and bringing handmade stories home.\u201D"),
                    React.createElement("div", { className: "buyer-meta" },
                        React.createElement("span", null,
                            "\u2316 ",
                            city || "India"),
                        React.createElement("span", null, "\u25CE Exploring global crafts"),
                        React.createElement("span", null, "\u2665 Handmade \u00B7 Sustainable \u00B7 Meaningful"))),
                React.createElement("div", { className: "profile-hero-art buyer-art" },
                    React.createElement("div", { className: "handmade-script" },
                        "More",
                        React.createElement("br", null),
                        "Handmade",
                        React.createElement("br", null),
                        "A Kinder World \u2661"),
                    React.createElement("div", { className: "hero-temple-art" })),
                React.createElement("button", { className: "profile-edit-btn", onClick: () => setEditing(v => !v) },
                    "\u270E ",
                    editing ? "Close" : "Edit Profile")),
            editing && (React.createElement("section", { className: "profile-edit-panel" },
                React.createElement("label", null,
                    "Delivery location",
                    React.createElement("input", { value: city, onChange: e => setCity(e.target.value), placeholder: "City / locality" })),
                React.createElement("button", { className: "profile-primary-btn", onClick: saveBuyer }, "Save buyer profile"))),
            React.createElement(LocationTools, { mode: "buyer", initial: city }),
            React.createElement("section", { className: "buyer-stat-layout" },
                React.createElement("div", { className: "profile-stat-grid buyer-stats" },
                    React.createElement("button", { onClick: () => go("orders") },
                        React.createElement("b", null, "12"),
                        React.createElement("span", null, "Orders Placed")),
                    React.createElement("button", { onClick: () => go("wishlist") },
                        React.createElement("b", null, "28"),
                        React.createElement("span", null, "Items Liked")),
                    React.createElement("button", { onClick: () => go("buyerReels") },
                        React.createElement("b", null, "46"),
                        React.createElement("span", null, "Artisans Followed")),
                    React.createElement("div", null,
                        React.createElement("b", null, "4.8"),
                        React.createElement("span", null, "Average Rating"))),
                React.createElement("button", { className: "conscious-card conscious-card-button", onClick: () => go("buyerReels") },
                    React.createElement("span", null, "\uD83C\uDF3F"),
                    React.createElement("div", null,
                        React.createElement("strong", null, "Conscious Buyer"),
                        React.createElement("small", null,
                            "You support traditional artisans",
                            React.createElement("br", null),
                            "and sustainable crafts.")),
                    React.createElement("b", null, "\u203A"))),
            React.createElement("div", { className: "buyer-impact-grid" },
                React.createElement("section", null,
                    React.createElement("div", { className: "quick-heading" },
                        React.createElement("h2", null, "Quick Actions"),
                        React.createElement("span", null,
                            "Shop",
                            React.createElement("br", null),
                            "Support",
                            React.createElement("br", null),
                            "Empower \u2661")),
                    React.createElement("div", { className: "quick-actions buyer-quick-actions" },
                        React.createElement("button", { onClick: () => go("orders") },
                            React.createElement("span", null, "\u25A3"),
                            React.createElement("b", null, "My Orders")),
                        React.createElement("button", { onClick: () => go("wishlist") },
                            React.createElement("span", null, "\u2665"),
                            React.createElement("b", null, "My Wishlist")),
                        React.createElement("button", { onClick: () => go("buyerReels") },
                            React.createElement("span", null, "\u265F"),
                            React.createElement("b", null, "Saved Artisans")),
                        React.createElement("button", { onClick: () => { setEditing(true); window.scrollTo({ top: 0, behavior: "smooth" }); } },
                            React.createElement("span", null, "\u2316"),
                            React.createElement("b", null, "Addresses")))),
                React.createElement("section", { className: "your-impact-card" },
                    React.createElement("span", { className: "impact-leaf" }, "\uD83C\uDF3F"),
                    React.createElement("div", null,
                        React.createElement("h3", null, "Your Impact"),
                        React.createElement("p", null, "Every purchase empowers an artisan.")),
                    React.createElement("div", { className: "impact-numbers" },
                        React.createElement("span", null,
                            React.createElement("b", null, "12"),
                            React.createElement("small", null, "Artisans Supported")),
                        React.createElement("span", null,
                            React.createElement("b", null, "28"),
                            React.createElement("small", null, "Handmade Pieces")),
                        React.createElement("span", null,
                            React.createElement("b", null, "3"),
                            React.createElement("small", null, "Regions Explored"))))),
            React.createElement("section", { className: "recently-viewed" },
                React.createElement("div", { className: "section-row" },
                    React.createElement("h2", null, "Recently Viewed"),
                    React.createElement("button", { className: "text-link-btn", onClick: () => go("buyerHome") }, "Explore \u2192")),
                recent.length ? React.createElement("div", { className: "recent-grid" }, recent.map((p) => React.createElement("button", { className: "recent-real-card", key: p.id, onClick: () => openProduct(p.id) },
                    React.createElement("div", { className: "recent-img real-recent-img", style: { backgroundImage: `url(${p.image})` } }),
                    React.createElement("b", null, p.title),
                    React.createElement("strong", null,
                        "\u20B9",
                        Number(p.price || 0).toLocaleString("en-IN"))))) : React.createElement("div", { className: "recent-empty" }, "Open a product from Explore and it will appear here automatically.")),
            React.createElement("div", { className: "quick-banner buyer-banner" },
                React.createElement("div", null,
                    React.createElement("em", null,
                        "Handmade",
                        React.createElement("br", null),
                        "Stories",
                        React.createElement("br", null),
                        "Better Tomorrows \u2661"),
                    React.createElement("button", { onClick: () => go("buyerHome") }, "Explore More \u2192"))),
            React.createElement("button", { className: "logout-wide", onClick: onLogout }, "Log out"),
            saved && React.createElement("div", { className: "saved-note" }, "\u2713 Buyer profile saved"))));
}
// ---------------------------------------------------------------------------
// BUYER: REELS FEED
// ---------------------------------------------------------------------------
function ReelsFeedScreen({ openProduct, setToast }) {
    const [reels, setReels] = useState([]), [liked, setLiked] = useState({}), [saved, setSaved] = useState({}), [counts, setCounts] = useState({}), [comments, setComments] = useState({}), [commentOpen, setCommentOpen] = useState(null), [commentText, setCommentText] = useState("");
    useEffect(() => { apiGet(`/reels`).then(data => { setReels(data); try {
        const l = JSON.parse(localStorage.getItem("kalasutra_reel_likes") || "{}"), s = JSON.parse(localStorage.getItem("kalasutra_reel_saves") || "{}"), c = JSON.parse(localStorage.getItem("kalasutra_reel_comments") || "{}"), n = {};
        data.forEach((r) => n[String(r.id)] = Number(r.likes || 0));
        Object.keys(l).forEach(id => { if (l[id])
            n[id] = (n[id] || 0) + 1; });
        setLiked(l);
        setSaved(s);
        setComments(c);
        setCounts(n);
    }
    catch (_) { } }).catch(() => setReels([])); }, []);
    const like = (id) => { const k = String(id), v = !liked[k], l = { ...liked, [k]: v }, n = { ...counts, [k]: Math.max(0, (counts[k] || 0) + (v ? 1 : -1)) }; setLiked(l); setCounts(n); localStorage.setItem("kalasutra_reel_likes", JSON.stringify(l)); setToast(v ? "Liked ❤️" : "Like removed"); };
    const save = (id) => { const k = String(id), v = !saved[k], s = { ...saved, [k]: v }; setSaved(s); localStorage.setItem("kalasutra_reel_saves", JSON.stringify(s)); setToast(v ? "Reel saved 🔖" : "Removed from saved"); };
    async function share(r) { const url = window.location.href.split("#")[0] + `?reel=${encodeURIComponent(r.id)}`; try {
        if (navigator.share)
            await navigator.share({ title: "KalaSutra Maker Reel", text: r.caption || "See this handmade craft story on KalaSutra", url });
        else {
            await navigator.clipboard.writeText(url);
            setToast("Reel link copied ↗");
        }
    }
    catch (_) { } }
    const comment = (id) => { const v = commentText.trim(); if (!v)
        return; const k = String(id), next = [...(comments[k] || []), v], all = { ...comments, [k]: next }; setComments(all); setCommentText(""); localStorage.setItem("kalasutra_reel_comments", JSON.stringify(all)); setToast("Comment added 💬"); };
    return React.createElement("div", { className: "reels-wrap" },
        reels.length === 0 && React.createElement("div", { className: "empty-note", style: { paddingTop: 100 } }, "No Reels yet \u2014 check back soon."),
        reels.map(r => { const k = String(r.id), list = comments[k] || [], num = counts[k] ?? Number(r.likes || 0); return React.createElement("div", { className: "reel", key: r.id },
            r.video ? React.createElement("video", { src: r.video, className: "reel-visual", style: { objectFit: "cover", fontSize: 0 }, autoPlay: true, loop: true, muted: true, playsInline: true }) : React.createElement("div", { className: "reel-visual", style: { background: "#8a5a3a" } }, r.thumbEmoji),
            React.createElement("div", { className: "reel-gradient" }),
            React.createElement("div", { className: "reel-overlay" },
                React.createElement("div", { className: "reel-info" },
                    React.createElement(ArtisanIdentityChip, { artisan: r.artisan, compact: true, tone: "reel-feed-identity" }),
                    React.createElement("strong", null,
                        "@",
                        r.artisan?.name?.toLowerCase().replace(/\s+/g, ".") || "artisan"),
                    React.createElement("span", null, r.caption),
                    r.product && React.createElement("div", null,
                        React.createElement("span", { className: "badge-inline", style: { background: "#e2f0e4", color: "var(--green)" } },
                            React.createElement(BadgeLabel, { status: r.product.verificationStatus })),
                        React.createElement("div", { className: "view-btn", onClick: () => openProduct(r.product.id) }, "\uD83D\uDECD\uFE0F View Product"))),
                React.createElement("div", { className: "reel-actions" },
                    React.createElement("button", { className: `act ${liked[k] ? "active" : ""}`, onClick: () => like(k) },
                        React.createElement("span", { className: "ic" }, liked[k] ? "❤️" : "♡"),
                        num),
                    React.createElement("button", { className: `act ${commentOpen === k ? "active" : ""}`, onClick: () => setCommentOpen(commentOpen === k ? null : k) },
                        React.createElement("span", { className: "ic" }, "\uD83D\uDCAC"),
                        Number(r.comments || 0) + list.length),
                    React.createElement("button", { className: `act ${saved[k] ? "active" : ""}`, onClick: () => save(k) },
                        React.createElement("span", { className: "ic" }, saved[k] ? "🔖" : "◇"),
                        saved[k] ? "Saved" : "Save"),
                    React.createElement("button", { className: "act", onClick: () => share(r) },
                        React.createElement("span", { className: "ic" }, "\u2197"),
                        "Share")),
                commentOpen === k && React.createElement("div", { className: "reel-comments-sheet" },
                    React.createElement("div", { className: "reel-comments-title" },
                        React.createElement("strong", null, "Comments"),
                        React.createElement("button", { onClick: () => setCommentOpen(null) }, "\u00D7")),
                    React.createElement("div", { className: "reel-comments-list" }, list.length === 0 ? React.createElement("small", null, "No comments yet. Start the conversation.") : list.map((x, i) => React.createElement("div", { key: i },
                        React.createElement("b", null, "You"),
                        React.createElement("span", null, x)))),
                    React.createElement("div", { className: "reel-comment-input" },
                        React.createElement("input", { value: commentText, onChange: e => setCommentText(e.target.value), onKeyDown: e => { if (e.key === "Enter")
                                comment(k); }, placeholder: "Write a comment\u2026" }),
                        React.createElement("button", { onClick: () => comment(k) }, "Post"))))); }));
}
// ---------------------------------------------------------------------------
// DIGITAL PRODUCT CERTIFICATE — public QR destination
// ---------------------------------------------------------------------------
function CertificateScreen({ certificateId }) {
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);
    useEffect(() => { apiGet(`/certificate/${encodeURIComponent(certificateId)}`).then(setData).catch((e) => setErr(e.message)); }, [certificateId]);
    if (err)
        return React.createElement("div", { className: "certificate-public" },
            React.createElement("img", { src: "/assets/logo.png", className: "certificate-public-logo" }),
            React.createElement("div", { className: "certificate-public-card" },
                React.createElement("h2", null, "Certificate unavailable"),
                React.createElement("p", null, err)));
    if (!data)
        return React.createElement("div", { className: "certificate-public" },
            React.createElement("img", { src: "/assets/logo.png", className: "certificate-public-logo" }),
            React.createElement("div", { className: "certificate-public-card" },
                React.createElement("p", null, "Loading verified product record\u2026")));
    const p = data.product;
    const verified = p.verificationStatus === 'verified';
    return React.createElement("div", { className: "certificate-public" },
        React.createElement("img", { src: "/assets/logo.png", className: "certificate-public-logo" }),
        React.createElement("div", { className: "certificate-public-card" },
            React.createElement("div", { className: "certificate-public-kicker" }, "KALASUTRA DIGITAL PRODUCT CERTIFICATE"),
            React.createElement("div", { className: "certificate-public-id" }, p.uniqueProductId),
            React.createElement("div", { className: `certificate-public-status ${verified ? 'verified' : 'review'}` }, verified ? '🟢 VERIFIED HANDMADE' : p.verificationStatus === 'rejected' ? '🔴 VERIFICATION REVOKED' : '🟡 UNDER REVIEW'),
            p.image && React.createElement("img", { className: "certificate-public-image", src: p.image, alt: p.title }),
            React.createElement("h1", null, p.title),
            React.createElement("p", null, p.description),
            React.createElement("div", { className: "certificate-public-grid" },
                React.createElement("div", null,
                    React.createElement("small", null, "ARTISAN"),
                    React.createElement("strong", null, p.artisan?.name || 'Verified artisan')),
                React.createElement("div", null,
                    React.createElement("small", null, "CRAFT"),
                    React.createElement("strong", null, p.category)),
                React.createElement("div", null,
                    React.createElement("small", null, "TRUST SCORE"),
                    React.createElement("strong", null,
                        p.trustScore || '—',
                        "/100")),
                React.createElement("div", null,
                    React.createElement("small", null, "VERIFICATION DATE"),
                    React.createElement("strong", null, p.verificationDate ? new Date(p.verificationDate).toLocaleDateString('en-IN') : '—'))),
            React.createElement("div", { className: "certificate-public-proof" },
                React.createElement("strong", null, "Making proof"),
                React.createElement("span", null, "\uD83C\uDFA5 Mandatory making-process proof supplied"),
                React.createElement("span", null, "\uD83D\uDD0D Originality & image checks recorded"),
                React.createElement("span", null, "\uD83E\uDDD1\u200D\uD83C\uDFA8 Artisan ownership declaration recorded")),
            p.customizations?.length > 0 && React.createElement("div", { className: "certificate-public-proof" },
                React.createElement("strong", null, "Customization history"),
                p.customizations.slice(0, 5).map((c) => React.createElement("span", { key: c.id },
                    "#",
                    c.customizationId,
                    " \u00B7 ",
                    c.request))),
            React.createElement("p", { className: "certificate-public-note" }, "This QR is a gateway to KalaSutra\u2019s digital product record. Verification is an AI-assisted trust signal and not a legal copyright determination.")));
}
// ---------------------------------------------------------------------------
// ROOT APP — simple state-based router (no react-router dependency needed)
// ---------------------------------------------------------------------------
function App() {
    // Keep ALL hooks unconditional and in the same order on every render.
    // This is important because the certificate QR route can be opened directly
    // and React must never see a different hook order between renders.
    const [phase, setPhase] = useState("splash"); // splash -> role -> login -> app
    const [user, setUser] = useState(null);
    const [pendingName, setPendingName] = useState("");
    const [pendingRole, setPendingRole] = useState("buyer");
    const [screen, setScreen] = useState("dashboard");
    const [toast, setToastState] = useState(null);
    const [activeProductId, setActiveProductId] = useState(null);
    const [screenStack, setScreenStack] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [lastVerifiedProductId, setLastVerifiedProductId] = useState(null);
    const [showPermissions, setShowPermissions] = useState(false);
    // Phone browsers require HTTPS for location and microphone. If someone opens
    // the LAN HTTP URL directly on a phone, automatically move them to the
    // bundled secure server before requesting any permissions. Laptop localhost
    // continues to work exactly as before.
    useEffect(() => {
        const host = window.location.hostname;
        const isPhone = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isLanHttp = isPhone && window.location.protocol === 'http:' && !isLocalHost();
        if (isLanHttp && host) {
            window.location.replace(`https://${host}:3443${window.location.pathname}${window.location.search}${window.location.hash}`);
        }
    }, []);
    useEffect(() => {
        // Permissions are opt-in and never block the Buyer UI automatically.
        // Add ?permissions=1 when you explicitly want the permission sheet.
        const wantsPermissions = new URLSearchParams(window.location.search).get('permissions') === '1';
        if (phase === 'app' && wantsPermissions && localStorage.getItem('kalasutra_permission_seen') !== '1')
            setShowPermissions(true);
    }, [phase]);
    const certificateId = new URLSearchParams(window.location.search).get('certificate');
    if (certificateId)
        return React.createElement(CertificateScreen, { certificateId: certificateId });
    function closePermissions() {
        localStorage.setItem('kalasutra_permission_seen', '1');
        setShowPermissions(false);
    }
    function setToast(msg) {
        setToastState(msg);
        setTimeout(() => setToastState(null), 2200);
    }
    function refreshWishlist(userId) {
        apiGet(`/wishlist?userId=${userId}`).then((items) => setWishlist(items.map((p) => p.id)));
    }
    function refreshCartCount(userId) {
        const uid = userId || user?.id;
        if (!uid)
            return;
        apiGet(`/cart?userId=${uid}`).then((items) => setCartCount(items.reduce((s, i) => s + i.qty, 0)));
    }
    async function toggleWishlist(productId) {
        if (!user)
            return;
        if (wishlist.includes(productId)) {
            await apiDelete("/wishlist", { userId: user.id, productId });
        }
        else {
            await apiPost("/wishlist", { userId: user.id, productId });
        }
        refreshWishlist(user.id);
    }
    async function addToCart(productId) {
        if (!user)
            return;
        await apiPost("/cart", { userId: user.id, productId });
        refreshCartCount(user.id);
    }
    async function handleLoggedIn(contact, name) {
        setPendingName(name);
        setPhase("role");
    }
    async function handleRolePick(role) {
        try {
            const created = await apiPost("/users", { name: pendingName, contact: "demo", role });
            setUser(created);
            setPendingRole(role);
            setPhase("app");
            setScreen(role === "artisan" ? "dashboard" : "buyerHome");
            if (role === "buyer") {
                refreshWishlist(created.id);
                refreshCartCount(created.id);
            }
        }
        catch (e) {
            setToast("Couldn't log in: " + e.message);
        }
    }
    function logout() {
        setUser(null);
        setPhase("splash");
        setScreen("dashboard");
    }
    function go(nextScreen) {
        setScreenStack((s) => [...s, screen]);
        setScreen(nextScreen);
    }
    function goBack() {
        setScreenStack((s) => {
            const copy = [...s];
            const prev = copy.pop();
            setScreen(prev || (user?.role === "artisan" ? "dashboard" : "buyerHome"));
            return copy;
        });
    }
    function openProduct(id) {
        if (user?.id)
            saveRecentProduct(user.id, id);
        setActiveProductId(id);
        go("productDetail");
    }
    function switchRole() {
        const newRole = user.role === "artisan" ? "buyer" : "artisan";
        apiPost("/users", { name: user.name, contact: "demo", role: newRole }).then((u) => {
            setUser(u);
            setScreen(newRole === "artisan" ? "dashboard" : "buyerHome");
            if (newRole === "buyer") {
                refreshWishlist(u.id);
                refreshCartCount(u.id);
            }
        });
    }
    if (phase === "splash")
        return React.createElement("div", { className: "app-shell" },
            React.createElement(SplashScreen, { onNext: () => setPhase("login") }),
            React.createElement(Toast, { message: toast }));
    if (phase === "login")
        return React.createElement("div", { className: "app-shell" },
            React.createElement(LoginScreen, { onLoggedIn: handleLoggedIn }),
            React.createElement(Toast, { message: toast }));
    if (phase === "role")
        return React.createElement("div", { className: "app-shell" },
            React.createElement(RoleSelectScreen, { name: pendingName, onPick: handleRolePick }),
            React.createElement(Toast, { message: toast }));
    // ----- logged in app -----
    const isArtisan = user.role === "artisan";
    const navBar = isArtisan
        ? ["dashboard", "addProduct", "myReels", "orders", "profile"].includes(screen) && React.createElement(ArtisanNav, { screen: screen, go: setScreen })
        : ["buyerHome", "buyerReels", "cart", "orders", "buyerProfile"].includes(screen) && React.createElement(BuyerNav, { screen: screen, go: setScreen, cartCount: cartCount });
    return (React.createElement("div", { className: `app-shell screen-${screen}` },
        isArtisan && screen === "dashboard" && (React.createElement(React.Fragment, null,
            React.createElement(ArtisanDashboard, { user: user, go: go, setToast: setToast }),
            React.createElement("button", { className: "fab", onClick: () => go("addProduct") }, "\uFF0B"))),
        isArtisan && screen === "addProduct" && (React.createElement(AddProductScreen, { user: user, go: (s) => { if (s === "createReel") {
                go("createReel");
            }
            else {
                setScreen(s);
            } }, setToast: setToast, setLastVerifiedProductId: setLastVerifiedProductId })),
        isArtisan && screen === "myProducts" && React.createElement(MyProductsScreen, { user: user, go: setScreen }),
        isArtisan && screen === "createReel" && React.createElement(CreateReelScreen, { user: user, go: setScreen, setToast: setToast, prefillProductId: lastVerifiedProductId }),
        isArtisan && screen === "myReels" && React.createElement(MyReelsScreen, { user: user, go: setScreen, setToast: setToast }),
        isArtisan && screen === "orders" && React.createElement(OrdersScreen, { user: user, go: setScreen }),
        isArtisan && screen === "reviews" && React.createElement(SafetyReviewScreen, { go: setScreen, setToast: setToast }),
        isArtisan && screen === "profile" && React.createElement(ArtisanProfileScreen, { user: user, onLogout: logout, go: setScreen }),
        !isArtisan && screen === "buyerHome" && React.createElement(BuyerHomeScreen, { user: user, go: setScreen, openProduct: openProduct, wishlist: wishlist, toggleWishlist: toggleWishlist, cartCount: cartCount, addToCart: addToCart, setToast: setToast }),
        !isArtisan && screen === "buyerReels" && React.createElement(ReelsFeedScreen, { openProduct: openProduct, setToast: setToast }),
        !isArtisan && screen === "wishlist" && React.createElement(WishlistScreen, { user: user, openProduct: openProduct, toggleWishlist: toggleWishlist }),
        !isArtisan && screen === "cart" && React.createElement(CartScreen, { user: user, go: setScreen, setToast: setToast, refreshCartCount: () => refreshCartCount(user.id) }),
        !isArtisan && screen === "orders" && React.createElement(OrdersScreen, { user: user, go: setScreen }),
        !isArtisan && screen === "buyerProfile" && React.createElement(BuyerProfileScreen, { user: user, onLogout: logout, go: setScreen, openProduct: openProduct }),
        screen === "productDetail" && (React.createElement(ProductDetailScreen, { productId: activeProductId, go: setScreen, back: goBack, setToast: setToast, wishlist: wishlist, toggleWishlist: toggleWishlist, addToCart: addToCart, userId: user.id })),
        navBar,
        !(isArtisan && screen === "dashboard") && React.createElement(AITalker, { compact: true, role: isArtisan ? "artisan" : "buyer", go: setScreen }),
        !(isArtisan && screen === "dashboard") && React.createElement("div", { className: `mode-switch-wrap ${screen === 'profile' || screen === 'buyerProfile' ? 'profile-mode-switch' : ''}` },
            React.createElement("button", { className: "mode-pill", onClick: switchRole },
                "\u21C4 Switch to ",
                isArtisan ? "Buyer" : "Artisan")),
        React.createElement(Toast, { message: toast }),
        showPermissions && React.createElement(PermissionCenter, { onClose: closePermissions })));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App, null));
