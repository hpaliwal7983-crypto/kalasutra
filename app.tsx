// KalaSutra frontend — React, written with light TypeScript annotations,
// compiled in-browser by Babel standalone (see index.html). No build step.
const { useState, useEffect, useRef } = React;

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
const API = "/api";

async function apiGet(path: string) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error((await res.json()).error || "Request failed");
  return res.json();
}
async function apiPost(path: string, body: any = {}) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Request failed");
  return res.json();
}
async function apiPut(path: string, body: any = {}) {
  const res = await fetch(`${API}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Request failed");
  return res.json();
}
async function apiDelete(path: string, body: any = {}) {
  const res = await fetch(`${API}${path}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Request failed");
  return res.json();
}

// Convert a File (from an <input type="file">) into a base64 data URL.
// This lets the demo "upload" images/video without needing a multipart
// file-upload library on the server.
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Shared browsing trail: keeps Recently Viewed consistent when the demo switches
// between Buyer and Artisan roles on the same device.
function saveRecentProduct(userId: any, productId: any) {
  try {
    const globalKey = "kalasutra_recent_products_global";
    const userKey = userId ? `kalasutra_recent_products_${userId}` : null;
    const read = (key: string) => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch (_) { return []; } };
    const next = [String(productId), ...read(globalKey).filter((x: any) => String(x) !== String(productId))].slice(0, 12);
    localStorage.setItem(globalKey, JSON.stringify(next));
    if (userKey) localStorage.setItem(userKey, JSON.stringify(next));
    window.dispatchEvent(new Event("kalasutra:recent-product"));
  } catch (_) {}
}

function getRecentProductIds(userId: any) {
  try {
    const global = JSON.parse(localStorage.getItem("kalasutra_recent_products_global") || "[]");
    const own = userId ? JSON.parse(localStorage.getItem(`kalasutra_recent_products_${userId}`) || "[]") : [];
    return [...own, ...global].map(String).filter((id, i, a) => a.indexOf(id) === i).slice(0, 12);
  } catch (_) { return []; }
}

const CATEGORY_EMOJI: Record<string, string> = {
  Pottery: "🏺", Textiles: "🧣", Woodwork: "🐘", Metalwork: "🪔",
  Basketry: "🧺", Other: "🎨",
};

// ---------------------------------------------------------------------------
// Small shared UI pieces
// ---------------------------------------------------------------------------
function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

function BadgeLabel({ status }: { status: string }) {
  const map: Record<string, string> = {
    verified: "🟢 Verified Handmade",
    needs_review: "🟡 Needs Verification",
    rejected: "🔴 Not Eligible",
    unverified: "⚪ Not Verified Yet",
  };
  return <span className={`badge ${status}`}>{map[status] || status}</span>;
}

function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="error-banner">⚠ {message}</div>;
}

function Icon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></svg>,
    add: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 8v8M8 12h8" /></svg>,
    reels: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="14" rx="3" /><path d="M10.2 9.3v5.4l4.6-2.7z" fill="currentColor" stroke="none" /></svg>,
    orders: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 7h11l-.8 12.1a2 2 0 0 1-2 1.9H9.3a2 2 0 0 1-2-1.9L6.5 7Z" /><path d="M9 7V5.5a3 3 0 0 1 6 0V7" /></svg>,
    profile: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c0-4 3.5-6.5 7.5-6.5s7.5 2.5 7.5 6.5" /></svg>,
    search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.3-4.3" /></svg>,
    heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 20s-7-4.35-9.5-8.5C.9 8.1 2.7 5 6 5c2 0 3.5 1.2 4 2.3.5-1.1 2-2.3 4-2.3 3.3 0 5.1 3.1 3.5 6.5C19 15.65 12 20 12 20Z" /></svg>,
    bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>,
    cart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H5.2" /></svg>,
  };
  return icons[name] || null;
}


// ---------------------------------------------------------------------------
// DEVICE PERMISSIONS — location, notifications and microphone/voice
// ---------------------------------------------------------------------------
function savedLocation(): any {
  try { return JSON.parse(localStorage.getItem('kalasutra_location') || 'null'); } catch (_) { return null; }
}

async function requestVoicePermission(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices?.getUserMedia) return false;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    localStorage.setItem('kalasutra_voice_allowed', '1');
    return true;
  } catch (_) { return false; }
}

async function requestNotifications(): Promise<string> {
  try {
    if (!('Notification' in window)) return 'unsupported';
    const result = await Notification.requestPermission();
    if (result === 'granted') localStorage.setItem('kalasutra_notifications_allowed', '1');
    return result;
  } catch (_) { return 'unsupported'; }
}

function isLocalHost() {
  return ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
}

function securePhoneLocationUrl() {
  return `https://${window.location.hostname}:3443${window.location.pathname}${window.location.search}`;
}

function requestCurrentLocation(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Location is not available in this browser.'));
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
      } catch (_) {
        const location = { area: '', city: '', pincode: '', lat: pos.coords.latitude, lon: pos.coords.longitude };
        localStorage.setItem('kalasutra_location', JSON.stringify(location));
        resolve(location);
      }
    }, (err) => reject(new Error(err?.code === 1 ? 'Location permission was denied.' : 'Could not get your location.')),
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 });
  });
}

function notifyUser(title: string, body: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body, icon: '/assets/avatar-artisan.png' });
  } catch (_) {}
}

function PermissionCenter({ onClose }: { onClose: () => void }) {
  const [locationState, setLocationState] = useState(savedLocation() ? 'allowed' : 'idle');
  const [notificationState, setNotificationState] = useState(() => ('Notification' in window && Notification.permission === 'granted') ? 'allowed' : 'idle');
  const [voiceState, setVoiceState] = useState(() => localStorage.getItem('kalasutra_voice_allowed') === '1' ? 'allowed' : 'idle');
  const [busy, setBusy] = useState<string | null>(null);

  async function allowLocation() {
    setBusy('location');
    try {
      if (!window.isSecureContext && !isLocalHost()) {
        window.location.href = securePhoneLocationUrl();
        return;
      }
      await requestCurrentLocation();
      setLocationState('allowed');
    } catch (_) { setLocationState('denied'); }
    finally { setBusy(null); }
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

  return <div className="permission-overlay">
    <div className="permission-sheet">
      <div className="permission-glow" />
      <div className="permission-avatar"><img src="/assets/avatar-artisan.png" alt="KalaSutra" /></div>
      <div className="permission-kicker">WELCOME TO KALASUTRA</div>
      <h2>Make your experience easier ✨</h2>
      <p>Allow these permissions once and KalaSutra can fill delivery details, send order updates and listen to your voice.</p>
      <div className="permission-list">
        <button onClick={allowLocation} disabled={busy !== null} className="permission-row">
          <span className="permission-icon">⌖</span><span><strong>Location</strong><small>Auto-fill area, city &amp; pincode</small></span><b>{busy === 'location' ? '…' : locationState === 'allowed' ? '✓' : 'Allow'}</b>
        </button>
        <button onClick={allowNotifications} disabled={busy !== null} className="permission-row">
          <span className="permission-icon">♧</span><span><strong>Notifications</strong><small>Order &amp; payment updates</small></span><b>{busy === 'notification' ? '…' : notificationState === 'allowed' ? '✓' : 'Allow'}</b>
        </button>
        <button onClick={allowVoice} disabled={busy !== null} className="permission-row">
          <span className="permission-icon">♩</span><span><strong>Voice &amp; microphone</strong><small>Voice search &amp; AI Talker</small></span><b>{busy === 'voice' ? '…' : voiceState === 'allowed' ? '✓' : 'Allow'}</b>
        </button>
      </div>
      <button className="permission-skip" onClick={() => { localStorage.setItem('kalasutra_permission_seen','1'); onClose(); }}>Not now — continue to KalaSutra</button>
      {!window.isSecureContext && !isLocalHost() && <div className="permission-secure-note">📍 Phone location needs the secure KalaSutra link. Tap <b>Allow</b> and KalaSutra will open it automatically.</div>}
      <div className="permission-note">You can change these permissions later in your browser settings.</div>
    </div>
  </div>;
}

// ---------------------------------------------------------------------------
// AI TALKER — voice-first assistant used across the prototype/demo
// ---------------------------------------------------------------------------
function AITalker({ compact = false, embedded = false, role = 'buyer', go }: { compact?: boolean; embedded?: boolean; role?: 'buyer' | 'artisan'; go?: (s: string) => void }) {
  const [open, setOpen] = useState(embedded ? true : !compact);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("Namaste! Main aapki kaise madad karoon?");
  const recognitionRef = useRef<any>(null);

  function speak(text: string) {
    setMessage(text);
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "hi-IN";
        u.rate = 0.95;
        window.speechSynthesis.speak(u);
      }
    } catch (_) {}
  }

  function startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
    recognition.onresult = (event: any) => {
      const heard = event.results?.[0]?.[0]?.transcript || "";
      setListening(false);
      if (heard) {
        const q = heard.toLowerCase();
        if (q.includes("cart") || q.includes("खरीद") || q.includes("buy") || q.includes("add")) {
          speak("Bilkul! Main aapko product choose karke cart mein add karne mein help karta hoon.");
        } else if (q.includes("reel") || q.includes("रील")) {
          speak("Aap verified craft ki making Reel bana sakte hain aur buyers ko uski kahani dikha sakte hain.");
        } else if (q.includes("verify") || q.includes("verification") || q.includes("जांच")) {
          speak("Product verification ke liye pehle photo, phir aapki voice story aur making proof clip chahiye.");
          if (role === 'artisan') go?.('addProduct');
        } else if (q.includes("profile") || q.includes("प्रोफाइल")) {
          speak("Bilkul, main aapka profile khol raha hoon.");
          go?.(role === 'artisan' ? 'profile' : 'buyerProfile');
        } else if (q.includes("order") || q.includes("ऑर्डर")) {
          speak("Bilkul, main aapke orders khol raha hoon.");
          go?.('orders');
        } else if (q.includes("home") || q.includes("होम") || q.includes("explore") || q.includes("देखना")) {
          speak("Chaliye, Explore kholte hain.");
          go?.(role === 'artisan' ? 'dashboard' : 'buyerHome');
        } else if (q.includes("wishlist") || q.includes("saved") || q.includes("पसंद")) {
          speak("Aapki saved pieces list khol raha hoon.");
          if (role === 'buyer') go?.('wishlist');
        } else if (q.includes("add a piece") || q.includes("product") || q.includes("उत्पाद")) {
          speak("Chaliye, Add a Piece kholte hain. Main photo, story aur verification mein guide karunga.");
          if (role === 'artisan') go?.('addProduct');
        } else {
          speak(`Aapne kaha: ${heard}. Main aapki KalaSutra journey mein help karta hoon.`);
        }
      }
    };
    requestVoicePermission().then((ok) => {
      if (!ok) { speak('Microphone permission allow karein, phir dobara try karein.'); return; }
      recognitionRef.current = recognition;
      try { recognition.start(); } catch (_) {}
    });
  }

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch (_) {}
  }, []);

  if (embedded) return (
    <div className="ai-talker ai-talker-embedded">
      <div className="ai-talker-head">
        <div className="ai-talker-avatar-wrap"><img src="/assets/avatar-artisan.png" alt="AI Talker" /></div>
        <div className="ai-talker-title"><strong>✦ AI Talker</strong><span>Your voice-first KalaSutra guide</span></div>
        <button className="ai-lang-pill" onClick={() => speak("Hindi selected")}>◎ हिंदी⌄</button>
      </div>
      <div className="ai-embedded-main">
        <div className="ai-embedded-message"><strong>Namaste! 🙏</strong><br/>{role === 'artisan' ? 'Main aapki listing aur orders mein madad karoon?' : 'Main aapko handicraft dhoondhne mein madad karoon?'}<span className="embedded-wave">▮▮▮▮▮▮</span></div>
        <div className="ai-embedded-actions">
          {role === 'artisan' ? <>
            <button onClick={() => { speak("Take a photo of your product. Ab Add a Piece kholte hain."); go?.('addProduct'); }}><span>⌕</span> Add<br/>a piece</button>
            <button onClick={() => { speak("Aapke orders aur earnings yahan milenge."); go?.('orders'); }}><span>▣</span> Orders &amp;<br/>earnings</button>
          </> : <>
            <button onClick={() => speak("What kind of handicraft are you looking for?")}><span>⌕</span> Find a<br/>craft</button>
            <button onClick={() => { speak("Main aapko saved products aur cart tak le ja sakta hoon."); go?.('cart'); }}><span>▣</span> Open<br/>cart</button>
          </>}
        </div>
      </div>
      <button className="ai-speak-pill" onClick={startListening}>♩&nbsp; Tap to speak</button>
      <div className="ai-quote">“Every craft has a story. Let’s tell yours.” ♡</div>
    </div>
  );

  if (!open) return (
    <button className="ai-fab" aria-label="Open AI Talker" onClick={() => setOpen(true)}>
      <img src="/assets/avatar-artisan.png" alt="AI Talker" />
      <span className="ai-fab-dot" />
    </button>
  );

  return (
    <div className={`ai-talker ${compact ? "ai-talker-compact" : ""}`}>
      <div className="ai-talker-head">
        <div className="ai-talker-avatar-wrap">
          <img src="/assets/avatar-artisan.png" alt="AI Talker" />
          <span className="ai-live-dot" />
        </div>
        <div className="ai-talker-title"><strong>AI Talker</strong><span>Voice-first KalaSutra guide</span></div>
        <button className="ai-close" onClick={() => { setOpen(false); try { recognitionRef.current?.stop(); } catch (_) {} }}>✕</button>
      </div>
      <div className="ai-talker-body">
        <div className="ai-message">{message}</div>
        <div className="ai-wave" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/></div>
        <div className="ai-talker-actions">
          <button className={`ai-mic ${listening ? "listening" : ""}`} onClick={startListening} aria-label="Talk to AI">
            {listening ? "●" : "🎙️"}
          </button>
          <button className="ai-send" onClick={() => speak("Bilkul! Chaliye aapka agla step shuru karte hain.")} aria-label="Send">➤</button>
        </div>
        <div className="ai-quick-row">
          {role === 'artisan' ? <>
            <button onClick={() => { speak("Take a photo of your product. Chaliye Add a Piece shuru karte hain."); go?.('addProduct'); }}>Add a piece</button>
            <button onClick={() => { speak("Aapke New Orders, Processing, Shipped, Delivered aur Earnings yahan hain."); go?.('orders'); }}>My orders</button>
          </> : <>
            <button onClick={() => speak("What kind of handicraft are you looking for?")}>Find a craft</button>
            <button onClick={() => { speak("Opening your cart."); go?.('cart'); }}>Open cart</button>
          </>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AUTH / ONBOARDING SCREENS
// ---------------------------------------------------------------------------
function SplashScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="splash-screen">
      <div className="splash-glow glow-one" />
      <div className="splash-glow glow-two" />
      <div className="walking-artisan" aria-hidden="true">
        <span className="craft-spark spark-one">✦</span>
        <span className="craft-spark spark-two">✧</span>
        <img src="/assets/avatar-artisan.png" alt="" />
        <span className="walking-shadow" />
      </div>
      <img className="splash-logo" src="/assets/logo.png" alt="Kala Sutra" />
      <p className="splash-tagline">Take a photo. Tell your story. AI does the rest.</p>
      <div className="splash-hindi">“Namaste! चलिए शुरू करें।”</div>
      <div className="splash-cta"><button className="btn splash-btn" onClick={onNext}>Get Started <span>→</span></button></div>
    </div>
  );
}

function RoleSelectScreen({ name, onPick }: { name: string; onPick: (role: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="role-landing">
      <div className="role-mandala mandala-one" />
      <div className="role-mandala mandala-two" />
      <div className="role-topbar">
        <img src="/assets/logo.png" alt="Kala Sutra" className="role-logo" />
        <button className="role-menu" aria-label="Open menu" onClick={() => setMenuOpen(v => !v)}>
          <span/><span/><span/>
        </button>
      </div>
      {menuOpen && (
        <div className="role-menu-panel">
          <strong>KalaSutra</strong>
          <span>Crafting a Better Tomorrow</span>
          <small>Take a photo. Tell your story. AI does the rest.</small>
        </div>
      )}

      <div className="role-hero-copy">
        <div className="role-script">Art<br/><b>Lives</b><br/>Here ♡</div>
        <h1>Namaste, {name}! <span>🙏</span></h1>
        <p>How will you use Kala Sutra?</p>
      </div>

      <div className="role-options">
        <button className="role-card role-card-premium artisan" onClick={() => onPick("artisan")}>
          <span className="role-card-icon"><Icon name="add" /></span>
          <span className="role-card-copy"><strong>I'm an Artisan</strong><em>List your craft, verify it, tell its story in Reels</em></span>
          <span className="role-arrow">→</span>
        </button>
        <button className="role-card role-card-premium buyer" onClick={() => onPick("buyer")}>
          <span className="role-card-icon"><Icon name="search" /></span>
          <span className="role-card-copy"><strong>I'm a Buyer</strong><em>Discover verified handmade pieces, meet the makers</em></span>
          <span className="role-arrow">→</span>
        </button>
      </div>

      <div className="role-bottom-note">
        <span>✦ Small Creations · Big Stories ♡</span>
        <span>Made with respect for every maker.</span>
      </div>
    </div>
  );
}

function LoginScreen({ onLoggedIn }: { onLoggedIn: (contact: string, name: string) => void }) {
  const [step, setStep] = useState("contact"); // contact -> otp -> name
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
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

  return (
    <div className="centered-screen login-screen" style={{ justifyContent: "flex-start", paddingTop: 36 }}>
      <div className="login-art-wrap"><img src="/assets/avatar-artisan.png" alt="KalaSutra artisan" /><span className="login-art-glow" /></div>
      <div style={{ width: "100%", textAlign: "left" }}>
        <h2 className="serif" style={{ margin: "0 0 4px" }}>Welcome</h2>
        <p style={{ fontSize: 12.5, color: "#5a4f45", marginBottom: 22 }}>Login to continue to Kala Sutra</p>
        <ErrorBanner message={err} />

        {step === "contact" && (
          <>
            <div className="field">
              <div className="field-label">Mobile number</div>
              <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Enter 10-digit mobile number" />
            </div>
            <div className="captcha-card">
              <div className="captcha-head">
                <label className="captcha-check">
                  <input type="checkbox" checked={humanChecked} onChange={(e) => { setHumanChecked(e.target.checked); setErr(null); }} />
                  <span className="captcha-box">{humanChecked ? "✓" : ""}</span>
                  <span>I'm not a robot</span>
                </label>
                <span className="captcha-mini">SECURE LOGIN</span>
              </div>
              {humanChecked && (
                <div className="captcha-challenge">
                  <div className="captcha-code" aria-label="Captcha code">{captcha}</div>
                  <button type="button" className="captcha-refresh" onClick={refreshCaptcha} aria-label="Refresh captcha">↻</button>
                  <div className="captcha-input-row">
                    <input value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 5))} placeholder="Enter the code above" maxLength={5} />
                    <span className={captchaInput === captcha ? "captcha-ok" : "captcha-pending"}>{captchaInput === captcha ? "✓" : ""}</span>
                  </div>
                </div>
              )}
              <div className="captcha-note">Quick human verification before OTP</div>
            </div>
            <button className="btn" onClick={() => {
              if (!contact.trim()) { setErr("Please enter your mobile number"); return; }
              if (!humanChecked) { setErr("Please confirm that you are not a robot"); return; }
              if (captchaInput !== captcha) { setErr("Please enter the captcha correctly"); return; }
              setErr(null); setStep("otp");
            }}>Send OTP</button>
            <p style={{ fontSize: 10.5, color: "#8a7d6e", marginTop: 10 }}>
              Demo mode: any 4 digits will work as the OTP — no real SMS is sent.
            </p>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="field">
              <div className="field-label">Enter the 4-digit code sent to {contact}</div>
              <input value={otp} maxLength={4} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="••••" style={{ letterSpacing: 8, fontSize: 20, textAlign: "center" }} />
            </div>
            <button className="btn" onClick={() => {
              if (otp.length < 4) { setErr("Enter the 4-digit demo code"); return; }
              setErr(null); setStep("name");
            }}>Verify &amp; Continue</button>
            <button className="btn secondary" style={{ marginTop: 10 }} onClick={() => setStep("contact")}>Back</button>
          </>
        )}

        {step === "name" && (
          <>
            <div className="field">
              <div className="field-label">What should we call you?</div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            </div>
            <button className="btn" onClick={() => {
              if (!name.trim()) { setErr("Please enter your name"); return; }
              onLoggedIn(contact, name.trim());
            }}>Continue</button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ARTISAN NAV
// ---------------------------------------------------------------------------
function ArtisanNav({ screen, go }: { screen: string; go: (s: string) => void }) {
  const items = [
    { id: "dashboard", label: "Home", icon: "home" },
    { id: "addProduct", label: "Add", icon: "add" },
    { id: "myReels", label: "Reels", icon: "reels" },
    { id: "orders", label: "Orders", icon: "orders" },
    { id: "profile", label: "Profile", icon: "profile" },
  ];
  return (
    <div className="bottom-nav">
      {items.map((it) => (
        <button key={it.id} className={`nav-btn ${screen === it.id ? "active" : ""}`} onClick={() => go(it.id)}>
          <Icon name={it.icon} /><span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

function ArtisanGrowthHub({ user, featured, products, setToast }: any) {
  const [open, setOpen] = useState<string | null>(null);
  const [materialCost, setMaterialCost] = useState("450");
  const [hours, setHours] = useState("6");
  const [hourlyRate, setHourlyRate] = useState("180");
  const [overhead, setOverhead] = useState("150");
  const [capitalNeed, setCapitalNeed] = useState("25000");
  const [materialJoin, setMaterialJoin] = useState<Record<string, boolean>>({});
  const [designCraft, setDesignCraft] = useState("Pottery");
  const [passportMade, setPassportMade] = useState(false);
  const [lessonSaved, setLessonSaved] = useState<Record<string, boolean>>({});

  const fairBase = Number(materialCost || 0) + Number(hours || 0) * Number(hourlyRate || 0) + Number(overhead || 0);
  const fairPrice = Math.round(fairBase * 1.20);
  const productTitle = featured?.title || "Your handmade piece";
  const productPrice = Number(featured?.price || fairPrice || 0);

  const modules = [
    { id:"price", icon:"₹", title:"Fair Price AI", problem:"Low margins", desc:"Estimate a fair maker price from real time, material and overhead.", accent:"money" },
    { id:"capital", icon:"◈", title:"Craft Capital", problem:"Limited capital", desc:"Prepare an order-ready funding plan without relying on informal lenders.", accent:"capital" },
    { id:"material", icon:"✦", title:"Material Hub", problem:"Raw material scarcity", desc:"See collective-buy opportunities for silk, clay, wood, dyes and more.", accent:"material" },
    { id:"design", icon:"✺", title:"Design Lab", problem:"Outdated designs", desc:"Turn traditional skills into contemporary, market-ready product directions.", accent:"design" },
    { id:"passport", icon:"▣", title:"Craft Passport", problem:"Factory-copy competition", desc:"Create a traceable identity for the artisan, process and handmade origin.", accent:"passport" },
    { id:"market", icon:"↗", title:"Direct Market Match", problem:"Middlemen & isolation", desc:"Match your craft with buyer needs so demand can reach the maker directly.", accent:"market" },
    { id:"gurukul", icon:"⌘", title:"Craft Gurukul", problem:"Youth brain drain", desc:"Preserve techniques and pass practical craft knowledge to the next generation.", accent:"gurukul" },
  ];

  const materials = [
    ["Natural dyes","18 artisans","62% funded"],
    ["Terracotta clay","31 artisans","78% funded"],
    ["Eri silk yarn","12 artisans","45% funded"]
  ];
  const designs: Record<string,string[]> = {
    Pottery:["Stackable serving set for modern kitchens","Minimal terracotta planter with regional motif","Giftable chai + snack set with artisan story"],
    Weaving:["Lightweight everyday stole with heritage border","Contemporary cushion series using traditional weave","Small-batch table runner for premium homes"],
    Woodcraft:["Modular desk organiser with local carving","Modern wall accent with traditional geometry","Compact gifting box with maker mark"],
    "Metal Craft":["Minimal statement diya set","Modern table centrepiece with traditional form","Collector's mini decor series"]
  };
  const demand = [
    ["Boutique home stores","Pottery & tableware","92% match"],
    ["Conscious gifting brands","Small handcrafted sets","86% match"],
    ["Hotels & cafés","Regional decor pieces","79% match"]
  ];
  const lessons = [
    ["01","Record a technique","Capture one signature step before it is lost."],
    ["02","Teach a family member","Create a simple repeatable learning lesson."],
    ["03","Build a craft archive","Save stories, tools and process notes with each piece."]
  ];

  function toggle(id:string){ setOpen(open === id ? null : id); }

  return <section className="artisan-growth-hub">
    <div className="growth-hub-heading">
      <div>
        <span className="field-label">KALASUTRA • ARTISAN IMPACT HUB</span>
        <h3>We solve the system around the artisan.</h3>
        <p>Not just a storefront — tools for fair pricing, materials, capital, demand and craft legacy.</p>
      </div>
      <span className="growth-hub-pill">7 challenges → 7 solutions</span>
    </div>

    <div className="problem-solution-strip">
      <span>Middlemen → Direct market</span><span>Low margins → Fair price</span><span>Raw materials → Collective buy</span><span>Youth loss → Craft Gurukul</span>
    </div>

    <div className="growth-module-grid">
      {modules.map(m => <button key={m.id} className={`growth-module-card ${m.accent} ${open===m.id?'open':''}`} onClick={() => toggle(m.id)}>
        <span className="growth-module-icon">{m.icon}</span>
        <span className="growth-module-copy"><small>{m.problem}</small><strong>{m.title}</strong><em>{m.desc}</em></span>
        <span className="growth-module-arrow">{open===m.id?'⌃':'→'}</span>
      </button>)}
    </div>

    {open === "price" && <div className="growth-module-panel">
      <div className="panel-kicker">FAIR PRICE AI</div><h4>Price the craft, not just the material.</h4>
      <div className="growth-form-grid">
        <label>Material cost ₹<input value={materialCost} onChange={e=>setMaterialCost(e.target.value.replace(/\D/g,""))}/></label>
        <label>Making hours<input value={hours} onChange={e=>setHours(e.target.value.replace(/\D/g,""))}/></label>
        <label>Fair hourly rate ₹<input value={hourlyRate} onChange={e=>setHourlyRate(e.target.value.replace(/\D/g,""))}/></label>
        <label>Overhead ₹<input value={overhead} onChange={e=>setOverhead(e.target.value.replace(/\D/g,""))}/></label>
      </div>
      <div className="growth-result-card"><span>Suggested fair maker price</span><strong>₹{fairPrice.toLocaleString("en-IN")}</strong><small>Includes a 20% craft-value buffer over direct cost. Use it as a planning benchmark.</small></div>
      <button className="growth-action" onClick={()=>setToast(`Fair price benchmark saved: ₹${fairPrice.toLocaleString("en-IN")}`)}>Use this price benchmark →</button>
    </div>}

    {open === "capital" && <div className="growth-module-panel">
      <div className="panel-kicker">CRAFT CAPITAL</div><h4>Prepare for the next order.</h4>
      <p className="panel-copy">Build a simple working-capital plan for materials and production. KalaSutra does not promise or issue a loan here.</p>
      <label className="wide-field">Working capital needed ₹<input value={capitalNeed} onChange={e=>setCapitalNeed(e.target.value.replace(/\D/g,""))}/></label>
      <div className="capital-readiness"><span>Order readiness <b>78%</b></span><div><i style={{width:"78%"}} /></div><small>Strong product proof + artisan profile + verified craft can improve finance-readiness.</small></div>
      <button className="growth-action" onClick={()=>setToast(`Capital plan prepared for ₹${Number(capitalNeed||0).toLocaleString("en-IN")}`)}>Prepare capital plan →</button>
    </div>}

    {open === "material" && <div className="growth-module-panel">
      <div className="panel-kicker">MATERIAL HUB</div><h4>Buy better together.</h4>
      <p className="panel-copy">Collective demand can make quality raw materials more accessible to rural makers.</p>
      <div className="material-list">{materials.map(([name,people,progress]) => <div className="material-row" key={name}><div><strong>{name}</strong><small>{people} already interested</small></div><span>{progress}</span><button onClick={()=>setMaterialJoin(p=>({...p,[name]:!p[name]}))}>{materialJoin[name]?"Joined ✓":"Join"}</button></div>)}</div>
    </div>}

    {open === "design" && <div className="growth-module-panel">
      <div className="panel-kicker">DESIGN LAB</div><h4>Keep the tradition. Refresh the use.</h4>
      <div className="design-tabs">{Object.keys(designs).map(c=><button key={c} className={designCraft===c?"active":""} onClick={()=>setDesignCraft(c)}>{c}</button>)}</div>
      <div className="design-suggestions">{designs[designCraft].map((d,i)=><div key={d}><span>0{i+1}</span><strong>{d}</strong><small>Built around your existing {designCraft.toLowerCase()} skill.</small></div>)}</div>
      <button className="growth-action" onClick={()=>setToast(`${designCraft} design directions saved for your next collection`)}>Save collection ideas →</button>
    </div>}

    {open === "passport" && <div className="growth-module-panel">
      <div className="panel-kicker">CRAFT PASSPORT</div><h4>Give every piece a traceable story.</h4>
      <div className="passport-mini">
        <div className="passport-code">{passportMade?"KS✓":"KS"}</div>
        <div><small>KALASUTRA CRAFT PASSPORT</small><strong>{productTitle}</strong><span>{user.name} • {featured?.category || "Traditional craft"} • {featured?.region || "India"}</span></div>
      </div>
      <div className="passport-points"><span>✓ Artisan identity</span><span>✓ Material & origin</span><span>✓ Making process</span><span>✓ Verification status</span></div>
      <button className="growth-action" onClick={()=>{setPassportMade(true);setToast("Digital Craft Passport prepared for this piece");}}>Generate Craft Passport →</button>
    </div>}

    {open === "market" && <div className="growth-module-panel">
      <div className="panel-kicker">DIRECT MARKET MATCH</div><h4>Find buyers who need your craft.</h4>
      <div className="demand-list">{demand.map(([who,need,match])=><div className="demand-row" key={who}><div><strong>{who}</strong><small>{need}</small></div><b>{match}</b><button onClick={()=>setToast(`Interest signal sent to ${who}`)}>Match</button></div>)}</div>
      <div className="panel-note">Buyer matches are presented as prototype demand signals; no buyer commitment is implied until an order is confirmed.</div>
    </div>}

    {open === "gurukul" && <div className="growth-module-panel">
      <div className="panel-kicker">CRAFT GURUKUL</div><h4>Make your knowledge outlive you.</h4>
      <div className="lesson-list">{lessons.map(([n,title,desc])=><div className="lesson-row" key={n}><span>{n}</span><div><strong>{title}</strong><small>{desc}</small></div><button onClick={()=>setLessonSaved(p=>({...p,[n]:!p[n]}))}>{lessonSaved[n]?"Saved ✓":"Start"}</button></div>)}</div>
      <button className="growth-action" onClick={()=>setToast("Your craft legacy workspace is ready")}>Open craft legacy →</button>
    </div>}
  </section>
}


// ---------------------------------------------------------------------------
// ARTISAN: DASHBOARD
// ---------------------------------------------------------------------------
function ArtisanDashboard({ user, go, setToast }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiGet(`/products`).then((all) => {
      const mine = all.filter((p: any) => p.artisanId === user.id);
      // Keep the demo storefront populated with the featured real cane product.
      setProducts(mine.length ? mine : all.filter((p: any) => p.id === "p5"));
    }).catch((e) => setErr(e.message));
  }, [user.id]);

  const verifiedCount = products.filter((p) => p.verificationStatus === "verified").length;
  const featured = products[0];

  return (
    <div className="artisan-home">
      <div className="artisan-topbar">
        <img className="artisan-logo" src="/assets/logo.png" alt="Kala Sutra" />
        <div className="art-lives">Art<br/>Lives<br/>Here ♡</div>
        <button className="menu-circle" aria-label="Menu">☰</button>
      </div>
      <div className="artisan-greeting">
        <div><h2>Hello, {user.name} <span>🙏</span></h2><div className="sub">Your artisan journey is live ✨</div></div>
        <button className="home-switch" onClick={() => {
          const next = user.role === "artisan" ? "buyer" : "artisan";
          apiPost("/users", { name: user.name, contact: "demo", role: next }).then((u) => { window.location.reload(); });
        }}>⇄ Switch to Buyer</button>
      </div>
      <div className="content artisan-content">
        <ErrorBanner message={err} />
        <div className="home-stats">
          <div><span className="stat-icon pot">▱</span><strong>{products.length}</strong><small>Products Listed</small></div>
          <div><span className="stat-icon check">✓</span><strong>{verifiedCount}</strong><small>Verified</small></div>
          <div><span className="stat-icon star">★</span><strong>{user.profile?.trustScore ?? 100}</strong><small>Trust score</small></div>
        </div>
        <div className="artisan-growth-card" onClick={() => go('orders')}>
          <div><span className="field-label">ARTISAN GROWTH DASHBOARD</span><strong>Orders, earnings &amp; business insights</strong><small>Track New Orders → Processing → Shipped → Delivered</small></div><button className="btn secondary" style={{marginTop:10}} onClick={()=>go("reviews")}>🛡️ Safety &amp; Review Center</button>
          <span className="growth-arrow">→</span>
        </div>

        <ArtisanGrowthHub user={user} featured={featured} products={products} setToast={setToast} />

        <div className="section-row home-section-row">
          <div className="section-title">Your craft, on the grid</div>
          <span className="view-all" onClick={() => go("myProducts")}>View all →</span>
        </div>

        {products.length ? (
          <div className="home-products-grid">
            {products.slice(0, 4).map((p) => (
              <div key={p.id} className="home-product-card" onClick={() => go("product", p.id)}>
                <div className="home-product-image" style={{ backgroundImage: `url(${p.image})` }}>
                  <span className="featured-badge">● Verified Handmade</span>
                </div>
                <div className="home-product-info">
                  <strong>{p.title}</strong>
                  <div className="home-product-bottom">
                    <span className="featured-price">₹{Number(p.price).toLocaleString("en-IN")}</span>
                    <button onClick={(e) => { e.stopPropagation(); setToast("Product is ready on your storefront"); }}>＋ Cart</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="craft-empty"><div className="plus-circle">＋</div><strong>You haven’t added any products yet.</strong><span>Tap “Add” below to list your first piece.</span></div>
        )}

        <AITalker embedded role="artisan" go={go} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ARTISAN: ADD PRODUCT  →  SCAN/VERIFY
// ---------------------------------------------------------------------------
function AddProductScreen({ user, go, setToast, setLastVerifiedProductId }: any) {
  const [step, setStepState] = useState("form");
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [englishDescription, setEnglishDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Pottery");
  const [material, setMaterial] = useState("");
  const [region, setRegion] = useState("");
  const [storyLang, setStoryLang] = useState("hi-IN");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [proofVideo, setProofVideo] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [storyRecording, setStoryRecording] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const proofRecorderRef = useRef<MediaRecorder | null>(null);
  const proofStreamRef = useRef<MediaStream | null>(null);
  const proofChunksRef = useRef<Blob[]>([]);
  const storyRecognitionRef = useRef<any>(null);

  async function handleImagePick(e: any) {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;
    try {
      const urls = await Promise.all(files.slice(0, 6).map(fileToDataURL));
      setGalleryImages(prev => [...prev, ...urls].slice(0, 6));
      setImageDataUrl(prev => prev || urls[0]);
      setErr(null);
    } catch { setErr("Couldn't read that image — please try another file."); }
    e.target.value = "";
  }
  function removeImage(index: number) {
    setGalleryImages(prev => {
      const next = prev.filter((_, i) => i !== index);
      setImageDataUrl(next[0] || null);
      return next;
    });
  }

  function generateEnglishDescription(transcript: string) {
    const clean = transcript.trim();
    if (!clean) return;
    const titleGuess = clean.split(/\s+/).slice(0, 5).join(" ");
    if (!title.trim()) setTitle(`${category} — ${titleGuess}`.slice(0, 70));
    setEnglishDescription(`Handcrafted ${category.toLowerCase()} created by an artisan. Story shared in ${storyLang === "hi-IN" ? "Hindi" : storyLang === "mr-IN" ? "Marathi" : storyLang === "ta-IN" ? "Tamil" : storyLang === "bn-IN" ? "Bangla" : "the artisan's language"}: “${clean}”. KalaSutra AI has prepared this English listing draft for buyers.`);
  }

  function startStoryRecording() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setErr("Voice story is not supported in this browser. Please use Chrome on the phone/laptop."); return; }
    try {
      const rec = new SR();
      rec.lang = storyLang; rec.interimResults = false; rec.continuous = false; rec.maxAlternatives = 1;
      rec.onstart = () => { setStoryRecording(true); setErr(null); };
      rec.onend = () => setStoryRecording(false);
      rec.onerror = () => { setStoryRecording(false); setErr("I couldn't hear the story. Please try again."); };
      rec.onresult = (event: any) => {
        const heard = event.results?.[0]?.[0]?.transcript || "";
        if (heard) { setStory(heard); generateEnglishDescription(heard); }
      };
      storyRecognitionRef.current = rec; rec.start();
    } catch (e: any) { setErr(e.message || "Voice story could not start."); }
  }
  function stopStoryRecording() { try { storyRecognitionRef.current?.stop(); } catch (_) {} setStoryRecording(false); }

  async function startProofRecording() {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      proofStreamRef.current = stream; proofChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) proofChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(proofChunksRef.current, { type: "video/webm" });
        const reader = new FileReader(); reader.onload = () => setProofVideo(reader.result as string); reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start(); proofRecorderRef.current = recorder; setRecording(true);
      setTimeout(() => { if (proofRecorderRef.current?.state === "recording") proofRecorderRef.current.stop(); setRecording(false); }, 5000);
    } catch (e: any) { setErr("Camera/microphone permission is needed for the 5-second making-proof clip. " + e.message); }
  }
  function stopProofRecording() { if (proofRecorderRef.current?.state === "recording") proofRecorderRef.current.stop(); proofStreamRef.current?.getTracks().forEach((t) => t.stop()); setRecording(false); }

  async function handleProofUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setProofVideo(await fileToDataURL(file)); setErr(null); } catch { setErr("Couldn't read that video. Please try another clip."); }
    e.target.value = "";
  }

  async function handleCreateAndScan() {
    if (!imageDataUrl) { setErr("First upload/take a photo of the piece."); return; }
    if (!story.trim()) { setErr("Please tell your craft story by voice before verification."); return; }
    if (!price || !/^\d+(\.\d{1,2})?$/.test(price)) { setErr("Please enter a valid price in ₹."); return; }
    if (!proofVideo) { setErr("The 5-second making-proof video is required before verification."); return; }
    setErr(null);
    try {
      const finalTitle = title.trim() || `${category} Handmade Piece`;
      const finalDescription = englishDescription || `Handcrafted ${category.toLowerCase()} made by a traditional artisan. Story: “${story.trim()}”.`;
      const created = await apiPost("/products", {
        artisanId: user.id, title: finalTitle, description: finalDescription, price: price,
        category, image: imageDataUrl, craftInfo: { material, region, storyLanguage: storyLang, originalStory: story, verificationProof: proofVideo, gallery: galleryImages },
      });
      setProduct(created); setStepState("scanning");
      await new Promise((r) => setTimeout(r, 900));
      const result = await apiPost("/scan", { productId: created.id });
      const safety = await apiPost("/risk", { productId: created.id });
      result.riskScore = safety.riskScore; result.riskLevel = safety.level; result.riskReasons = safety.reasons;
      setVerifyResult(result);
      await new Promise((r) => setTimeout(r, 700));
      setStepState("result");
      setLastVerifiedProductId(created.id);
      saveRecentProduct(user.id, created.id);
    } catch (e: any) { setErr(e.message || "Verification failed."); }
  }

  useEffect(() => () => { try { storyRecognitionRef.current?.stop(); } catch (_) {} proofStreamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  return (<>
    <div className="addpiece-page">
      <header className="addpiece-topbar">
        <button className="addpiece-back" onClick={() => go("dashboard")} aria-label="Back">‹</button>
        <img src="/assets/logo.png" className="addpiece-logo" alt="KalaSutra" />
        <button className="addpiece-switch" onClick={() => go("buyerHome")}>Switch to Buyer</button>
      </header>

      <div className="addpiece-content"><ErrorBanner message={err} />
        {step === "form" && <>
          <section className="addpiece-heading"><span className="addpiece-eyebrow">FOR ARTISANS</span><h1>Add a New Piece</h1><p>Take a photo. Tell your story. <b>AI does the rest.</b></p></section>
          <div className="addpiece-steps"><div className="active"><span>1</span><b>Capture</b></div><i></i><div><span>2</span><b>Add Details</b></div><i></i><div><span>3</span><b>Verify</b></div><i></i><div><span>4</span><b>Publish</b></div></div>

          <section className="addpiece-card capture-card">
            <div className="addpiece-section-head"><div><span className="addpiece-num">01</span><div><h2>Show us your piece</h2><p>Upload clear photos and a short making proof.</p></div></div><span>📷</span></div>
            <div className="photo-grid">
              {galleryImages.map((src, i) => <div className="photo-tile" key={i}><img src={src} alt={`Piece ${i+1}`} /><button onClick={() => removeImage(i)} aria-label="Remove photo">×</button></div>)}
              {galleryImages.length < 6 && <div className="photo-add photo-add-choice">
                <span>＋</span><b>Add Photos</b><small>{galleryImages.length}/6 added</small>
                <div className="media-choice-row">
                  <label><input type="file" accept="image/*" capture="environment" multiple onChange={handleImagePick} />📷 Camera</label>
                  <label><input type="file" accept="image/*" multiple onChange={handleImagePick} />🖼 Gallery</label>
                </div>
              </div>}
              <div className="proof-upload-tile proof-upload-choice">
                <span>🎥</span><b>{proofVideo ? "Proof Added" : "Making Video"}</b><small>{proofVideo ? "Replace or record again" : "Upload or record 5-sec proof"}</small>
                <div className="media-choice-row">
                  <label><input type="file" accept="video/*" capture="environment" onChange={handleProofUpload} />📹 Record</label>
                  <label><input type="file" accept="video/*" onChange={handleProofUpload} />🎞 Gallery</label>
                </div>
              </div>
            </div>
            {proofVideo && <video src={proofVideo} controls className="proof-preview" />}
            <div className="capture-actions"><button className={`record-proof-btn ${recording ? "recording" : ""}`} onClick={recording ? stopProofRecording : startProofRecording}>{recording ? "⏹ Recording… auto-stops in 5s" : "🔴 Record 5-sec Making Proof"}</button></div>
          </section>

          <section className="addpiece-card story-card-new">
            <div className="addpiece-section-head"><div><span className="addpiece-num">02</span><div><h2>Tell Your Story</h2><p>Voice first — speak naturally in your language.</p></div></div><span>🎙️</span></div>
            <div className="story-controls"><select value={storyLang} onChange={(e)=>setStoryLang(e.target.value)}><option value="hi-IN">Hindi</option><option value="mr-IN">Marathi</option><option value="ta-IN">Tamil</option><option value="bn-IN">Bangla</option><option value="en-IN">English</option></select><button className={`story-big-mic ${storyRecording ? "recording" : ""}`} onClick={storyRecording ? stopStoryRecording : startStoryRecording}>{storyRecording ? "■ Stop listening" : "🎙 Start speaking"}</button></div>
            <textarea className="story-box-new" value={story} onChange={(e)=>setStory(e.target.value)} placeholder="Or type your story here…" />
            {englishDescription && <div className="ai-draft-new"><b>✨ AI buyer description</b><span>{englishDescription}</span></div>}
          </section>

          <section className="addpiece-card details-card-new">
            <div className="addpiece-section-head"><div><span className="addpiece-num">03</span><div><h2>Product Details</h2><p>Simple details help buyers discover your craft.</p></div></div><span>🧵</span></div>
            <div className="detail-grid-new">
              <label>Product Name<input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g. Blue Pottery Vase" /></label>
              <label>Category<select value={category} onChange={(e)=>setCategory(e.target.value)}>{Object.keys(CATEGORY_EMOJI).map(c=><option key={c}>{c}</option>)}</select></label>
              <label>Price (₹)<input value={price} onChange={(e)=>setPrice(e.target.value.replace(/[^0-9.]/g,""))} placeholder="2000" inputMode="decimal" /></label>
              <label>Material<input value={material} onChange={(e)=>setMaterial(e.target.value)} placeholder="Terracotta clay" /></label>
              <label>Region<input value={region} onChange={(e)=>setRegion(e.target.value)} placeholder="Rajasthan" /></label>
              <label>Tags<input placeholder="Handmade, traditional, sustainable" /></label>
            </div>
          </section>

          <section className="addpiece-card verification-card-new">
            <div className="addpiece-section-head"><div><span className="addpiece-num">04</span><div><h2>Verification</h2><p>Your piece is checked before it goes live.</p></div></div><span>🛡️</span></div>
            <div className="verification-points"><span>✓</span><div><b>Authenticity &amp; safety check</b><small>Photo + making proof + craft story are reviewed by KalaSutra's verification flow.</small></div></div>
            <div className="verification-points"><span>✓</span><div><b>Your price stays yours</b><small>No middleman markup is added to your artisan listing.</small></div></div>
          </section>
          <button className="addpiece-main-btn" onClick={handleCreateAndScan}>Add Piece &amp; Start Verification <span>→</span></button>
        </>}

        {step === "scanning" && <div className="addpiece-result-wrap"><span className="demo-tag">Demo verification</span><div className="section-title">🛡️ Authenticity Check Running</div><div className="verify-row"><div className="verify-icon pending">⏳</div><div><div className="verify-title">Micro-Texture + Image Analysis</div><div className="verify-note">Checking the uploaded piece and making-proof clip…</div></div></div><div className="verify-row"><div className="verify-icon pending">⏳</div><div><div className="verify-title">Making-Process Proof</div><div className="verify-note">Confirming that proof was supplied before listing.</div></div></div><div className="verify-row"><div className="verify-icon pending">⏳</div><div><div className="verify-title">Authenticity Decision</div><div className="verify-note">Generating a confidence score.</div></div></div></div>}
        {step === "result" && verifyResult && <div className="addpiece-result-wrap"><span className="demo-tag">Demo verification</span><div className={`badge-result ${verifyResult.status}`}><div className="big">{verifyResult.status === "verified" ? "🟢 Verified Handmade" : verifyResult.status === "needs_review" ? "🟡 Needs Verification" : "🔴 Not Eligible"}</div><div className="small">Confidence score: {(verifyResult.confidence*100).toFixed(0)}%</div></div><div className="section-title">Listing saved • Price locked at ₹{Number(price).toLocaleString("en-IN")}</div><div className="card"><div className="thumb" style={{backgroundImage:`url(${product.image})`}}><BadgeLabel status={verifyResult.status}/></div><div className="info"><div className="t">{product.title}</div><div className="p">₹{Number(product.price).toLocaleString("en-IN")}</div></div></div></div>}
      </div>
      <div className="addpiece-bottom-actions">{step === "result" && verifyResult?.status !== "rejected" && <button className="btn green" onClick={()=>go("createReel")}>Create a Reel for this product</button>}{step === "result" && <button className="btn secondary" onClick={()=>{setToast("Saved to your products");go("myProducts")}}>My Products</button>}</div>
    </div>
  </>);
}

// ---------------------------------------------------------------------------
// ARTISAN: MY PRODUCTS
// ---------------------------------------------------------------------------
function MyProductsScreen({ user, go }: any) {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => { apiGet(`/products`).then((all) => setProducts(all.filter((p: any) => p.artisanId === user.id))); }, []);
  return (
    <>
      <div className="app-header"><button className="header-back" onClick={() => go('dashboard')} aria-label="Back">‹</button><div><h2>My Products</h2><div className="sub">{products.length} listed</div></div></div>
      <div className="content">
        {products.length === 0 ? <div className="empty-note">No products yet.</div> : (
          <div className="grid">
            {products.map((p) => (
              <div key={p.id} className="card">
                <div className="thumb" style={{ backgroundImage: `url(${p.image})` }}>
                  <BadgeLabel status={p.verificationStatus} />
                  <span className="emoji">{CATEGORY_EMOJI[p.category] || "🎨"}</span>
                </div>
                <div className="info"><div className="t">{p.title}</div><div className="p">₹{p.price.toLocaleString("en-IN")}</div><div className="product-id-mini">{p.uniqueProductId || 'KS-ART-000001'}</div></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// ARTISAN: CREATE REEL  (record via camera OR upload from gallery)
// ---------------------------------------------------------------------------
function CreateReelScreen({ user, go, setToast, prefillProductId }: any) {
  const [products,setProducts]=useState<any[]>([]),[productId,setProductId]=useState(prefillProductId||""),[caption,setCaption]=useState(""),[category,setCategory]=useState("Pottery"),[tags,setTags]=useState("");
  const [videoDataUrl,setVideoDataUrl]=useState<string|null>(null),[photoDataUrl,setPhotoDataUrl]=useState<string|null>(null),[mode,setMode]=useState<'video'|'photo'>('video'),[recording,setRecording]=useState(false),[facing,setFacing]=useState<'user'|'environment'>('environment');
  const [err,setErr]=useState<string|null>(null),[cameraReady,setCameraReady]=useState(false),[timer,setTimer]=useState(0),[speed,setSpeed]=useState(1),[filter,setFilter]=useState('none'),[beautify,setBeautify]=useState(false),[music,setMusic]=useState<string|null>(null),[musicName,setMusicName]=useState('');
  const [mediaPicker,setMediaPicker]=useState(false),[musicPicker,setMusicPicker]=useState(false),[musicQuery,setMusicQuery]=useState(''),[musicResults,setMusicResults]=useState<any[]>([]),[musicLoading,setMusicLoading]=useState(false),[cameraSettings,setCameraSettings]=useState(false);
  const [savedMusic,setSavedMusic]=useState<any[]>(()=>{try{return JSON.parse(localStorage.getItem('kalasutra_saved_music')||'[]')}catch(_){return[]}});
  const videoRef=useRef<HTMLVideoElement>(null),streamRef=useRef<MediaStream|null>(null),recorderRef=useRef<MediaRecorder|null>(null),chunksRef=useRef<Blob[]>([]),musicRef=useRef<HTMLAudioElement>(null),timerRef=useRef<any>(null);
  const photoInputRef=useRef<HTMLInputElement>(null),videoInputRef=useRef<HTMLInputElement>(null),fileInputRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{
    apiGet("/products").then((all)=>{const mine=all.filter((p:any)=>p.artisanId===user.id&&p.verificationStatus!=="rejected");setProducts(mine);const p=prefillProductId?mine.find((x:any)=>x.id===prefillProductId):mine[0];if(p){setProductId(p.id);setCategory(p.category);setCaption(`Making of: ${p.title}`)}}).catch((e)=>setErr(e.message));
    const t=setTimeout(()=>openCamera('environment'),350);
    return()=>{clearTimeout(t);stopCamera();clearTimeout(timerRef.current)}
  },[]);

  async function openCamera(cameraFacing: 'user'|'environment'=facing) {
    stopCamera(); setErr(null);
    try {
      if(!navigator.mediaDevices?.getUserMedia) throw new Error('Live camera is not supported in this browser.');
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:cameraFacing},width:{ideal:1080},height:{ideal:1920}},audio:true});
      streamRef.current=stream;
      setCameraReady(true);
      if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play();}
    } catch(e:any){setErr('Camera permission is needed. Please allow camera + microphone and try again. '+(e.message||''));}
  }
  function stopCamera(){streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;if(videoRef.current)videoRef.current.srcObject=null;}
  async function flipCamera(){if(recording) stopRecording();const next=facing==='environment'?'user':'environment';setFacing(next);await new Promise(r=>setTimeout(r,80));openCamera(next);}
  async function startRecording(){
    if(mode==='photo'){if(!streamRef.current) await openCamera();if(streamRef.current) capturePhoto();return;}
    setErr(null);if(!streamRef.current) await openCamera();if(!streamRef.current)return;
    const begin=()=>{try{chunksRef.current=[];const rec=new MediaRecorder(streamRef.current!);rec.ondataavailable=e=>{if(e.data.size)chunksRef.current.push(e.data)};rec.onstop=()=>{const blob=new Blob(chunksRef.current,{type:'video/webm'});const r=new FileReader();r.onload=()=>setVideoDataUrl(r.result as string);r.readAsDataURL(blob);stopCamera()};rec.start();recorderRef.current=rec;setRecording(true);if(timerRef.current)clearTimeout(timerRef.current);timerRef.current=setTimeout(()=>stopRecording(),60000)}catch(e:any){setErr(e.message||'Could not start recording')}};
    if(timer>0){setToast(`Timer set: ${timer}s`);timerRef.current=setTimeout(begin,timer*1000)}else begin();
  }
  function stopRecording(){if(recorderRef.current?.state==='recording')recorderRef.current.stop();setRecording(false);if(timerRef.current)clearTimeout(timerRef.current)}
  function capturePhoto(){const v=videoRef.current;if(!v)return;const c=document.createElement('canvas');c.width=v.videoWidth||720;c.height=v.videoHeight||1280;const ctx=c.getContext('2d');if(!ctx)return;if(facing==='user'){ctx.translate(c.width,0);ctx.scale(-1,1)}ctx.drawImage(v,0,0,c.width,c.height);setPhotoDataUrl(c.toDataURL('image/jpeg',.9));setVideoDataUrl(null);setMode('photo');setToast('Photo captured 📸');}
  async function uploadVideo(e:any){const f=e.target.files?.[0];if(!f)return;try{setVideoDataUrl(await fileToDataURL(f));setPhotoDataUrl(null);setMode('video');setMediaPicker(false);setToast('Video added from gallery')}catch(_){setErr('Could not load that video.')}}
  async function uploadPhoto(e:any){const f=e.target.files?.[0];if(!f)return;try{setPhotoDataUrl(await fileToDataURL(f));setVideoDataUrl(null);setMode('photo');setMediaPicker(false);setToast('Photo added from gallery')}catch(_){setErr('Could not load that photo.')}}
  async function uploadAny(e:any){const f=e.target.files?.[0];if(!f)return;if(f.type.startsWith('video/'))return uploadVideo(e);return uploadPhoto(e)}
  async function uploadMusic(e:any){const f=e.target.files?.[0];if(!f)return;try{const u=await fileToDataURL(f);setMusic(u);setMusicName(f.name);setMusicPicker(false);setTimeout(()=>musicRef.current?.play().catch(()=>{}),80);setToast('Music added 🎵')}catch(_){setErr('Could not load that audio file.')}}
  async function searchMusic(q=musicQuery){
    const term=(q||'handmade instrumental').trim();setMusicLoading(true);
    try{const res=await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=25`);const data=await res.json();setMusicResults(data.results||[])}catch(_){setMusicResults([]);setErr('Music search is unavailable right now. You can still import audio from your device.')}finally{setMusicLoading(false)}
  }
  function chooseMusic(track:any){if(!track.previewUrl){setToast('Preview unavailable for this track');return}setMusic(track.previewUrl);setMusicName(`${track.trackName} · ${track.artistName}`);setMusicPicker(false);setTimeout(()=>musicRef.current?.play().catch(()=>{}),80);const item={trackName:track.trackName,artistName:track.artistName,previewUrl:track.previewUrl,artworkUrl100:track.artworkUrl100};const next=[item,...savedMusic.filter((x:any)=>x.previewUrl!==item.previewUrl)].slice(0,12);setSavedMusic(next);localStorage.setItem('kalasutra_saved_music',JSON.stringify(next));setToast('Music selected 🎵')}
  function chooseSavedMusic(track:any){setMusic(track.previewUrl);setMusicName(`${track.trackName} · ${track.artistName}`);setMusicPicker(false);setTimeout(()=>musicRef.current?.play().catch(()=>{}),80);}
  function cycleTimer(){setTimer(t=>t===0?3:t===3?5:t===5?10:0)}
  function cycleSpeed(){setSpeed(s=>s===1?0.5:s===0.5?1.5:s===1.5?2:1)}
  function cycleFilter(){setFilter(f=>f==='none'?'warm':f==='warm'?'mono':f==='mono'?'soft':'none')}
  function filterStyle(){return {filter:`${filter==='warm'?'sepia(.18) saturate(1.15)':filter==='mono'?'grayscale(1)':filter==='soft'?'brightness(1.06) contrast(.92)':'none'} ${beautify?'brightness(1.03) saturate(1.05)':''}`}}
  async function postReel(){if(!videoDataUrl&&!photoDataUrl){setErr('Record or upload your Reel first.');return}try{await apiPost('/reels',{artisanId:user.id,productId:productId||null,caption:caption||'Stories behind my handmade craft',category,tags,video:videoDataUrl||photoDataUrl});setToast('Reel posted successfully ✨');go('myReels')}catch(e:any){setErr(e.message||'Could not post Reel.')}}

  return <div className="reel-create-page">
    <header className="reel-create-topbar"><button onClick={()=>{stopCamera();go('dashboard')}} aria-label="Back">‹</button><img src="/assets/logo.png" alt="KalaSutra"/><div><b>KalaSutra</b><span>Artisans to the World</span></div><button onClick={()=>setCameraSettings(v=>!v)} title="Camera settings">⚙</button><button onClick={flipCamera} title="Flip camera">↻</button><button onClick={()=>setToast('Draft saved locally')}>Save Draft</button></header>
    <div className="reel-create-layout">
      <section className="reel-camera-panel">
        <div className="reel-viewfinder">
          {(videoDataUrl||photoDataUrl)?(videoDataUrl?<video src={videoDataUrl} controls playsInline className="reel-preview" style={{...filterStyle(),transform:speed!==1?'scale(1)':'none'}}/>:<img src={photoDataUrl} className="reel-preview" style={filterStyle()}/>):<><video ref={videoRef} className="reel-preview" autoPlay muted playsInline style={{...filterStyle(),transform:facing==='user'?'scaleX(-1)':'none'}}/>{!cameraReady&&<div className="reel-empty-visual"><div className="reel-caption-art">Capture<br/>Your Craft<br/>Share Your Story ♡</div><div className="reel-placeholder">{recording?'Recording your craft…':'Your craft camera appears here'}</div></div>}</>}
          <div className="viewfinder-corners" />
          <div className="reel-live-status">● {facing==='user'?'FRONT CAMERA':'BACK CAMERA'}</div>
          <div className="reel-side-tools">
            <button onClick={()=>{setMusicPicker(true);if(!musicResults.length)searchMusic('handmade instrumental')}}>♫<small>{musicName?'Music ✓':'Music'}</small></button>
            <button onClick={cycleTimer}>◷<small>Timer {timer?timer+'s':'Off'}</small></button>
            <button onClick={cycleSpeed}>1×<small>Speed {speed}×</small></button>
            <button onClick={cycleFilter}>✦<small>Filter {filter}</small></button>
            <button className={beautify?'tool-active':''} onClick={()=>setBeautify(v=>!v)}>♧<small>Beautify {beautify?'On':'Off'}</small></button>
          </div>
          <div className="reel-mode-toggle"><button className={mode==='video'?'active':''} onClick={()=>{setMode('video');if(!streamRef.current)openCamera()}}>Video</button><button className={mode==='photo'?'active':''} onClick={()=>{setMode('photo');if(!streamRef.current)openCamera()}}>Photo</button></div>
          <button className={`record-button ${recording?'recording':''}`} onClick={recording?stopRecording:startRecording}>{recording?'■':'●'}</button><span className="record-hint">{recording?'Tap to stop':mode==='photo'?'Tap for photo':'Tap to record'}<small>{timer?'Timer ready':''}</small></span>
          <button className="gallery-upload" onClick={()=>setMediaPicker(true)}><span>▧</span><small>Gallery</small></button>
          <button className="photo-gallery-upload" onClick={()=>{setMediaPicker(true)}}><span>▣</span><small>Photo</small></button>
          <button className="effects-btn" onClick={cycleFilter}>✧<small>Effects</small></button>
          {music&&<audio ref={musicRef} src={music} loop controls className="reel-music-player"/>}
          {cameraSettings&&<div className="reel-settings-sheet"><div className="reel-sheet-head"><b>Camera settings</b><button onClick={()=>setCameraSettings(false)}>×</button></div><button onClick={flipCamera}>↻ Switch to {facing==='environment'?'front':'back'} camera</button><button onClick={()=>{setBeautify(v=>!v);setCameraSettings(false)}}>♧ Beautify: {beautify?'On':'Off'}</button><button onClick={()=>{cycleFilter();setCameraSettings(false)}}>✦ Filter: {filter}</button><button onClick={()=>{cycleTimer();setCameraSettings(false)}}>◷ Timer: {timer?timer+'s':'Off'}</button></div>}
        </div>
        <div className="reel-camera-controls"><button onClick={flipCamera}>↻ {facing==='environment'?'Front camera':'Back camera'}</button><button onClick={()=>{setMusicPicker(true);if(!musicResults.length)searchMusic('handmade instrumental')}}>♫ Add music</button><button onClick={()=>{setMusic(null);setMusicName('');musicRef.current?.pause()}}>Remove music</button></div>
        <div className="reel-bottom-tools"><span>♧<b>Tips</b></span><span>▣<b>Inspiration</b></span><span>▤<b>Guidelines</b></span></div>
      </section>
      <section className="reel-details-panel">
        <div className="reel-panel-title"><div><h1>Almost Ready!</h1><p>Add a few details and let the world see your creation</p></div><span>♧</span></div>
        <div className="reel-story-card">{videoDataUrl?<video src={videoDataUrl} controls playsInline style={filterStyle()}/>:photoDataUrl?<img src={photoDataUrl} style={filterStyle()}/>:<div className="no-clip"><span>◉</span><b>No clip yet</b><small>Use live camera, front/back flip, or gallery upload</small></div>}<div><em>Stories<br/>Behind<br/>Handmade<br/>Matter ♡</em></div></div>
        {err&&<ErrorBanner message={err}/>} 
        <label className="reel-field"><b>✎ Caption</b><textarea value={caption} maxLength={300} onChange={e=>setCaption(e.target.value)} placeholder="e.g. Making this piece takes days of hard work, patience and love. ❤️"/></label>
        <label className="reel-field"><b>▣ Attach Product <small>(Optional)</small></b><select value={productId} onChange={e=>setProductId(e.target.value)}><option value="">No product — just my process</option>{products.map((p:any)=><option key={p.id} value={p.id}>{p.title} · ₹{p.price}</option>)}</select></label>
        <label className="reel-field"><b>♢ Category</b><select value={category} onChange={e=>setCategory(e.target.value)}>{['Pottery','Textiles','Woodwork','Metalwork','Basketry','Other'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="reel-field"><b># Tags <small>(comma separated)</small></b><input value={tags} onChange={e=>setTags(e.target.value)} placeholder="pottery, handmade, rajasthan, traditional"/></label>
        <button className="post-reel-btn" onClick={postReel}>☁ &nbsp; Post Reel</button><div className="reel-footer-note">Show the world your craft ✨</div><div className="reel-bottom-quote">“Every craft has a story. Tell yours.” ♥</div>
      </section>
    </div>

    <input ref={photoInputRef} type="file" accept="image/*" onChange={uploadPhoto} className="hidden-media-input"/>
    <input ref={videoInputRef} type="file" accept="video/*" onChange={uploadVideo} className="hidden-media-input"/>
    <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={uploadAny} className="hidden-media-input"/>

    {mediaPicker&&<div className="reel-modal-backdrop" onClick={()=>setMediaPicker(false)}><div className="reel-media-sheet" onClick={e=>e.stopPropagation()}><div className="reel-sheet-handle"/><div className="reel-sheet-head"><b>Add to your Reel</b><button onClick={()=>setMediaPicker(false)}>×</button></div><button onClick={()=>photoInputRef.current?.click()}>▣ <span><strong>Photo Library</strong><small>Choose photos from your device</small></span></button><button onClick={()=>videoInputRef.current?.click()}>▣ <span><strong>Take Video</strong><small>Open your camera to record</small></span></button><button onClick={()=>fileInputRef.current?.click()}>▱ <span><strong>Choose File</strong><small>Select a photo or video file</small></span></button></div></div>}

    {musicPicker&&<div className="reel-modal-backdrop" onClick={()=>setMusicPicker(false)}><div className="reel-music-sheet" onClick={e=>e.stopPropagation()}><div className="reel-sheet-handle"/><div className="reel-sheet-head"><b>🎵 Add music</b><button onClick={()=>setMusicPicker(false)}>×</button></div><div className="music-search-row"><input value={musicQuery} onChange={e=>setMusicQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')searchMusic()}} placeholder="Search songs, artists, sounds…"/><button onClick={()=>searchMusic()}>Search</button></div><div className="music-tabs"><button className="active">For you</button><button>Trending</button><button>Original audio</button><button>Saved</button></div><button className="music-import-btn" onClick={()=>document.getElementById('reelMusicFile')?.click()}>🎵 Import audio from device</button><input id="reelMusicFile" type="file" accept="audio/*" onChange={uploadMusic} className="hidden-media-input"/>{savedMusic.length>0&&<><div className="music-section-label">Saved on this device</div>{savedMusic.slice(0,5).map((t:any,i:number)=><button className="music-row" key={'saved'+i} onClick={()=>chooseSavedMusic(t)}><img src={t.artworkUrl100||'/assets/logo.png'} /><span><strong>{t.trackName}</strong><small>{t.artistName} · Saved</small></span><b>▶</b></button>)}</>}{musicLoading?<div className="music-loading">Finding music…</div>:<>{musicResults.length>0&&<div className="music-section-label">Search results</div>}{musicResults.map((t:any,i:number)=><button className="music-row" key={t.trackId||i} onClick={()=>chooseMusic(t)}><img src={t.artworkUrl100||'/assets/logo.png'} /><span><strong>{t.trackName}</strong><small>{t.artistName} · {t.trackTimeMillis?Math.round(t.trackTimeMillis/60000)+':'+String(Math.round(t.trackTimeMillis/1000)%60).padStart(2,'0'):''}</small></span><b>▶</b></button>)}</>}{!musicLoading&&!musicResults.length&&<div className="music-empty">Search for a song or use <b>Import audio</b> to add your own track.</div>}</div></div>}
  </div>;
}

// ---------------------------------------------------------------------------
// ARTISAN: MY REELS
// ---------------------------------------------------------------------------
function MyReelsScreen({ user, go, setToast }: any) {
  const [reels, setReels] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");

  function load() { apiGet(`/reels?artisanId=${user.id}`).then(setReels); }
  useEffect(load, []);

  async function handleDelete(id: string) {
    await apiDelete(`/reels/${id}`);
    setToast("Reel deleted");
    load();
  }
  async function handleSaveCaption(id: string) {
    await apiPut(`/reels/${id}`, { caption: editCaption });
    setEditingId(null);
    load();
  }

  return (
    <>
      <div className="app-header">
        <button className="header-back" onClick={() => go('dashboard')} aria-label="Back">‹</button><div><h2>My Reels</h2><div className="sub">{reels.length} posted</div></div>
        <div className="fab" style={{ position: "static", width: 40, height: 40, fontSize: 18 }} onClick={() => go("createReel")}>🎬</div>
      </div>
      <div className="content">
        {reels.length === 0 ? <div className="empty-note">You haven't posted any Reels yet.</div> : reels.map((r) => (
          <div className="my-reel-row" key={r.id}>
            <div className="thumb-sm" style={{ background: "#e4d9bd" }}>{r.thumbEmoji}</div>
            <div style={{ flex: 1 }}>
              {editingId === r.id ? (
                <>
                  <textarea value={editCaption} onChange={(e) => setEditCaption(e.target.value)} style={{ width: "100%", fontSize: 12, border: "1.5px solid var(--ink)", padding: 6 }} />
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <button className="btn" style={{ padding: "6px 10px", fontSize: 11 }} onClick={() => handleSaveCaption(r.id)}>Save</button>
                    <button className="btn secondary" style={{ padding: "6px 10px", fontSize: 11 }} onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{r.caption}</div>
                  <div style={{ fontSize: 10.5, color: "#6b6055", marginTop: 3 }}>
                    {r.product ? `Linked: ${r.product.title}` : "No product linked"} · ❤️ {r.likes} · 💬 {r.comments}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--indigo)", cursor: "pointer" }} onClick={() => { setEditingId(r.id); setEditCaption(r.caption); }}>Edit caption</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--madder)", cursor: "pointer" }} onClick={() => handleDelete(r.id)}>Delete</span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}


// ---------------------------------------------------------------------------
// LOCATION TOOLS — separate buyer delivery location + artisan craft location
// ---------------------------------------------------------------------------
function LocationTools({ mode, initial }: { mode: 'buyer' | 'artisan'; initial?: string }) {
  const key = `kalasutra_${mode}_location`;
  const saved = (() => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } })();
  const [loc, setLoc] = useState<any>(saved || null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [manual, setManual] = useState(initial || saved?.label || saved?.city || '');

  async function detect() {
    setBusy(true); setMessage('');
    try {
      const x = await requestCurrentLocation();
      const next = { ...x, label: [x.area, x.city, x.pincode].filter(Boolean).join(', ') || 'Current location' };
      setLoc(next); setManual(next.label); localStorage.setItem(key, JSON.stringify(next));
      setMessage(mode === 'buyer' ? '✓ Current delivery location detected' : '✓ Craft location verified from this device');
    } catch (e:any) { setMessage(e.message || 'Could not detect location'); }
    finally { setBusy(false); }
  }
  function saveManual() {
    const next = { ...(loc || {}), label: manual.trim() || 'Location saved manually', manual: true };
    setLoc(next); localStorage.setItem(key, JSON.stringify(next)); setMessage('✓ Location saved');
  }
  return <section className={`location-tools-card ${mode === 'artisan' ? 'artisan-location-card' : 'buyer-location-card'}`}>
    <div className="location-tools-icon">⌖</div>
    <div className="location-tools-main">
      <span className="field-label">{mode === 'buyer' ? 'BUYER DELIVERY LOCATION' : 'ARTISAN CRAFT LOCATION'}</span>
      <h3>{mode === 'buyer' ? 'Where should we deliver?' : 'Where is this craft made?'}</h3>
      <p>{loc?.label || manual || (mode === 'buyer' ? 'Use your current location for faster checkout.' : 'Verify the place connected to your handmade work.')}</p>
      <div className="location-tools-actions">
        <button onClick={detect} disabled={busy}>{busy ? 'Detecting…' : '⌖ Use current location'}</button>
        <input value={manual} onChange={e=>setManual(e.target.value)} placeholder="City / locality" />
        <button className="location-save-btn" onClick={saveManual}>Save</button>
      </div>
      {message && <small className="location-tools-message">{message}</small>}
    </div>
    <span className="location-tools-status">{loc ? '✓' : '○'}</span>
  </section>;
}

// ---------------------------------------------------------------------------
// ARTISAN: PROFILE
// ---------------------------------------------------------------------------
function ArtisanProfileScreen({ user, onLogout, go }: any) {
  const profile = user.profile || {};
  const [editing, setEditing] = useState(false);
  const [location, setLocation] = useState(profile.location || "Jaipur, Rajasthan");
  const [bio, setBio] = useState(profile.bio || "Keeping our traditions alive, one creation at a time.");
  const [avatar, setAvatar] = useState(() => localStorage.getItem(`kalasutra_avatar_${user.id}`) || profile.avatar || "/assets/avatar-artisan.png");

  async function handleAvatarPick(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { const data = await fileToDataURL(file); setAvatar(data); localStorage.setItem(`kalasutra_avatar_${user.id}`, data); } catch (_) {}
    e.target.value = "";
  }
  function saveProfile() { setEditing(false); }

  return (
    <div className="profile-page artisan-profile-page">
      <header className="profile-topbar profile-topbar-with-back">
        <button className="profile-back-btn" onClick={() => go("dashboard")} aria-label="Back">‹</button>
        <img src="/assets/logo.png" className="profile-logo" alt="KalaSutra" />
        <div className="profile-top-actions">
          <button aria-label="Search"><Icon name="search" /></button>
          <button aria-label="Notifications"><Icon name="bell" /><span className="notification-dot" /></button>
          <button aria-label="Settings" onClick={() => { setEditing(v => !v); window.scrollTo({top: 0, behavior: "smooth"}); }}>⚙</button>
          <span className="profile-top-slogan">Handmade<br/>Stories<br/>Brighter Tomorrows ♡</span>
        </div>
      </header>

      <main className="profile-container">
        <section className="profile-hero artisan-hero">
          <div className="profile-avatar-wrap">
            <img src={avatar} className="profile-avatar" alt="Artisan profile" />
            <input id="artisanAvatarInput" className="avatar-file-input" type="file" accept="image/*" capture="user" onChange={handleAvatarPick} />
            <label htmlFor="artisanAvatarInput" className="avatar-camera" title="Upload profile photo">⌾</label>
          </div>
          <div className="profile-identity">
            <h1>{user.name} <span className="verified-check">✓</span></h1>
            <h3>Master Artisan</h3>
            <p className="profile-location">⌖ {location}</p>
            <p className="profile-quote">“{bio}”</p>
            <div className="profile-tags">
              <span>◉ Handcrafted</span><span>♟ Traditional</span><span>◉ Sustainable</span>
            </div>
          </div>
          <div className="profile-hero-art">
            <div className="handmade-script">Crafting<br/>A Better<br/>Tomorrow ♡</div>
            <div className="hero-craft-image" />
          </div>
          <button className="profile-edit-btn" onClick={() => setEditing(v => !v)}>✎ {editing ? "Close" : "Edit Profile"}</button>
        </section>

        {editing && (
          <section className="profile-edit-panel">
            <label>Craft location<input value={location} onChange={e => setLocation(e.target.value)} /></label>
            <label>Artisan story / bio<textarea value={bio} onChange={e => setBio(e.target.value)} /></label>
            <button className="profile-primary-btn" onClick={saveProfile}>Save artisan profile</button>
          </section>
        )}

        <LocationTools mode="artisan" initial={location} />

        <section className="trust-row">
          <div className="trust-score-card">
            <div><b>TRUST SCORE</b><small>Build trust. Reach the world.</small></div>
            <div className="trust-progress"><span style={{width:`${Math.min(100, Number(profile.trustScore ?? 100))}%`}} /></div>
            <strong>{profile.trustScore ?? 100}/100</strong><span className="trust-crown">♛</span>
          </div>
          <div className="trust-side"><span className="trust-icon">♛</span><div><b>Top Artisan</b><small>Keep creating magic!</small></div><span>›</span></div>
        </section>

        <section className="profile-stat-grid artisan-stats">
          <div><b>12</b><span>Products Listed</span></div>
          <div><b>248</b><span>Profile Views</span></div>
          <div><b>36</b><span>Orders Received</span></div>
          <div><b>4.9</b><span>Buyer Rating</span></div>
          <div className="impact-stat"><b>🌿</b><div><strong>You are making an impact!</strong><span>Your art supports culture, communities and a sustainable future.</span></div><span>›</span></div>
        </section>

        <button className="safety-center" onClick={() => go("reviews")}><span>✓</span><div><strong>Safety &amp; Review Center</strong><small>Your safety and trust matter to us. View guidelines, report issues and read reviews.</small></div><b>›</b></button>

        <div className="profile-switch-row">
          <button onClick={() => apiPost("/users", { name: user.name, contact: user.contact || "demo", role: "buyer" }).then(() => window.location.reload())}>⇄ &nbsp;Switch to Buyer View</button>
          <button onClick={onLogout}>⇥ &nbsp;Log out</button>
        </div>

        <div className="quick-heading"><h2>Quick Actions</h2><span>Create<br/>Share<br/>Grow ♡</span></div>
        <section className="quick-actions artisan-quick-actions">
          <button onClick={() => go("addProduct")}><span>＋</span><b>Add a Piece</b><small>Take a photo,<br/>tell your story</small></button>
          <button onClick={() => go("createReel")}><span>▣</span><b>Upload Reel</b><small>Show your craft<br/>to the world</small></button>
          <button onClick={() => go("myProducts")}><span>▥</span><b>My Portfolio</b><small>Manage your<br/>creations</small></button>
          <button onClick={() => go("orders")}><span>▤</span><b>Orders</b><small>Track &amp; manage<br/>orders</small></button>
          <div className="quick-banner artisan-banner"><div><em>Your Craft<br/>Inspires the World</em><small>Keep creating.<br/>We'll handle the rest.</small><button onClick={() => go("myProducts")}>View My Creations →</button></div></div>
        </section>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BUYER NAV
// ---------------------------------------------------------------------------
function BuyerNav({ screen, go, cartCount }: { screen: string; go: (s: string) => void; cartCount: number }) {
  const items = [
    { id: "buyerHome", label: "Home", icon: "home" },
    { id: "buyerReels", label: "Reels", icon: "reels" },
    { id: "cart", label: "Cart", icon: "cart" },
    { id: "orders", label: "Orders", icon: "orders" },
    { id: "buyerProfile", label: "Profile", icon: "profile" },
  ];
  return (
    <div className="bottom-nav buyer-bottom-nav">
      {items.map((it) => (
        <button key={it.id} className={`nav-btn ${screen === it.id ? "active" : ""}`} onClick={() => go(it.id)}>
          <span className="nav-icon-wrap"><Icon name={it.icon} />{it.id === "cart" && cartCount > 0 && <b className="nav-badge">{cartCount > 9 ? "9+" : cartCount}</b>}</span><span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BUYER: HOME / EXPLORE
// ---------------------------------------------------------------------------
function BuyerHomeScreen({ user, go, openProduct, wishlist, toggleWishlist, cartCount, addToCart, setToast }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const recentKey = `kalasutra_recent_products_${user.id}`;
  const loadRecent = () => setRecentIds(getRecentProductIds(user.id));

  useEffect(() => {
    apiGet(`/products`).then(setProducts).catch((e) => setErr(e.message));
    loadRecent();
    const f = () => loadRecent();
    window.addEventListener("kalasutra:recent-product", f);
    return () => window.removeEventListener("kalasutra:recent-product", f);
  }, [user.id]);

  const craftItems = [
    { key: "Pottery", label: "Pottery", img: "/assets/buyer-home/craft-pottery.jpg" },
    { key: "Textiles", label: "Textiles", img: "/assets/buyer-home/craft-textiles.jpg" },
    { key: "Woodwork", label: "Woodwork", img: "/assets/buyer-home/craft-woodwork.jpg" },
    { key: "Metalwork", label: "Metalwork", img: "/assets/buyer-home/craft-metalwork.jpg" },
    { key: "Cane & Bamboo", label: "Cane & Bamboo", img: "/assets/buyer-home/craft-cane.jpg" },
    { key: "Jewellery", label: "Jewellery", img: "/assets/buyer-home/craft-jewellery.jpg" },
    { key: "Home Decor", label: "Home Decor", img: "/assets/buyer-home/craft-decor.jpg" },
  ];

  const curated = [
    { title: "Handwoven Cane Dome Pendant Lamp", maker: "Radha Devi", place: "Jaipur, Rajasthan", price: 1499, img: "/assets/buyer-home/product-1.jpg" },
    { title: "Terracotta Minimal Vase", maker: "Suresh Prajapat", place: "Jaipur, Rajasthan", price: 899, img: "/assets/buyer-home/product-2.jpg" },
    { title: "Handcarved Wooden Serving Bowl", maker: "Mohan Lal", place: "Udaipur, Rajasthan", price: 1200, img: "/assets/buyer-home/product-3.jpg" },
    { title: "Block Print Cushion Cover", maker: "Fatima Bano", place: "Sanganer, Rajasthan", price: 699, img: "/assets/buyer-home/product-4.jpg" },
  ];

  const filtered = products.filter((p) => {
    if (!query.trim()) return true;
    return query.toLowerCase().split(" ").filter(Boolean).every((w) =>
      `${p.title} ${p.category} ${p.craftInfo?.material || ""} ${p.craftInfo?.region || ""}`.toLowerCase().includes(w)
    );
  });

  const recent = recentIds.map((id) => products.find((p) => String(p.id) === String(id))).filter(Boolean).slice(0, 4);

  function viewProduct(id: string) {
    saveRecentProduct(user.id, id);
    setRecentIds(getRecentProductIds(user.id));
    openProduct(id);
  }

  async function voiceSearch() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setErr("Voice search is not supported in this browser."); return; }
    const ok = await requestVoicePermission();
    if (!ok) { setErr("Please allow microphone access for voice search."); return; }
    const r = new SR();
    r.lang = "hi-IN";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); setErr("Voice search could not start. Please try again."); };
    r.onresult = (e: any) => setQuery(e.results?.[0]?.[0]?.transcript || "");
    try { r.start(); } catch (_) {}
  }

  function chooseCraft(name: string) {
    setQuery(name === "Cane & Bamboo" ? "Cane" : name);
    setTimeout(() => document.getElementById("buyer-curated")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  function curatedAction(index: number) {
    const actual = products[index];
    if (!actual) { setToast("This handcrafted piece is part of the curated showcase."); return; }
    viewProduct(String(actual.id));
  }

  return (
    <div className="buyer-home-reference">
      <div className="buyer-home-frame buyer-home-frame-left" />
      <div className="buyer-home-frame buyer-home-frame-right" />

      <header className="buyer-reference-header">
        <div className="buyer-reference-brand-row">
          <div className="buyer-reference-brand">
            <img src="/assets/logo.png" alt="KalaSutra" />
            <span>Art<br />Lives<br />Here ♡</span>
          </div>
          <div className="buyer-reference-tools">
            <button aria-label="Search" onClick={() => document.getElementById("buyer-search")?.focus()}><Icon name="search" /></button>
            <button aria-label="Notifications"><Icon name="bell" /></button>
            <button aria-label="Settings" onClick={() => setToast("KalaSutra settings")}>⚙</button>
          </div>
        </div>

        <div className="buyer-reference-hero">
          <div className="buyer-reference-copy">
            <h1>Hello, {user.name || "Harsh"} <span>✦</span></h1>
            <p>Discover something made by hand,<br />made with a story.</p>
            <button onClick={() => document.getElementById("buyer-crafts")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Explore Handmade <b>→</b></button>
          </div>
          <div className="buyer-reference-hero-photo">
            <img src="/assets/buyer-home/hero-photo.jpg" alt="Handmade pottery" />
          </div>
          <div className="buyer-reference-quote">“Handmade<br />things carry<br />pieces of<br />people’s hearts.”<i>—</i></div>
        </div>
      </header>

      <main className="buyer-reference-content">
        <ErrorBanner message={err} />

        <div className="buyer-reference-search-row">
          <div className="buyer-reference-search" id="buyer-search-wrap">
            <Icon name="search" />
            <input id="buyer-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search crafts, materials, makers..." />
            <button className={listening ? "listening" : ""} onClick={voiceSearch} aria-label="Voice search">🎙</button>
          </div>
          <div className="buyer-reference-ai-hint">Ask me to find<br />a craft ✨</div>
        </div>

        <div className="buyer-reference-shortcuts">
          <button onClick={() => go("wishlist")}><Icon name="heart" /> Saved</button>
          <button onClick={() => go("buyerReels")}><Icon name="reels" /> Craft Stories</button>
          <button onClick={() => go("cart")}><Icon name="cart" /> Cart{cartCount ? ` (${cartCount})` : ""}</button>
        </div>

        <section className="buyer-craft-section" id="buyer-crafts">
          <div className="buyer-section-head"><h2>EXPLORE BY CRAFT</h2><button onClick={() => setQuery("")}>See all →</button></div>
          <div className="buyer-craft-scroller">
            {craftItems.map((c) => (
              <button className="buyer-craft-item" key={c.key} onClick={() => chooseCraft(c.key)}>
                <span><img src={c.img} alt={c.label} /></span>
                <b>{c.label}</b>
              </button>
            ))}
            <button className="buyer-craft-item buyer-craft-more" onClick={() => setToast("More crafts are coming to KalaSutra ✦")}><span>›</span><b>More</b></button>
          </div>
        </section>

        <section className="buyer-todays-story">
          <div className="buyer-today-copy">
            <span className="buyer-eyebrow">TODAY’S CRAFT STORY</span>
            <h2>From Jaipur, with hands<br />that have carried a<br />tradition forward.</h2>
            <p>Meet Radha Devi, a cane craft artisan from Jaipur<br />who turns simple materials into timeless pieces.</p>
            <button onClick={() => setToast("Radha Devi's craft story opened ✦")}>View Story <b>→</b></button>
          </div>
          <div className="buyer-today-photo"><img src="/assets/buyer-home/todays-story.jpg" alt="Radha Devi crafting" /></div>
          <div className="buyer-today-note"><em>“Every weave<br />tells a story<br />of resilience.”</em><b>— Radha Devi</b><span>⌖ Jaipur, Rajasthan</span><strong>✓ Verified Artisan</strong></div>
        </section>

        <section className="buyer-curated-section" id="buyer-curated">
          <div className="buyer-section-head"><div><h2>CURATED FOR YOU</h2><span>Handpicked pieces from verified artisans.</span></div><button onClick={() => setToast("More curated pieces coming soon →")}>See all →</button></div>
          <div className="buyer-curated-grid">
            {curated.map((p, i) => (
              <article className="buyer-reference-product" key={p.title} onClick={() => curatedAction(i)}>
                <div className="buyer-reference-product-image">
                  <img src={p.img} alt={p.title} />
                  <span className="buyer-verified">● Verified Handmade</span>
                  <button className="buyer-product-heart" onClick={(e) => { e.stopPropagation(); const actual = products[i]; if (actual) toggleWishlist(actual.id); else setToast("Saved for your handmade inspiration ♡"); }}>{products[i] && wishlist.includes(products[i].id) ? "♥" : "♡"}</button>
                </div>
                <div className="buyer-reference-product-info">
                  <h3>{p.title}</h3><p>by {p.maker}</p><small>{p.place}</small>
                  <div><strong>₹{p.price.toLocaleString("en-IN")}</strong><button onClick={(e) => { e.stopPropagation(); const actual = products[i]; if (actual) { addToCart(actual.id); setToast("Added to cart 🛍️"); } else setToast("This showcase piece is ready for your curated collection."); }}>＋ Add to cart</button></div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {query.trim() && (
          <section className="buyer-search-results">
            <div className="buyer-section-head"><h2>RESULTS FOR “{query}”</h2><button onClick={() => setQuery("")}>Clear</button></div>
            {filtered.length === 0 ? <div className="buyer-search-empty">No pieces match this search yet — try another craft, material, or region.</div> : <div className="grid buyer-live-grid">{filtered.slice(0, 8).map((p) => (
              <div key={p.id} className="card buyer-product-card" onClick={() => viewProduct(p.id)}><div className="thumb" style={{ backgroundImage: `url(${p.image})` }}><BadgeLabel status={p.verificationStatus} /></div><div className="info"><div className="t">{p.title}</div><div className="buyer-card-bottom"><div className="p">₹{Number(p.price).toLocaleString("en-IN")}</div><button className="quick-cart-btn" onClick={(e) => { e.stopPropagation(); addToCart(p.id); setToast("Added to cart 🛍️"); }}>＋ Add to cart</button></div></div></div>
            ))}</div>}
          </section>
        )}

        <section className="buyer-why-section">
          <div><span className="buyer-eyebrow">WHY BUY HANDMADE?</span><h2>More than products — a better tomorrow.</h2></div>
          <div className="buyer-why-grid">
            <div><span>◈</span><b>Verified<br />Handmade</b><small>Craft authenticity checked.</small></div>
            <div><span>₹</span><b>Fair Price</b><small>Help makers earn fairly.</small></div>
            <div><span>♟</span><b>Meet the Maker</b><small>Know the person behind your piece.</small></div>
            <div><span>◒</span><b>Craft Legacy</b><small>Every purchase keeps traditions alive.</small></div>
          </div>
        </section>

        {recent.length > 0 && <section className="recent-viewed-section buyer-reference-recent"><div className="recent-viewed-head"><div><span className="field-label">YOUR BROWSING TRAIL</span><h3>Recently Viewed</h3></div><button onClick={() => { localStorage.removeItem(recentKey); setRecentIds([]); }}>Clear</button></div><div className="recent-viewed-grid">{recent.map((p: any) => <button className="recent-product-card" key={`recent-${p.id}`} onClick={() => viewProduct(p.id)}><div className="recent-product-image" style={{ backgroundImage: `url(${p.image})` }}><BadgeLabel status={p.verificationStatus} /></div><div className="recent-product-info"><strong>{p.title}</strong><span>₹{Number(p.price || 0).toLocaleString("en-IN")}</span></div></button>)}</div></section>}
      </main>

      {cartCount > 0 && <div className="floating-cart-wrap"><button className="floating-cart" onClick={() => go("cart")}><span className="mini-cart-icon"><Icon name="cart" /></span><span><strong>View cart</strong><small>{cartCount} item{cartCount > 1 ? "s" : ""}</small></span><b>›</b></button></div>}
    </div>
  );
}
// ---------------------------------------------------------------------------
// BUYER: PRODUCT DETAIL
// ---------------------------------------------------------------------------
function ProductDetailScreen({ productId, go, back, setToast, wishlist, toggleWishlist, addToCart, userId }: any) {
  const [product, setProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reported, setReported] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customRequest, setCustomRequest] = useState("");
  const [customId, setCustomId] = useState("");
  const [customizing, setCustomizing] = useState(false);
  const [customListening, setCustomListening] = useState(false);
  const customRecRef = useRef<any>(null);

  useEffect(() => {
    apiGet(`/products/${productId}`).then((p) => {
      setProduct(p); setSelectedImage(p.image || null);
      if (userId) saveRecentProduct(userId, productId);
    }).catch((e) => setErr(e.message));
  }, [productId, userId]);

  function startCustomizationVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setToast('Voice input is not supported here — type your request instead.'); return; }
    const run = async () => {
      const ok = await requestVoicePermission();
      if (!ok) { setToast('Please allow microphone access for voice customization.'); return; }
      try {
        const rec = new SR(); rec.lang = 'hi-IN'; rec.interimResults = false; rec.continuous = false;
        rec.onstart = () => setCustomListening(true); rec.onend = () => setCustomListening(false);
        rec.onerror = () => { setCustomListening(false); setToast('I could not hear that. Please try again.'); };
        rec.onresult = (e:any) => { const heard=e.results?.[0]?.[0]?.transcript||''; if(heard) setCustomRequest(prev => (prev ? prev+' ' : '')+heard); };
        customRecRef.current=rec; rec.start();
      } catch (_) { setCustomListening(false); }
    }; run();
  }
  function stopCustomizationVoice(){ try{customRecRef.current?.stop()}catch(_){} setCustomListening(false); }

  if (err) return <div className="content"><ErrorBanner message={err} /><button className="btn secondary" onClick={back}>← Go back</button></div>;
  if (!product) return <div className="content"><div className="empty-note">Loading…</div></div>;

  const gallery = Array.isArray(product.gallery) && product.gallery.length ? product.gallery : [product.image];
  const mediaSrc = (img: string) => img ? (img.startsWith("http") || img.startsWith("data:") || img.startsWith("/") ? img : `/${img}`) : "";
  const delivery = 99, total = Number(product.price) + delivery, makerPct = 74;

  return <div className="product-page">
    <header className="product-topbar">
      <button className="product-back-btn product-back-primary" onClick={back} aria-label="Go back">‹ <span>Back</span></button>
      <div className="product-brand"><img src="/assets/logo.png" alt="KalaSutra" /><span>Handmade. Heartfelt. Home.</span></div>
      <div className="product-search"><Icon name="search" /><input placeholder="Search for handmade, artisans, home decor…" /></div>
      <nav><button onClick={() => go("buyerHome")}>Explore</button><button onClick={() => go("buyerReels")}>Artisans</button><button onClick={() => go("orders")}>Orders</button><button onClick={() => go("cart")}>Cart</button></nav>
    </header>
    <button className="mobile-floating-back" onClick={back}>‹ <span>Back</span></button>
    <main className="product-container">
      <div className="breadcrumb">Home　›　Home Decor　›　Lighting　›　{product.title}</div>
      <div className="product-main">
        <section className="product-gallery-main">
          <div className="product-thumbs">{gallery.slice(0,5).map((img:string,i:number)=><button key={img+i} className={selectedImage===img?"active":""} onClick={()=>setSelectedImage(img)}><img src={mediaSrc(img)} alt={`Craft ${i+1}`} /></button>)}</div>
          <div className="product-hero-image" style={{backgroundImage:`url(${selectedImage || product.image})`}}>
            <span className="photo-badge">🌿 Handcrafted</span><span className="eco-badge">◉ Eco-Friendly</span>
            <button className="gallery-arrow left" onClick={()=>setSelectedImage(gallery[Math.max(0,gallery.indexOf(selectedImage||gallery[0])-1)])}>‹</button>
            <button className="gallery-arrow right" onClick={()=>setSelectedImage(gallery[Math.min(gallery.length-1,gallery.indexOf(selectedImage||gallery[0])+1)])}>›</button>
            <span className="light-story">Light<br/>Stories<br/>from ♡<br/>Indian Hands ♡</span>
          </div>
          <div className="gallery-dots">{gallery.slice(0,5).map((_,i)=><i key={i} className={gallery[i]===selectedImage?"active":""}/>)}</div>
          <div className="story-card"><em>“Every weave tells a story of tradition, creativity and a brighter tomorrow.”</em><b>– {product.artisan?.name || "KalaSutra artisan"}</b><div className="story-benefits"><span>⌁<b>Eco-Friendly</b></span><span>♧<b>Empowers Artisans</b></span><span>♢<b>Adds Warmth</b></span></div></div>
        </section>
        <section className="product-info-panel">
          <div className="artisan-line"><div className="mini-artisan">🧵</div><div><b>{product.artisan?.name || "KalaSutra artisan"}</b><span>⌖ {product.artisan?.profile?.location || "India"}</span></div><span className="verified-pill">✓ Verified Artisan</span></div>
          <h1>{product.title}</h1><div className="rating-line"><strong>★★★★★</strong> <b>4.8</b> <span>(120 reviews)</span> <i>289 sold</i> <em>♥ Handmade with love</em></div>
          <p className="product-description">{product.description}</p>
          <div className="certificate-card large-certificate"><div className="qr-big"><img alt="Product QR" src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + '/?certificate=' + (product.uniqueProductId || product.id))}`} /></div><div><span className="field-label">DIGITAL PRODUCT ID</span><strong>{product.uniqueProductId || "KS-ART-000001"}</strong><small>✓ Verified identity linked to this handmade piece</small><button onClick={()=>setToast("Certificate story opened")}>◫ Scan to know the artisan’s story ›</button></div></div>
          <div className="customize-card product-custom-card"><div><span className="field-label">MAKE IT YOURS</span><strong>Customize this unique piece</strong><small>Personalize with a name, colour, size or small design change.</small></div><button className="customize-price" onClick={()=>setCustomOpen(v=>!v)}>Customize for ₹100 →</button>
            {customOpen && <div className="customize-form"><div className="custom-voice-row"><span>Tell us naturally in Hindi or English</span><button onClick={customListening?stopCustomizationVoice:startCustomizationVoice}>{customListening?'⏹ Stop speaking':'🎙 Speak request'}</button></div><textarea value={customRequest} onChange={e=>setCustomRequest(e.target.value)} placeholder="e.g. mera naam Rahul likh do aur colour blue kar do"/><button className="btn" disabled={customizing} onClick={async()=>{if(!customRequest.trim()){setToast("Please describe your customization");return;}setCustomizing(true);try{const c=await apiPost("/customizations",{productId:product.id,buyerId:userId,request:customRequest,charge:100});setCustomId(c.customizationId);setToast(`Customization ${c.customizationId} created • ₹100`);setCustomRequest("")}catch(e:any){setToast(e.message||"Customization failed")}finally{setCustomizing(false)}}}>{customizing?"Saving…":"Request customization • ₹100"}</button>{customId&&<small>✓ {customId}</small>}</div>}
          </div>
          <div className="feature-strip"><span>⌁<b>Sustainable<br/>Materials</b></span><span>♧<b>100%<br/>Handmade</b></span><span>▱<b>Supports<br/>Rural Artisans</b></span><span>♡<b>{makerPct}% Goes<br/>to the Maker</b></span></div>
          <div className="checkout-box product-checkout"><div className="checkout-row"><span>Product price</span><b>₹{Number(product.price).toLocaleString("en-IN")}</b></div><div className="checkout-row"><span>Delivery charge</span><b>₹{delivery}</b></div><div className="checkout-row total"><span>Final price</span><b>₹{total.toLocaleString("en-IN")}</b></div></div>
          <button className="product-add-btn" onClick={()=>{addToCart(product.id);setToast("Added to cart 🛍️")}}>🛒 Add to Cart</button>
          <div className="product-secondary-actions"><button>🎁 Buy as Gift</button><button onClick={()=>toggleWishlist(product.id)}>♡ Save for Later</button></div>
          <div className="report-link" onClick={()=>{if(!reported){setReported(true);setToast("Reported — our trust & safety team will review this listing")}}}>{reported?"✓ Reported — under review":"🚩 Report Product: Not Handmade"}</div>
        </section>
      </div>
      <section className="buyer-reviews"><span className="field-label">BUYER REVIEWS</span><h2>What buyers say</h2><div className="review-item"><strong>★★★★★　 Ananya</strong><p>Beautifully made and the craft story made the purchase feel personal.</p></div><div className="review-write"><div>★★★★★</div><textarea placeholder="Share your experience…"/><button onClick={()=>setToast("Review posted")}>Post review</button></div></section>
      <section className="you-may-like"><h2>You May Also Like</h2><div>{gallery.concat(gallery).slice(0,6).map((img:string,i:number)=><button key={i}><img src={mediaSrc(img)} alt=""/><span>♡</span></button>)}</div></section>
    </main>
  </div>;
}

// ---------------------------------------------------------------------------
// BUYER: WISHLIST
// ---------------------------------------------------------------------------
function WishlistScreen({ user, openProduct, toggleWishlist }: any) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { apiGet(`/wishlist?userId=${user.id}`).then(setItems); }, []);
  return (
    <>
      <div className="app-header"><div><h2>Wishlist</h2><div className="sub">{items.length} saved</div></div></div>
      <div className="content">
        {items.length === 0 ? <div className="empty-note">Nothing saved yet — tap the heart on any piece.</div> : (
          <div className="grid">
            {items.map((p) => (
              <div key={p.id} className="card" onClick={() => openProduct(p.id)}>
                <div className="thumb" style={{ backgroundImage: `url(${p.image})` }}>
                  <BadgeLabel status={p.verificationStatus} />
                  <span className="emoji">{CATEGORY_EMOJI[p.category] || "🎨"}</span>
                </div>
                <div className="info"><div className="t">{p.title}</div><div className="p">₹{p.price.toLocaleString("en-IN")}</div><div className="product-id-mini">{p.uniqueProductId || 'KS-ART-000001'}</div></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// BUYER: CART / CHECKOUT
// ---------------------------------------------------------------------------
function CartScreen({ user, go, setToast, refreshCartCount }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [method, setMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [orderType, setOrderType] = useState<'retail' | 'bulk'>('retail');
  const [bulkQty, setBulkQty] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState(user.contact || '');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  function fillSavedLocation() {
    const loc = savedLocation();
    if (loc) { setArea(loc.area || ''); setCity(loc.city || ''); setPincode(loc.pincode || ''); return true; }
    return false;
  }

  async function useMyLocation() {
    setLocationLoading(true); setLocationMessage('');
    try {
      if (!window.isSecureContext && !isLocalHost()) {
        window.location.href = securePhoneLocationUrl();
        return;
      }
      const loc = await requestCurrentLocation();
      setArea(loc.area || ''); setCity(loc.city || ''); setPincode(loc.pincode || '');
      setLocationMessage('✓ Location detected and address filled automatically');
    } catch (e: any) { setLocationMessage(e.message || 'Could not get location'); }
    finally { setLocationLoading(false); }
  }

  function openCheckout() {
    setError(null);
    const hasSaved = fillSavedLocation();
    setCheckoutOpen(true);
    window.history.pushState({ kalasutraCheckout: true }, '', window.location.href);
    if (!hasSaved) useMyLocation();
  }

  function closeCheckout() {
    if (window.history.state?.kalasutraCheckout) window.history.back();
    else setCheckoutOpen(false);
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
      const initial: Record<string, number> = {};
      next.forEach((i: any, index: number) => {
        initial[String(i.productId)] = i.qty + (index === 0 ? Math.max(0, 20 - i.qty) : 0);
      });
      setBulkQty(initial);
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function remove(productId: string) {
    await apiDelete('/cart', { userId: user.id, productId });
    load(); refreshCartCount();
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
      setError('Please fill phone, area, city and pincode'); return false;
    }
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) { setError('Please enter a valid 10-digit phone number'); return false; }
    if (!/^\d{6}$/.test(pincode.trim())) { setError('Please enter a valid 6-digit pincode'); return false; }
    return true;
  }

  function updateBulkQuantity(productId: string, delta: number) {
    setBulkQty(prev => {
      const current = Math.max(1, Number(prev[String(productId)] || 1));
      return { ...prev, [String(productId)]: Math.max(1, current + delta) };
    });
  }

  function chooseBulkTier(min: number) {
    if (!items.length) return;
    const firstId = String(items[0].productId);
    setBulkQty(prev => ({ ...prev, [firstId]: Math.max(min, Number(prev[firstId] || 1)) }));
  }

  function requestBulkOrder() {
    setError(null);
    if (!validateAddress()) return;
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
    if (!validateAddress()) return;
    setLoading(true); setError(null);
    try {
      await apiPost('/checkout/cod', { buyerId: user.id, address });
      setToast('COD order placed successfully 🎉');
      notifyUser('KalaSutra order confirmed', 'Your Cash on Delivery order has been placed successfully.');
      load(); refreshCartCount(); closeCheckout(); go('orders');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function payOnline() {
    if (!validateAddress()) return;
    setLoading(true); setError(null);
    try {
      const config = await apiGet('/payment/config');
      if (!config.configured) throw new Error('Razorpay is not configured on the server yet. Add your Razorpay API keys first.');
      const data = await apiPost('/payment/create-order', { buyerId: user.id });
      if (!window.Razorpay) throw new Error('Razorpay checkout could not load. Please check your internet connection.');
      const options: any = {
        key: data.keyId, amount: Math.round(data.amount * 100), currency: data.currency,
        name: 'KalaSutra', description: 'Handcrafted artisan products', order_id: data.orderId,
        prefill: { name: user.name, contact: phone },
        notes: { buyerId: String(user.id) },
        theme: { color: '#c93f78' },
        handler: async (response: any) => {
          try {
            setLoading(true);
            await apiPost('/payment/verify', { buyerId: user.id, address, ...response });
            setToast('Payment successful — order confirmed 🎉');
            notifyUser('KalaSutra payment successful', 'Your payment was verified and your order is confirmed.');
            load(); refreshCartCount(); closeCheckout(); go('orders');
          } catch (e) { setError(e.message); }
          finally { setLoading(false); }
        },
        modal: { ondismiss: () => setLoading(false) }
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => { setError(response?.error?.description || 'Payment failed. Please try again.'); setLoading(false); });
      rzp.open();
    } catch (e) { setError(e.message); setLoading(false); }
  }

  return (
    <>
      <div className="app-header"><div><h2>Your Cart</h2><div className="sub">{items.length} item(s)</div></div></div>
      <div className="content">
        {items.length === 0 ? <div className="empty-note">Your cart is empty.</div> : (
          <>
            {items.map((i) => (
              <div className="order-item" key={i.productId}>
                <div><strong style={{ fontSize: 12.5 }}>{i.product?.title} × {i.qty}</strong><div style={{ fontSize: 11, color: '#6b6055' }}>₹{i.product?.price.toLocaleString('en-IN')}</div></div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--madder)', cursor: 'pointer' }} onClick={() => remove(i.productId)}>Remove</span>
              </div>
            ))}
            <div className="checkout-row total" style={{ margin: '16px 0' }}><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
            <button className="btn" onClick={openCheckout}>Continue to payment</button>
          </>
        )}
      </div>

      {checkoutOpen && <div className="payment-overlay">
        <div className="payment-sheet bulk-checkout-sheet">
          <div className="payment-topbar">
            <button onClick={closeCheckout} aria-label="Back">‹</button>
            <div><small>SECURE CHECKOUT</small><h2>Delivery and payment</h2></div>
            <button onClick={closeCheckout} aria-label="Close">×</button>
          </div>

          <div className="payment-body">
            <div className="payment-section-title">Delivery details</div>
            <div className="payment-field"><span>☎</span><input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="10-digit mobile number" /></div>
            <div className="payment-field"><span>⌂</span><input value={area} onChange={e => setArea(e.target.value)} placeholder="Area / locality" /></div>
            <div className="payment-field"><span>⌖</span><input value={city} onChange={e => setCity(e.target.value)} placeholder="City" /></div>
            <div className="payment-field"><span>➤</span><input value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6-digit pincode" /></div>
            <button className="location-fill-btn" onClick={useMyLocation} disabled={locationLoading}>⌖ {locationLoading ? 'Detecting your location…' : 'Use my current location & auto-fill'}</button>
            {locationMessage && <div className="location-fill-note">{locationMessage}</div>}

            <div className="bulk-order-card">
              <div className="bulk-order-head">
                <div className="bulk-order-icon">▦</div>
                <div>
                  <div className="bulk-order-kicker">ORDER TYPE</div>
                  <h3>How do you want to order?</h3>
                  <p>For shops, studios, hotels and larger craft collections.</p>
                </div>
              </div>
              <div className="bulk-order-tabs">
                <button className={orderType === 'retail' ? 'active' : ''} onClick={() => setOrderType('retail')}>
                  <span>Retail</span><small>Regular purchase</small>
                </button>
                <button className={orderType === 'bulk' ? 'active' : ''} onClick={() => setOrderType('bulk')}>
                  <span>Bulk / B2B</span><small>20+ pieces</small>
                </button>
              </div>

              {orderType === 'bulk' ? (
                <div className="bulk-order-panel">
                  <div className="bulk-benefit-row">
                    <span>🧵 Direct artisan sourcing</span>
                    <span>📦 Volume pricing</span>
                  </div>
                  <div className="bulk-tier-row">
                    <button onClick={() => chooseBulkTier(20)} className={bulkTotalQty >= 20 ? 'chosen' : ''}><b>20+</b><small>10% off</small></button>
                    <button onClick={() => chooseBulkTier(50)} className={bulkTotalQty >= 50 ? 'chosen' : ''}><b>50+</b><small>15% off</small></button>
                    <button onClick={() => chooseBulkTier(100)} className={bulkTotalQty >= 100 ? 'chosen' : ''}><b>100+</b><small>20% off</small></button>
                  </div>

                  <div className="bulk-items-list">
                    {items.map(i => {
                      const q = Math.max(1, Number(bulkQty[String(i.productId)] || i.qty || 1));
                      return <div className="bulk-item-row" key={`bulk-${i.productId}`}>
                        <div><strong>{i.product?.title}</strong><small>₹{Number(i.product?.price || 0).toLocaleString('en-IN')} / piece</small></div>
                        <div className="bulk-qty-control">
                          <button onClick={() => updateBulkQuantity(i.productId, -1)} aria-label="Decrease quantity">−</button>
                          <b>{q}</b>
                          <button onClick={() => updateBulkQuantity(i.productId, 1)} aria-label="Increase quantity">+</button>
                        </div>
                      </div>;
                    })}
                  </div>

                  <div className="bulk-price-box">
                    <div><span>Total pieces</span><strong>{bulkTotalQty}</strong></div>
                    <div><span>Volume discount</span><strong>{Math.round(bulkDiscountRate * 100)}%</strong></div>
                    <div className="bulk-final-price"><span>Estimated total</span><strong>₹{bulkTotal.toLocaleString('en-IN')}</strong></div>
                    <small>Approx. ₹{bulkUnitAverage.toLocaleString('en-IN')} per piece after volume discount.</small>
                  </div>
                  <div className="bulk-note">Bulk requests are reviewed with the artisan so larger orders can be confirmed at a fair, direct-to-maker price.</div>
                </div>
              ) : (
                <div className="bulk-retail-note">Regular checkout for individual purchases. Switch to <b>Bulk / B2B</b> when you need 20+ pieces.</div>
              )}
            </div>

            {orderType === 'retail' && <>
              <div className="payment-section-title payment-method-title">Payment method</div>
              <button className={`payment-method-card ${method === 'razorpay' ? 'selected' : ''}`} onClick={() => setMethod('razorpay')}>
                <span className="payment-method-icon">▣</span><span><strong>Razorpay secure payment</strong><small>Google Pay, PhonePe, UPI, cards and netbanking</small></span><i>{method === 'razorpay' ? '●' : '○'}</i>
              </button>
              <button className={`payment-method-card ${method === 'cod' ? 'selected' : ''}`} onClick={() => setMethod('cod')}>
                <span className="payment-method-icon">▤</span><span><strong>Cash on delivery</strong><small>Pay when your order arrives</small></span><i>{method === 'cod' ? '●' : '○'}</i>
              </button>
              <div className="payment-trust">✓ {method === 'razorpay' ? 'Payment is completed on Razorpay and verified before your order is created.' : 'Your order is confirmed now. Pay in cash when the artisan order arrives.'}</div>
            </>}

            {error && <div className="payment-error">{error}</div>}

            {orderType === 'bulk' ? (
              <div className="payment-summary bulk-summary">
                <span><small>{bulkTotalQty} pieces • {Math.round(bulkDiscountRate * 100)}% volume discount</small><strong>₹{bulkTotal.toLocaleString('en-IN')}</strong></span>
                <button onClick={requestBulkOrder} disabled={loading || bulkTotalQty < 20}>
                  {loading ? 'Saving…' : `Request bulk order • ${bulkTotalQty} pieces`}
                </button>
              </div>
            ) : (
              <div className="payment-summary">
                <span><small>{retailQty} items</small><strong>₹{total.toLocaleString('en-IN')}</strong></span>
                <button onClick={method === 'razorpay' ? payOnline : placeCOD} disabled={loading}>{loading ? 'Processing…' : method === 'razorpay' ? `Pay ₹${total.toLocaleString('en-IN')} securely` : `Place COD order • ₹${total.toLocaleString('en-IN')}`}</button>
              </div>
            )}
          </div>
        </div>
      </div>}
    </>
  );
}

// ---------------------------------------------------------------------------
// ORDERS (shared shape, buyer-focused)
// ---------------------------------------------------------------------------
function SafetyReviewScreen({ go, setToast }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() { setLoading(true); try { setItems(await apiGet('/reviews')); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  async function decide(id: string, status: string) {
    await apiPut(`/reviews/${id}`, { status, note: status === 'approved' ? 'Human reviewer approved after checking evidence.' : 'Human reviewer rejected after checking evidence.' });
    setToast(status === 'approved' ? 'Listing approved by human review.' : 'Listing rejected by human review.'); load();
  }
  return <div className="content">
    <div className="app-header"><button className="header-back" onClick={() => go('dashboard')}>‹</button><div><h2>Safety &amp; Review Center</h2><div className="sub">AI flags suspicious activity — humans decide</div></div></div>
    <div className="trust-box" style={{marginBottom:14}}><strong>AI Risk Protection</strong><small style={{display:'block',marginTop:5}}>Risk signals include missing proof, duplicate images and suspicious listing patterns. AI never makes the final decision.</small></div>
    {loading ? <div className="empty-note">Loading review queue…</div> : items.length === 0 ? <div className="empty-note">🟢 No suspicious listings waiting for review.</div> : items.map((r:any) => <div className="card" key={r.id} style={{marginBottom:12}}>
      <div className="thumb" style={{backgroundImage:`url(${r.product?.image || ''})`}}></div><div className="info"><div className="t">{r.product?.title || 'Unknown listing'}</div><div className="p">AI Risk Score: {r.riskScore}/100</div><div style={{fontSize:11,color:'#8a2f25',marginTop:5}}>{r.reason}</div><div className="btn-row" style={{marginTop:10}}><button className="btn green" onClick={()=>decide(r.id,'approved')}>Human Approve</button><button className="btn secondary" onClick={()=>decide(r.id,'rejected')}>Reject</button></div></div>
    </div>)}
  </div>;
}

function OrdersScreen({ user, go }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  useEffect(() => { apiGet(`/orders?userId=${user.id}`).then(setOrders); }, [user.id]);
  const isArtisan = user.role === 'artisan';
  const statusLabel: any = { placed: 'New Orders', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', paid: 'New Orders' };
  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
  const earnings = isArtisan ? orders.reduce((sum, o) => sum + (o.artisanItems || []).reduce((s:any, p:any) => s + Number(p.price || 0) * Number(p.qty || 0), 0), 0) : 0;
  return (<>
    <div className="app-header"><button className="header-back" onClick={() => go ? go(isArtisan ? 'dashboard' : 'buyerHome') : null} aria-label="Back">‹</button><div><h2>{isArtisan ? 'Orders & Earnings' : 'Your Orders'}</h2><div className="sub">{isArtisan ? 'Manage your artisan business' : 'Track your purchases'}</div></div></div>
    <div className="content">
      {isArtisan && <div className="artisan-order-summary">
        <div><small>EARNINGS</small><strong>₹{earnings.toLocaleString('en-IN')}</strong></div>
        <div><small>NEW ORDERS</small><strong>{orders.filter(o => ['placed','paid'].includes(o.status)).length}</strong></div>
        <div><small>DELIVERED</small><strong>{orders.filter(o => o.status === 'delivered').length}</strong></div>
      </div>}
      {isArtisan && <div className="order-filter-row">
        {[['all','All'],['placed','New Orders'],['processing','Processing'],['shipped','Shipped'],['delivered','Delivered']].map(([v,l]) => <button key={v} className={statusFilter===v?'active':''} onClick={()=>setStatusFilter(v)}>{l}</button>)}
      </div>}
      {filtered.length === 0 ? <div className="empty-note">{isArtisan ? 'No artisan orders yet. Orders will appear here when buyers purchase your products.' : 'No orders yet.'}</div> : filtered.map((o) => (
        <div className="order-item" key={o.id}>
          <div><strong style={{ fontSize: 12.5 }}>{(isArtisan ? o.artisanItems : o.products).map((p: any) => p.title).join(', ')}</strong>
          <div style={{ fontSize: 11, color: '#6b6055' }}>₹{Number(isArtisan ? (o.artisanItems || []).reduce((s:any,p:any)=>s+p.price*p.qty,0) : o.amount).toLocaleString('en-IN')} · {new Date(o.date).toLocaleDateString()}</div></div>
          <span className="st">{isArtisan ? (statusLabel[o.status] || o.status) : o.status}</span>
        </div>
      ))}
    </div>
  </>);
}

// ---------------------------------------------------------------------------
// BUYER: PROFILE
// ---------------------------------------------------------------------------
function BuyerProfileScreen({ user, onLogout, go, openProduct }: any) {
  const profile = user.profile || {};
  const [editing, setEditing] = useState(false);
  const [city, setCity] = useState(profile.location || "");
  const [saved, setSaved] = useState(false);
  const [avatar, setAvatar] = useState(() => localStorage.getItem(`kalasutra_avatar_${user.id}`) || profile.avatar || "/assets/avatar-artisan.png");
  const [products, setProducts] = useState<any[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const recentKey = `kalasutra_recent_products_${user.id}`;

  async function handleAvatarPick(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { const data = await fileToDataURL(file); setAvatar(data); localStorage.setItem(`kalasutra_avatar_${user.id}`, data); } catch (_) {}
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

  return (
    <div className="profile-page buyer-profile-page">
      <header className="profile-topbar profile-topbar-with-back">
        <button className="profile-back-btn" onClick={() => go("buyerHome")} aria-label="Back">‹</button>
        <button className="profile-logo-button" onClick={() => go("buyerHome")} aria-label="Go home"><img src="/assets/logo.png" className="profile-logo" alt="KalaSutra" /></button>
        <div className="profile-top-actions">
          <button onClick={() => go("buyerHome")} aria-label="Explore"><Icon name="search" /></button>
          <button onClick={() => go("orders")} aria-label="Orders"><Icon name="bell" /><span className="notification-dot" /></button>
          <button onClick={() => setEditing(v => !v)} aria-label="Settings">⚙</button>
          <span className="profile-top-slogan">Good Choices<br/>Create Greater Impact ♡</span>
        </div>
      </header>

      <main className="profile-container">
        <section className="profile-hero buyer-hero">
          <div className="profile-avatar-wrap buyer-avatar-wrap">
            <img src={avatar} className="profile-avatar buyer-avatar" alt="Buyer profile" />
            <input id="buyerAvatarInput" className="avatar-file-input" type="file" accept="image/*" capture="user" onChange={handleAvatarPick} />
            <label htmlFor="buyerAvatarInput" className="avatar-camera" title="Upload profile photo">⌾</label>
          </div>
          <div className="profile-identity">
            <h1>{user.name}</h1><h3>🌿 Conscious buyer</h3>
            <p className="profile-quote">“Supporting artisans, preserving traditions<br/>and bringing handmade stories home.”</p>
            <div className="buyer-meta"><span>⌖ {city || "India"}</span><span>◎ Exploring global crafts</span><span>♥ Handmade · Sustainable · Meaningful</span></div>
          </div>
          <div className="profile-hero-art buyer-art"><div className="handmade-script">More<br/>Handmade<br/>A Kinder World ♡</div><div className="hero-temple-art" /></div>
          <button className="profile-edit-btn" onClick={() => setEditing(v => !v)}>✎ {editing ? "Close" : "Edit Profile"}</button>
        </section>

        {editing && (
          <section className="profile-edit-panel">
            <label>Delivery location<input value={city} onChange={e => setCity(e.target.value)} placeholder="City / locality" /></label>
            <button className="profile-primary-btn" onClick={saveBuyer}>Save buyer profile</button>
          </section>
        )}

        <LocationTools mode="buyer" initial={city} />

        <section className="buyer-stat-layout">
          <div className="profile-stat-grid buyer-stats">
            <button onClick={() => go("orders")}><b>12</b><span>Orders Placed</span></button><button onClick={() => go("wishlist")}><b>28</b><span>Items Liked</span></button><button onClick={() => go("buyerReels")}><b>46</b><span>Artisans Followed</span></button><div><b>4.8</b><span>Average Rating</span></div>
          </div>
          <button className="conscious-card conscious-card-button" onClick={() => go("buyerReels")}><span>🌿</span><div><strong>Conscious Buyer</strong><small>You support traditional artisans<br/>and sustainable crafts.</small></div><b>›</b></button>
        </section>

        <div className="buyer-impact-grid">
          <section>
            <div className="quick-heading"><h2>Quick Actions</h2><span>Shop<br/>Support<br/>Empower ♡</span></div>
            <div className="quick-actions buyer-quick-actions">
              <button onClick={() => go("orders")}><span>▣</span><b>My Orders</b></button>
              <button onClick={() => go("wishlist")}><span>♥</span><b>My Wishlist</b></button>
              <button onClick={() => go("buyerReels")}><span>♟</span><b>Saved Artisans</b></button>
              <button onClick={() => { setEditing(true); window.scrollTo({top: 0, behavior: "smooth"}); }}><span>⌖</span><b>Addresses</b></button>
            </div>
          </section>
          <section className="your-impact-card"><span className="impact-leaf">🌿</span><div><h3>Your Impact</h3><p>Every purchase empowers an artisan.</p></div><div className="impact-numbers"><span><b>12</b><small>Artisans Supported</small></span><span><b>28</b><small>Handmade Pieces</small></span><span><b>3</b><small>Regions Explored</small></span></div></section>
        </div>

        <section className="recently-viewed">
          <div className="section-row"><h2>Recently Viewed</h2><button className="text-link-btn" onClick={() => go("buyerHome")}>Explore →</button></div>
          {recent.length ? <div className="recent-grid">
            {recent.map((p:any) => <button className="recent-real-card" key={p.id} onClick={() => openProduct(p.id)}><div className="recent-img real-recent-img" style={{backgroundImage:`url(${p.image})`}} /><b>{p.title}</b><strong>₹{Number(p.price||0).toLocaleString("en-IN")}</strong></button>)}
          </div> : <div className="recent-empty">Open a product from Explore and it will appear here automatically.</div>}
        </section>
        <div className="quick-banner buyer-banner"><div><em>Handmade<br/>Stories<br/>Better Tomorrows ♡</em><button onClick={() => go("buyerHome")}>Explore More →</button></div></div>
        <button className="logout-wide" onClick={onLogout}>Log out</button>
        {saved && <div className="saved-note">✓ Buyer profile saved</div>}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BUYER: REELS FEED
// ---------------------------------------------------------------------------
function ReelsFeedScreen({ openProduct, setToast }: any) {
 const [reels,setReels]=useState<any[]>([]),[liked,setLiked]=useState<Record<string,boolean>>({}),[saved,setSaved]=useState<Record<string,boolean>>({}),[counts,setCounts]=useState<Record<string,number>>({}),[comments,setComments]=useState<Record<string,string[]>>({}),[commentOpen,setCommentOpen]=useState<string|null>(null),[commentText,setCommentText]=useState("");
 useEffect(()=>{apiGet(`/reels`).then(data=>{setReels(data);try{const l=JSON.parse(localStorage.getItem("kalasutra_reel_likes")||"{}"),s=JSON.parse(localStorage.getItem("kalasutra_reel_saves")||"{}"),c=JSON.parse(localStorage.getItem("kalasutra_reel_comments")||"{}"),n:any={};data.forEach((r:any)=>n[String(r.id)]=Number(r.likes||0));Object.keys(l).forEach(id=>{if(l[id])n[id]=(n[id]||0)+1});setLiked(l);setSaved(s);setComments(c);setCounts(n)}catch(_){}}).catch(()=>setReels([]))},[]);
 const like=(id:string)=>{const k=String(id),v=!liked[k],l={...liked,[k]:v},n={...counts,[k]:Math.max(0,(counts[k]||0)+(v?1:-1))};setLiked(l);setCounts(n);localStorage.setItem("kalasutra_reel_likes",JSON.stringify(l));setToast(v?"Liked ❤️":"Like removed")};
 const save=(id:string)=>{const k=String(id),v=!saved[k],s={...saved,[k]:v};setSaved(s);localStorage.setItem("kalasutra_reel_saves",JSON.stringify(s));setToast(v?"Reel saved 🔖":"Removed from saved")};
 async function share(r:any){const url=window.location.href.split("#")[0]+`?reel=${encodeURIComponent(r.id)}`;try{if(navigator.share)await navigator.share({title:"KalaSutra Maker Reel",text:r.caption||"See this handmade craft story on KalaSutra",url});else{await navigator.clipboard.writeText(url);setToast("Reel link copied ↗")}}catch(_){}}
 const comment=(id:string)=>{const v=commentText.trim();if(!v)return;const k=String(id),next=[...(comments[k]||[]),v],all={...comments,[k]:next};setComments(all);setCommentText("");localStorage.setItem("kalasutra_reel_comments",JSON.stringify(all));setToast("Comment added 💬")};
 return <div className="reels-wrap">{reels.length===0&&<div className="empty-note" style={{paddingTop:100}}>No Reels yet — check back soon.</div>}{reels.map(r=>{const k=String(r.id),list=comments[k]||[],num=counts[k]??Number(r.likes||0);return <div className="reel" key={r.id}>{r.video?<video src={r.video} className="reel-visual" style={{objectFit:"cover",fontSize:0}} autoPlay loop muted playsInline/>:<div className="reel-visual" style={{background:"#8a5a3a"}}>{r.thumbEmoji}</div>}<div className="reel-gradient"/><div className="reel-overlay"><div className="reel-info"><strong>@{r.artisan?.name?.toLowerCase().replace(/\s+/g,".")||"artisan"}</strong><span>{r.caption}</span>{r.product&&<div><span className="badge-inline" style={{background:"#e2f0e4",color:"var(--green)"}}><BadgeLabel status={r.product.verificationStatus}/></span><div className="view-btn" onClick={()=>openProduct(r.product.id)}>🛍️ View Product</div></div>}</div><div className="reel-actions"><button className={`act ${liked[k]?"active":""}`} onClick={()=>like(k)}><span className="ic">{liked[k]?"❤️":"♡"}</span>{num}</button><button className={`act ${commentOpen===k?"active":""}`} onClick={()=>setCommentOpen(commentOpen===k?null:k)}><span className="ic">💬</span>{Number(r.comments||0)+list.length}</button><button className={`act ${saved[k]?"active":""}`} onClick={()=>save(k)}><span className="ic">{saved[k]?"🔖":"◇"}</span>{saved[k]?"Saved":"Save"}</button><button className="act" onClick={()=>share(r)}><span className="ic">↗</span>Share</button></div>{commentOpen===k&&<div className="reel-comments-sheet"><div className="reel-comments-title"><strong>Comments</strong><button onClick={()=>setCommentOpen(null)}>×</button></div><div className="reel-comments-list">{list.length===0?<small>No comments yet. Start the conversation.</small>:list.map((x,i)=><div key={i}><b>You</b><span>{x}</span></div>)}</div><div className="reel-comment-input"><input value={commentText} onChange={e=>setCommentText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")comment(k)}} placeholder="Write a comment…"/><button onClick={()=>comment(k)}>Post</button></div></div>}</div></div>})}</div>;
}
// ---------------------------------------------------------------------------
// DIGITAL PRODUCT CERTIFICATE — public QR destination
// ---------------------------------------------------------------------------
function CertificateScreen({ certificateId }: { certificateId: string }) {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { apiGet(`/certificate/${encodeURIComponent(certificateId)}`).then(setData).catch((e) => setErr(e.message)); }, [certificateId]);
  if (err) return <div className="certificate-public"><img src="/assets/logo.png" className="certificate-public-logo"/><div className="certificate-public-card"><h2>Certificate unavailable</h2><p>{err}</p></div></div>;
  if (!data) return <div className="certificate-public"><img src="/assets/logo.png" className="certificate-public-logo"/><div className="certificate-public-card"><p>Loading verified product record…</p></div></div>;
  const p = data.product; const verified = p.verificationStatus === 'verified';
  return <div className="certificate-public">
    <img src="/assets/logo.png" className="certificate-public-logo"/>
    <div className="certificate-public-card">
      <div className="certificate-public-kicker">KALASUTRA DIGITAL PRODUCT CERTIFICATE</div>
      <div className="certificate-public-id">{p.uniqueProductId}</div>
      <div className={`certificate-public-status ${verified ? 'verified' : 'review'}`}>{verified ? '🟢 VERIFIED HANDMADE' : p.verificationStatus === 'rejected' ? '🔴 VERIFICATION REVOKED' : '🟡 UNDER REVIEW'}</div>
      {p.image && <img className="certificate-public-image" src={p.image} alt={p.title}/>}
      <h1>{p.title}</h1>
      <p>{p.description}</p>
      <div className="certificate-public-grid">
        <div><small>ARTISAN</small><strong>{p.artisan?.name || 'Verified artisan'}</strong></div>
        <div><small>CRAFT</small><strong>{p.category}</strong></div>
        <div><small>TRUST SCORE</small><strong>{p.trustScore || '—'}/100</strong></div>
        <div><small>VERIFICATION DATE</small><strong>{p.verificationDate ? new Date(p.verificationDate).toLocaleDateString('en-IN') : '—'}</strong></div>
      </div>
      <div className="certificate-public-proof"><strong>Making proof</strong><span>🎥 Mandatory making-process proof supplied</span><span>🔍 Originality &amp; image checks recorded</span><span>🧑‍🎨 Artisan ownership declaration recorded</span></div>
      {p.customizations?.length > 0 && <div className="certificate-public-proof"><strong>Customization history</strong>{p.customizations.slice(0,5).map((c:any)=><span key={c.id}>#{c.customizationId} · {c.request}</span>)}</div>}
      <p className="certificate-public-note">This QR is a gateway to KalaSutra’s digital product record. Verification is an AI-assisted trust signal and not a legal copyright determination.</p>
    </div>
  </div>;
}

// ---------------------------------------------------------------------------
// ROOT APP — simple state-based router (no react-router dependency needed)
// ---------------------------------------------------------------------------
function App() {
  const certificateId = new URLSearchParams(window.location.search).get('certificate');
  if (certificateId) return <CertificateScreen certificateId={certificateId} />;
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
  const [user, setUser] = useState<any>(null);
  const [pendingName, setPendingName] = useState("");
  const [pendingRole, setPendingRole] = useState("buyer");
  const [screen, setScreen] = useState("dashboard");
  const [toast, setToastState] = useState<string | null>(null);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [screenStack, setScreenStack] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [lastVerifiedProductId, setLastVerifiedProductId] = useState<string | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);

  useEffect(() => {
    if (phase === 'app' && localStorage.getItem('kalasutra_permission_seen') !== '1') setShowPermissions(true);
  }, [phase]);

  function closePermissions() {
    localStorage.setItem('kalasutra_permission_seen', '1');
    setShowPermissions(false);
  }

  function setToast(msg: string) {
    setToastState(msg);
    setTimeout(() => setToastState(null), 2200);
  }

  function refreshWishlist(userId: string) {
    apiGet(`/wishlist?userId=${userId}`).then((items) => setWishlist(items.map((p: any) => p.id)));
  }
  function refreshCartCount(userId?: string) {
    const uid = userId || user?.id;
    if (!uid) return;
    apiGet(`/cart?userId=${uid}`).then((items) => setCartCount(items.reduce((s: number, i: any) => s + i.qty, 0)));
  }

  async function toggleWishlist(productId: string) {
    if (!user) return;
    if (wishlist.includes(productId)) {
      await apiDelete("/wishlist", { userId: user.id, productId });
    } else {
      await apiPost("/wishlist", { userId: user.id, productId });
    }
    refreshWishlist(user.id);
  }
  async function addToCart(productId: string) {
    if (!user) return;
    await apiPost("/cart", { userId: user.id, productId });
    refreshCartCount(user.id);
  }

  async function handleLoggedIn(contact: string, name: string) {
    setPendingName(name);
    setPhase("role");
  }
  async function handleRolePick(role: string) {
    try {
      const created = await apiPost("/users", { name: pendingName, contact: "demo", role });
      setUser(created);
      setPendingRole(role);
      setPhase("app");
      setScreen(role === "artisan" ? "dashboard" : "buyerHome");
      if (role === "buyer") { refreshWishlist(created.id); refreshCartCount(created.id); }
    } catch (e: any) {
      setToast("Couldn't log in: " + e.message);
    }
  }
  function logout() {
    setUser(null); setPhase("splash"); setScreen("dashboard");
  }

  function go(nextScreen: string) {
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
  function openProduct(id: string) {
    if (user?.id) saveRecentProduct(user.id, id);
    setActiveProductId(id);
    go("productDetail");
  }
  function switchRole() {
    const newRole = user.role === "artisan" ? "buyer" : "artisan";
    apiPost("/users", { name: user.name, contact: "demo", role: newRole }).then((u) => {
      setUser(u);
      setScreen(newRole === "artisan" ? "dashboard" : "buyerHome");
      if (newRole === "buyer") { refreshWishlist(u.id); refreshCartCount(u.id); }
    });
  }

  if (phase === "splash") return <div className="app-shell"><SplashScreen onNext={() => setPhase("login")} /><Toast message={toast} /></div>;
  if (phase === "login") return <div className="app-shell"><LoginScreen onLoggedIn={handleLoggedIn} /><Toast message={toast} /></div>;
  if (phase === "role") return <div className="app-shell"><RoleSelectScreen name={pendingName} onPick={handleRolePick} /><Toast message={toast} /></div>;

  // ----- logged in app -----
  const isArtisan = user.role === "artisan";
  const navBar = isArtisan
    ? ["dashboard", "addProduct", "myReels", "orders", "profile"].includes(screen) && <ArtisanNav screen={screen} go={setScreen} />
    : ["buyerHome", "buyerReels", "cart", "orders", "buyerProfile"].includes(screen) && <BuyerNav screen={screen} go={setScreen} cartCount={cartCount} />;

  return (
    <div className={`app-shell screen-${screen}`}>
      {isArtisan && screen === "dashboard" && (
        <>
          <ArtisanDashboard user={user} go={go} setToast={setToast} />
          <button className="fab" onClick={() => go("addProduct")}>＋</button>
        </>
      )}
      {isArtisan && screen === "addProduct" && (
        <AddProductScreen user={user} go={(s: string) => { if (s === "createReel") { go("createReel"); } else { setScreen(s); } }} setToast={setToast} setLastVerifiedProductId={setLastVerifiedProductId} />
      )}
      {isArtisan && screen === "myProducts" && <MyProductsScreen user={user} go={setScreen} />}
      {isArtisan && screen === "createReel" && <CreateReelScreen user={user} go={setScreen} setToast={setToast} prefillProductId={lastVerifiedProductId} />}
      {isArtisan && screen === "myReels" && <MyReelsScreen user={user} go={setScreen} setToast={setToast} />}
      {isArtisan && screen === "orders" && <OrdersScreen user={user} go={setScreen} />}
      {isArtisan && screen === "reviews" && <SafetyReviewScreen go={setScreen} setToast={setToast} />}
      {isArtisan && screen === "profile" && <ArtisanProfileScreen user={user} onLogout={logout} go={setScreen} />}

      {!isArtisan && screen === "buyerHome" && <BuyerHomeScreen user={user} go={setScreen} openProduct={openProduct} wishlist={wishlist} toggleWishlist={toggleWishlist} cartCount={cartCount} addToCart={addToCart} setToast={setToast} />}
      {!isArtisan && screen === "buyerReels" && <ReelsFeedScreen openProduct={openProduct} setToast={setToast} />}
      {!isArtisan && screen === "wishlist" && <WishlistScreen user={user} openProduct={openProduct} toggleWishlist={toggleWishlist} />}
      {!isArtisan && screen === "cart" && <CartScreen user={user} go={setScreen} setToast={setToast} refreshCartCount={() => refreshCartCount(user.id)} />}
      {!isArtisan && screen === "orders" && <OrdersScreen user={user} go={setScreen} />}
      {!isArtisan && screen === "buyerProfile" && <BuyerProfileScreen user={user} onLogout={logout} go={setScreen} openProduct={openProduct} />}
      {screen === "productDetail" && (
        <ProductDetailScreen productId={activeProductId} go={setScreen} back={goBack} setToast={setToast} wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} userId={user.id} />
      )}

      {navBar}
      {!(isArtisan && screen === "dashboard") && <AITalker compact role={isArtisan ? "artisan" : "buyer"} go={setScreen} />}
      {!(isArtisan && screen === "dashboard") && <div className={`mode-switch-wrap ${screen === 'profile' || screen === 'buyerProfile' ? 'profile-mode-switch' : ''}`}>
        <button className="mode-pill" onClick={switchRole}>⇄ Switch to {isArtisan ? "Buyer" : "Artisan"}</button>
      </div>}
      <Toast message={toast} />
      {showPermissions && <PermissionCenter onClose={closePermissions} />}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
