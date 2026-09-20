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
    var _a;
    try {
        if (!((_a = navigator.mediaDevices) === null || _a === void 0 ? void 0 : _a.getUserMedia))
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
        }, (err) => reject(new Error((err === null || err === void 0 ? void 0 : err.code) === 1 ? 'Location permission was denied.' : 'Could not get your location.')), { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 });
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
// ---------------------------------------------------------------------------
function AITalker({ compact = false, embedded = false, role = 'buyer', go }) {
    const [open, setOpen] = useState(embedded ? true : !compact);
    const [listening, setListening] = useState(false);
    const [message, setMessage] = useState("Namaste! Main aapki kaise madad karoon?");
    const recognitionRef = useRef(null);
    function speak(text) {
        setMessage(text);
        try {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(text);
                u.lang = "hi-IN";
                u.rate = 0.95;
                window.speechSynthesis.speak(u);
            }
        }
        catch (_) { }
    }
    function startListening() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            speak("Voice input is not available in this browser. Aap type karke bhi mujhse baat kar sakte hain.");
            return;
        }
        const recognition = new SR();
        recognition.lang = "hi-IN";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onstart = () => setListening(true);
        recognition.onend = () => setListening(false);
        recognition.onerror = () => { setListening(false); speak("Sorry, main aapki awaaz samajh nahi paaya. Dobara try karein."); };
        recognition.onresult = (event) => {
            var _a, _b, _c;
            const heard = ((_c = (_b = (_a = event.results) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.transcript) || "";
            setListening(false);
            if (heard) {
                const q = heard.toLowerCase();
                if (q.includes("cart") || q.includes("खरीद") || q.includes("buy") || q.includes("add")) {
                    speak("Bilkul! Main aapko product choose karke cart mein add karne mein help karta hoon.");
                }
                else if (q.includes("reel") || q.includes("रील")) {
                    speak("Aap verified craft ki making Reel bana sakte hain aur buyers ko uski kahani dikha sakte hain.");
                }
                else if (q.includes("verify") || q.includes("verification") || q.includes("जांच")) {
                    speak("Product verification ke liye pehle photo, phir aapki voice story aur making proof clip chahiye.");
                }
                else {
                    speak(`Aapne kaha: ${heard}. Main aapki KalaSutra journey mein help karta hoon.`);
                }
            }
        };
        requestVoicePermission().then((ok) => {
            if (!ok) {
                speak('Microphone permission allow karein, phir dobara try karein.');
                return;
            }
            recognitionRef.current = recognition;
            try {
                recognition.start();
            }
            catch (_) { }
        });
    }
    useEffect(() => () => {
        var _a;
        try {
            (_a = recognitionRef.current) === null || _a === void 0 ? void 0 : _a.stop();
        }
        catch (_) { }
    }, []);
    if (embedded)
        return (React.createElement("div", { className: "ai-talker ai-talker-embedded" },
            React.createElement("div", { className: "ai-talker-head" },
                React.createElement("div", { className: "ai-talker-avatar-wrap" },
                    React.createElement("img", { src: "/assets/avatar-artisan.png", alt: "AI Talker" })),
                React.createElement("div", { className: "ai-talker-title" },
                    React.createElement("strong", null, "\u2726 AI Talker"),
                    React.createElement("span", null, "Your voice-first KalaSutra guide")),
                React.createElement("button", { className: "ai-lang-pill", onClick: () => speak("Hindi selected") }, "\u25CE \u0939\u093F\u0902\u0926\u0940\u2304")),
            React.createElement("div", { className: "ai-embedded-main" },
                React.createElement("div", { className: "ai-embedded-message" },
                    React.createElement("strong", null, "Namaste! \uD83D\uDE4F"),
                    React.createElement("br", null),
                    role === 'artisan' ? 'Main aapki listing aur orders mein madad karoon?' : 'Main aapko handicraft dhoondhne mein madad karoon?',
                    React.createElement("span", { className: "embedded-wave" }, "\u25AE\u25AE\u25AE\u25AE\u25AE\u25AE")),
                React.createElement("div", { className: "ai-embedded-actions" }, role === 'artisan' ? React.createElement(React.Fragment, null,
                    React.createElement("button", { onClick: () => { speak("Take a photo of your product. Ab Add a Piece kholte hain."); go === null || go === void 0 ? void 0 : go('addProduct'); } },
                        React.createElement("span", null, "\u2315"),
                        " Add",
                        React.createElement("br", null),
                        "a piece"),
                    React.createElement("button", { onClick: () => { speak("Aapke orders aur earnings yahan milenge."); go === null || go === void 0 ? void 0 : go('orders'); } },
                        React.createElement("span", null, "\u25A3"),
                        " Orders &",
                        React.createElement("br", null),
                        "earnings")) : React.createElement(React.Fragment, null,
                    React.createElement("button", { onClick: () => speak("What kind of handicraft are you looking for?") },
                        React.createElement("span", null, "\u2315"),
                        " Find a",
                        React.createElement("br", null),
                        "craft"),
                    React.createElement("button", { onClick: () => { speak("Main aapko saved products aur cart tak le ja sakta hoon."); go === null || go === void 0 ? void 0 : go('cart'); } },
                        React.createElement("span", null, "\u25A3"),
                        " Open",
                        React.createElement("br", null),
                        "cart")))),
            React.createElement("button", { className: "ai-speak-pill", onClick: startListening }, "\u2669\u00A0 Tap to speak"),
            React.createElement("div", { className: "ai-quote" }, "\u201CEvery craft has a story. Let\u2019s tell yours.\u201D \u2661")));
    if (!open)
        return (React.createElement("button", { className: "ai-fab", "aria-label": "Open AI Talker", onClick: () => setOpen(true) },
            React.createElement("img", { src: "/assets/avatar-artisan.png", alt: "AI Talker" }),
            React.createElement("span", { className: "ai-fab-dot" })));
    return (React.createElement("div", { className: `ai-talker ${compact ? "ai-talker-compact" : ""}` },
        React.createElement("div", { className: "ai-talker-head" },
            React.createElement("div", { className: "ai-talker-avatar-wrap" },
                React.createElement("img", { src: "/assets/avatar-artisan.png", alt: "AI Talker" }),
                React.createElement("span", { className: "ai-live-dot" })),
            React.createElement("div", { className: "ai-talker-title" },
                React.createElement("strong", null, "AI Talker"),
                React.createElement("span", null, "Voice-first KalaSutra guide")),
            React.createElement("button", { className: "ai-close", onClick: () => { var _a; setOpen(false); try {
                    (_a = recognitionRef.current) === null || _a === void 0 ? void 0 : _a.stop();
                }
                catch (_) { } } }, "\u2715")),
        React.createElement("div", { className: "ai-talker-body" },
            React.createElement("div", { className: "ai-message" }, message),
            React.createElement("div", { className: "ai-wave", "aria-hidden": "true" },
                React.createElement("i", null),
                React.createElement("i", null),
                React.createElement("i", null),
                React.createElement("i", null),
                React.createElement("i", null),
                React.createElement("i", null),
                React.createElement("i", null)),
            React.createElement("div", { className: "ai-talker-actions" },
                React.createElement("button", { className: `ai-mic ${listening ? "listening" : ""}`, onClick: startListening, "aria-label": "Talk to AI" }, listening ? "●" : "🎙️"),
                React.createElement("button", { className: "ai-send", onClick: () => speak("Bilkul! Chaliye aapka agla step shuru karte hain."), "aria-label": "Send" }, "\u27A4")),
            React.createElement("div", { className: "ai-quick-row" }, role === 'artisan' ? React.createElement(React.Fragment, null,
                React.createElement("button", { onClick: () => { speak("Take a photo of your product. Chaliye Add a Piece shuru karte hain."); go === null || go === void 0 ? void 0 : go('addProduct'); } }, "Add a piece"),
                React.createElement("button", { onClick: () => { speak("Aapke New Orders, Processing, Shipped, Delivered aur Earnings yahan hain."); go === null || go === void 0 ? void 0 : go('orders'); } }, "My orders")) : React.createElement(React.Fragment, null,
                React.createElement("button", { onClick: () => speak("What kind of handicraft are you looking for?") }, "Find a craft"),
                React.createElement("button", { onClick: () => { speak("Opening your cart."); go === null || go === void 0 ? void 0 : go('cart'); } }, "Open cart"))))));
}
// ---------------------------------------------------------------------------
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
// ---------------------------------------------------------------------------
// ARTISAN: DASHBOARD
// ---------------------------------------------------------------------------
function ArtisanDashboard({ user, go, setToast }) {
    var _a, _b;
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
                    React.createElement("strong", null, (_b = (_a = user.profile) === null || _a === void 0 ? void 0 : _a.trustScore) !== null && _b !== void 0 ? _b : 100),
                    React.createElement("small", null, "Trust score"))),
            React.createElement("div", { className: "artisan-growth-card", onClick: () => go('orders') },
                React.createElement("div", null,
                    React.createElement("span", { className: "field-label" }, "ARTISAN GROWTH DASHBOARD"),
                    React.createElement("strong", null, "Orders, earnings & business insights"),
                    React.createElement("small", null, "Track New Orders \u2192 Processing \u2192 Shipped \u2192 Delivered")),
                React.createElement("button", { className: "btn secondary", style: { marginTop: 10 }, onClick: () => go("reviews") }, "\uD83D\uDEE1\uFE0F Safety & Review Center"),
                React.createElement("span", { className: "growth-arrow" }, "\u2192")),
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
// ARTISAN: ADD PRODUCT  →  SCAN/VERIFY
// ---------------------------------------------------------------------------
function AddProductScreen({ user, go, setToast, setLastVerifiedProductId }) {
    const [step, setStepState] = useState("form"); // form -> proof -> scanning -> result
    const [title, setTitle] = useState("");
    const [story, setStory] = useState("");
    const [englishDescription, setEnglishDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("Pottery");
    const [material, setMaterial] = useState("");
    const [region, setRegion] = useState("");
    const [storyLang, setStoryLang] = useState("hi-IN");
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
        const file = e.target.files[0];
        if (!file)
            return;
        try {
            setImageDataUrl(await fileToDataURL(file));
        }
        catch (_a) {
            setErr("Couldn't read that image — please try another file.");
        }
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
                var _a, _b, _c;
                const heard = ((_c = (_b = (_a = event.results) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.transcript) || "";
                if (heard) {
                    setStory(heard);
                    generateEnglishDescription(heard);
                    try {
                        if (window.speechSynthesis) {
                            window.speechSynthesis.cancel();
                            const u = new SpeechSynthesisUtterance("Aapki story save ho gayi hai. Ab verification ke liye making proof record karein.");
                            u.lang = "hi-IN";
                            u.rate = 0.95;
                            window.speechSynthesis.speak(u);
                        }
                    }
                    catch (_) { }
                }
            };
            storyRecognitionRef.current = rec;
            rec.start();
        }
        catch (e) {
            setErr(e.message || "Voice story could not start.");
        }
    }
    function stopStoryRecording() { var _a; try {
        (_a = storyRecognitionRef.current) === null || _a === void 0 ? void 0 : _a.stop();
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
            setTimeout(() => { var _a; if (((_a = proofRecorderRef.current) === null || _a === void 0 ? void 0 : _a.state) === "recording")
                proofRecorderRef.current.stop(); setRecording(false); }, 5000);
        }
        catch (e) {
            setErr("Camera/microphone permission is needed for the 5-second making-proof clip. " + e.message);
        }
    }
    function stopProofRecording() { var _a, _b; if (((_a = proofRecorderRef.current) === null || _a === void 0 ? void 0 : _a.state) === "recording")
        proofRecorderRef.current.stop(); (_b = proofStreamRef.current) === null || _b === void 0 ? void 0 : _b.getTracks().forEach((t) => t.stop()); setRecording(false); }
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
                category, image: imageDataUrl, craftInfo: { material, region, storyLanguage: storyLang, originalStory: story, verificationProof: proofVideo },
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
        }
        catch (e) {
            setErr(e.message || "Verification failed.");
        }
    }
    useEffect(() => () => { var _a, _b; try {
        (_a = storyRecognitionRef.current) === null || _a === void 0 ? void 0 : _a.stop();
    }
    catch (_) { } (_b = proofStreamRef.current) === null || _b === void 0 ? void 0 : _b.getTracks().forEach((t) => t.stop()); }, []);
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "app-header add-piece-header" },
            React.createElement("button", { className: "header-back", "aria-label": "Back to Home", onClick: () => go("dashboard") }, "\u2039"),
            React.createElement("div", null,
                React.createElement("h2", null, "Add a piece"),
                React.createElement("div", { className: "sub" }, "Photo \u2192 Voice Story \u2192 Proof \u2192 Verify"))),
        React.createElement("div", { className: "content" },
            React.createElement(ErrorBanner, { message: err }),
            step === "form" && React.createElement(React.Fragment, null,
                React.createElement("div", { className: "scan-box", style: { marginBottom: 14, position: "relative" }, onClick: () => { var _a; return (_a = document.getElementById("prodImgInput")) === null || _a === void 0 ? void 0 : _a.click(); } }, imageDataUrl ? React.createElement("img", { src: imageDataUrl, style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } }) : React.createElement(React.Fragment, null,
                    React.createElement("div", { style: { fontSize: 36 } }, "\uD83D\uDCF7"),
                    React.createElement("div", { style: { fontSize: 12.5, fontWeight: 700 } }, "Tap to take/upload a photo"),
                    React.createElement("div", { style: { fontSize: 10.5, color: "#6b6055" } }, "Your piece becomes the starting point"))),
                React.createElement("input", { id: "prodImgInput", type: "file", accept: "image/*", capture: "environment", style: { display: "none" }, onChange: handleImagePick }),
                React.createElement("div", { className: "voice-story-card" },
                    React.createElement("div", { className: "field-label" }, "YOUR STORY \u2022 VOICE FIRST"),
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 13 } }, "Tell us about your craft"),
                    React.createElement("div", { style: { fontSize: 10.5, color: "#6b6055", margin: "4px 0 9px" } }, "Speak in your language \u2014 AI prepares the English buyer description."),
                    React.createElement("div", { style: { display: "flex", gap: 7, alignItems: "center" } },
                        React.createElement("select", { value: storyLang, onChange: (e) => setStoryLang(e.target.value), style: { flex: 1 } },
                            React.createElement("option", { value: "hi-IN" }, "Hindi"),
                            React.createElement("option", { value: "mr-IN" }, "Marathi"),
                            React.createElement("option", { value: "ta-IN" }, "Tamil"),
                            React.createElement("option", { value: "bn-IN" }, "Bangla"),
                            React.createElement("option", { value: "en-IN" }, "English")),
                        React.createElement("button", { className: `story-mic ${storyRecording ? "recording" : ""}`, onClick: storyRecording ? stopStoryRecording : startStoryRecording }, storyRecording ? "■ Stop" : "🎙 Start")),
                    story && React.createElement("div", { className: "story-transcript" },
                        React.createElement("b", null, "Heard:"),
                        " ",
                        story),
                    englishDescription && React.createElement("div", { className: "ai-draft" },
                        React.createElement("b", null, "AI English draft:"),
                        " ",
                        englishDescription)),
                React.createElement("div", { className: "field" },
                    React.createElement("div", { className: "field-label" },
                        "Product name ",
                        React.createElement("span", { style: { fontWeight: 400 } }, "(optional \u2014 AI can draft it)")),
                    React.createElement("input", { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Leave blank to let AI draft a title" })),
                React.createElement("div", { style: { display: "flex", gap: 10 } },
                    React.createElement("div", { className: "field", style: { flex: 1 } },
                        React.createElement("div", { className: "field-label" }, "Price (\u20B9) \u2022 YOUR PRICE"),
                        React.createElement("input", { value: price, onChange: (e) => setPrice(e.target.value.replace(/[^0-9.]/g, "")), placeholder: "2000", inputMode: "decimal" })),
                    React.createElement("div", { className: "field", style: { flex: 1 } },
                        React.createElement("div", { className: "field-label" }, "Category"),
                        React.createElement("select", { value: category, onChange: (e) => setCategory(e.target.value) }, Object.keys(CATEGORY_EMOJI).map(c => React.createElement("option", { key: c }, c))))),
                React.createElement("div", { style: { display: "flex", gap: 10 } },
                    React.createElement("div", { className: "field", style: { flex: 1 } },
                        React.createElement("div", { className: "field-label" }, "Material"),
                        React.createElement("input", { value: material, onChange: (e) => setMaterial(e.target.value), placeholder: "e.g. Terracotta clay" })),
                    React.createElement("div", { className: "field", style: { flex: 1 } },
                        React.createElement("div", { className: "field-label" }, "Region"),
                        React.createElement("input", { value: region, onChange: (e) => setRegion(e.target.value), placeholder: "e.g. Rajasthan" }))),
                React.createElement("div", { className: "proof-card" },
                    React.createElement("div", { className: "field-label" }, "MANDATORY MAKING PROOF"),
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 13 } }, "\uD83C\uDFA5 5-second verification clip"),
                    React.createElement("div", { style: { fontSize: 10.5, color: "#6b6055", margin: "4px 0 9px" } }, "Show the piece or a small moment of the making process. This proof is checked before listing."),
                    proofVideo ? React.createElement("video", { src: proofVideo, controls: true, style: { width: "100%", borderRadius: 12, maxHeight: 190, objectFit: "cover" } }) : React.createElement("button", { className: `btn ${recording ? "secondary" : ""}`, onClick: recording ? stopProofRecording : startProofRecording }, recording ? "⏹ Recording… (auto-stops in 5s)" : "🔴 Record 5-sec proof"),
                    proofVideo && React.createElement("button", { className: "btn secondary", style: { marginTop: 8 }, onClick: () => setProofVideo(null) }, "Retake proof"))),
            step === "scanning" && React.createElement("div", { style: { paddingTop: 18 } },
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
            step === "result" && verifyResult && React.createElement("div", { style: { paddingTop: 6 } },
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
                React.createElement("div", { className: "card", style: { gridColumn: "span 2" } },
                    React.createElement("div", { className: "thumb", style: { backgroundImage: `url(${product.image})` } },
                        React.createElement(BadgeLabel, { status: verifyResult.status })),
                    React.createElement("div", { className: "info" },
                        React.createElement("div", { className: "t" }, product.title),
                        React.createElement("div", { className: "p" },
                            "\u20B9",
                            Number(product.price).toLocaleString("en-IN")))))),
        React.createElement("div", { className: "btn-row" },
            step === "form" && React.createElement("button", { className: "btn", onClick: handleCreateAndScan }, "Scan & Verify Product \u2192"),
            step === "result" && (verifyResult === null || verifyResult === void 0 ? void 0 : verifyResult.status) !== "rejected" && React.createElement("button", { className: "btn green", onClick: () => go("createReel") }, "Create a Reel for this product"),
            step === "result" && React.createElement("button", { className: "btn secondary", onClick: () => { setToast("Saved to your products"); go("myProducts"); } }, "My Products"))));
}
// ---------------------------------------------------------------------------
// ARTISAN: MY PRODUCTS
// ---------------------------------------------------------------------------
function MyProductsScreen({ user, go }) {
    const [products, setProducts] = useState([]);
    useEffect(() => { apiGet(`/products`).then((all) => setProducts(all.filter((p) => p.artisanId === user.id))); }, []);
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "app-header" },
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
    const [products, setProducts] = useState([]);
    const [productId, setProductId] = useState(prefillProductId || "");
    const [caption, setCaption] = useState("");
    const [category, setCategory] = useState("Pottery");
    const [tags, setTags] = useState("");
    const [videoDataUrl, setVideoDataUrl] = useState(null);
    const [mode, setMode] = useState("idle");
    const [err, setErr] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const recorderRef = useRef(null);
    const chunksRef = useRef([]);
    useEffect(() => {
        apiGet(`/products`).then((all) => {
            const mine = all.filter((p) => p.artisanId === user.id && p.verificationStatus !== "rejected");
            setProducts(mine);
            if (prefillProductId) {
                const p = mine.find((x) => x.id === prefillProductId);
                if (p) {
                    setCategory(p.category);
                    setCaption(`Making of: ${p.title}`);
                }
            }
        });
        return () => { var _a; (_a = streamRef.current) === null || _a === void 0 ? void 0 : _a.getTracks().forEach((t) => t.stop()); };
    }, []);
    async function startRecording() {
        setErr(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            chunksRef.current = [];
            const recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (e) => { if (e.data.size > 0)
                chunksRef.current.push(e.data); };
            recorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: "video/webm" });
                const reader = new FileReader();
                reader.onload = () => setVideoDataUrl(reader.result);
                reader.readAsDataURL(blob);
                stream.getTracks().forEach((t) => t.stop());
            };
            recorder.start();
            recorderRef.current = recorder;
            setMode("recording");
            // Auto-stop at 20s so the demo clip (and its base64 payload) stays small.
            setTimeout(() => { var _a; if (((_a = recorderRef.current) === null || _a === void 0 ? void 0 : _a.state) === "recording")
                recorderRef.current.stop(); setMode("idle"); }, 20000);
        }
        catch (e) {
            setErr("Couldn't access your camera/microphone — you can upload a clip from your gallery instead. (" + e.message + ")");
        }
    }
    function stopRecording() {
        var _a;
        (_a = recorderRef.current) === null || _a === void 0 ? void 0 : _a.stop();
        setMode("idle");
    }
    async function handleGalleryPick(e) {
        const file = e.target.files[0];
        if (!file)
            return;
        try {
            setVideoDataUrl(await fileToDataURL(file));
        }
        catch (_a) {
            setErr("Couldn't read that video file.");
        }
    }
    async function handlePost() {
        if (!caption.trim()) {
            setErr("Please add a short caption.");
            return;
        }
        const product = products.find((p) => p.id === productId);
        try {
            await apiPost("/reels", {
                artisanId: user.id,
                productId: productId || null,
                video: videoDataUrl,
                thumbEmoji: product ? CATEGORY_EMOJI[product.category] : CATEGORY_EMOJI[category] || "🎨",
                caption, category,
                tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            });
            setToast("Reel posted 🎬");
            go("myReels");
        }
        catch (e) {
            setErr(e.message);
        }
    }
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "app-header" },
            React.createElement("div", null,
                React.createElement("h2", null, "Create a Reel"),
                React.createElement("div", { className: "sub" }, "Show the making process \u2014 30 sec or less")),
            React.createElement("button", { className: "mode-pill", onClick: () => go("myReels") }, "Cancel")),
        React.createElement("div", { className: "content" },
            React.createElement(ErrorBanner, { message: err }),
            React.createElement("div", { className: "scan-box", style: { aspectRatio: "9/12", marginBottom: 14 } }, videoDataUrl ? (React.createElement("video", { src: videoDataUrl, controls: true, style: { width: "100%", height: "100%", objectFit: "cover" } })) : mode === "recording" ? (React.createElement("video", { ref: videoRef, muted: true, style: { width: "100%", height: "100%", objectFit: "cover" } })) : (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { fontSize: 36 } }, "\uD83C\uDFA5"),
                React.createElement("div", { style: { fontSize: 12.5, fontWeight: 700 } }, "No clip yet"),
                React.createElement("div", { style: { fontSize: 10.5, color: "#6b6055", textAlign: "center", padding: "0 20px" } }, "Record with your camera, or upload one from your gallery")))),
            React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 16 } },
                mode === "idle" ? (React.createElement("button", { className: "btn", style: { flex: 1 }, onClick: startRecording }, "\uD83D\uDD34 Record")) : (React.createElement("button", { className: "btn", style: { flex: 1, background: "var(--madder)", borderColor: "var(--madder)" }, onClick: stopRecording }, "\u23F9 Stop")),
                React.createElement("label", { className: "btn secondary", style: { flex: 1, textAlign: "center" } },
                    "\u2B06 Upload",
                    React.createElement("input", { type: "file", accept: "video/*", style: { display: "none" }, onChange: handleGalleryPick }))),
            React.createElement("div", { className: "field" },
                React.createElement("div", { className: "field-label" }, "Caption"),
                React.createElement("textarea", { value: caption, onChange: (e) => setCaption(e.target.value), placeholder: "e.g. Throwing a surai on the wheel \u2014 6th generation potter" })),
            React.createElement("div", { className: "field" },
                React.createElement("div", { className: "field-label" }, "Attach a verified product (optional)"),
                React.createElement("select", { value: productId, onChange: (e) => setProductId(e.target.value) },
                    React.createElement("option", { value: "" }, "No product \u2014 just my process"),
                    products.map((p) => React.createElement("option", { key: p.id, value: p.id },
                        p.title,
                        " ",
                        p.verificationStatus === "verified" ? "🟢" : "🟡")))),
            React.createElement("div", { style: { display: "flex", gap: 10 } },
                React.createElement("div", { className: "field", style: { flex: 1 } },
                    React.createElement("div", { className: "field-label" }, "Category"),
                    React.createElement("select", { value: category, onChange: (e) => setCategory(e.target.value) }, Object.keys(CATEGORY_EMOJI).map((c) => React.createElement("option", { key: c, value: c }, c)))),
                React.createElement("div", { className: "field", style: { flex: 1 } },
                    React.createElement("div", { className: "field-label" }, "Tags (comma separated)"),
                    React.createElement("input", { value: tags, onChange: (e) => setTags(e.target.value), placeholder: "pottery, handmade" })))),
        React.createElement("div", { className: "btn-row" },
            React.createElement("button", { className: "btn", onClick: handlePost }, "Post Reel"))));
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
// ARTISAN: PROFILE
// ---------------------------------------------------------------------------
function ArtisanProfileScreen({ user, onLogout, go }) {
    var _a, _b, _c, _d;
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "content", style: { paddingTop: 24 } },
            React.createElement("div", { style: { textAlign: "center", marginBottom: 20 } },
                React.createElement("img", { src: "/assets/avatar-artisan.png", style: { width: 70, height: "auto", marginBottom: 8 } }),
                React.createElement("div", { className: "serif", style: { fontWeight: 600, fontSize: 17 } }, user.name),
                React.createElement("div", { style: { fontSize: 11.5, color: "#6b6055" } }, ((_a = user.profile) === null || _a === void 0 ? void 0 : _a.location) || "Location not set")),
            React.createElement("div", { className: "trust-box" },
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between" } },
                    React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "var(--green)", textTransform: "uppercase" } }, "Trust Score"),
                    React.createElement("span", { className: "serif", style: { fontSize: 17, fontWeight: 700, color: "var(--green)" } }, (_c = (_b = user.profile) === null || _b === void 0 ? void 0 : _b.trustScore) !== null && _c !== void 0 ? _c : 100,
                        "/100"))),
            React.createElement("div", { className: "field-label" }, "Bio"),
            React.createElement("p", { style: { fontSize: 12.5, marginTop: 4 } }, ((_d = user.profile) === null || _d === void 0 ? void 0 : _d.bio) || "No bio yet."),
            React.createElement("button", { className: "btn", style: { marginTop: 14 }, onClick: () => go("reviews") }, "Safety & Review Center"),
            React.createElement("button", { className: "btn secondary", style: { marginTop: 20 }, onClick: onLogout }, "Log out"))));
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
    const [products, setProducts] = useState([]);
    const [query, setQuery] = useState("");
    const [err, setErr] = useState(null);
    const [listening, setListening] = useState(false);
    useEffect(() => { apiGet(`/products`).then(setProducts).catch((e) => setErr(e.message)); }, []);
    const filtered = products.filter((p) => {
        var _a, _b;
        if (!query.trim())
            return true;
        const hay = `${p.title} ${p.category} ${((_a = p.craftInfo) === null || _a === void 0 ? void 0 : _a.material) || ""} ${((_b = p.craftInfo) === null || _b === void 0 ? void 0 : _b.region) || ""}`.toLowerCase();
        return query.toLowerCase().split(" ").filter(Boolean).every((w) => hay.includes(w));
    });
    async function voiceSearch() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            setErr('Voice search is not supported in this browser.');
            return;
        }
        const ok = await requestVoicePermission();
        if (!ok) {
            setErr('Please allow microphone access for voice search.');
            return;
        }
        const r = new SR();
        r.lang = "hi-IN";
        r.interimResults = false;
        r.maxAlternatives = 1;
        r.onstart = () => setListening(true);
        r.onend = () => setListening(false);
        r.onerror = () => { setListening(false); setErr('Voice search could not start. Please try again.'); };
        r.onresult = (e) => setQuery(e.results[0][0].transcript);
        try {
            r.start();
        }
        catch (_) { }
    }
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "buyer-hero-header" },
            React.createElement("div", null,
                React.createElement("div", { className: "buyer-kicker" }, "KALASUTRA MARKETPLACE"),
                React.createElement("h2", null,
                    "Hello, ",
                    user.name,
                    " ",
                    React.createElement("span", { className: "hello-dot" }, "\u2726")),
                React.createElement("div", { className: "sub" }, "Discover stories behind every handmade piece.")),
            React.createElement("button", { className: "buyer-wishlist-head", onClick: () => go("wishlist"), "aria-label": "Saved pieces" },
                React.createElement(Icon, { name: "heart" }),
                wishlist.length > 0 && React.createElement("b", null, wishlist.length))),
        React.createElement("div", { className: "content buyer-content" },
            React.createElement(ErrorBanner, { message: err }),
            React.createElement("div", { className: "smart-search" },
                React.createElement(Icon, { name: "search" }),
                React.createElement("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Search pottery, textiles, wood decor\u2026" }),
                React.createElement("button", { className: listening ? "voice-search listening" : "voice-search", onClick: voiceSearch, "aria-label": "Voice search" }, "\uD83C\uDF99")),
            React.createElement("div", { className: "buyer-shortcuts" },
                React.createElement("button", { onClick: () => go("wishlist") },
                    React.createElement(Icon, { name: "heart" }),
                    " Saved ",
                    wishlist.length ? `(${wishlist.length})` : ""),
                React.createElement("button", { onClick: () => go("buyerReels") },
                    React.createElement(Icon, { name: "reels" }),
                    " Maker Reels"),
                React.createElement("button", { onClick: () => go("cart") },
                    React.createElement(Icon, { name: "cart" }),
                    " Cart ",
                    cartCount ? `(${cartCount})` : "")),
            React.createElement("div", { className: "section-row" },
                React.createElement("div", { className: "section-title", style: { margin: 0 } }, query ? `Results for "${query}"` : "For you"),
                React.createElement("span", { className: "view-all", onClick: () => go("buyerReels") }, "Explore Reels \u2192")),
            filtered.length === 0 ? (React.createElement("div", { className: "empty-note" }, "No pieces match your search \u2014 try a different craft, material, or region.")) : (React.createElement("div", { className: "grid" }, filtered.map((p) => (React.createElement("div", { key: p.id, "data-featured": p.id === "p5" ? "true" : undefined, className: "card buyer-product-card", onClick: () => openProduct(p.id) },
                React.createElement("div", { className: "thumb", style: { backgroundImage: `url(${p.image})` } },
                    React.createElement(BadgeLabel, { status: p.verificationStatus }),
                    React.createElement("button", { className: "card-icon-btn card-heart", onClick: (e) => { e.stopPropagation(); toggleWishlist(p.id); } }, wishlist.includes(p.id) ? "❤️" : "🤍"),
                    React.createElement("span", { className: "emoji" }, CATEGORY_EMOJI[p.category] || "🎨")),
                React.createElement("div", { className: "info" },
                    React.createElement("div", { className: "t" }, p.title),
                    React.createElement("div", { className: "buyer-card-bottom" },
                        React.createElement("div", { className: "p" },
                            "\u20B9",
                            p.price.toLocaleString("en-IN")),
                        React.createElement("button", { className: "quick-cart-btn", onClick: (e) => { e.stopPropagation(); addToCart(p.id); setToast("Added to cart 🛍️"); } }, "\uFF0B Add to cart"))))))))),
        React.createElement("div", { className: "floating-cart-wrap" }, cartCount > 0 && React.createElement("button", { className: "floating-cart", onClick: () => go("cart") },
            React.createElement("span", { className: "mini-cart-icon" },
                React.createElement(Icon, { name: "cart" })),
            React.createElement("span", null,
                React.createElement("strong", null, "View cart"),
                React.createElement("small", null,
                    cartCount,
                    " item",
                    cartCount > 1 ? "s" : "")),
            React.createElement("b", null, "\u203A"))),
        React.createElement(AITalker, { role: "buyer", go: go })));
}
// ---------------------------------------------------------------------------
// BUYER: PRODUCT DETAIL
// ---------------------------------------------------------------------------
function ProductDetailScreen({ productId, go, back, setToast, wishlist, toggleWishlist, addToCart, userId }) {
    var _a, _b, _c;
    const [product, setProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [err, setErr] = useState(null);
    const [reported, setReported] = useState(false);
    const [customOpen, setCustomOpen] = useState(false);
    const [customRequest, setCustomRequest] = useState('');
    const [customizing, setCustomizing] = useState(false);
    const [customId, setCustomId] = useState(null);
    useEffect(() => {
        apiGet(`/products/${productId}`).then((p) => { setProduct(p); setSelectedImage(p.image || null); }).catch((e) => setErr(e.message));
    }, [productId]);
    if (err)
        return React.createElement("div", { className: "content" },
            React.createElement(ErrorBanner, { message: err }),
            React.createElement("button", { className: "btn secondary", onClick: back }, "Go back"));
    if (!product)
        return React.createElement("div", { className: "content" },
            React.createElement("div", { className: "empty-note" }, "Loading\u2026"));
    const delivery = 120;
    const total = product.price + delivery;
    const pct = Math.round(((product.price * 0.81) / total) * 100);
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "detail-photo real-photo-hero", style: { backgroundImage: `url(${selectedImage || product.image})` } },
            React.createElement("button", { className: "close-btn", onClick: back }, "\u2715"),
            !selectedImage && React.createElement("span", { style: { position: "relative", zIndex: 1 } }, CATEGORY_EMOJI[product.category] || "🎨")),
        React.createElement("div", { className: "content", style: { paddingTop: 0 } },
            React.createElement("div", { style: { borderBottom: "1px solid var(--line)", margin: "0 -18px", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 } },
                React.createElement("div", { className: "av", style: { width: 36, height: 36, borderRadius: "50%", background: "var(--indigo)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" } }, "\uD83E\uDDF5"),
                React.createElement("div", null,
                    React.createElement("div", { style: { fontSize: 12.5, fontWeight: 700 } }, (_a = product.artisan) === null || _a === void 0 ? void 0 : _a.name),
                    React.createElement("div", { style: { fontSize: 10.5, color: "#6b6055" } }, (_c = (_b = product.artisan) === null || _b === void 0 ? void 0 : _b.profile) === null || _c === void 0 ? void 0 : _c.location))),
            React.createElement("div", { style: { marginTop: 14 } },
                React.createElement(BadgeLabel, { status: product.verificationStatus }),
                React.createElement("h2", { className: "serif", style: { fontSize: 19, margin: "8px 0 6px" } }, product.title),
                React.createElement("p", { style: { fontSize: 13 } }, product.description)),
            Array.isArray(product.gallery) && product.gallery.length > 0 && (React.createElement("div", { className: "product-gallery" },
                React.createElement("div", { className: "product-gallery-title" }, "Real artisan photo gallery"),
                React.createElement("div", { className: "product-gallery-strip" }, product.gallery.map((img, i) => (React.createElement("button", { key: img + i, className: `product-gallery-thumb ${selectedImage === img ? "active" : ""}`, onClick: () => setSelectedImage(img), "aria-label": `View craft photo ${i + 1}` },
                    React.createElement("img", { src: `/${img}`, alt: `Artisan craft photo ${i + 1}` }))))),
                React.createElement("div", { className: "product-gallery-note" }, "Tap any photo to view it above."))),
            React.createElement("div", { className: "certificate-card" },
                React.createElement("div", null,
                    React.createElement("span", { className: "field-label" }, "DIGITAL PRODUCT ID"),
                    React.createElement("strong", null, product.uniqueProductId || 'KS-ART-000001'),
                    React.createElement("small", null, "Verified identity linked to this handmade piece")),
                React.createElement("div", { className: "certificate-qr" },
                    React.createElement("img", { alt: "Product QR", src: `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(window.location.origin + '/?certificate=' + (product.uniqueProductId || product.id))}` }))),
            React.createElement("div", { className: "customize-card" },
                React.createElement("div", null,
                    React.createElement("span", { className: "field-label" }, "MAKE IT YOURS"),
                    React.createElement("strong", null, "Customize this unique piece"),
                    React.createElement("small", null, "Personalize with a name, colour, size or small design change.")),
                React.createElement("button", { className: "btn secondary", onClick: () => setCustomOpen(v => !v) }, "Customize \u2022 \u20B9100"),
                customOpen && React.createElement("div", { className: "customize-form" },
                    React.createElement("textarea", { value: customRequest, onChange: e => setCustomRequest(e.target.value), placeholder: "e.g. Add my name 'Harsh' and change the colour to blue" }),
                    React.createElement("button", { className: "btn", disabled: customizing, onClick: async () => {
                            if (!customRequest.trim()) {
                                setToast('Please describe your customization');
                                return;
                            }
                            setCustomizing(true);
                            try {
                                const c = await apiPost('/customizations', { productId: product.id, buyerId: userId, request: customRequest, charge: 100 });
                                setCustomId(c.customizationId);
                                setToast(`Customization request ${c.customizationId} created • ₹100`);
                                setCustomRequest('');
                            }
                            catch (e) {
                                setToast(e.message || 'Customization failed');
                            }
                            finally {
                                setCustomizing(false);
                            }
                        } }, customizing ? 'Saving…' : 'Request customization • ₹100'),
                    customId && React.createElement("div", { className: "location-fill-note" },
                        "\u2713 Customization ID: ",
                        React.createElement("strong", null, customId),
                        " \u2014 Product ID remains ",
                        product.uniqueProductId))),
            React.createElement("div", { className: "impact-bar" },
                React.createElement("b", null,
                    pct,
                    "%"),
                " of what you pay goes straight to the maker."),
            React.createElement("div", { className: "checkout-box" },
                React.createElement("div", { className: "checkout-row" },
                    React.createElement("span", null, "Product price"),
                    React.createElement("span", null,
                        "\u20B9",
                        product.price.toLocaleString("en-IN"))),
                React.createElement("div", { className: "checkout-row" },
                    React.createElement("span", null, "Delivery charge"),
                    React.createElement("span", null,
                        "\u20B9",
                        delivery)),
                React.createElement("div", { className: "checkout-row total" },
                    React.createElement("span", null, "Final price"),
                    React.createElement("span", null,
                        "\u20B9",
                        total.toLocaleString("en-IN")))),
            React.createElement("div", { style: { display: "flex", gap: 10, margin: "0 0 10px" } },
                React.createElement("button", { className: "btn", style: { flex: 1 }, onClick: () => { addToCart(product.id); setToast("Added to cart"); } }, "Add to Cart"),
                React.createElement("button", { className: "btn secondary", style: { width: 52, flex: "0 0 auto" }, onClick: () => toggleWishlist(product.id) }, wishlist.includes(product.id) ? "❤️" : "🤍")),
            React.createElement("div", { style: { textAlign: "center" } },
                React.createElement("span", { style: { fontSize: 11, color: reported ? "var(--madder)" : "#8a7d6e", textDecoration: "underline", cursor: reported ? "default" : "pointer" }, onClick: () => { if (!reported) {
                        setReported(true);
                        setToast("Reported — our trust & safety team will review this listing");
                    } } }, reported ? "✓ Reported — under review" : "🚩 Report Product: Not Handmade")))));
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
        var _a;
        if ((_a = window.history.state) === null || _a === void 0 ? void 0 : _a.kalasutraCheckout)
            window.history.back();
        else
            setCheckoutOpen(false);
    }
    useEffect(() => {
        const onPopState = () => setCheckoutOpen(false);
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);
    function load() { apiGet(`/cart?userId=${user.id}`).then(setItems).catch(e => setError(e.message)); }
    useEffect(load, []);
    async function remove(productId) {
        await apiDelete('/cart', { userId: user.id, productId });
        load();
        refreshCartCount();
    }
    const total = items.reduce((s, i) => { var _a; return s + (((_a = i.product) === null || _a === void 0 ? void 0 : _a.price) || 0) * i.qty; }, 0);
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
            rzp.on('payment.failed', (response) => { var _a; setError(((_a = response === null || response === void 0 ? void 0 : response.error) === null || _a === void 0 ? void 0 : _a.description) || 'Payment failed. Please try again.'); setLoading(false); });
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
            items.map((i) => {
                var _a, _b;
                return (React.createElement("div", { className: "order-item", key: i.productId },
                    React.createElement("div", null,
                        React.createElement("strong", { style: { fontSize: 12.5 } }, (_a = i.product) === null || _a === void 0 ? void 0 :
                            _a.title,
                            " \u00D7 ",
                            i.qty),
                        React.createElement("div", { style: { fontSize: 11, color: '#6b6055' } },
                            "\u20B9", (_b = i.product) === null || _b === void 0 ? void 0 :
                            _b.price.toLocaleString('en-IN'))),
                    React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: 'var(--madder)', cursor: 'pointer' }, onClick: () => remove(i.productId) }, "Remove")));
            }),
            React.createElement("div", { className: "checkout-row total", style: { margin: '16px 0' } },
                React.createElement("span", null, "Total"),
                React.createElement("span", null,
                    "\u20B9",
                    total.toLocaleString('en-IN'))),
            React.createElement("button", { className: "btn", onClick: openCheckout }, "Continue to payment")))),
        checkoutOpen && React.createElement("div", { className: "payment-overlay" },
            React.createElement("div", { className: "payment-sheet" },
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
                        method === 'razorpay' ? 'Payment is completed on Razorpay and verified before your order is created.' : 'Your order is confirmed now. Pay in cash when the artisan order arrives.'),
                    error && React.createElement("div", { className: "payment-error" }, error),
                    React.createElement("div", { className: "payment-summary" },
                        React.createElement("span", null,
                            React.createElement("small", null,
                                items.reduce((s, i) => s + i.qty, 0),
                                " items"),
                            React.createElement("strong", null,
                                "\u20B9",
                                total.toLocaleString('en-IN'))),
                        React.createElement("button", { onClick: method === 'razorpay' ? payOnline : placeCOD, disabled: loading }, loading ? 'Processing…' : method === 'razorpay' ? `Pay ₹${total.toLocaleString('en-IN')} securely` : `Place COD order • ₹${total.toLocaleString('en-IN')}`)))))));
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
        loading ? React.createElement("div", { className: "empty-note" }, "Loading review queue\u2026") : items.length === 0 ? React.createElement("div", { className: "empty-note" }, "\uD83D\uDFE2 No suspicious listings waiting for review.") : items.map((r) => {
            var _a, _b;
            return React.createElement("div", { className: "card", key: r.id, style: { marginBottom: 12 } },
                React.createElement("div", { className: "thumb", style: { backgroundImage: `url(${((_a = r.product) === null || _a === void 0 ? void 0 : _a.image) || ''})` } }),
                React.createElement("div", { className: "info" },
                    React.createElement("div", { className: "t" }, ((_b = r.product) === null || _b === void 0 ? void 0 : _b.title) || 'Unknown listing'),
                    React.createElement("div", { className: "p" },
                        "AI Risk Score: ",
                        r.riskScore,
                        "/100"),
                    React.createElement("div", { style: { fontSize: 11, color: '#8a2f25', marginTop: 5 } }, r.reason),
                    React.createElement("div", { className: "btn-row", style: { marginTop: 10 } },
                        React.createElement("button", { className: "btn green", onClick: () => decide(r.id, 'approved') }, "Human Approve"),
                        React.createElement("button", { className: "btn secondary", onClick: () => decide(r.id, 'rejected') }, "Reject"))));
        }));
}
function OrdersScreen({ user }) {
    const [orders, setOrders] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    useEffect(() => { apiGet(`/orders?userId=${user.id}`).then(setOrders); }, [user.id]);
    const isArtisan = user.role === 'artisan';
    const statusLabel = { placed: 'New Orders', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', paid: 'New Orders' };
    const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
    const earnings = isArtisan ? orders.reduce((sum, o) => sum + (o.artisanItems || []).reduce((s, p) => s + Number(p.price || 0) * Number(p.qty || 0), 0), 0) : 0;
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "app-header" },
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
function BuyerProfileScreen({ user, onLogout }) {
    var _a;
    return (React.createElement("div", { className: "content", style: { paddingTop: 24 } },
        React.createElement("div", { style: { textAlign: "center", marginBottom: 20 } },
            React.createElement("div", { style: { width: 64, height: 64, borderRadius: "50%", background: "var(--madder)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 10px" } }, "\uD83D\uDECD\uFE0F"),
            React.createElement("div", { className: "serif", style: { fontWeight: 600, fontSize: 17 } }, user.name),
            React.createElement("div", { style: { fontSize: 11.5, color: "#6b6055" } }, ((_a = user.profile) === null || _a === void 0 ? void 0 : _a.location) || "Conscious buyer")),
        React.createElement("button", { className: "btn secondary", onClick: onLogout }, "Log out")));
}
// ---------------------------------------------------------------------------
// BUYER: REELS FEED
// ---------------------------------------------------------------------------
function ReelsFeedScreen({ openProduct, setToast }) {
    const [reels, setReels] = useState([]);
    useEffect(() => { apiGet(`/reels`).then(setReels); }, []);
    const COLORS = ["#8a5a3a", "#3d5c73", "#6b4423", "#7a5c1e", "#5c6b3a", "#7a3a5c"];
    return (React.createElement("div", { className: "reels-wrap" },
        reels.length === 0 && React.createElement("div", { className: "empty-note", style: { paddingTop: 100 } }, "No Reels yet \u2014 check back soon."),
        reels.map((r, i) => {
            var _a, _b;
            return (React.createElement("div", { className: "reel", key: r.id },
                r.video ? (React.createElement("video", { src: r.video, className: "reel-visual", style: { objectFit: "cover", fontSize: 0 }, autoPlay: true, loop: true, muted: true, playsInline: true })) : (React.createElement("div", { className: "reel-visual", style: { background: COLORS[i % COLORS.length] } }, r.thumbEmoji)),
                React.createElement("div", { className: "reel-gradient" }),
                React.createElement("div", { className: "reel-overlay" },
                    React.createElement("div", { className: "reel-info" },
                        React.createElement("strong", null,
                            "@",
                            ((_b = (_a = r.artisan) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.toLowerCase().replace(/\s+/g, ".")) || "artisan"),
                        React.createElement("span", null, r.caption),
                        r.product && (React.createElement("div", null,
                            React.createElement("span", { className: "badge-inline", style: { background: "#e2f0e4", color: "var(--green)" } },
                                React.createElement(BadgeLabel, { status: r.product.verificationStatus })),
                            React.createElement("div", { className: "view-btn", onClick: () => openProduct(r.product.id) }, "\uD83D\uDECD\uFE0F View Product")))),
                    React.createElement("div", { className: "reel-actions" },
                        React.createElement("button", { className: "act", onClick: () => setToast("Liked") },
                            React.createElement("span", { className: "ic" }, "\u2764\uFE0F"),
                            r.likes),
                        React.createElement("button", { className: "act", onClick: () => setToast("Comments coming soon") },
                            React.createElement("span", { className: "ic" }, "\uD83D\uDCAC"),
                            r.comments),
                        React.createElement("button", { className: "act", onClick: () => setToast("Saved") },
                            React.createElement("span", { className: "ic" }, "\uD83D\uDD16"),
                            "Save"),
                        React.createElement("button", { className: "act", onClick: () => setToast("Link copied") },
                            React.createElement("span", { className: "ic" }, "\u2197"),
                            "Share")))));
        })));
}
// ---------------------------------------------------------------------------
// DIGITAL PRODUCT CERTIFICATE — public QR destination
// ---------------------------------------------------------------------------
function CertificateScreen({ certificateId }) {
    var _a, _b;
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
                    React.createElement("strong", null, ((_a = p.artisan) === null || _a === void 0 ? void 0 : _a.name) || 'Verified artisan')),
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
            ((_b = p.customizations) === null || _b === void 0 ? void 0 : _b.length) > 0 && React.createElement("div", { className: "certificate-public-proof" },
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
    const certificateId = new URLSearchParams(window.location.search).get('certificate');
    if (certificateId)
        return React.createElement(CertificateScreen, { certificateId: certificateId });
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
    useEffect(() => {
        if (phase === 'app' && localStorage.getItem('kalasutra_permission_seen') !== '1')
            setShowPermissions(true);
    }, [phase]);
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
        const uid = userId || (user === null || user === void 0 ? void 0 : user.id);
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
            setScreen(prev || ((user === null || user === void 0 ? void 0 : user.role) === "artisan" ? "dashboard" : "buyerHome"));
            return copy;
        });
    }
    function openProduct(id) {
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
    return (React.createElement("div", { className: "app-shell" },
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
        isArtisan && screen === "orders" && React.createElement(OrdersScreen, { user: user }),
        isArtisan && screen === "reviews" && React.createElement(SafetyReviewScreen, { go: setScreen, setToast: setToast }),
        isArtisan && screen === "profile" && React.createElement(ArtisanProfileScreen, { user: user, onLogout: logout, go: setScreen }),
        !isArtisan && screen === "buyerHome" && React.createElement(BuyerHomeScreen, { user: user, go: setScreen, openProduct: openProduct, wishlist: wishlist, toggleWishlist: toggleWishlist, cartCount: cartCount, addToCart: addToCart, setToast: setToast }),
        !isArtisan && screen === "buyerReels" && React.createElement(ReelsFeedScreen, { openProduct: openProduct, setToast: setToast }),
        !isArtisan && screen === "wishlist" && React.createElement(WishlistScreen, { user: user, openProduct: openProduct, toggleWishlist: toggleWishlist }),
        !isArtisan && screen === "cart" && React.createElement(CartScreen, { user: user, go: setScreen, setToast: setToast, refreshCartCount: () => refreshCartCount(user.id) }),
        !isArtisan && screen === "orders" && React.createElement(OrdersScreen, { user: user }),
        !isArtisan && screen === "buyerProfile" && React.createElement(BuyerProfileScreen, { user: user, onLogout: logout }),
        screen === "productDetail" && (React.createElement(ProductDetailScreen, { productId: activeProductId, go: setScreen, back: goBack, setToast: setToast, wishlist: wishlist, toggleWishlist: toggleWishlist, addToCart: addToCart, userId: user.id })),
        navBar,
        !(isArtisan && screen === "dashboard") && React.createElement("div", { className: "mode-switch-wrap" },
            React.createElement("button", { className: "mode-pill", onClick: switchRole },
                "\u21C4 Switch to ",
                isArtisan ? "Buyer" : "Artisan")),
        React.createElement(Toast, { message: toast }),
        showPermissions && React.createElement(PermissionCenter, { onClose: closePermissions })));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App, null));
