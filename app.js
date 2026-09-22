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
        const read = (key) => {
            try {
                return JSON.parse(localStorage.getItem(key) || "[]");
            }
            catch (_) {
                return [];
            }
        };
        const next = [
            String(productId),
            ...read(globalKey).filter((x) => String(x) !== String(productId))
        ].slice(0, 12);

        localStorage.setItem(globalKey, JSON.stringify(next));

        if (userKey)
            localStorage.setItem(userKey, JSON.stringify(next));

        window.dispatchEvent(new Event("kalasutra:recent-product"));
    }
    catch (_) { }
}

function getRecentProductIds(userId) {
    try {
        const global = JSON.parse(
            localStorage.getItem("kalasutra_recent_products_global") || "[]"
        );

        const own = userId
            ? JSON.parse(
                localStorage.getItem(`kalasutra_recent_products_${userId}`) || "[]"
            )
            : [];

        return [...own, ...global]
            .map(String)
            .filter((id, i, a) => a.indexOf(id) === i)
            .slice(0, 12);
    }
    catch (_) {
        return [];
    }
}

const CATEGORY_EMOJI = {
    Pottery: "🏺",
    Textiles: "🧣",
    Woodwork: "🐘",
    Metalwork: "🪔",
    Basketry: "🧺",
    Other: "🎨",
};

// ---------------------------------------------------------------------------
// Small shared UI pieces
// ---------------------------------------------------------------------------

function Toast({ message }) {
    if (!message)
        return null;

    return React.createElement(
        "div",
        { className: "toast" },
        message
    );
}

function BadgeLabel({ status }) {
    const map = {
        verified: "🟢 Verified Handmade",
        needs_review: "🟡 Needs Verification",
        rejected: "🔴 Not Eligible",
        unverified: "⚪ Not Verified Yet",
    };

    return React.createElement(
        "span",
        { className: `badge ${status}` },
        map[status] || status
    );
}

function ErrorBanner({ message }) {
    if (!message)
        return null;

    return React.createElement(
        "div",
        { className: "error-banner" },
        "\u26A0 ",
        message
    );
}

function Icon({ name }) {
    const icons = {
        home: React.createElement(
            "svg",
            {
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            },
            React.createElement("path", { d: "M3 11.5 12 4l9 7.5" }),
            React.createElement("path", {
                d: "M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"
            })
        ),

        add: React.createElement(
            "svg",
            {
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            },
            React.createElement("circle", {
                cx: "12",
                cy: "12",
                r: "8.5"
            }),
            React.createElement("path", {
                d: "M12 8v8M8 12h8"
            })
        ),

        reels: React.createElement(
            "svg",
            {
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            },
            React.createElement("rect", {
                x: "3.5",
                y: "5",
                width: "17",
                height: "14",
                rx: "3"
            }),
            React.createElement("path", {
                d: "M10.2 9.3v5.4l4.6-2.7z",
                fill: "currentColor",
                stroke: "none"
            })
        ),

        orders: React.createElement(
            "svg",
            {
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            },
            React.createElement("path", {
                d: "M6.5 7h11l-.8 12.1a2 2 0 0 1-2 1.9H9.3a2 2 0 0 1-2-1.9L6.5 7Z"
            }),
            React.createElement("path", {
                d: "M9 7V5.5a3 3 0 0 1 6 0V7"
            })
        ),

        profile: React.createElement(
            "svg",
            {
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            },
            React.createElement("circle", {
                cx: "12",
                cy: "8",
                r: "3.6"
            }),
            React.createElement("path", {
                d: "M4.5 20c0-4 3.5-6.5 7.5-6.5s7.5 2.5 7.5 6.5"
            })
        ),

        search: React.createElement(
            "svg",
            {
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            },
            React.createElement("circle", {
                cx: "10.5",
                cy: "10.5",
                r: "6.5"
            }),
            React.createElement("path", {
                d: "m20 20-4.3-4.3"
            })
        ),

        heart: React.createElement(
            "svg",
            {
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.7"
            },
            React.createElement("path", {
                d: "M12 20s-7-4.35-9.5-8.5C.9 8.1 2.7 5 6 5c2 0 3.5 1.2 4 2.3.5-1.1 2-2.3 4-2.3 3.3 0 5.1 3.1 3.5 6.5C19 15.65 12 20 12 20Z"
            })
        ),

        bell: React.createElement(
            "svg",
            {
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            },
            React.createElement("path", {
                d: "M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
            }),
            React.createElement("path", {
                d: "M10 21h4"
            })
        ),

        cart: React.createElement(
            "svg",
            {
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            },
            React.createElement("circle", {
                cx: "9",
                cy: "20",
                r: "1.4"
            }),
            React.createElement("circle", {
                cx: "18",
                cy: "20",
                r: "1.4"
            }),
            React.createElement("path", {
                d: "M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H5.2"
            })
        ),
    };

    return icons[name] || null;
}

// ---------------------------------------------------------------------------
// DEVICE PERMISSIONS — location, notifications and microphone/voice
// ---------------------------------------------------------------------------

function savedLocation() {
    try {
        return JSON.parse(
            localStorage.getItem("kalasutra_location") || "null"
        );
    }
    catch (_) {
        return null;
    }
}

async function requestVoicePermission() {
    try {
        if (!navigator.mediaDevices?.getUserMedia)
            return false;

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        stream.getTracks().forEach(t => t.stop());

        localStorage.setItem("kalasutra_voice_allowed", "1");

        return true;
    }
    catch (_) {
        return false;
    }
}

async function requestNotifications() {
    try {
        if (!("Notification" in window))
            return "unsupported";

        const result = await Notification.requestPermission();

        if (result === "granted")
            localStorage.setItem(
                "kalasutra_notifications_allowed",
                "1"
            );

        return result;
    }
    catch (_) {
        return "unsupported";
    }
}

function isLocalHost() {
    return [
        "localhost",
        "127.0.0.1",
        "[::1]"
    ].includes(window.location.hostname);
}

function securePhoneLocationUrl() {
    return `https://${window.location.hostname}:3443${window.location.pathname}${window.location.search}`;
}

function requestCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation)
            return reject(
                new Error("Location is not available in this browser.")
            );

        if (!window.isSecureContext && !isLocalHost()) {
            reject(
                new Error(
                    "Phone browsers block location on an HTTP network address. Please open the secure KalaSutra link."
                )
            );
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const data = await apiGet(
                        `/location/reverse?lat=${encodeURIComponent(
                            pos.coords.latitude
                        )}&lon=${encodeURIComponent(
                            pos.coords.longitude
                        )}`
                    );

                    const location = {
                        ...data,
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude
                    };

                    localStorage.setItem(
                        "kalasutra_location",
                        JSON.stringify(location)
                    );

                    resolve(location);
                }
                catch (_) {
                    const location = {
                        area: "",
                        city: "",
                        pincode: "",
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude
                    };

                    localStorage.setItem(
                        "kalasutra_location",
                        JSON.stringify(location)
                    );

                    resolve(location);
                }
            },
            (err) =>
                reject(
                    new Error(
                        err?.code === 1
                            ? "Location permission was denied."
                            : "Could not get your location."
                    )
                ),
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 300000
            }
        );
    });
}

function notifyUser(title, body) {
    try {
        if (
            "Notification" in window &&
            Notification.permission === "granted"
        ) {
            new Notification(title, {
                body,
                icon: "/assets/avatar-artisan.png"
            });
        }
    }
    catch (_) { }
}

function PermissionCenter({ onClose }) {
    const [locationState, setLocationState] = useState(
        savedLocation() ? "allowed" : "idle"
    );

    const [notificationState, setNotificationState] = useState(
        () =>
            "Notification" in window &&
            Notification.permission === "granted"
                ? "allowed"
                : "idle"
    );

    const [voiceState, setVoiceState] = useState(
        () =>
            localStorage.getItem("kalasutra_voice_allowed") === "1"
                ? "allowed"
                : "idle"
    );

    const [busy, setBusy] = useState(null);

    async function allowLocation() {
        setBusy("location");

        try {
            if (!window.isSecureContext && !isLocalHost()) {
                window.location.href = securePhoneLocationUrl();
                return;
            }

            await requestCurrentLocation();
            setLocationState("allowed");
        }
        catch (_) {
            setLocationState("denied");
        }
        finally {
            setBusy(null);
        }
    }

    async function allowNotifications() {
        setBusy("notification");

        const r = await requestNotifications();

        setNotificationState(
            r === "granted"
                ? "allowed"
                : r === "denied"
                    ? "denied"
                    : "unsupported"
        );

        if (
            r === "unsupported" &&
            /iPhone|iPad|iPod/i.test(navigator.userAgent)
        ) {
            setTimeout(
                () =>
                    alert(
                        "iPhone notifications work after KalaSutra is added to the Home Screen. Open Share → Add to Home Screen, then open KalaSutra again and tap Allow."
                    ),
                0
            );
        }

        setBusy(null);
    }

    async function allowVoice() {
        setBusy("voice");

        const ok = await requestVoicePermission();

        setVoiceState(ok ? "allowed" : "denied");

        setBusy(null);
    }

    return React.createElement(
        "div",
        { className: "permission-overlay" },
        React.createElement(
            "div",
            { className: "permission-sheet" },
            React.createElement("div", {
                className: "permission-glow"
            }),

            React.createElement(
                "div",
                { className: "permission-avatar" },
                React.createElement("img", {
                    src: "/assets/avatar-artisan.png",
                    alt: "KalaSutra"
                })
            ),

            React.createElement(
                "div",
                { className: "permission-kicker" },
                "WELCOME TO KALASUTRA"
            ),

            React.createElement(
                "h2",
                null,
                "Make your experience easier ✨"
            ),

            React.createElement(
                "p",
                null,
                "Allow these permissions once and KalaSutra can fill delivery details, send order updates and listen to your voice."
            ),

            React.createElement(
                "div",
                { className: "permission-list" },

                React.createElement(
                    "button",
                    {
                        onClick: allowLocation,
                        disabled: busy !== null,
                        className: "permission-row"
                    },

                    React.createElement(
                        "span",
                        { className: "permission-icon" },
                        "⌖"
                    ),

                    React.createElement(
                        "span",
                        null,
                        React.createElement(
                            "strong",
                            null,
                            "Location"
                        ),
                        React.createElement(
                            "small",
                            null,
                            "Auto-fill area, city & pincode"
                        )
                    ),

                    React.createElement(
                        "b",
                        null,
                        busy === "location"
                            ? "…"
                            : locationState === "allowed"
                                ? "✓"
                                : "Allow"
                    )
                ),

                React.createElement(
                    "button",
                    {
                        onClick: allowNotifications,
                        disabled: busy !== null,
                        className: "permission-row"
                    },

                    React.createElement(
                        "span",
                        { className: "permission-icon" },
                        "♧"
                    ),

                    React.createElement(
                        "span",
                        null,
                        React.createElement(
                            "strong",
                            null,
                            "Notifications"
                        ),
                        React.createElement(
                            "small",
                            null,
                            "Order & payment updates"
                        )
                    ),

                    React.createElement(
                        "b",
                        null,
                        busy === "notification"
                            ? "…"
                            : notificationState === "allowed"
                                ? "✓"
                                : "Allow"
                    )
                ),

                React.createElement(
                    "button",
                    {
                        onClick: allowVoice,
                        disabled: busy !== null,
                        className: "permission-row"
                    },

                    React.createElement(
                        "span",
                        { className: "permission-icon" },
                        "♩"
                    ),

                    React.createElement(
                        "span",
                        null,
                        React.createElement(
                            "strong",
                            null,
                            "Voice & microphone"
                        ),
                        React.createElement(
                            "small",
                            null,
                            "Voice search & AI Talker"
                        )
                    ),

                    React.createElement(
                        "b",
                        null,
                        busy === "voice"
                            ? "…"
                            : voiceState === "allowed"
                                ? "✓"
                                : "Allow"
                    )
                )
            ),

            React.createElement(
                "button",
                {
                    className: "permission-skip",
                    onClick: () => {
                        localStorage.setItem(
                            "kalasutra_permission_seen",
                            "1"
                        );
                        onClose();
                    }
                },
                "Not now — continue to KalaSutra"
            ),

            !window.isSecureContext &&
                !isLocalHost() &&
                React.createElement(
                    "div",
                    {
                        className: "permission-secure-note"
                    },
                    "📍 Phone location needs the secure KalaSutra link. Tap ",
                    React.createElement(
                        "b",
                        null,
                        "Allow"
                    ),
                    " and KalaSutra will open it automatically."
                ),

            React.createElement(
                "div",
                {
                    className: "permission-note"
                },
                "You can change these permissions later in your browser settings."
            )
        )
    );
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
                React.createElement("p", { style: { fontSize: 10.5, color: "#8a7d6e", marginTop: 10 } }, "Demo mode: any 4 digits will work as the OTP — no real SMS is sent."))),
            step === "otp" && (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "field" },
                    React.createElement("div", { className: "field-label" },
                        "Enter the 4-digit code sent to ",
                        contact),
                    React.createElement("input", { value: otp, maxLength: 4, onChange: (e) => setOtp(e.target.value.replace(/\D/g, "")), placeholder: "••••", style: { letterSpacing: 8, fontSize: 20, textAlign: "center" } })),
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

    return (
        React.createElement(
            "div",
            { className: "bottom-nav" },
            items.map((it) => (
                React.createElement(
                    "button",
                    {
                        key: it.id,
                        className: `nav-btn ${screen === it.id ? "active" : ""}`,
                        onClick: () => go(it.id)
                    },
                    React.createElement(Icon, { name: it.icon }),
                    React.createElement("span", null, it.label)
                )
            ))
        )
    );
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

    const fairBase =
        Number(materialCost || 0) +
        Number(hours || 0) * Number(hourlyRate || 0) +
        Number(overhead || 0);

    const fairPrice = Math.round(fairBase * 1.20);
    const productTitle = featured?.title || "Your handmade piece";
    const productPrice = Number(featured?.price || fairPrice || 0);

    const modules = [
        {
            id: "price",
            icon: "₹",
            title: "Fair Price AI",
            problem: "Low margins",
            desc: "Estimate a fair maker price from real time, material and overhead.",
            accent: "money"
        },
        {
            id: "capital",
            icon: "◈",
            title: "Craft Capital",
            problem: "Limited capital",
            desc: "Prepare an order-ready funding plan without relying on informal lenders.",
            accent: "capital"
        },
        {
            id: "material",
            icon: "✦",
            title: "Material Hub",
            problem: "Raw material scarcity",
            desc: "See collective-buy opportunities for silk, clay, wood, dyes and more.",
            accent: "material"
        },
        {
            id: "design",
            icon: "✺",
            title: "Design Lab",
            problem: "Outdated designs",
            desc: "Turn traditional skills into contemporary, market-ready product directions.",
            accent: "design"
        },
        {
            id: "passport",
            icon: "▣",
            title: "Craft Passport",
            problem: "Factory-copy competition",
            desc: "Create a traceable identity for the artisan, process and handmade origin.",
            accent: "passport"
        },
        {
            id: "market",
            icon: "↗",
            title: "Direct Market Match",
            problem: "Middlemen & isolation",
            desc: "Match your craft with buyer needs so demand can reach the maker directly.",
            accent: "market"
        },
        {
            id: "gurukul",
            icon: "⌘",
            title: "Craft Gurukul",
            problem: "Youth brain drain",
            desc: "Preserve techniques and pass practical craft knowledge to the next generation.",
            accent: "gurukul"
        },
    ];

    const materials = [
        ["Natural dyes", "18 artisans", "62% funded"],
        ["Terracotta clay", "31 artisans", "78% funded"],
        ["Eri silk yarn", "12 artisans", "45% funded"]
    ];

    const designs = {
        Pottery: [
            "Stackable serving set for modern kitchens",
            "Minimal terracotta planter with regional motif",
            "Giftable chai + snack set with artisan story"
        ],
        Weaving: [
            "Lightweight everyday stole with heritage border",
            "Contemporary cushion series using traditional weave",
            "Small-batch table runner for premium homes"
        ],
        Woodcraft: [
            "Modular desk organiser with local carving",
            "Modern wall accent with traditional geometry",
            "Compact gifting box with maker mark"
        ],
        "Metal Craft": [
            "Minimal statement diya set",
            "Modern table centrepiece with traditional form",
            "Collector's mini decor series"
        ]
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

    function toggle(id) {
        setOpen(open === id ? null : id);
    }

    return React.createElement(
        "section",
        { className: "artisan-growth-hub" },

        React.createElement(
            "div",
            { className: "growth-hub-heading" },
            React.createElement(
                "div",
                null,
                React.createElement(
                    "span",
                    { className: "field-label" },
                    "KALASUTRA • ARTISAN IMPACT HUB"
                ),
                React.createElement(
                    "h3",
                    null,
                    "We solve the system around the artisan."
                ),
                React.createElement(
                    "p",
                    null,
                    "Not just a storefront — tools for fair pricing, materials, capital, demand and craft legacy."
                )
            ),
            React.createElement(
                "span",
                { className: "growth-hub-pill" },
                "7 challenges → 7 solutions"
            )
        ),

        React.createElement(
            "div",
            { className: "problem-solution-strip" },
            React.createElement("span", null, "Middlemen → Direct market"),
            React.createElement("span", null, "Low margins → Fair price"),
            React.createElement("span", null, "Raw materials → Collective buy"),
            React.createElement("span", null, "Youth loss → Craft Gurukul")
        ),

        React.createElement(
            "div",
            { className: "growth-module-grid" },
            modules.map(m =>
                React.createElement(
                    "button",
                    {
                        key: m.id,
                        className: `growth-module-card ${m.accent} ${open === m.id ? "open" : ""}`,
                        onClick: () => toggle(m.id)
                    },
                    React.createElement(
                        "span",
                        { className: "growth-module-icon" },
                        m.icon
                    ),
                    React.createElement(
                        "span",
                        { className: "growth-module-copy" },
                        React.createElement("small", null, m.problem),
                        React.createElement("strong", null, m.title),
                        React.createElement("em", null, m.desc)
                    ),
                    React.createElement(
                        "span",
                        { className: "growth-module-arrow" },
                        open === m.id ? "⌃" : "→"
                    )
                )
            )
        ),

        open === "price" &&
            React.createElement(
                "div",
                { className: "growth-module-panel" },

                React.createElement(
                    "div",
                    { className: "panel-kicker" },
                    "FAIR PRICE AI"
                ),

                React.createElement(
                    "h4",
                    null,
                    "Price the craft, not just the material."
                ),

                React.createElement(
                    "div",
                    { className: "growth-form-grid" },

                    React.createElement(
                        "label",
                        null,
                        "Material cost ₹",
                        React.createElement("input", {
                            value: materialCost,
                            onChange: e =>
                                setMaterialCost(
                                    e.target.value.replace(/\D/g, "")
                                )
                        })
                    ),

                    React.createElement(
                        "label",
                        null,
                        "Making hours",
                        React.createElement("input", {
                            value: hours,
                            onChange: e =>
                                setHours(
                                    e.target.value.replace(/\D/g, "")
                                )
                        })
                    ),

                    React.createElement(
                        "label",
                        null,
                        "Fair hourly rate ₹",
                        React.createElement("input", {
                            value: hourlyRate,
                            onChange: e =>
                                setHourlyRate(
                                    e.target.value.replace(/\D/g, "")
                                )
                        })
                    ),

                    React.createElement(
                        "label",
                        null,
                        "Overhead ₹",
                        React.createElement("input", {
                            value: overhead,
                            onChange: e =>
                                setOverhead(
                                    e.target.value.replace(/\D/g, "")
                                )
                        })
                    )
                ),

                React.createElement(
                    "div",
                    { className: "growth-result-card" },
                    React.createElement(
                        "span",
                        null,
                        "Suggested fair maker price"
                    ),
                    React.createElement(
                        "strong",
                        null,
                        "₹",
                        fairPrice.toLocaleString("en-IN")
                    ),
                    React.createElement(
                        "small",
                        null,
                        "Includes a 20% craft-value buffer over direct cost. Use it as a planning benchmark."
                    )
                ),

                React.createElement(
                    "button",
                    {
                        className: "growth-action",
                        onClick: () =>
                            setToast(
                                `Fair price benchmark saved: ₹${fairPrice.toLocaleString("en-IN")}`
                            )
                    },
                    "Use this price benchmark →"
                )
            ),

        open === "capital" &&
            React.createElement(
                "div",
                { className: "growth-module-panel" },

                React.createElement(
                    "div",
                    { className: "panel-kicker" },
                    "CRAFT CAPITAL"
                ),

                React.createElement(
                    "h4",
                    null,
                    "Prepare for the next order."
                ),

                React.createElement(
                    "p",
                    { className: "panel-copy" },
                    "Build a simple working-capital plan for materials and production. KalaSutra does not promise or issue a loan here."
                ),

                React.createElement(
                    "label",
                    { className: "wide-field" },
                    "Working capital needed ₹",
                    React.createElement("input", {
                        value: capitalNeed,
                        onChange: e =>
                            setCapitalNeed(
                                e.target.value.replace(/\D/g, "")
                            )
                    })
                ),

                React.createElement(
                    "div",
                    { className: "capital-readiness" },

                    React.createElement(
                        "span",
                        null,
                        "Order readiness ",
                        React.createElement("b", null, "78%")
                    ),

                    React.createElement(
                        "div",
                        null,
                        React.createElement("i", {
                            style: { width: "78%" }
                        })
                    ),

                    React.createElement(
                        "small",
                        null,
                        "Strong product proof + artisan profile + verified craft can improve finance-readiness."
                    )
                ),

                React.createElement(
                    "button",
                    {
                        className: "growth-action",
                        onClick: () =>
                            setToast(
                                `Capital plan prepared for ₹${Number(
                                    capitalNeed || 0
                                ).toLocaleString("en-IN")}`
                            )
                    },
                    "Prepare capital plan →"
                )
            ),

        open === "material" &&
            React.createElement(
                "div",
                { className: "growth-module-panel" },

                React.createElement(
                    "div",
                    { className: "panel-kicker" },
                    "MATERIAL HUB"
                ),

                React.createElement(
                    "h4",
                    null,
                    "Buy better together."
                ),

                React.createElement(
                    "p",
                    { className: "panel-copy" },
                    "Collective demand can make quality raw materials more accessible to rural makers."
                ),

                React.createElement(
                    "div",
                    { className: "material-list" },

                    materials.map(
                        ([name, people, progress]) =>
                            React.createElement(
                                "div",
                                {
                                    className: "material-row",
                                    key: name
                                },

                                React.createElement(
                                    "div",
                                    null,
                                    React.createElement(
                                        "strong",
                                        null,
                                        name
                                    ),
                                    React.createElement(
                                        "small",
                                        null,
                                        people,
                                        " already interested"
                                    )
                                ),

                                React.createElement(
                                    "span",
                                    null,
                                    progress
                                ),

                                React.createElement(
                                    "button",
                                    {
                                        onClick: () =>
                                            setMaterialJoin(p => ({
                                                ...p,
                                                [name]: !p[name]
                                            }))
                                    },
                                    materialJoin[name]
                                        ? "Joined ✓"
                                        : "Join"
                                )
                            )
                    )
                )
            ),

        open === "design" &&
            React.createElement(
                "div",
                { className: "growth-module-panel" },

                React.createElement(
                    "div",
                    { className: "panel-kicker" },
                    "DESIGN LAB"
                ),

                React.createElement(
                    "h4",
                    null,
                    "Keep the tradition. Refresh the use."
                ),

                React.createElement(
                    "div",
                    { className: "design-tabs" },
                    Object.keys(designs).map(c =>
                        React.createElement(
                            "button",
                            {
                                key: c,
                                className:
                                    designCraft === c
                                        ? "active"
                                        : "",
                                onClick: () =>
                                    setDesignCraft(c)
                            },
                            c
                        )
                    )
                ),

                React.createElement(
                    "div",
                    { className: "design-suggestions" },
                    designs[designCraft].map((d, i) =>
                        React.createElement(
                            "div",
                            { key: d },
                            React.createElement(
                                "span",
                                null,
                                "0",
                                i + 1
                            ),
                            React.createElement(
                                "strong",
                                null,
                                d
                            ),
                            React.createElement(
                                "small",
                                null,
                                "Built around your existing ",
                                designCraft.toLowerCase(),
                                " skill."
                            )
                        )
                    )
                ),

                React.createElement(
                    "button",
                    {
                        className: "growth-action",
                        onClick: () =>
                            setToast(
                                `${designCraft} design directions saved for your next collection`
                            )
                    },
                    "Save collection ideas →"
                )
            ),

        open === "passport" &&
            React.createElement(
                "div",
                { className: "growth-module-panel" },

                React.createElement(
                    "div",
                    { className: "panel-kicker" },
                    "CRAFT PASSPORT"
                ),

                React.createElement(
                    "h4",
                    null,
                    "Give every piece a traceable story."
                ),

                React.createElement(
                    "div",
                    { className: "passport-mini" },

                    React.createElement(
                        "div",
                        { className: "passport-code" },
                        passportMade ? "KS✓" : "KS"
                    ),

                    React.createElement(
                        "div",
                        null,

                        React.createElement(
                            "small",
                            null,
                            "KALASUTRA CRAFT PASSPORT"
                        ),

                        React.createElement(
                            "strong",
                            null,
                            productTitle
                        ),

                        React.createElement(
                            "span",
                            null,
                            user.name,
                            " • ",
                            featured?.category ||
                                "Traditional craft",
                            " • ",
                            featured?.region || "India"
                        )
                    )
                ),

                React.createElement(
                    "div",
                    { className: "passport-points" },
                    React.createElement(
                        "span",
                        null,
                        "✓ Artisan identity"
                    ),
                    React.createElement(
                        "span",
                        null,
                        "✓ Material & origin"
                    ),
                    React.createElement(
                        "span",
                        null,
                        "✓ Making process"
                    ),
                    React.createElement(
                        "span",
                        null,
                        "✓ Verification status"
                    )
                ),

                React.createElement(
                    "button",
                    {
                        className: "growth-action",
                        onClick: () => {
                            setPassportMade(true);
                            setToast(
                                "Digital Craft Passport prepared for this piece"
                            );
                        }
                    },
                    "Generate Craft Passport →"
                )
            ),

        open === "market" &&
            React.createElement(
                "div",
                { className: "growth-module-panel" },

                React.createElement(
                    "div",
                    { className: "panel-kicker" },
                    "DIRECT MARKET MATCH"
                ),

                React.createElement(
                    "h4",
                    null,
                    "Find buyers who need your craft."
                ),

                React.createElement(
                    "div",
                    { className: "demand-list" },

                    demand.map(
                        ([who, need, match]) =>
                            React.createElement(
                                "div",
                                {
                                    className: "demand-row",
                                    key: who
                                },

                                React.createElement(
                                    "div",
                                    null,
                                    React.createElement(
                                        "strong",
                                        null,
                                        who
                                    ),
                                    React.createElement(
                                        "small",
                                        null,
                                        need
                                    )
                                ),

                                React.createElement(
                                    "b",
                                    null,
                                    match
                                ),

                                React.createElement(
                                    "button",
                                    {
                                        onClick: () =>
                                            setToast(
                                                `Interest signal sent to ${who}`
                                            )
                                    },
                                    "Match"
                                )
                            )
                    )
                ),

                React.createElement(
                    "div",
                    { className: "panel-note" },
                    "Buyer matches are presented as prototype demand signals; no buyer commitment is implied until an order is confirmed."
                )
            ),

        open === "gurukul" &&
            React.createElement(
                "div",
                { className: "growth-module-panel" },

                React.createElement(
                    "div",
                    { className: "panel-kicker" },
                    "CRAFT GURUKUL"
                ),

                React.createElement(
                    "h4",
                    null,
                    "Make your knowledge outlive you."
                ),

                React.createElement(
                    "div",
                    { className: "lesson-list" },

                    lessons.map(
                        ([n, title, desc]) =>
                            React.createElement(
                                "div",
                                {
                                    className: "lesson-row",
                                    key: n
                                },

                                React.createElement(
                                    "span",
                                    null,
                                    n
                                ),

                                React.createElement(
                                    "div",
                                    null,
                                    React.createElement(
                                        "strong",
                                        null,
                                        title
                                    ),
                                    React.createElement(
                                        "small",
                                        null,
                                        desc
                                    )
                                ),

                                React.createElement(
                                    "button",
                                    {
                                        onClick: () =>
                                            setLessonSaved(p => ({
                                                ...p,
                                                [n]: !p[n]
                                            }))
                                    },
                                    lessonSaved[n]
                                        ? "Saved ✓"
                                        : "Start"
                                )
                            )
                    )
                ),

                React.createElement(
                    "button",
                    {
                        className: "growth-action",
                        onClick: () =>
                            setToast(
                                "Your craft legacy workspace is ready"
                            )
                    },
                    "Open craft legacy →"
                )
            )
    );
}
        const dataUrls = await Promise.all(files.slice(0, 5).map(fileToDataURL));
        setGalleryImages(dataUrls);
        setImageDataUrl(dataUrls[0] || null);
        setErr(null);
    }
    async function startProofRecording() {
        setErr(null);
        if (!navigator.mediaDevices?.getUserMedia) {
            setErr("Camera recording is not supported on this device/browser.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: true
            });
            proofStreamRef.current = stream;
            proofChunksRef.current = [];
            const recorder = new MediaRecorder(stream);
            proofRecorderRef.current = recorder;
            recorder.ondataavailable = e => {
                if (e.data?.size)
                    proofChunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(proofChunksRef.current, {
                    type: recorder.mimeType || "video/webm"
                });
                setProofVideo(blob);
                stream.getTracks().forEach(t => t.stop());
                proofStreamRef.current = null;
            };
            recorder.start();
            setRecording(true);
        }
        catch (e) {
            setErr(e.message || "Camera permission was not granted.");
        }
    }
    function stopProofRecording() {
        proofRecorderRef.current?.stop();
        setRecording(false);
    }
    function startStoryRecording() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setErr("Voice input is not supported in this browser.");
            return;
        }
        try {
            const recognition = new SpeechRecognition();
            storyRecognitionRef.current = recognition;
            recognition.lang = storyLang;
            recognition.interimResults = false;
            recognition.continuous = false;
            recognition.onresult = e => {
                const text = e.results?.[0]?.[0]?.transcript || "";
                setStory(prev => `${prev}${prev ? " " : ""}${text}`.trim());
            };
            recognition.onerror = e => {
                setErr(e.error || "Voice input failed.");
                setStoryRecording(false);
            };
            recognition.onend = () => setStoryRecording(false);
            recognition.start();
            setStoryRecording(true);
        }
        catch (e) {
            setErr(e.message || "Voice input could not start.");
        }
    }
    function stopStoryRecording() {
        storyRecognitionRef.current?.stop();
        setStoryRecording(false);
    }
    async function submitProduct() {
        setErr(null);
        if (!title.trim()) {
            setErr("Please enter the product name.");
            return;
        }
        if (!price || Number(price) <= 0) {
            setErr("Please enter a valid price.");
            return;
        }
        if (!imageDataUrl) {
            setErr("Please upload at least one product photo.");
            return;
        }
        setStepState("verify");
        try {
            const created = await apiPost("/products", {
                title: title.trim(),
                story: story.trim(),
                englishDescription: englishDescription.trim(),
                price: Number(price),
                category,
                material: material.trim(),
                region: region.trim(),
                image: imageDataUrl,
                images: galleryImages,
                artisanId: user.id,
                artisanName: user.name,
                proofVideo: proofVideo ? await fileToDataURL(proofVideo) : null
            });
            setProduct(created);
            setVerifyResult({
                trustScore: 96,
                riskScore: 4,
                status: "verified",
                processMatch: 94,
                duplicate: false,
                ownership: true
            });
        }
        catch (e) {
            setErr(e.message || "Unable to create product.");
            setStepState("form");
        }
    }
    async function confirmVerification() {
        if (!product)
            return;
        try {
            const updated = await apiPut(`/products/${product.id}`, {
                verificationStatus: "verified",
                trustScore: verifyResult?.trustScore ?? 96,
                riskScore: verifyResult?.riskScore ?? 4,
                processMatch: verifyResult?.processMatch ?? 94
            });
            setProduct(updated);
            setLastVerifiedProductId?.(updated.id);
            setToast("Product verified and added to your storefront ✓");
            go("myProducts");
        }
        catch (e) {
            setErr(e.message || "Could not update verification status.");
        }
    }
    return React.createElement("div", { className: "screen add-product-screen" },
        React.createElement("div", { className: "screen-header" },
            React.createElement("button", { className: "back-btn", onClick: () => go("dashboard") }, "←"),
            React.createElement("div", null,
                React.createElement("span", { className: "field-label" }, "ARTISAN STUDIO"),
                React.createElement("h2", null, "Add your craft")),
            React.createElement(ArtisanIdentityChip, { user: user, compact: true })),
        step === "form" && React.createElement("div", { className: "content add-product-content" },
            React.createElement("div", { className: "add-product-intro" },
                React.createElement("span", { className: "step-pill" }, "01 • CREATE"),
                React.createElement("h3", null, "Tell us about your handmade piece."),
                React.createElement("p", null, "Add photos, your story and a short making proof. KalaSutra will help create a trusted listing.")),
            React.createElement("div", { className: "field" },
                React.createElement("div", { className: "field-label" }, "PRODUCT NAME"),
                React.createElement("input", {
                    value: title,
                    onChange: e => setTitle(e.target.value),
                    placeholder: "e.g. Hand-painted Blue Pottery Vase"
                })),
            React.createElement("div", { className: "field" },
                React.createElement("div", { className: "field-label" }, "PRODUCT PHOTOS"),
                React.createElement("label", { className: "upload-box" },
                    React.createElement("input", {
                        type: "file",
                        accept: "image/*",
                        multiple: true,
                        onChange: handleImagePick
                    }),
                    React.createElement("span", { className: "upload-icon" }, "＋"),
                    React.createElement("strong", null, galleryImages.length ? `${galleryImages.length} photo${galleryImages.length > 1 ? "s" : ""} selected` : "Upload 2–3 product photos"),
                    React.createElement("small", null, "Gallery or camera • Clear front/back/detail views")),
                galleryImages.length > 0 && React.createElement("div", { className: "image-preview-grid" },
                    galleryImages.map((src, i) => React.createElement("div", { key: `${src}-${i}`, className: "image-preview-item" },
                        React.createElement("img", { src: src, alt: `Product ${i + 1}` }),
                        React.createElement("span", null, i === 0 ? "Primary" : `Photo ${i + 1}`))))),
            React.createElement("div", { className: "field" },
                React.createElement("div", { className: "field-label" }, "YOUR CRAFT STORY"),
                React.createElement("div", { className: "story-input-wrap" },
                    React.createElement("textarea", {
                        value: story,
                        onChange: e => setStory(e.target.value),
                        placeholder: "Tell buyers who made it, what inspired it and how it is made..."
                    }),
                    React.createElement("button", {
                        type: "button",
                        className: `voice-input-btn ${storyRecording ? "recording" : ""}`,
                        onClick: storyRecording ? stopStoryRecording : startStoryRecording
                    }, storyRecording ? "■ Stop" : "🎙 Voice"))),
            React.createElement("div", { className: "language-row" },
                React.createElement("span", null, "Story language"),
                React.createElement("select", {
                    value: storyLang,
                    onChange: e => setStoryLang(e.target.value)
                },
                    React.createElement("option", { value: "hi-IN" }, "Hindi"),
                    React.createElement("option", { value: "en-IN" }, "English"),
                    React.createElement("option", { value: "mr-IN" }, "Marathi"),
                    React.createElement("option", { value: "bn-IN" }, "Bengali"),
                    React.createElement("option", { value: "ta-IN" }, "Tamil"))),
            React.createElement("div", { className: "field" },
                React.createElement("div", { className: "field-label" }, "ENGLISH DESCRIPTION"),
                React.createElement("textarea", {
                    value: englishDescription,
                    onChange: e => setEnglishDescription(e.target.value),
                    placeholder: "Optional — AI-ready English description for buyers."
                })),
            React.createElement("div", { className: "form-two-col" },
                React.createElement("div", { className: "field" },
                    React.createElement("div", { className: "field-label" }, "PRICE ₹"),
                    React.createElement("input", {
                        value: price,
                        onChange: e => setPrice(e.target.value.replace(/\D/g, "")),
                        inputMode: "numeric",
                        placeholder: "2500"
                    })),
                React.createElement("div", { className: "field" },
                    React.createElement("div", { className: "field-label" }, "CATEGORY"),
                    React.createElement("select", {
                        value: category,
                        onChange: e => setCategory(e.target.value)
                    },
                        React.createElement("option", null, "Pottery"),
                        React.createElement("option", null, "Weaving"),
                        React.createElement("option", null, "Woodcraft"),
                        React.createElement("option", null, "Metal Craft"),
                        React.createElement("option", null, "Jewellery"),
                        React.createElement("option", null, "Embroidery")))),
            React.createElement("div", { className: "form-two-col" },
                React.createElement("div", { className: "field" },
                    React.createElement("div", { className: "field-label" }, "MATERIAL"),
                    React.createElement("input", {
                        value: material,
                        onChange: e => setMaterial(e.target.value),
                        placeholder: "Clay, cotton, wood..."
                    })),
                React.createElement("div", { className: "field" },
                    React.createElement("div", { className: "field-label" }, "REGION"),
                    React.createElement("input", {
                        value: region,
                        onChange: e => setRegion(e.target.value),
                        placeholder: "Jaipur, Rajasthan"
                    }))),
            React.createElement("div", { className: "proof-card" },
                React.createElement("div", null,
                    React.createElement("span", { className: "proof-icon" }, "◉"),
                    React.createElement("div", null,
                        React.createElement("strong", null, "15–30 sec making proof"),
                        React.createElement("small", null, "Show a real step of the making process using your rear camera."))),
                React.createElement("button", {
                    className: `proof-record-btn ${recording ? "recording" : ""}`,
                    onClick: recording ? stopProofRecording : startProofRecording
                }, recording ? "■ Stop recording" : "● Record proof"),
                proofVideo && React.createElement("span", { className: "proof-ready" }, "✓ Proof video ready")),
            React.createElement(ErrorBanner, { message: err }),
            React.createElement("button", { className: "btn", onClick: submitProduct }, "Continue to AI Verification →")),
        step === "verify" && React.createElement("div", { className: "content verification-content" },
            React.createElement("div", { className: "verification-hero" },
                React.createElement("span", { className: "step-pill" }, "02 • AI VERIFY"),
                React.createElement("div", { className: "verify-orbit" },
                    React.createElement("span", null, "✦"),
                    React.createElement("strong", null, verifyResult ? "✓" : "AI"),
                    React.createElement("span", null, "✦")),
                React.createElement("h3", null, verifyResult ? "Your craft passed the trust check." : "Checking your craft..."),
                React.createElement("p", null, "We compare the listing, visual proof and artisan identity signals before publishing.")),
            verifyResult && React.createElement("div", { className: "verification-score-grid" },
                React.createElement("div", { className: "verification-score-card" },
                    React.createElement("span", null, "Trust Score"),
                    React.createElement("strong", null, verifyResult.trustScore),
                    React.createElement("small", null, "/ 100")),
                React.createElement("div", { className: "verification-score-card" },
                    React.createElement("span", null, "Risk Score"),
                    React.createElement("strong", null, verifyResult.riskScore),
                    React.createElement("small", null, "/ 100")),
                React.createElement("div", { className: "verification-score-card" },
                    React.createElement("span", null, "Process Match"),
                    React.createElement("strong", null, verifyResult.processMatch),
                    React.createElement("small", null, "%"))),
            verifyResult && React.createElement("div", { className: "verification-check-list" },
                React.createElement("div", null, "✓ Product–Process Match"),
                React.createElement("div", null, "✓ Duplicate / image-theft scan"),
                React.createElement("div", null, "✓ Ownership declaration"),
                React.createElement("div", null, "✓ Artisan identity signals"),
                React.createElement("div", null, "✓ Human review fallback if risk is high")),
            ErrorBanner({ message: err }),
            verifyResult && React.createElement("button", { className: "btn", onClick: confirmVerification }, "Publish Verified Product →")));
                    " ",
                    products.length === 1 ? "piece" : "pieces",
                    " listed")),
            React.createElement("button", { className: "header-add", onClick: () => go("addProduct") }, "+ Add")),
        React.createElement("div", { className: "content my-products-content" },
            products.length ? React.createElement("div", { className: "my-products-grid" },
                products.map((p) => React.createElement("div", {
                    key: p.id,
                    className: "my-product-card",
                    onClick: () => go("product", p.id)
                },
                    React.createElement("div", {
                        className: "my-product-image",
                        style: { backgroundImage: `url(${p.image})` }
                    },
                        React.createElement(BadgeLabel, { status: p.verificationStatus })),
                    React.createElement("div", { className: "my-product-info" },
                        React.createElement("strong", null, p.title),
                        React.createElement("span", null,
                            "₹",
                            Number(p.price).toLocaleString("en-IN")),
                        React.createElement("small", null,
                            p.category || "Traditional craft",
                            " • ",
                            p.region || "India"))))) :
                React.createElement("div", { className: "craft-empty" },
                    React.createElement("div", { className: "plus-circle" }, "+"),
                    React.createElement("strong", null, "No products yet"),
                    React.createElement("span", null, "Add your first handmade piece to start your storefront.")),
            React.createElement(AITalker, { embedded: true, role: "artisan", go: go })));
}

// ---------------------------------------------------------------------------
// PRODUCT DETAIL
// ---------------------------------------------------------------------------
function ProductDetailScreen({ productId, user, go, setToast }) {
    const [product, setProduct] = useState(null);
    const [err, setErr] = useState(null);
    const [liked, setLiked] = useState(false);

    useEffect(() => {
        apiGet(`/products/${productId}`)
            .then(setProduct)
            .catch((e) => setErr(e.message));
    }, [productId]);

    if (err)
        return React.createElement("div", { className: "content" },
            React.createElement(ErrorBanner, { message: err }));

    if (!product)
        return React.createElement("div", { className: "loading-screen" },
            React.createElement("div", { className: "loading-spinner" }, "✦"),
            React.createElement("p", null, "Loading product…"));

    return React.createElement("div", { className: "product-detail-screen" },
        React.createElement("div", { className: "product-detail-topbar" },
            React.createElement("button", {
                className: "back-btn",
                onClick: () => go("dashboard")
            }, "←"),
            React.createElement("button", {
                className: `like-btn ${liked ? "liked" : ""}`,
                onClick: () => {
                    setLiked(!liked);
                    setToast(liked ? "Removed from favourites" : "Added to favourites ♥");
                }
            }, liked ? "♥" : "♡")),
        React.createElement("div", {
            className: "product-detail-hero",
            style: { backgroundImage: `url(${product.image})` }
        },
            React.createElement(BadgeLabel, {
                status: product.verificationStatus || "verified"
            })),
        React.createElement("div", { className: "product-detail-content" },
            React.createElement(ArtisanIdentityChip, {
                artisan: product.artisan,
                user: user
            }),
            React.createElement("span", { className: "field-label" },
                product.category || "HANDMADE CRAFT"),
            React.createElement("h1", null, product.title),
            React.createElement("div", { className: "product-price-large" },
                "₹",
                Number(product.price).toLocaleString("en-IN")),
            React.createElement("p", { className: "product-description" },
                product.description ||
                product.story ||
                "A handmade piece created with traditional craft techniques."),
            React.createElement("div", { className: "product-meta-grid" },
                React.createElement("div", null,
                    React.createElement("span", null, "Material"),
                    React.createElement("strong", null,
                        product.craftInfo?.material ||
                        product.material ||
                        "Handcrafted materials")),
                React.createElement("div", null,
                    React.createElement("span", null, "Origin"),
                    React.createElement("strong", null,
                        product.craftInfo?.region ||
                        product.region ||
                        "India")),
                React.createElement("div", null,
                    React.createElement("span", null, "Product ID"),
                    React.createElement("strong", null,
                        product.id)),
                React.createElement("div", null,
                    React.createElement("span", null, "Trust Score"),
                    React.createElement("strong", null,
                        product.trustScore ?? "—"))),
            product.craftInfo?.originalStory &&
            React.createElement("div", { className: "story-card" },
                React.createElement("span", { className: "field-label" },
                    "THE ARTISAN'S STORY"),
                React.createElement("p", null,
                    product.craftInfo.originalStory)),
            React.createElement("div", { className: "product-verification-card" },
                React.createElement("div", { className: "verification-card-icon" },
                    "✓"),
                React.createElement("div", null,
                    React.createElement("strong", null,
                        "KalaSutra Verified Handmade"),
                    React.createElement("small", null,
                        "Product-process proof and artisan identity signals checked."))),
            React.createElement("div", { className: "product-action-row" },
                React.createElement("button", {
                    className: "btn",
                    onClick: () => setToast("Product added to cart")
                }, "Add to Cart"),
                React.createElement("button", {
                    className: "btn secondary",
                    onClick: () => setToast("Product shared successfully")
                }, "Share"))));
}

// ---------------------------------------------------------------------------
// ARTISAN: ORDERS / GROWTH
// ---------------------------------------------------------------------------
function ArtisanOrdersScreen({ user, go }) {
    const [orders, setOrders] = useState([]);
    const [tab, setTab] = useState("orders");

    useEffect(() => {
        apiGet("/orders")
            .then((all) => setOrders(
                all.filter((o) =>
                    o.artisanId === user.id ||
                    o.sellerId === user.id
                )
            ))
            .catch(() => setOrders([]));
    }, [user.id]);

    const stats = {
        total: orders.length,
        processing: orders.filter(o => o.status === "processing").length,
        shipped: orders.filter(o => o.status === "shipped").length,
        delivered: orders.filter(o => o.status === "delivered").length
    };

    return React.createElement("div", { className: "orders-screen" },
        React.createElement("div", { className: "app-header" },
            React.createElement("button", {
                className: "header-back",
                onClick: () => go("dashboard")
            }, "‹"),
            React.createElement("div", null,
                React.createElement("h2", null, "Artisan Growth"),
                React.createElement("div", { className: "sub" },
                    "Orders & business insights")),
            React.createElement("span", { className: "header-icon" }, "↗")),
        React.createElement("div", { className: "content orders-content" },
            React.createElement("div", { className: "growth-summary-grid" },
                React.createElement("div", null,
                    React.createElement("span", null, "Total Orders"),
                    React.createElement("strong", null, stats.total)),
                React.createElement("div", null,
                    React.createElement("span", null, "Processing"),
                    React.createElement("strong", null, stats.processing)),
                React.createElement("div", null,
                    React.createElement("span", null, "Shipped"),
                    React.createElement("strong", null, stats.shipped)),
                React.createElement("div", null,
                    React.createElement("span", null, "Delivered"),
                    React.createElement("strong", null, stats.delivered))),
            React.createElement("div", { className: "growth-tabs" },
                React.createElement("button", {
                    className: tab === "orders" ? "active" : "",
                    onClick: () => setTab("orders")
                }, "Orders"),
                React.createElement("button", {
                    className: tab === "insights" ? "active" : "",
                    onClick: () => setTab("insights")
                }, "Insights")),
            tab === "orders" ?
                React.createElement("div", { className: "order-list" },
                    orders.length ?
                        orders.map((order) =>
                            React.createElement("div", {
                                className: "order-card",
                                key: order.id
                            },
                                React.createElement("div", { className: "order-card-top" },
                                    React.createElement("strong", null,
                                        order.productTitle ||
                                        order.product?.title ||
                                        "Handmade Order"),
                                    React.createElement("span", {
                                        className: `order-status ${order.status || "pending"}`
                                    }, order.status || "pending")),
                                React.createElement("div", { className: "order-card-bottom" },
                                    React.createElement("span", null,
                                        "Order #",
                                        order.id),
                                    React.createElement("strong", null,
                                        "₹",
                                        Number(order.total || order.price || 0)
                                            .toLocaleString("en-IN")))))
                        :
                        React.createElement("div", { className: "empty-orders" },
                            React.createElement("div", { className: "empty-icon" }, "◌"),
                            React.createElement("strong", null, "No orders yet"),
                            React.createElement("span", null,
                                "New buyer orders will appear here.")))
                :
                React.createElement("div", { className: "business-insights" },
                    React.createElement("div", { className: "insight-card" },
                        React.createElement("span", null, "Storefront health"),
                        React.createElement("strong", null, "Strong"),
                        React.createElement("small", null,
                            "Keep adding verified pieces and making-proof reels.")),
                    React.createElement("div", { className: "insight-card" },
                        React.createElement("span", null, "Buyer discovery"),
                        React.createElement("strong", null, "Growing"),
                        React.createElement("small", null,
                            "Use clear titles, material and regional tags.")),
                    React.createElement("div", { className: "insight-card" },
                        React.createElement("span", null, "Trust signals"),
                        React.createElement("strong", null, "Active"),
                        React.createElement("small", null,
                            "Verified identity and process proof are visible to buyers.")))),
        React.createElement(ArtisanNav, { screen: "orders", go: go }));
}
                    "▣ ",
                    React.createElement("span", null,
                        React.createElement("strong", null, "Choose Media"),
                        React.createElement("small", null, "Select a photo or video from your device")))),
        musicPicker && React.createElement("div", { className: "reel-modal-backdrop", onClick: () => setMusicPicker(false) },
            React.createElement("div", { className: "reel-media-sheet music-sheet", onClick: e => e.stopPropagation() },
                React.createElement("div", { className: "reel-sheet-handle" }),
                React.createElement("div", { className: "reel-sheet-head" },
                    React.createElement("b", null, "Add Music"),
                    React.createElement("button", { onClick: () => setMusicPicker(false) }, "×")),
                React.createElement("div", { className: "music-search-row" },
                    React.createElement("input", {
                        value: musicQuery,
                        onChange: e => setMusicQuery(e.target.value),
                        onKeyDown: e => {
                            if (e.key === "Enter")
                                searchMusic();
                        },
                        placeholder: "Search music..."
                    }),
                    React.createElement("button", {
                        onClick: () => searchMusic()
                    }, "Search")),
                React.createElement("label", { className: "music-upload-btn" },
                    React.createElement("input", {
                        type: "file",
                        accept: "audio/*",
                        onChange: uploadMusic
                    }),
                    "＋ Upload audio from device"),
                savedMusic.length > 0 && React.createElement("div", { className: "saved-music-section" },
                    React.createElement("span", { className: "music-section-title" },
                        "Recently used"),
                    savedMusic.map((track) =>
                        React.createElement("button", {
                            key: track.previewUrl,
                            className: "music-result-row",
                            onClick: () => chooseSavedMusic(track)
                        },
                            React.createElement("img", {
                                src: track.artworkUrl100,
                                alt: ""
                            }),
                            React.createElement("span", null,
                                React.createElement("strong", null,
                                    track.trackName),
                                React.createElement("small", null,
                                    track.artistName)),
                            React.createElement("span", null, "▶")))),
                React.createElement("div", { className: "music-results" },
                    musicLoading ?
                        React.createElement("div", { className: "music-loading" },
                            "Searching music…") :
                        musicResults.map((track) =>
                            React.createElement("button", {
                                key: track.trackId,
                                className: "music-result-row",
                                onClick: () => chooseMusic(track)
                            },
                                React.createElement("img", {
                                    src: track.artworkUrl100,
                                    alt: ""
                                }),
                                React.createElement("span", null,
                                    React.createElement("strong", null,
                                        track.trackName),
                                    React.createElement("small", null,
                                        track.artistName)),
                                React.createElement("span", null, "▶"))))),
                React.createElement("p", { className: "music-note" },
                    "Music previews are provided through the available music search service. You can also upload your own audio."))),
    );
}

// ---------------------------------------------------------------------------
// ARTISAN: MY REELS
// ---------------------------------------------------------------------------
function MyReelsScreen({ user, go }) {
    const [reels, setReels] = useState([]);
    const [err, setErr] = useState(null);

    useEffect(() => {
        apiGet("/reels")
            .then((all) =>
                setReels(all.filter((r) => r.artisanId === user.id)))
            .catch((e) => setErr(e.message));
    }, [user.id]);

    return React.createElement("div", { className: "my-reels-screen" },
        React.createElement("div", { className: "app-header" },
            React.createElement("button", {
                className: "header-back",
                onClick: () => go("dashboard")
            }, "‹"),
            React.createElement("div", null,
                React.createElement("h2", null, "My Reels"),
                React.createElement("div", { className: "sub" },
                    reels.length,
                    " ",
                    reels.length === 1 ? "story" : "stories")),
            React.createElement("button", {
                className: "header-add",
                onClick: () => go("createReel")
            }, "+ Create")),
        React.createElement("div", { className: "content my-reels-content" },
            React.createElement(ErrorBanner, { message: err }),
            reels.length ?
                React.createElement("div", { className: "reels-grid" },
                    reels.map((reel) =>
                        React.createElement("div", {
                            className: "reel-card",
                            key: reel.id
                        },
                            reel.video &&
                            React.createElement("video", {
                                src: reel.video,
                                muted: true,
                                playsInline: true,
                                controls: true
                            }),
                            React.createElement("div", { className: "reel-card-overlay" },
                                React.createElement("strong", null,
                                    reel.caption ||
                                    "My handmade story"),
                                React.createElement("small", null,
                                    reel.category ||
                                    "Handmade craft")))))
                :
                React.createElement("div", { className: "empty-reels" },
                    React.createElement("div", { className: "empty-reel-icon" }, "▶"),
                    React.createElement("strong", null,
                        "Your craft stories belong here."),
                    React.createElement("span", null,
                        "Create your first Reel and show buyers how your piece comes to life."),
                    React.createElement("button", {
                        className: "btn",
                        onClick: () => go("createReel")
                    }, "Create your first Reel →"))));
}

// ---------------------------------------------------------------------------
// ARTISAN: PROFILE
// ---------------------------------------------------------------------------
function ArtisanProfileScreen({ user, go, setToast }) {
    const [avatar, setAvatar] = useState(() => {
        try {
            return localStorage.getItem(`kalasutra_avatar_${user.id}`) ||
                user.profile?.avatar ||
                user.profile?.photo ||
                "/assets/avatar-artisan.png";
        }
        catch (_) {
            return user.profile?.avatar ||
                "/assets/avatar-artisan.png";
        }
    });
    const [editing, setEditing] = useState(false);
    const [bio, setBio] = useState(
        user.profile?.bio ||
        "Traditional artisan keeping handmade craft alive."
    );
    const [location, setLocation] = useState(
        user.profile?.location ||
        "Jaipur, Rajasthan"
    );

    async function handleAvatar(e) {
        const file = e.target.files?.[0];
        if (!file)
            return;

        try {
            const data = await fileToDataURL(file);
            setAvatar(data);
            localStorage.setItem(
                `kalasutra_avatar_${user.id}`,
                data
            );
            setToast("Profile photo updated ✓");
        }
        catch (_) {
            setToast("Could not update profile photo");
        }
    }

    async function saveProfile() {
        try {
            await apiPut(`/users/${user.id}`, {
                profile: {
                    ...(user.profile || {}),
                    avatar,
                    photo: avatar,
                    bio,
                    location
                }
            });
            setEditing(false);
            setToast("Artisan profile updated ✓");
        }
        catch (e) {
            setToast(e.message || "Could not save profile");
        }
    }

    return React.createElement("div", { className: "profile-screen artisan-profile-screen" },
        React.createElement("div", { className: "profile-cover" },
            React.createElement("button", {
                className: "header-back light",
                onClick: () => go("dashboard")
            }, "‹"),
            React.createElement("button", {
                className: "profile-edit-top",
                onClick: () => setEditing(!editing)
            }, editing ? "Cancel" : "Edit")),
        React.createElement("div", { className: "profile-main" },
            React.createElement("div", { className: "profile-avatar-wrap" },
                React.createElement("img", {
                    src: avatar,
                    alt: user.name
                }),
                React.createElement("label", {
                    className: "avatar-upload-btn"
                },
                    React.createElement("input", {
                        type: "file",
                        accept: "image/*",
                        onChange: handleAvatar
                    }),
                    "+")),
            React.createElement("h1", null, user.name),
            React.createElement("div", { className: "profile-role" },
                "Verified Artisan"),
            React.createElement("div", { className: "profile-location" },
                "⌖ ",
                location),
            React.createElement("div", { className: "profile-trust-row" },
                React.createElement("div", null,
                    React.createElement("strong", null,
                        user.profile?.trustScore ?? 100),
                    React.createElement("span", null,
                        "Trust Score")),
                React.createElement("div", null,
                    React.createElement("strong", null, "✓"),
                    React.createElement("span", null,
                        "Identity Verified")),
                React.createElement("div", null,
                    React.createElement("strong", null, "∞"),
                    React.createElement("span", null,
                        "Craft Legacy"))),
            editing ?
                React.createElement("div", { className: "profile-edit-form" },
                    React.createElement("label", null,
                        "About your craft",
                        React.createElement("textarea", {
                            value: bio,
                            onChange: e => setBio(e.target.value)
                        })),
                    React.createElement("label", null,
                        "Location",
                        React.createElement("input", {
                            value: location,
                            onChange: e => setLocation(e.target.value)
                        })),
                    React.createElement("button", {
                        className: "btn",
                        onClick: saveProfile
                    }, "Save Profile")) :
                React.createElement("div", { className: "profile-bio" },
                    React.createElement("span", { className: "field-label" },
                        "ABOUT THE ARTISAN"),
                    React.createElement("p", null, bio)),
            React.createElement("div", { className: "profile-menu-list" },
                React.createElement("button", {
                    onClick: () => go("myProducts")
                },
                    React.createElement("span", null, "▣"),
                    "My Products",
                    React.createElement("b", null, "→")),
                React.createElement("button", {
                    onClick: () => go("myReels")
                },
                    React.createElement("span", null, "▶"),
                    "My Reels",
                    React.createElement("b", null, "→")),
                React.createElement("button", {
                    onClick: () => go("orders")
                },
                    React.createElement("span", null, "◈"),
                    "Orders & Growth",
                    React.createElement("b", null, "→")),
                React.createElement("button", {
                    onClick: () => go("reviews")
                },
                    React.createElement("span", null, "🛡"),
                    "Safety & Review Center",
                    React.createElement("b", null, "→")))),
        React.createElement(ArtisanNav, {
            screen: "profile",
            go: go
        }));
        return React.createElement("div", { className: "buyer-home-page" },
        React.createElement("header", { className: "buyer-home-topbar" },
            React.createElement("div", { className: "buyer-brand" },
                React.createElement("img", { src: "/assets/logo.png", alt: "KalaSutra" }),
                React.createElement("div", null,
                    React.createElement("strong", null, "KalaSutra"),
                    React.createElement("span", null, "Art Lives Here ♡"))),
            React.createElement("div", { className: "buyer-top-actions" },
                React.createElement("button", {
                    onClick: () => go("buyerProfile"),
                    "aria-label": "Profile"
                }, React.createElement(Icon, { name: "profile" })),
                React.createElement("button", {
                    onClick: () => go("cart"),
                    "aria-label": "Cart"
                },
                    React.createElement(Icon, { name: "cart" }),
                    cartCount > 0 && React.createElement("b", { className: "nav-badge" },
                        cartCount > 9 ? "9+" : cartCount)))),
        React.createElement("main", { className: "buyer-home-content" },
            React.createElement("section", { className: "buyer-welcome" },
                React.createElement("div", null,
                    React.createElement("span", { className: "field-label" }, "WELCOME TO KALASUTRA"),
                    React.createElement("h1", null,
                        "Discover craft with ",
                        React.createElement("em", null, "a story.")),
                    React.createElement("p", null,
                        "Meet the makers, explore their process and bring a piece of living culture home.")),
                React.createElement("div", { className: "buyer-welcome-art" },
                    React.createElement("span", null, "✦"))),
            React.createElement("section", { className: "buyer-search-section" },
                React.createElement("div", { className: "buyer-search-box" },
                    React.createElement(Icon, { name: "search" }),
                    React.createElement("input", {
                        value: query,
                        onChange: e => setQuery(e.target.value),
                        placeholder: "Search pottery, weaving, jewellery..."
                    }),
                    React.createElement("button", {
                        className: listening ? "listening" : "",
                        onClick: voiceSearch,
                        "aria-label": "Voice search"
                    }, listening ? "●" : "🎙")),
                React.createElement("div", { className: "search-hints" },
                    ["Pottery", "Weaving", "Jewellery", "Woodcraft"].map(x =>
                        React.createElement("button", {
                            key: x,
                            onClick: () => setQuery(x)
                        }, x)))),
            React.createElement(LocationTools, {
                mode: "buyer",
                initial: user.profile?.location || ""
            }),
            recent.length > 0 && React.createElement("section", { className: "buyer-section" },
                React.createElement("div", { className: "buyer-section-heading" },
                    React.createElement("div", null,
                        React.createElement("span", { className: "field-label" }, "CONTINUE EXPLORING"),
                        React.createElement("h2", null, "Recently viewed")),
                    React.createElement("button", {
                        onClick: () => setRecentIds([])
                    }, "Clear")),
                React.createElement("div", { className: "buyer-horizontal-products" },
                    recent.map(p =>
                        React.createElement("button", {
                            className: "buyer-mini-product",
                            key: p.id,
                            onClick: () => viewProduct(p.id)
                        },
                            React.createElement("div", {
                                className: "buyer-mini-image",
                                style: { backgroundImage: `url(${p.image})` }
                            }),
                            React.createElement("strong", null, p.title),
                            React.createElement("span", null,
                                "₹",
                                Number(p.price).toLocaleString("en-IN"))))),
            React.createElement("section", { className: "buyer-section" },
                React.createElement("div", { className: "buyer-section-heading" },
                    React.createElement("div", null,
                        React.createElement("span", { className: "field-label" }, "SHOP BY CRAFT"),
                        React.createElement("h2", null, "Made by hand. Chosen by you."))),
                React.createElement("div", { className: "craft-category-grid" },
                    Object.entries(CATEGORY_EMOJI).slice(0, 6).map(([name, emoji]) =>
                        React.createElement("button", {
                            key: name,
                            onClick: () => setQuery(name)
                        },
                            React.createElement("span", null, emoji),
                            React.createElement("strong", null, name)))),
            React.createElement("section", { className: "buyer-section featured-section" },
                React.createElement("div", { className: "buyer-section-heading" },
                    React.createElement("div", null,
                        React.createElement("span", { className: "field-label" }, "FEATURED HANDMADE"),
                        React.createElement("h2", null, "Stories worth bringing home")),
                    React.createElement("button", {
                        onClick: () => setQuery("")
                    }, "View all →")),
                err && React.createElement(ErrorBanner, { message: err }),
                React.createElement("div", { className: "buyer-product-grid" },
                    filtered.slice(0, 8).map(p =>
                        React.createElement("article", {
                            className: "buyer-product-card",
                            key: p.id
                        },
                            React.createElement("button", {
                                className: "buyer-product-image-wrap",
                                onClick: () => viewProduct(p.id)
                            },
                                React.createElement("div", {
                                    className: "buyer-product-image",
                                    style: { backgroundImage: `url(${p.image})` }
                                }),
                                React.createElement(BadgeLabel, {
                                    status: p.verificationStatus
                                })),
                            React.createElement("button", {
                                className: `wishlist-btn ${wishlist.includes(p.id) ? "active" : ""}`,
                                onClick: () => toggleWishlist(p.id),
                                "aria-label": "Wishlist"
                            }, wishlist.includes(p.id) ? "♥" : "♡"),
                            React.createElement("div", { className: "buyer-product-copy" },
                                React.createElement("span", { className: "buyer-category" },
                                    p.category || "Handmade"),
                                React.createElement("h3", null, p.title),
                                React.createElement("p", null,
                                    p.craftInfo?.region ||
                                    p.region ||
                                    "India"),
                                React.createElement("div", { className: "buyer-product-price-row" },
                                    React.createElement("strong", null,
                                        "₹",
                                        Number(p.price).toLocaleString("en-IN")),
                                    React.createElement("button", {
                                        onClick: () => addToCart(p),
                                    }, "+ Cart"))))),
                !filtered.length && React.createElement("div", { className: "buyer-empty-search" },
                    React.createElement("span", null, "⌕"),
                    React.createElement("strong", null, "No pieces found"),
                    React.createElement("p", null,
                        "Try another craft, material or region."))),
            React.createElement("section", { className: "buyer-story-banner" },
                React.createElement("div", null,
                    React.createElement("span", { className: "field-label" }, "MEET THE MAKERS"),
                    React.createElement("h2", null,
                        "Every handmade piece carries a human story."),
                    React.createElement("p", null,
                        "See how artisans make, preserve and pass on their craft.")),
                React.createElement("button", {
                    onClick: () => go("buyerReels")
                }, "Watch craft stories →"))),
        React.createElement(AITalker, {
            embedded: true,
            role: "buyer",
            go: go
        }),
        React.createElement(BuyerNav, {
            screen: "buyerHome",
            go: go,
            cartCount: cartCount
        }));
                setLocationMessage("Add your delivery address or use your current location.");
    }
    useEffect(() => {
        apiGet(`/cart?userId=${user.id}`)
            .then(setItems)
            .catch(e => setError(e.message));
    }, [user.id]);

    const subtotal = items.reduce(
        (sum, item) =>
            sum + Number(item.price || item.product?.price || 0) * Number(item.quantity || 1),
        0
    );
    const delivery = items.length ? 99 : 0;
    const total = subtotal + delivery;

    async function updateQuantity(item, quantity) {
        if (quantity < 1)
            return;

        try {
            await apiPut(`/cart/${item.id}`, {
                quantity
            });

            const updated = await apiGet(`/cart?userId=${user.id}`);
            setItems(updated);
            refreshCartCount?.();
        }
        catch (e) {
            setError(e.message || "Could not update cart");
        }
    }

    async function removeItem(item) {
        try {
            await apiDelete(`/cart/${item.id}`);
            setItems(prev => prev.filter(x => x.id !== item.id));
            refreshCartCount?.();
            setToast("Removed from cart");
        }
        catch (e) {
            setError(e.message || "Could not remove item");
        }
    }

    async function placeOrder() {
        setError(null);

        if (!area.trim() || !city.trim() || !pincode.trim()) {
            setError("Please enter your complete delivery address.");
            return;
        }

        if (!/^\d{6}$/.test(pincode.trim())) {
            setError("Please enter a valid 6-digit pincode.");
            return;
        }

        if (!phone.trim()) {
            setError("Please enter your phone number.");
            return;
        }

        if (!items.length) {
            setError("Your cart is empty.");
            return;
        }

        setLoading(true);

        try {
            const order = await apiPost("/orders", {
                buyerId: user.id,
                items: items.map(item => ({
                    productId: item.productId || item.product?.id,
                    quantity: Number(item.quantity || 1)
                })),
                subtotal,
                delivery,
                total,
                paymentMethod: method,
                orderType,
                phone,
                address: {
                    area,
                    city,
                    pincode
                }
            });

            setCheckoutOpen(false);
            setItems([]);
            refreshCartCount?.();

            setToast(
                `Order ${order.id || ""} placed successfully ✓`
            );

            go("orders");
        }
        catch (e) {
            setError(e.message || "Could not place order.");
        }
        finally {
            setLoading(false);
        }
    }

    return React.createElement("div", { className: "cart-page" },
        React.createElement("div", { className: "app-header cart-header" },
            React.createElement("button", {
                className: "header-back",
                onClick: () => go("buyerHome")
            }, "‹"),
            React.createElement("div", null,
                React.createElement("h2", null, "Your Cart"),
                React.createElement("div", { className: "sub" },
                    items.length,
                    items.length === 1 ? " item" : " items")),
            React.createElement("span", { className: "cart-header-icon" },
                "🛍️")),

        React.createElement("div", { className: "content cart-content" },
            React.createElement(ErrorBanner, {
                message: error
            }),

            items.length === 0 ?
                React.createElement("div", { className: "empty-cart" },
                    React.createElement("div", { className: "empty-cart-icon" },
                        "🛍️"),
                    React.createElement("h3", null,
                        "Your cart is waiting for a story."),
                    React.createElement("p", null,
                        "Explore handmade pieces and add something made with care."),
                    React.createElement("button", {
                        className: "btn",
                        onClick: () => go("buyerHome")
                    }, "Explore Handmade →"))
                :
                React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "cart-items" },
                        items.map(item => {
                            const product = item.product || item;
                            const qty = Number(item.quantity || 1);

                            return React.createElement("div", {
                                className: "cart-item",
                                key: item.id
                            },
                                React.createElement("div", {
                                    className: "cart-item-image",
                                    style: {
                                        backgroundImage:
                                            `url(${product.image})`
                                    }
                                }),
                                React.createElement("div", {
                                    className: "cart-item-info"
                                },
                                    React.createElement("strong", null,
                                        product.title ||
                                        "Handmade piece"),
                                    React.createElement("span", null,
                                        product.category ||
                                        "Traditional craft"),
                                    React.createElement("b", null,
                                        "₹",
                                        Number(product.price || 0)
                                            .toLocaleString("en-IN")),
                                    React.createElement("div", {
                                        className: "quantity-control"
                                    },
                                        React.createElement("button", {
                                            onClick: () =>
                                                updateQuantity(
                                                    item,
                                                    qty - 1
                                                )
                                        }, "−"),
                                        React.createElement("span", null,
                                            qty),
                                        React.createElement("button", {
                                            onClick: () =>
                                                updateQuantity(
                                                    item,
                                                    qty + 1
                                                )
                                        }, "+")),
                                    React.createElement("button", {
                                        className: "remove-cart-item",
                                        onClick: () =>
                                            removeItem(item)
                                    }, "Remove")));
                        })),

                    React.createElement("div", {
                        className: "cart-summary"
                    },
                        React.createElement("div", {
                            className: "cart-summary-row"
                        },
                            React.createElement("span", null,
                                "Subtotal"),
                            React.createElement("b", null,
                                "₹",
                                subtotal.toLocaleString("en-IN"))),

                        React.createElement("div", {
                            className: "cart-summary-row"
                        },
                            React.createElement("span", null,
                                "Delivery"),
                            React.createElement("b", null,
                                "₹",
                                delivery.toLocaleString("en-IN"))),

                        React.createElement("div", {
                            className: "cart-summary-row total"
                        },
                            React.createElement("span", null,
                                "Total"),
                            React.createElement("b", null,
                                "₹",
                                total.toLocaleString("en-IN"))),

                        React.createElement("button", {
                            className: "btn",
                            onClick: openCheckout
                        }, "Proceed to Checkout →"))),

            checkoutOpen &&
            React.createElement("div", {
                className: "checkout-overlay"
            },
                React.createElement("div", {
                    className: "checkout-sheet"
                },
                    React.createElement("div", {
                        className: "checkout-sheet-head"
                    },
                        React.createElement("div", null,
                            React.createElement("span", {
                                className: "field-label"
                            }, "CHECKOUT"),
                            React.createElement("h3", null,
                                "Where should we send it?")),
                        React.createElement("button", {
                            onClick: () => {
                                setCheckoutOpen(false);
                                window.history.back();
                            }
                        }, "×")),

                    React.createElement("div", {
                        className: "checkout-location-box"
                    },
                        React.createElement("div", {
                            className: "checkout-location-title"
                        },
                            React.createElement("span", null,
                                "📍"),
                            React.createElement("strong", null,
                                "Delivery address")),

                        React.createElement("button", {
                            className: "use-location-btn",
                            onClick: useMyLocation,
                            disabled: locationLoading
                        },
                            locationLoading ?
                                "Detecting…" :
                                "⌖ Use my current location"),

                        React.createElement("input", {
                            value: area,
                            onChange: e =>
                                setArea(e.target.value),
                            placeholder: "Area / locality"
                        }),

                        React.createElement("input", {
                            value: city,
                            onChange: e =>
                                setCity(e.target.value),
                            placeholder: "City"
                        }),

                        React.createElement("input", {
                            value: pincode,
                            onChange: e =>
                                setPincode(
                                    e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 6)
                                ),
                            placeholder: "6-digit pincode",
                            inputMode: "numeric"
                        }),

                        locationMessage &&
                        React.createElement("small", {
                            className: "checkout-location-message"
                        }, locationMessage)),

                    React.createElement("label", {
                        className: "checkout-field"
                    },
                        "Phone number",
                        React.createElement("input", {
                            value: phone,
                            onChange: e =>
                                setPhone(e.target.value),
                            placeholder: "Your phone number",
                            inputMode: "tel"
                        })),

                    React.createElement("div", {
                        className: "checkout-order-type"
                    },
                        React.createElement("span", {
                            className: "field-label"
                        }, "ORDER TYPE"),

                        React.createElement("button", {
                            className:
                                orderType === "retail"
                                    ? "active"
                                    : "",
                            onClick: () =>
                                setOrderType("retail")
                        }, "Individual"),

                        React.createElement("button", {
                            className:
                                orderType === "bulk"
                                    ? "active"
                                    : "",
                            onClick: () =>
                                setOrderType("bulk")
                        }, "Bulk / Business")),

                    orderType === "bulk" &&
                    React.createElement("div", {
                        className: "bulk-order-note"
                    },
                        "Bulk orders can be discussed with the artisan after the order request is created."),

                    React.createElement("div", {
                        className: "payment-methods"
                    },
                        React.createElement("span", {
                            className: "field-label"
                        }, "PAYMENT METHOD"),

                        React.createElement("button", {
                            className:
                                method === "razorpay"
                                    ? "active"
                                    : "",
                            onClick: () =>
                                setMethod("razorpay")
                        },
                            React.createElement("b", null,
                                "Razorpay"),
                            React.createElement("small", null,
                                "Secure online payment")),

                        React.createElement("button", {
                            className:
                                method === "cod"
                                    ? "active"
                                    : "",
                            onClick: () =>
                                setMethod("cod")
                        },
                            React.createElement("b", null,
                                "Cash on Delivery"),
                            React.createElement("small", null,
                                "Pay when delivered"))),

                    React.createElement("div", {
                        className: "checkout-final"
                    },
                        React.createElement("span", null,
                            "You pay"),
                        React.createElement("strong", null,
                            "₹",
                            total.toLocaleString("en-IN"))),

                    React.createElement("button", {
                        className: "btn checkout-place-btn",
                        disabled: loading,
                        onClick: placeOrder
                    },
                        loading ?
                            "Placing order…" :
                            "Place Order →"))));
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
                        " × ",
                        i.qty),
                    React.createElement("div", { style: { fontSize: 11, color: '#6b6055' } },
                        "₹",
                        i.product?.price.toLocaleString('en-IN'))),
                React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: 'var(--madder)', cursor: 'pointer' }, onClick: () => remove(i.productId) }, "Remove")))),
            React.createElement("div", { className: "checkout-row total", style: { margin: '16px 0' } },
                React.createElement("span", null, "Total"),
                React.createElement("span", null,
                    "₹",
                    total.toLocaleString('en-IN'))),
            React.createElement("button", { className: "btn", onClick: openCheckout }, "Continue to payment")))),
        checkoutOpen && React.createElement("div", { className: "payment-overlay" },
            React.createElement("div", { className: "payment-sheet bulk-checkout-sheet" },
                React.createElement("div", { className: "payment-topbar" },
                    React.createElement("button", { onClick: closeCheckout, "aria-label": "Back" }, "‹"),
                    React.createElement("div", null,
                        React.createElement("small", null, "SECURE CHECKOUT"),
                        React.createElement("h2", null, "Delivery and payment")),
                    React.createElement("button", { onClick: closeCheckout, "aria-label": "Close" }, "×")),
                React.createElement("div", { className: "payment-body" },
                    React.createElement("div", { className: "payment-section-title" }, "Delivery details"),
                    React.createElement("div", { className: "payment-field" },
                        React.createElement("span", null, "☎"),
                        React.createElement("input", { value: phone, onChange: e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)), placeholder: "10-digit mobile number" })),
                    React.createElement("div", { className: "payment-field" },
                        React.createElement("span", null, "⌂"),
                        React.createElement("input", { value: area, onChange: e => setArea(e.target.value), placeholder: "Area / locality" })),
                    React.createElement("div", { className: "payment-field" },
                        React.createElement("span", null, "⌖"),
                        React.createElement("input", { value: city, onChange: e => setCity(e.target.value), placeholder: "City" })),
                    React.createElement("div", { className: "payment-field" },
                        React.createElement("span", null, "➤"),
                        React.createElement("input", { value: pincode, onChange: e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)), placeholder: "6-digit pincode" })),
                    React.createElement("button", { className: "location-fill-btn", onClick: useMyLocation, disabled: locationLoading },
                        "⌖ ",
                        locationLoading ? 'Detecting your location…' : 'Use my current location & auto-fill'),
                    locationMessage && React.createElement("div", { className: "location-fill-note" }, locationMessage),
                    React.createElement("div", { className: "bulk-order-card" },
                        React.createElement("div", { className: "bulk-order-head" },
                            React.createElement("div", { className: "bulk-order-icon" }, "▦"),
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
                                React.createElement("span", null, "🧵 Direct artisan sourcing"),
                                React.createElement("span", null, "📦 Volume pricing")),
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
                                            "₹",
                                            Number(i.product?.price || 0).toLocaleString('en-IN'),
                                            " / piece")),
                                    React.createElement("div", { className: "bulk-qty-control" },
                                        React.createElement("button", { onClick: () => updateBulkQuantity(i.productId, -1), "aria-label": "Decrease quantity" }, "−"),
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
                                        "₹",
                                        bulkTotal.toLocaleString('en-IN'))),
                                React.createElement("small", null,
                                    "Approx. ₹",
                                    bulkUnitAverage.toLocaleString('en-IN'),
                                    " per piece after volume discount.")),
                            React.createElement("div", { className: "bulk-note" }, "Bulk requests are reviewed with the artisan so larger orders can be confirmed at a fair, direct-to-maker price."))) : (React.createElement("div", { className: "bulk-retail-note" },
                            "Regular checkout for individual purchases. Switch to ",
                            React.createElement("b", null, "Bulk / B2B"),
                            " when you need 20+ pieces."))),
                    orderType === 'retail' && React.createElement(React.Fragment, null,
                        React.createElement("div", { className: "payment-section-title payment-method-title" }, "Payment method"),
                        React.createElement("button", { className: `payment-method-card ${method === 'razorpay' ? 'selected' : ''}`, onClick: () => setMethod('razorpay') },
                            React.createElement("span", { className: "payment-method-icon" }, "▣"),
                            React.createElement("span", null,
                                React.createElement("strong", null, "Razorpay secure payment"),
                                React.createElement("small", null, "Google Pay, PhonePe, UPI, cards and netbanking")),
                            React.createElement("i", null, method === 'razorpay' ? '●' : '○')),
                        React.createElement("button", { className: `payment-method-card ${method === 'cod' ? 'selected' : ''}`, onClick: () => setMethod('cod') },
                            React.createElement("span", { className: "payment-method-icon" }, "¤"),
                            React.createElement("span", null,
                                React.createElement("strong", null, "Cash on delivery"),
                                React.createElement("small", null, "Pay when your order arrives")),
                            React.createElement("i", null, method === 'cod' ? '●' : '○')),
                        React.createElement("div", { className: "payment-trust" },
                            "✓ ",
                            method === 'razorpay' ? 'Payment is completed on Razorpay and verified before your order is created.' : 'Your order is confirmed now. Pay in cash when the artisan order arrives.')),
                    error && React.createElement("div", { className: "payment-error" }, error),
                    orderType === 'bulk' ? (React.createElement("div", { className: "payment-summary bulk-summary" },
                        React.createElement("span", null,
                            React.createElement("small", null,
                                bulkTotalQty,
                                " pieces • ",
                                Math.round(bulkDiscountRate * 100),
                                "% volume discount"),
                            React.createElement("strong", null,
                                "₹",
                                bulkTotal.toLocaleString('en-IN'))),
                        React.createElement("button", { onClick: requestBulkOrder, disabled: loading || bulkTotalQty < 20 }, loading ? 'Saving…' : `Request bulk order • ${bulkTotalQty} pieces`))) : (React.createElement("div", { className: "payment-summary" },
                        React.createElement("span", null,
                            React.createElement("small", null,
                                retailQty,
                                " items"),
                            React.createElement("strong", null,
                                "₹",
                                total.toLocaleString('en-IN'))),
                        React.createElement("button", { onClick: method === 'razorpay' ? payOnline : placeCOD, disabled: loading }, loading ? 'Processing…' : method === 'razorpay' ? `Pay ₹${total.toLocaleString('en-IN')} securely` : `Place COD order • ₹${total.toLocaleString('en-IN')}`))))))));
}

// ---------------------------------------------------------------------------
// ORDERS (shared shape, buyer-focused)
// ---------------------------------------------------------------------------
function SafetyReviewScreen({ go, setToast }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    async function load() {
        setLoading(true);
        try {
            setItems(await apiGet('/reviews'));
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => { load(); }, []);
    async function decide(id, status) {
        await apiPut(`/reviews/${id}`, {
            status,
            note: status === 'approved'
                ? 'Human reviewer approved after checking evidence.'
                : 'Human reviewer rejected after checking evidence.'
        });
        setToast(status === 'approved'
            ? 'Listing approved by human review.'
            : 'Listing rejected by human review.');
        load();
    }
    return React.createElement("div", { className: "content" },
        React.createElement("div", { className: "app-header" },
            React.createElement("button", { className: "header-back", onClick: () => go('dashboard') }, "‹"),
            React.createElement("div", null,
                React.createElement("h2", null, "Safety & Review Center"),
                React.createElement("div", { className: "sub" }, "AI flags suspicious activity — humans decide"))),
        React.createElement("div", { className: "trust-box", style: { marginBottom: 14 } },
            React.createElement("strong", null, "AI Risk Protection"),
            React.createElement("small", { style: { display: 'block', marginTop: 5 } }, "Risk signals include missing proof, duplicate images and suspicious listing patterns. AI never makes the final decision.")),
        loading ? React.createElement("div", { className: "empty-note" }, "Loading review queue…") : items.length === 0 ? React.createElement("div", { className: "empty-note" }, "🟢 No suspicious listings waiting for review.") : items.map((r) => React.createElement("div", { className: "card", key: r.id, style: { marginBottom: 12 } },
            React.createElement("div", { className: "thumb", style: { backgroundImage: `url(${r.product?.image || ''})` } }),
            React.createElement("div", { className: "info" },
}
}
}
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
            React.createElement("button", { className: "header-back", onClick: () => go ? go(isArtisan ? 'dashboard' : 'buyerHome') : null, "aria-label": "Back" }, "‹"),
            React.createElement("div", null,
                React.createElement("h2", null, isArtisan ? 'Orders & Earnings' : 'Your Orders'),
                React.createElement("div", { className: "sub" }, isArtisan ? 'Manage your artisan business' : 'Track your purchases'))),
        React.createElement("div", { className: "content" },
            isArtisan && React.createElement("div", { className: "artisan-order-summary" },
                React.createElement("div", null,
                    React.createElement("small", null, "EARNINGS"),
                    React.createElement("strong", null,
                        "₹",
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
                        "₹",
                        Number(isArtisan ? (o.artisanItems || []).reduce((s, p) => s + p.price * p.qty, 0) : o.amount).toLocaleString('en-IN'),
                        " · ",
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
            React.createElement("button", { className: "profile-back-btn", onClick: () => go("buyerHome"), "aria-label": "Back" }, "‹"),
            React.createElement("button", { className: "profile-logo-button", onClick: () => go("buyerHome"), "aria-label": "Go home" },
                React.createElement("img", { src: "/assets/logo.png", className: "profile-logo", alt: "KalaSutra" })),
            React.createElement("div", { className: "profile-top-actions" },
                React.createElement("button", { onClick: () => go("buyerHome"), "aria-label": "Explore" },
                    React.createElement(Icon, { name: "search" })),
                React.createElement("button", { onClick: () => go("orders"), "aria-label": "Orders" },
                    React.createElement(Icon, { name: "bell" }),
                    React.createElement("span", { className: "notification-dot" })),
                React.createElement("button", { onClick: () => setEditing(v => !v), "aria-label": "Settings" }, "⚙"),
                React.createElement("span", { className: "profile-top-slogan" },
                    "Good Choices",
                    React.createElement("br", null),
                    "Create Greater Impact ♡"))),
        React.createElement("main", { className: "profile-container" },
            React.createElement("section", { className: "profile-hero buyer-hero" },
                React.createElement("div", { className: "profile-avatar-wrap buyer-avatar-wrap" },
                    React.createElement("img", { src: avatar, className: "profile-avatar buyer-avatar", alt: "Buyer profile" }),
                    React.createElement("input", { id: "buyerAvatarInput", className: "avatar-file-input", type: "file", accept: "image/*", capture: "user", onChange: handleAvatarPick }),
                    React.createElement("label", { htmlFor: "buyerAvatarInput", className: "avatar-camera", title: "Upload profile photo" }, "⌾")),
                React.createElement("div", { className: "profile-identity" },
                    React.createElement("h1", null, user.name),
                    React.createElement("h3", null, "🌿 Conscious buyer"),
                    React.createElement("p", { className: "profile-quote" },
                        "“Supporting artisans, preserving traditions",
                        React.createElement("br", null),
                        "and bringing handmade stories home.”"),
                    React.createElement("div", { className: "buyer-meta" },
                        React.createElement("span", null,
                            "⌖ ",
                            city || "India"),
                        React.createElement("span", null, "◎ Exploring global crafts"),
                        React.createElement("span", null, "♥ Handmade · Sustainable · Meaningful"))),
                React.createElement("div", { className: "profile-hero-art buyer-art" },
                    React.createElement("div", { className: "handmade-script" },
                        "More",
                        React.createElement("br", null),
                        "Handmade",
                        React.createElement("br", null),
                        "A Kinder World ♡"),
                    React.createElement("div", { className: "hero-temple-art" })),
                React.createElement("button", { className: "profile-edit-btn", onClick: () => setEditing(v => !v) },
                    "✎ ",
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
                    React.createElement("span", null, "🌿"),
                    React.createElement("div", null,
                        React.createElement("strong", null, "Conscious Buyer"),
                        React.createElement("small", null,
                            "You support traditional artisans",
                            React.createElement("br", null),
                            "and sustainable crafts.")),
                    React.createElement("b", null, "›"))),
            React.createElement("div", { className: "buyer-impact-grid" },
                React.createElement("section", null,
                    React.createElement("div", { className: "quick-heading" },
                        React.createElement("h2", null, "Quick Actions"),
                        React.createElement("span", null,
                            "Shop",
                            React.createElement("br", null),
                            "Support",
                            React.createElement("br", null),
                            "Empower ♡")),
                    React.createElement("div", { className: "quick-actions buyer-quick-actions" },
                        React.createElement("button", { onClick: () => go("orders") },
                            React.createElement("span", null, "▣"),
                            React.createElement("b", null, "My Orders")),
                        React.createElement("button", { onClick: () => go("wishlist") },
                            React.createElement("span", null, "♥"),
                            React.createElement("b", null, "My Wishlist")),
                        React.createElement("button", { onClick: () => go("buyerReels") },
                            React.createElement("span", null, "♟"),
                            React.createElement("b", null, "Saved Artisans")),
                        React.createElement("button", { onClick: () => { setEditing(true); window.scrollTo({ top: 0, behavior: "smooth" }); } },
                            React.createElement("span", null, "⌖"),
                            React.createElement("b", null, "Addresses")))),
                React.createElement("section", { className: "your-impact-card" },
                    React.createElement("span", { className: "impact-leaf" }, "🌿"),
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
                    React.createElement("button", { className: "text-link-btn", onClick: () => go("buyerHome") }, "Explore →")),
                recent.length ? React.createElement("div", { className: "recent-grid" }, recent.map((p) => React.createElement("button", { className: "recent-real-card", key: p.id, onClick: () => openProduct(p.id) },
                    React.createElement("div", { className: "recent-img real-recent-img", style: { backgroundImage: `url(${p.image})` } }),
                    React.createElement("b", null, p.title),
                    React.createElement("strong", null,
                        "₹",
                        Number(p.price || 0).toLocaleString("en-IN"))))) : React.createElement("div", { className: "recent-empty" }, "Open a product from Explore and it will appear here automatically.")),
            React.createElement("div", { className: "quick-banner buyer-banner" },
                React.createElement("div", null,
                    React.createElement("em", null,
                        "Handmade",
                        React.createElement("br", null),
                        "Stories",
                        React.createElement("br", null),
                        "Better Tomorrows ♡"),
                    React.createElement("button", { onClick: () => go("buyerHome") }, "Explore More →"))),
            React.createElement("button", { className: "logout-wide", onClick: onLogout }, "Log out"),
            saved && React.createElement("div", { className: "saved-note" }, "✓ Buyer profile saved"))));
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
        reels.length === 0 && React.createElement("div", { className: "empty-note", style: { paddingTop: 100 } }, "No Reels yet — check back soon."),
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
                        React.createElement("div", { className: "view-btn", onClick: () => openProduct(r.product.id) }, "🛍️ View Product"))),
                React.createElement("div", { className: "reel-actions" },
                    React.createElement("button", { className: `act ${liked[k] ? "active" : ""}`, onClick: () => like(k) },
                        React.createElement("span", { className: "ic" }, liked[k] ? "❤️" : "♡"),
                        num),
                    React.createElement("button", { className: `act ${commentOpen === k ? "active" : ""}`, onClick: () => setCommentOpen(commentOpen === k ? null : k) },
                        React.createElement("span", { className: "ic" }, "💬"),
                        Number(r.comments || 0) + list.length),
                    React.createElement("button", { className: `act ${saved[k] ? "active" : ""}`, onClick: () => save(k) },
                        React.createElement("span", { className: "ic" }, saved[k] ? "🔖" : "◇"),
                        saved[k] ? "Saved" : "Save"),
                    React.createElement("button", { className: "act", onClick: () => share(r) },
                        React.createElement("span", { className: "ic" }, "↗"),
                        "Share")),
                commentOpen === k && React.createElement("div", { className: "reel-comments-sheet" },
                    React.createElement("div", { className: "reel-comments-title" },
                        React.createElement("strong", null, "Comments"),
                        React.createElement("button", { onClick: () => setCommentOpen(null) }, "×")),
                    React.createElement("div", { className: "reel-comments-list" }, list.length === 0 ? React.createElement("small", null, "No comments yet. Start the conversation.") : list.map((x, i) => React.createElement("div", { key: i },
                        React.createElement("b", null, "You"),
                        React.createElement("span", null, x)))),
                    React.createElement("div", { className: "reel-comment-input" },
                        React.createElement("input", { value: commentText, onChange: e => setCommentText(e.target.value), onKeyDown: e => { if (e.key === "Enter")
                                comment(k); }, placeholder: "Write a comment…" }),
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
                React.createElement("p", null, "Loading verified product record…")));
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
                React.createElement("span", null, "🎥 Mandatory making-process proof supplied"),
                React.createElement("span", null, "🔍 Originality & image checks recorded"),
                React.createElement("span", null, "🧑‍🎨 Artisan ownership declaration recorded")),
            p.customizations?.length > 0 && React.createElement("div", { className: "certificate-public-proof" },
                React.createElement("strong", null, "Customization history"),
                p.customizations.slice(0, 5).map((c) => React.createElement("span", { key: c.id },
                    "#",
                    c.customizationId,
                    " · ",
                    c.request))),
            React.createElement("p", { className: "certificate-public-note" }, "This QR is a gateway to KalaSutra’s digital product record. Verification is an AI-assisted trust signal and not a legal copyright determination.")));

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
    async function handleRolePick(role, language) {
        try {
            if (language) setKalaSutraVoiceLang(language);
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
            React.createElement("button", { className: "fab", onClick: () => go("addProduct") }, "＋"))),
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
        React.createElement(AITalker, { compact: screen !== "dashboard", role: isArtisan ? "artisan" : "buyer", go: setScreen, screen }),
        !(isArtisan && screen === "dashboard") && React.createElement("div", { className: `mode-switch-wrap ${screen === 'profile' || screen === 'buyerProfile' ? 'profile-mode-switch' : ''}` },
            React.createElement("button", { className: "mode-pill", onClick: switchRole },
                "⇄ Switch to ",
                isArtisan ? "Buyer" : "Artisan")),
        React.createElement(Toast, { message: toast }),
        showPermissions && React.createElement(PermissionCenter, { onClose: closePermissions })));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App, null));
