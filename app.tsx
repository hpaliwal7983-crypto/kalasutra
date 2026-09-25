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
    mic: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3m-4 0h8"/></svg>,
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
  const [step, setStepState] = useState("form"); // form -> proof -> scanning -> result
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [englishDescription, setEnglishDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Pottery");
  const [material, setMaterial] = useState("");
  const [region, setRegion] = useState("");
  const [storyLang, setStoryLang] = useState("hi-IN");
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
    const file = e.target.files[0];
    if (!file) return;
    try { setImageDataUrl(await fileToDataURL(file)); } catch { setErr("Couldn't read that image — please try another file."); }
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
          } catch (_) {}
        }
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
        category, image: imageDataUrl, craftInfo: { material, region, storyLanguage: storyLang, originalStory: story, verificationProof: proofVideo },
      });
      setProduct(created); setStepState("scanning");
      await new Promise((r) => setTimeout(r, 900));
      const result = await apiPost("/scan", { productId: created.id });
      const safety = await apiPost("/risk", { productId: created.id });
      result.riskScore = safety.riskScore; result.riskLevel = safety.level; result.riskReasons = safety.reasons;
      setVerifyResult(result);
      await new Promise((r) => setTimeout(r, 700));
      setStepState("result"); setLastVerifiedProductId(created.id);
    } catch (e: any) { setErr(e.message || "Verification failed."); }
  }

  useEffect(() => () => { try { storyRecognitionRef.current?.stop(); } catch (_) {} proofStreamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  return (<>
    <div className="app-header add-piece-header"><button className="header-back" aria-label="Back to Home" onClick={() => go("dashboard")}>‹</button><div><h2>Add a piece</h2><div className="sub">Photo → Voice Story → Proof → Verify</div></div></div>
    <div className="content"><ErrorBanner message={err} />
      {step === "form" && <>
        <div className="scan-box" style={{ marginBottom: 14, position: "relative" }} onClick={() => (document.getElementById("prodImgInput") as HTMLInputElement)?.click()}>
          {imageDataUrl ? <img src={imageDataUrl} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} /> : <><div style={{fontSize:36}}>📷</div><div style={{fontSize:12.5,fontWeight:700}}>Tap to take/upload a photo</div><div style={{fontSize:10.5,color:"#6b6055"}}>Your piece becomes the starting point</div></>}
        </div>
        <input id="prodImgInput" type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleImagePick}/>
        <div className="voice-story-card">
          <div className="field-label">YOUR STORY • VOICE FIRST</div>
          <div style={{fontWeight:700,fontSize:13}}>Tell us about your craft</div>
          <div style={{fontSize:10.5,color:"#6b6055",margin:"4px 0 9px"}}>Speak in your language — AI prepares the English buyer description.</div>
          <div style={{display:"flex",gap:7,alignItems:"center"}}>
            <select value={storyLang} onChange={(e)=>setStoryLang(e.target.value)} style={{flex:1}}><option value="hi-IN">Hindi</option><option value="mr-IN">Marathi</option><option value="ta-IN">Tamil</option><option value="bn-IN">Bangla</option><option value="en-IN">English</option></select>
            <button className={`story-mic ${storyRecording ? "recording" : ""}`} onClick={storyRecording ? stopStoryRecording : startStoryRecording}>{storyRecording ? "■ Stop" : "🎙 Start"}</button>
          </div>
          {story && <div className="story-transcript"><b>Heard:</b> {story}</div>}
          {englishDescription && <div className="ai-draft"><b>AI English draft:</b> {englishDescription}</div>}
        </div>
        <div className="field"><div className="field-label">Product name <span style={{fontWeight:400}}>(optional — AI can draft it)</span></div><input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Leave blank to let AI draft a title"/></div>
        <div style={{display:"flex",gap:10}}><div className="field" style={{flex:1}}><div className="field-label">Price (₹) • YOUR PRICE</div><input value={price} onChange={(e)=>setPrice(e.target.value.replace(/[^0-9.]/g,""))} placeholder="2000" inputMode="decimal"/></div><div className="field" style={{flex:1}}><div className="field-label">Category</div><select value={category} onChange={(e)=>setCategory(e.target.value)}>{Object.keys(CATEGORY_EMOJI).map(c=><option key={c}>{c}</option>)}</select></div></div>
        <div style={{display:"flex",gap:10}}><div className="field" style={{flex:1}}><div className="field-label">Material</div><input value={material} onChange={(e)=>setMaterial(e.target.value)} placeholder="e.g. Terracotta clay"/></div><div className="field" style={{flex:1}}><div className="field-label">Region</div><input value={region} onChange={(e)=>setRegion(e.target.value)} placeholder="e.g. Rajasthan"/></div></div>
        <div className="proof-card">
          <div className="field-label">MANDATORY MAKING PROOF</div><div style={{fontWeight:700,fontSize:13}}>🎥 5-second verification clip</div><div style={{fontSize:10.5,color:"#6b6055",margin:"4px 0 9px"}}>Show the piece or a small moment of the making process. This proof is checked before listing.</div>
          {proofVideo ? <video src={proofVideo} controls style={{width:"100%",borderRadius:12,maxHeight:190,objectFit:"cover"}}/> : <button className={`btn ${recording?"secondary":""}`} onClick={recording?stopProofRecording:startProofRecording}>{recording ? "⏹ Recording… (auto-stops in 5s)" : "🔴 Record 5-sec proof"}</button>}
          {proofVideo && <button className="btn secondary" style={{marginTop:8}} onClick={()=>setProofVideo(null)}>Retake proof</button>}
        </div>
      </>}
      {step === "scanning" && <div style={{paddingTop:18}}><span className="demo-tag">Demo verification</span><div className="section-title">🛡️ Authenticity Check Running</div><div className="verify-row"><div className="verify-icon pending">⏳</div><div><div className="verify-title">Micro-Texture + Image Analysis</div><div className="verify-note">Checking the uploaded piece and making-proof clip…</div></div></div><div className="verify-row"><div className="verify-icon pending">⏳</div><div><div className="verify-title">Making-Process Proof</div><div className="verify-note">Confirming that proof was supplied before listing.</div></div></div><div className="verify-row"><div className="verify-icon pending">⏳</div><div><div className="verify-title">Authenticity Decision</div><div className="verify-note">Generating a confidence score.</div></div></div></div>}
      {step === "result" && verifyResult && <div style={{paddingTop:6}}><span className="demo-tag">Demo verification</span><div className={`badge-result ${verifyResult.status}`}><div className="big">{verifyResult.status === "verified" ? "🟢 Verified Handmade" : verifyResult.status === "needs_review" ? "🟡 Needs Verification" : "🔴 Not Eligible"}</div><div className="small">Confidence score: {(verifyResult.confidence*100).toFixed(0)}%</div></div><div className="section-title">Listing saved • Price locked at ₹{Number(price).toLocaleString("en-IN")}</div><div className="card" style={{gridColumn:"span 2"}}><div className="thumb" style={{backgroundImage:`url(${product.image})`}}><BadgeLabel status={verifyResult.status}/></div><div className="info"><div className="t">{product.title}</div><div className="p">₹{Number(product.price).toLocaleString("en-IN")}</div></div></div></div>}
    </div>
    <div className="btn-row">{step === "form" && <button className="btn" onClick={handleCreateAndScan}>Scan &amp; Verify Product →</button>}{step === "result" && verifyResult?.status !== "rejected" && <button className="btn green" onClick={()=>go("createReel")}>Create a Reel for this product</button>}{step === "result" && <button className="btn secondary" onClick={()=>{setToast("Saved to your products");go("myProducts")}}>My Products</button>}</div>
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
      <div className="app-header"><div><h2>My Products</h2><div className="sub">{products.length} listed</div></div></div>
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
  const [products, setProducts] = useState<any[]>([]);
  const [productId, setProductId] = useState<string>(prefillProductId || "");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("Pottery");
  const [tags, setTags] = useState("");
  const [videoDataUrl, setVideoDataUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"idle" | "recording">("idle");
  const [err, setErr] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    apiGet(`/products`).then((all) => {
      const mine = all.filter((p: any) => p.artisanId === user.id && p.verificationStatus !== "rejected");
      setProducts(mine);
      if (prefillProductId) {
        const p = mine.find((x: any) => x.id === prefillProductId);
        if (p) { setCategory(p.category); setCaption(`Making of: ${p.title}`); }
      }
    });
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  async function startRecording() {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const reader = new FileReader();
        reader.onload = () => setVideoDataUrl(reader.result as string);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setMode("recording");
      // Auto-stop at 20s so the demo clip (and its base64 payload) stays small.
      setTimeout(() => { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); setMode("idle"); }, 20000);
    } catch (e: any) {
      setErr("Couldn't access your camera/microphone — you can upload a clip from your gallery instead. (" + e.message + ")");
    }
  }
  function stopRecording() {
    recorderRef.current?.stop();
    setMode("idle");
  }
  async function handleGalleryPick(e: any) {
    const file = e.target.files[0];
    if (!file) return;
    try { setVideoDataUrl(await fileToDataURL(file)); } catch { setErr("Couldn't read that video file."); }
  }

  async function handlePost() {
    if (!caption.trim()) { setErr("Please add a short caption."); return; }
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
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <>
      <div className="app-header"><div><h2>Create a Reel</h2><div className="sub">Show the making process — 30 sec or less</div></div><button className="mode-pill" onClick={() => go("myReels")}>Cancel</button></div>
      <div className="content">
        <ErrorBanner message={err} />
        <div className="scan-box" style={{ aspectRatio: "9/12", marginBottom: 14 }}>
          {videoDataUrl ? (
            <video src={videoDataUrl} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : mode === "recording" ? (
            <video ref={videoRef} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <>
              <div style={{ fontSize: 36 }}>🎥</div>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>No clip yet</div>
              <div style={{ fontSize: 10.5, color: "#6b6055", textAlign: "center", padding: "0 20px" }}>Record with your camera, or upload one from your gallery</div>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {mode === "idle" ? (
            <button className="btn" style={{ flex: 1 }} onClick={startRecording}>🔴 Record</button>
          ) : (
            <button className="btn" style={{ flex: 1, background: "var(--madder)", borderColor: "var(--madder)" }} onClick={stopRecording}>⏹ Stop</button>
          )}
          <label className="btn secondary" style={{ flex: 1, textAlign: "center" }}>
            ⬆ Upload
            <input type="file" accept="video/*" style={{ display: "none" }} onChange={handleGalleryPick} />
          </label>
        </div>

        <div className="field"><div className="field-label">Caption</div><textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. Throwing a surai on the wheel — 6th generation potter" /></div>
        <div className="field">
          <div className="field-label">Attach a verified product (optional)</div>
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">No product — just my process</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.title} {p.verificationStatus === "verified" ? "🟢" : "🟡"}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <div className="field-label">Category</div>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {Object.keys(CATEGORY_EMOJI).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}><div className="field-label">Tags (comma separated)</div><input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="pottery, handmade" /></div>
        </div>
      </div>
      <div className="btn-row"><button className="btn" onClick={handlePost}>Post Reel</button></div>
    </>
  );
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
        <div><h2>My Reels</h2><div className="sub">{reels.length} posted</div></div>
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
// ARTISAN: PROFILE
// ---------------------------------------------------------------------------
function ArtisanProfileScreen({ user, onLogout, go }: any) {
  return (
    <>
      <div className="content" style={{ paddingTop: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img src="/assets/avatar-artisan.png" style={{ width: 70, height: "auto", marginBottom: 8 }} />
          <div className="serif" style={{ fontWeight: 600, fontSize: 17 }}>{user.name}</div>
          <div style={{ fontSize: 11.5, color: "#6b6055" }}>{user.profile?.location || "Location not set"}</div>
        </div>
        <div className="trust-box">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", textTransform: "uppercase" }}>Trust Score</span>
            <span className="serif" style={{ fontSize: 17, fontWeight: 700, color: "var(--green)" }}>{user.profile?.trustScore ?? 100}/100</span>
          </div>
        </div>
        <div className="field-label">Bio</div>
        <p style={{ fontSize: 12.5, marginTop: 4 }}>{user.profile?.bio || "No bio yet."}</p>
        <button className="btn" style={{ marginTop: 14 }} onClick={() => go("reviews")}>Safety &amp; Review Center</button>
        <button className="btn secondary" style={{ marginTop: 20 }} onClick={onLogout}>Log out</button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// BUYER NAV
// ---------------------------------------------------------------------------
function BuyerNav({ screen, go }: { screen: string; go: (s: string) => void; cartCount: number }) {
 const items=[{id:"buyerHome",label:"Home",icon:"home"},{id:"buyerReels",label:"Explore",icon:"search"},{id:"buyerAI",label:"",icon:"mic"},{id:"orders",label:"Orders",icon:"orders"},{id:"buyerProfile",label:"Profile",icon:"profile"}];
 return <div className="bottom-nav buyer-bottom-nav buyer-reference-nav">{items.map(it=>it.id==="buyerAI"?<button key={it.id} className="buyer-ai-nav-button" onClick={()=>go("buyerAI")} aria-label="Open KalaSutra AI"><span><Icon name="mic"/></span></button>:<button key={it.id} className={`nav-btn ${screen===it.id?"active":""}`} onClick={()=>go(it.id)}><span className="nav-icon-wrap"><Icon name={it.icon}/></span><span>{it.label}</span></button>)}</div>;
}

// ---------------------------------------------------------------------------
// BUYER: HOME / EXPLORE
// ---------------------------------------------------------------------------
function BuyerHomeScreen({user,go,openProduct,wishlist,toggleWishlist,cartCount,addToCart,setToast}:any){
 const [products,setProducts]=useState<any[]>([]),[query,setQuery]=useState(""),[category,setCategory]=useState(""),[err,setErr]=useState<string|null>(null),[listening,setListening]=useState(false);
 useEffect(()=>{apiGet("/products").then(setProducts).catch((e)=>setErr(e.message));},[]);
 const cats=[{label:"Pottery",image:"/craft-pottery.jpg",terms:["pottery","ceramic"]},{label:"Textiles",image:"/craft-textiles.jpg",terms:["textile","fabric","weave"]},{label:"Jewellery",image:"/craft-jewellery.jpg",terms:["jewel","metal"]},{label:"Home Decor",image:"/craft-decor.jpg",terms:["wood","decor","home","lamp"]},{label:"Art",image:"/craft-statue-05.png",terms:["art","craft","sculpt"]}];
 const filtered=products.filter(p=>{const hay=`${p.title} ${p.category} ${p.craftInfo?.material||""} ${p.craftInfo?.region||""}`.toLowerCase();const qok=!query.trim()||query.toLowerCase().split(" ").filter(Boolean).every(w=>hay.includes(w));const c=cats.find(x=>x.label===category);return qok&&(!c||c.terms.some(t=>hay.includes(t)));});
 async function voiceSearch(){const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!SR){go("buyerAI");return;}if(!await requestVoicePermission()){setErr("Please allow microphone access for voice search.");return;}const r=new SR();r.lang="hi-IN";r.interimResults=false;r.maxAlternatives=1;r.onstart=()=>setListening(true);r.onend=()=>setListening(false);r.onerror=()=>{setListening(false);setErr("Voice search could not start. Please try again.");};r.onresult=(e:any)=>setQuery(e.results[0][0].transcript);try{r.start();}catch(_){}}
 return <div className="buyer-reference-home">
 <div className="buyer-reference-topbar"><img src="/assets/logo.png" alt="KalaSutra"/><div className="buyer-reference-user-actions"><button className="buyer-notification-button" aria-label="Notifications">♧<i/></button><button className="buyer-profile-avatar" onClick={()=>go("buyerProfile")} aria-label="Open profile"><img src={user.profile?.photo||"/assets/avatar-artisan.png"} alt=""/></button></div></div>
 <div className="buyer-reference-welcome"><div><h1>Welcome to<br/>KalaSutra!</h1><p>Discover handmade.<br/>Support real artisans.<br/>Be part of a bigger story.</p></div><div className="buyer-welcome-art"><span>Good<br/>Things<br/>Are<br/>Handmade</span><i>❧</i></div></div>
 <div className="content buyer-content buyer-reference-content"><ErrorBanner message={err}/><div className="smart-search buyer-reference-search"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search for pottery, sarees, decor…"/><button className={listening?"voice-search listening":"voice-search"} onClick={voiceSearch} aria-label="Voice search">🎙</button></div>
 <button className="buyer-ai-promo" onClick={()=>go("buyerAI")}><div className="buyer-ai-promo-avatar"><img src="/assets/ai-talker.png" alt=""/></div><div className="buyer-ai-promo-copy"><strong>I’m KalaSutra AI!</strong><span>Tell me what you’re<br/>looking for today?</span><b><Icon name="mic"/> Start Talking</b></div><span className="buyer-ai-promo-leaf">✿</span></button>
 <div className="buyer-category-row" aria-label="Browse crafts">{cats.map(x=><button key={x.label} className={category===x.label?"buyer-category active":"buyer-category"} onClick={()=>setCategory(category===x.label?"":x.label)}><span><img src={x.image} alt=""/></span><small>{x.label}</small></button>)}</div>
 <div className="section-row buyer-reference-section"><div className="section-title" style={{margin:0}}>{query||category?"Matching Crafts":"Trending Crafts"}</div><span className="view-all" onClick={()=>{setCategory("");setQuery("");}}>See All →</span></div>
 {filtered.length===0?<div className="empty-note">No pieces match your search — try another craft, material, or region.</div>:<div className="grid buyer-reference-grid">{filtered.map(p=><div key={p.id} className="card buyer-product-card" onClick={()=>openProduct(p.id)}><div className="thumb" style={{backgroundImage:`url(${p.image})`}}><BadgeLabel status={p.verificationStatus}/><button className="card-icon-btn card-heart" onClick={(e:any)=>{e.stopPropagation();toggleWishlist(p.id);}}>{wishlist.includes(p.id)?"❤️":"🤍"}</button><span className="emoji">{CATEGORY_EMOJI[p.category]||"🎨"}</span></div><div className="info"><div className="t">{p.title}</div><div className="buyer-card-bottom"><div><div className="p">₹{Number(p.price||0).toLocaleString("en-IN")}</div><small className="buyer-rating">★ {Number(p.rating||4.8).toFixed(1)} ({p.reviewCount||98})</small></div><button className="quick-cart-btn" aria-label="Add to cart" onClick={(e:any)=>{e.stopPropagation();addToCart(p.id);setToast("Added to cart 🛍️");}}>＋</button></div></div></div>)}</div>}</div>
 {cartCount>0&&<div className="floating-cart-wrap"><button className="floating-cart" onClick={()=>go("cart")}><span className="mini-cart-icon"><Icon name="cart"/></span><span><strong>View cart</strong><small>{cartCount} item{cartCount>1?"s":""}</small></span><b>›</b></button></div>}</div>;
}

// ---------------------------------------------------------------------------
// BUYER: KALASUTRA AI
function BuyerAIPage({go,user}:any){
 const [language,setLanguage]=useState("en-IN"),[languageOpen,setLanguageOpen]=useState(false),[typing,setTyping]=useState(false),[draft,setDraft]=useState(""),[reply,setReply]=useState("I’m your KalaSutra AI. How can I help you today?"),[busy,setBusy]=useState(false),[listening,setListening]=useState(false);
 const languages=[{code:"en-IN",name:"English"},{code:"hi-IN",name:"हिंदी"},{code:"mr-IN",name:"मराठी"}];
 async function ask(value:string){const message=String(value||"").trim();if(!message||busy)return;setDraft("");setBusy(true);setReply("I’m thinking…");try{const out=await apiPost("/ai/chat",{message,role:"buyer",locale:language,userId:user?.id,screen:"buyerHome"});const answer=String(out.reply||"I’m here to help you find something special.");setReply(answer);if(window.speechSynthesis){const u=new SpeechSynthesisUtterance(answer);u.lang=language;u.rate=.96;window.speechSynthesis.cancel();window.speechSynthesis.speak(u);}}catch(_){setReply("I’m here to help you discover beautiful handmade pieces. What are you looking for?");}finally{setBusy(false);}}
 async function startListening(){const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!SR){setTyping(true);return;}if(!await requestVoicePermission()){setReply("Please allow microphone access, then tap the microphone again.");return;}const r=new SR();r.lang=language;r.interimResults=false;r.maxAlternatives=1;r.onstart=()=>setListening(true);r.onend=()=>setListening(false);r.onerror=()=>{setListening(false);setReply("I couldn’t hear that. Please try again.");};r.onresult=(e:any)=>ask(e.results?.[0]?.[0]?.transcript||"");try{r.start();}catch(_){}}
 const suggestions=[{icon:"⌕",text:"Show me handmade gifts under ₹2000"},{icon:"♧",text:"Show me products from Rajasthan"},{icon:"◈",text:"Suggest home decor items"},{icon:"♙",text:"Show me women artisans"},{icon:"✦",text:"Recommend something unique"}];
 return <div className="buyer-ai-page"><div className="buyer-ai-topbar"><button onClick={()=>go("buyerHome")} aria-label="Back to home">‹</button><strong>KalaSutra AI</strong><div className="buyer-ai-language-wrap"><button className="buyer-ai-language" onClick={()=>setLanguageOpen(!languageOpen)}>◎ {languages.find(x=>x.code===language)?.name||"English"}⌄</button>{languageOpen&&<div className="buyer-ai-language-menu">{languages.map(x=><button key={x.code} onClick={()=>{setLanguage(x.code);setLanguageOpen(false);}}>{x.name}</button>)}</div>}</div></div>
 <div className="buyer-ai-scene"><div className="buyer-ai-flower flower-left">♧</div><div className="buyer-ai-flower flower-right">♧</div><div className="buyer-ai-portrait"><img src="/assets/ai-talker.png" alt="KalaSutra AI assistant"/></div><div className="buyer-ai-story">Different<br/>People<br/>Beautiful<br/>Stories<br/>One India ♡</div></div>
 <div className="buyer-ai-chat-area"><div className="buyer-ai-greeting"><div><strong>Welcome to KalaSutra!</strong><span>{reply}</span></div><button aria-label="Speak reply" onClick={()=>{const u=new SpeechSynthesisUtterance(reply);u.lang=language;window.speechSynthesis?.speak(u);}}>◖))</button></div>
 {typing&&<form className="buyer-ai-input" onSubmit={e=>{e.preventDefault();ask(draft);}}><input autoFocus value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Ask KalaSutra AI…"/><button type="submit">➤</button></form>}
 <div className="buyer-ai-suggestions">{suggestions.map(x=><button key={x.text} onClick={()=>ask(x.text)}><span>{x.icon}</span>{x.text}</button>)}</div></div>
 <div className="buyer-ai-controls"><button className={typing?"buyer-ai-control active":"buyer-ai-control"} onClick={()=>setTyping(!typing)} aria-label="Type a message">▦</button><button className={listening?"buyer-ai-mic listening":"buyer-ai-mic"} onClick={startListening} aria-label="Tap to speak">{listening?"●":<Icon name="mic"/>}</button><button className="buyer-ai-control" onClick={()=>setTyping(true)} aria-label="Open chat">▤</button></div><div className="buyer-ai-tap-label">{busy?"Thinking…":listening?"Listening…":"Tap to Speak"}</div></div>;
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
  const [customRequest, setCustomRequest] = useState('');
  const [customizing, setCustomizing] = useState(false);
  const [customId, setCustomId] = useState<string | null>(null);

  useEffect(() => {
    apiGet(`/products/${productId}`).then((p) => { setProduct(p); setSelectedImage(p.image || null); }).catch((e) => setErr(e.message));
  }, [productId]);

  if (err) return <div className="content"><ErrorBanner message={err} /><button className="btn secondary" onClick={back}>Go back</button></div>;
  if (!product) return <div className="content"><div className="empty-note">Loading…</div></div>;

  const delivery = 120;
  const total = product.price + delivery;
  const pct = Math.round(((product.price * 0.81) / total) * 100);

  return (
    <>
      <div className="detail-photo real-photo-hero" style={{ backgroundImage: `url(${selectedImage || product.image})` }}>
        <button className="close-btn" onClick={back}>✕</button>
        {!selectedImage && <span style={{ position: "relative", zIndex: 1 }}>{CATEGORY_EMOJI[product.category] || "🎨"}</span>}
      </div>
      <div className="content" style={{ paddingTop: 0 }}>
        <div style={{ borderBottom: "1px solid var(--line)", margin: "0 -18px", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
          <div className="av" style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--indigo)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>🧵</div>
          <div><div style={{ fontSize: 12.5, fontWeight: 700 }}>{product.artisan?.name}</div><div style={{ fontSize: 10.5, color: "#6b6055" }}>{product.artisan?.profile?.location}</div></div>
        </div>
        <div style={{ marginTop: 14 }}>
          <BadgeLabel status={product.verificationStatus} />
          <h2 className="serif" style={{ fontSize: 19, margin: "8px 0 6px" }}>{product.title}</h2>
          <p style={{ fontSize: 13 }}>{product.description}</p>
        </div>
        {Array.isArray(product.gallery) && product.gallery.length > 0 && (
          <div className="product-gallery">
            <div className="product-gallery-title">Real artisan photo gallery</div>
            <div className="product-gallery-strip">
              {product.gallery.map((img: string, i: number) => (
                <button key={img + i} className={`product-gallery-thumb ${selectedImage === img ? "active" : ""}`} onClick={() => setSelectedImage(img)} aria-label={`View craft photo ${i + 1}`}>
                  <img src={`/${img}`} alt={`Artisan craft photo ${i + 1}`} />
                </button>
              ))}
            </div>
            <div className="product-gallery-note">Tap any photo to view it above.</div>
          </div>
        )}
        <div className="certificate-card">
          <div><span className="field-label">DIGITAL PRODUCT ID</span><strong>{product.uniqueProductId || 'KS-ART-000001'}</strong><small>Verified identity linked to this handmade piece</small></div>
          <div className="certificate-qr"><img alt="Product QR" src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(window.location.origin + '/?certificate=' + (product.uniqueProductId || product.id))}`} /></div>
        </div>
        <div className="customize-card">
          <div><span className="field-label">MAKE IT YOURS</span><strong>Customize this unique piece</strong><small>Personalize with a name, colour, size or small design change.</small></div>
          <button className="btn secondary" onClick={() => setCustomOpen(v => !v)}>Customize • ₹100</button>
          {customOpen && <div className="customize-form">
            <textarea value={customRequest} onChange={e => setCustomRequest(e.target.value)} placeholder="e.g. Add my name 'Harsh' and change the colour to blue" />
            <button className="btn" disabled={customizing} onClick={async () => {
              if (!customRequest.trim()) { setToast('Please describe your customization'); return; }
              setCustomizing(true);
              try { const c = await apiPost('/customizations', { productId: product.id, buyerId: userId, request: customRequest, charge: 100 }); setCustomId(c.customizationId); setToast(`Customization request ${c.customizationId} created • ₹100`); setCustomRequest(''); } catch (e:any) { setToast(e.message || 'Customization failed'); } finally { setCustomizing(false); }
            }}>{customizing ? 'Saving…' : 'Request customization • ₹100'}</button>
            {customId && <div className="location-fill-note">✓ Customization ID: <strong>{customId}</strong> — Product ID remains {product.uniqueProductId}</div>}
          </div>}
        </div>
        <div className="impact-bar"><b>{pct}%</b> of what you pay goes straight to the maker.</div>
        <div className="checkout-box">
          <div className="checkout-row"><span>Product price</span><span>₹{product.price.toLocaleString("en-IN")}</span></div>
          <div className="checkout-row"><span>Delivery charge</span><span>₹{delivery}</span></div>
          <div className="checkout-row total"><span>Final price</span><span>₹{total.toLocaleString("en-IN")}</span></div>
        </div>
        <div style={{ display: "flex", gap: 10, margin: "0 0 10px" }}>
          <button className="btn" style={{ flex: 1 }} onClick={() => { addToCart(product.id); setToast("Added to cart"); }}>Add to Cart</button>
          <button className="btn secondary" style={{ width: 52, flex: "0 0 auto" }} onClick={() => toggleWishlist(product.id)}>{wishlist.includes(product.id) ? "❤️" : "🤍"}</button>
        </div>
        <div style={{ textAlign: "center" }}>
          <span
            style={{ fontSize: 11, color: reported ? "var(--madder)" : "#8a7d6e", textDecoration: "underline", cursor: reported ? "default" : "pointer" }}
            onClick={() => { if (!reported) { setReported(true); setToast("Reported — our trust & safety team will review this listing"); } }}
          >
            {reported ? "✓ Reported — under review" : "🚩 Report Product: Not Handmade"}
          </span>
        </div>
      </div>
    </>
  );
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

  function load() { apiGet(`/cart?userId=${user.id}`).then(setItems).catch(e => setError(e.message)); }
  useEffect(load, []);

  async function remove(productId: string) {
    await apiDelete('/cart', { userId: user.id, productId });
    load(); refreshCartCount();
  }

  const total = items.reduce((s, i) => s + (i.product?.price || 0) * i.qty, 0);
  const address = { phone, area, city, pincode };

  function validateAddress() {
    if (!phone.trim() || !area.trim() || !city.trim() || !pincode.trim()) {
      setError('Please fill phone, area, city and pincode'); return false;
    }
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) { setError('Please enter a valid 10-digit phone number'); return false; }
    if (!/^\d{6}$/.test(pincode.trim())) { setError('Please enter a valid 6-digit pincode'); return false; }
    return true;
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
        <div className="payment-sheet">
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

            <div className="payment-section-title payment-method-title">Payment method</div>
            <button className={`payment-method-card ${method === 'razorpay' ? 'selected' : ''}`} onClick={() => setMethod('razorpay')}>
              <span className="payment-method-icon">▣</span><span><strong>Razorpay secure payment</strong><small>Google Pay, PhonePe, UPI, cards and netbanking</small></span><i>{method === 'razorpay' ? '●' : '○'}</i>
            </button>
            <button className={`payment-method-card ${method === 'cod' ? 'selected' : ''}`} onClick={() => setMethod('cod')}>
              <span className="payment-method-icon">▤</span><span><strong>Cash on delivery</strong><small>Pay when your order arrives</small></span><i>{method === 'cod' ? '●' : '○'}</i>
            </button>

            <div className="payment-trust">✓ {method === 'razorpay' ? 'Payment is completed on Razorpay and verified before your order is created.' : 'Your order is confirmed now. Pay in cash when the artisan order arrives.'}</div>
            {error && <div className="payment-error">{error}</div>}

            <div className="payment-summary"><span><small>{items.reduce((s,i)=>s+i.qty,0)} items</small><strong>₹{total.toLocaleString('en-IN')}</strong></span>
              <button onClick={method === 'razorpay' ? payOnline : placeCOD} disabled={loading}>{loading ? 'Processing…' : method === 'razorpay' ? `Pay ₹${total.toLocaleString('en-IN')} securely` : `Place COD order • ₹${total.toLocaleString('en-IN')}`}</button>
            </div>
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

function OrdersScreen({ user }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  useEffect(() => { apiGet(`/orders?userId=${user.id}`).then(setOrders); }, [user.id]);
  const isArtisan = user.role === 'artisan';
  const statusLabel: any = { placed: 'New Orders', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', paid: 'New Orders' };
  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
  const earnings = isArtisan ? orders.reduce((sum, o) => sum + (o.artisanItems || []).reduce((s:any, p:any) => s + Number(p.price || 0) * Number(p.qty || 0), 0), 0) : 0;
  return (<>
    <div className="app-header"><div><h2>{isArtisan ? 'Orders & Earnings' : 'Your Orders'}</h2><div className="sub">{isArtisan ? 'Manage your artisan business' : 'Track your purchases'}</div></div></div>
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
function BuyerProfileScreen({ user, onLogout }: any) {
  return (
    <div className="content" style={{ paddingTop: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--madder)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 10px" }}>🛍️</div>
        <div className="serif" style={{ fontWeight: 600, fontSize: 17 }}>{user.name}</div>
        <div style={{ fontSize: 11.5, color: "#6b6055" }}>{user.profile?.location || "Conscious buyer"}</div>
      </div>
      <button className="btn secondary" onClick={onLogout}>Log out</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BUYER: REELS FEED
// ---------------------------------------------------------------------------
function ReelsFeedScreen({ openProduct, setToast }: any) {
  const [reels, setReels] = useState<any[]>([]);
  useEffect(() => { apiGet(`/reels`).then(setReels); }, []);
  const COLORS = ["#8a5a3a", "#3d5c73", "#6b4423", "#7a5c1e", "#5c6b3a", "#7a3a5c"];

  return (
    <div className="reels-wrap">
      {reels.length === 0 && <div className="empty-note" style={{ paddingTop: 100 }}>No Reels yet — check back soon.</div>}
      {reels.map((r, i) => (
        <div className="reel" key={r.id}>
          {r.video ? (
            <video src={r.video} className="reel-visual" style={{ objectFit: "cover", fontSize: 0 }} autoPlay loop muted playsInline />
          ) : (
            <div className="reel-visual" style={{ background: COLORS[i % COLORS.length] }}>{r.thumbEmoji}</div>
          )}
          <div className="reel-gradient" />
          <div className="reel-overlay">
            <div className="reel-info">
              <strong>@{r.artisan?.name?.toLowerCase().replace(/\s+/g, ".") || "artisan"}</strong>
              <span>{r.caption}</span>
              {r.product && (
                <div>
                  <span className="badge-inline" style={{ background: "#e2f0e4", color: "var(--green)" }}>
                    <BadgeLabel status={r.product.verificationStatus} />
                  </span>
                  <div className="view-btn" onClick={() => openProduct(r.product.id)}>🛍️ View Product</div>
                </div>
              )}
            </div>
            <div className="reel-actions">
              <button className="act" onClick={() => setToast("Liked")}><span className="ic">❤️</span>{r.likes}</button>
              <button className="act" onClick={() => setToast("Comments coming soon")}><span className="ic">💬</span>{r.comments}</button>
              <button className="act" onClick={() => setToast("Saved")}><span className="ic">🔖</span>Save</button>
              <button className="act" onClick={() => setToast("Link copied")}><span className="ic">↗</span>Share</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
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
    <div className="app-shell">
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
      {isArtisan && screen === "orders" && <OrdersScreen user={user} />}
      {isArtisan && screen === "reviews" && <SafetyReviewScreen go={setScreen} setToast={setToast} />}
      {isArtisan && screen === "profile" && <ArtisanProfileScreen user={user} onLogout={logout} go={setScreen} />}

      {!isArtisan && screen === "buyerHome" && <BuyerHomeScreen user={user} go={setScreen} openProduct={openProduct} wishlist={wishlist} toggleWishlist={toggleWishlist} cartCount={cartCount} addToCart={addToCart} setToast={setToast} />}
       {!isArtisan && screen === "buyerAI" && <BuyerAIPage user={user} go={setScreen} />
      {!isArtisan && screen === "buyerReels" && <ReelsFeedScreen openProduct={openProduct} setToast={setToast} />}
      {!isArtisan && screen === "wishlist" && <WishlistScreen user={user} openProduct={openProduct} toggleWishlist={toggleWishlist} />}
      {!isArtisan && screen === "cart" && <CartScreen user={user} go={setScreen} setToast={setToast} refreshCartCount={() => refreshCartCount(user.id)} />}
      {!isArtisan && screen === "orders" && <OrdersScreen user={user} />}
      {!isArtisan && screen === "buyerProfile" && <BuyerProfileScreen user={user} onLogout={logout} />}
      {screen === "productDetail" && (
        <ProductDetailScreen productId={activeProductId} go={setScreen} back={goBack} setToast={setToast} wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} userId={user.id} />
      )}

      {navBar}
      {!(isArtisan && screen === "dashboard") && <div className="mode-switch-wrap">
        <button className="mode-pill" onClick={switchRole}>⇄ Switch to {isArtisan ? "Buyer" : "Artisan"}</button>
      </div>}
      <Toast message={toast} />
      {showPermissions && <PermissionCenter onClose={closePermissions} />}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
