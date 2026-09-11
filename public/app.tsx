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
          speak("Bilkul! Main aapko cart tak le ja raha hoon."); go?.("cart");
        } else if (q.includes("reel") || q.includes("रील")) {
          speak("Chaliye Reel section kholte hain."); go?.(role === "artisan" ? "createReel" : "buyerReels");
        } else if (q.includes("verify") || q.includes("verification") || q.includes("जांच")) {
          speak("Chaliye Add a Piece kholte hain. Main photo, story aur making proof mein step by step guide karunga."); go?.("addProduct");
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
  const [step, setStep] = useState("contact");
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
    <div className="login-modern">
      <div className="login-modern-glow" />
      <div className="login-top-brand">
        <img src="/assets/logo.png" alt="KalaSutra" />
        <span>Handmade. Heartfelt. Home.</span>
      </div>
      <div className="login-card-modern">
        <div className="login-hero-modern">
          <div className="login-portrait"><img src="/assets/avatar-artisan.png" alt="KalaSutra artisan" /></div>
          <div>
            <span className="login-kicker">KALASUTRA</span>
            <h1 className="serif">Welcome back</h1>
            <p>Continue your handmade journey.</p>
          </div>
        </div>
        <div className="login-progress"><i className={step === "contact" ? "on" : "done"} /><i className={step === "otp" ? "on" : step === "name" ? "done" : ""} /><i className={step === "name" ? "on" : ""} /></div>
        <ErrorBanner message={err} />

        {step === "contact" && (
          <>
            <div className="field login-field">
              <div className="field-label">Mobile number</div>
              <div className="login-input-wrap"><span>+91</span><input inputMode="numeric" value={contact} onChange={(e) => setContact(e.target.value.replace(/\D/g, "").slice(0,10))} placeholder="Enter 10-digit mobile number" /></div>
            </div>
            <div className="captcha-card modern-captcha">
              <div className="captcha-head">
                <label className="captcha-check">
                  <input type="checkbox" checked={humanChecked} onChange={(e) => { setHumanChecked(e.target.checked); setErr(null); }} />
                  <span className="captcha-box">{humanChecked ? "✓" : ""}</span>
                  <span>I'm not a robot</span>
                </label>
                <span className="captcha-mini">SECURE</span>
              </div>
              {humanChecked && (
                <div className="captcha-challenge">
                  <div className="captcha-code">{captcha}</div>
                  <button type="button" className="captcha-refresh" onClick={refreshCaptcha}>↻</button>
                  <div className="captcha-input-row">
                    <input value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value.toUpperCase().replace(/\s/g, "").slice(0,5))} placeholder="Enter code" maxLength={5} />
                    <span className={captchaInput === captcha ? "captcha-ok" : "captcha-pending"}>{captchaInput === captcha ? "✓" : ""}</span>
                  </div>
                </div>
              )}
              <div className="captcha-note">A quick safety check before OTP</div>
            </div>
            <button className="btn login-main-btn" onClick={() => {
              if (contact.length !== 10) { setErr("Please enter a valid 10-digit mobile number"); return; }
              if (!humanChecked) { setErr("Please confirm that you are not a robot"); return; }
              if (captchaInput !== captcha) { setErr("Please enter the captcha correctly"); return; }
              setErr(null); setStep("otp");
            }}>Continue with OTP <span>→</span></button>
            <div className="login-trust-row"><span>🔒 Private &amp; secure</span><span>🌿 Artisan-first</span></div>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="login-step-note"><b>OTP sent</b><span>Enter the 4-digit demo code for {contact}</span></div>
            <div className="field login-field"><div className="field-label">Verification code</div><input inputMode="numeric" value={otp} maxLength={4} onChange={(e) => setOtp(e.target.value.replace(/\D/g,""))} placeholder="• • • •" style={{letterSpacing:10,fontSize:22,textAlign:"center"}} /></div>
            <button className="btn login-main-btn" onClick={() => { if (otp.length < 4) { setErr("Enter the 4-digit demo code"); return; } setErr(null); setStep("name"); }}>Verify &amp; Continue <span>→</span></button>
            <button className="btn secondary" style={{marginTop:10}} onClick={() => setStep("contact")}>← Change number</button>
            <p className="login-demo-note">Demo mode: any 4 digits work. No real SMS is sent.</p>
          </>
        )}

        {step === "name" && (
          <>
            <div className="login-step-note"><b>One last step</b><span>Tell us what we should call you.</span></div>
            <div className="field login-field"><div className="field-label">Your name</div><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" /></div>
            <button className="btn login-main-btn" onClick={() => { if (!name.trim()) { setErr("Please enter your name"); return; } onLoggedIn(contact, name.trim()); }}>Enter KalaSutra <span>→</span></button>
          </>
        )}
      </div>
      <p className="login-footer">Craft • Share • Empower <span>♡</span></p>
    </div>
  );
}

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
// ARTISAN: ADD PRODUCT — HIGH-TRUST LISTING FLOW
function AddProductScreen({ user, go, setToast, setLastVerifiedProductId }: any) {
  const [step,setStepState]=useState("form"),[title,setTitle]=useState(""),[story,setStory]=useState(""),[description,setDescription]=useState(""),[price,setPrice]=useState(""),[category,setCategory]=useState("Pottery"),[material,setMaterial]=useState(""),[region,setRegion]=useState(""),[storyLang,setStoryLang]=useState("hi-IN"),[gallery,setGallery]=useState<string[]>([]),[proofVideo,setProofVideo]=useState<string|null>(null),[recording,setRecording]=useState(false),[storyRecording,setStoryRecording]=useState(false),[ownership,setOwnership]=useState(false),[err,setErr]=useState<string|null>(null),[product,setProduct]=useState<any>(null),[verifyResult,setVerifyResult]=useState<any>(null);
  const proofRecorderRef=useRef<MediaRecorder|null>(null),proofStreamRef=useRef<MediaStream|null>(null),proofChunksRef=useRef<Blob[]>([]),storyRecognitionRef=useRef<any>(null);
  function compressImage(file:File):Promise<string>{return new Promise((resolve,reject)=>{const img=new Image(),r=new FileReader();r.onload=()=>{img.onload=()=>{const max=1400,s=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);const x=c.getContext("2d");if(!x)return reject();x.drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL("image/jpeg",.82));};img.src=String(r.result)};r.onerror=reject;r.readAsDataURL(file)})}
  async function handleImagePick(e:any){const files=Array.from(e.target.files||[]) as File[];if(!files.length)return;try{const left=5-gallery.length;const imgs=await Promise.all(files.slice(0,left).map(compressImage));setGallery(g=>[...g,...imgs].slice(0,5));if(files.length>left)setErr("Maximum 5 photos allowed.");}catch{setErr("Could not read the selected image.");}e.target.value=""}
  function generateAI(s:string){const clean=s.trim();if(!clean)return; if(!title)setTitle(`${category} — ${clean.split(/\s+/).slice(0,5).join(" ")}`.slice(0,70));setDescription(`Handcrafted ${category.toLowerCase()} created by an artisan. Story shared in ${storyLang}: “${clean}”. KalaSutra AI prepared this buyer-friendly description.`)}
  function startStoryRecording(){const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!SR){setErr("Voice story needs Chrome.");return}const rec=new SR();rec.lang=storyLang;rec.interimResults=false;rec.continuous=false;rec.onstart=()=>setStoryRecording(true);rec.onend=()=>setStoryRecording(false);rec.onerror=()=>{setStoryRecording(false);setErr("I couldn't hear the story. Try again.")};rec.onresult=(e:any)=>{const heard=e.results?.[0]?.[0]?.transcript||"";if(heard){setStory(heard);generateAI(heard);try{const u=new SpeechSynthesisUtterance("Aapki story save ho gayi hai. Ab making proof record karein.");u.lang="hi-IN";speechSynthesis.speak(u)}catch(_){}}};storyRecognitionRef.current=rec;try{rec.start()}catch(_){}}
  function stopStoryRecording(){try{storyRecognitionRef.current?.stop()}catch(_){}setStoryRecording(false)}
  async function startProofRecording(){setErr(null);try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}},audio:true});proofStreamRef.current=stream;proofChunksRef.current=[];const rec=new MediaRecorder(stream);rec.ondataavailable=e=>{if(e.data.size)proofChunksRef.current.push(e.data)};rec.onstop=()=>{const blob=new Blob(proofChunksRef.current,{type:"video/webm"}),r=new FileReader();r.onload=()=>setProofVideo(r.result as string);r.readAsDataURL(blob);stream.getTracks().forEach(t=>t.stop())};rec.start();proofRecorderRef.current=rec;setRecording(true);setTimeout(()=>{if(proofRecorderRef.current?.state==="recording")proofRecorderRef.current.stop();setRecording(false)},15000)}catch(e:any){setErr("Back camera + microphone permission is needed. "+(e.message||""))}}
  function stopProofRecording(){if(proofRecorderRef.current?.state==="recording")proofRecorderRef.current.stop();proofStreamRef.current?.getTracks().forEach(t=>t.stop());setRecording(false)}
  async function handleCreateAndScan(){if(gallery.length<2){setErr("Please add 2–3 clear product photos.");return}if(!story.trim()){setErr("Tell your craft story by voice.");return}if(!price||!/^\d+(\.\d{1,2})?$/.test(price)){setErr("Enter a valid price.");return}if(!proofVideo){setErr("15–30 sec making-proof video is mandatory.");return}if(!ownership){setErr("Please confirm ownership of this handmade piece.");return}try{setErr(null);const created=await apiPost("/products",{artisanId:user.id,title:title.trim()||`${category} Handmade Piece`,description:description||`Handcrafted ${category.toLowerCase()} made by a traditional artisan.`,price,category,image:gallery[0],gallery,craftInfo:{material,region,storyLanguage:storyLang,originalStory:story,verificationProof:proofVideo,ownershipDeclaration:true,proofDurationSeconds:15,photoCount:gallery.length}});setProduct(created);setStepState("scanning");await new Promise(r=>setTimeout(r,900));const result=await apiPost("/scan",{productId:created.id}),safety=await apiPost("/risk",{productId:created.id});result.riskScore=safety.riskScore;result.riskLevel=safety.level;result.riskReasons=safety.reasons;result.trustScore=safety.trustScore;setVerifyResult(result);setStepState("result");setLastVerifiedProductId(created.id)}catch(e:any){setErr(e.message||"Verification failed.")}}
  useEffect(()=>()=>{try{storyRecognitionRef.current?.stop()}catch(_){}proofStreamRef.current?.getTracks().forEach(t=>t.stop())},[]);
  return <><div className="artisan-add-hero"><div className="add-topline"><button className="header-back" onClick={()=>go("dashboard")}>‹</button><div className="add-brand">🌿 <b>KalaSutra</b><small>Artisans to the World</small></div><button className="switch-buyer" onClick={()=>go("buyerHome")}>⇄ Switch to Buyer</button></div><h1>Add a New Piece</h1><p>Take a photo. Tell your story. AI does the rest.</p><div className="add-progress">{["📷 Capture","▤ Add Details","🛡 Verify","☁ Publish"].map((x,i)=><React.Fragment key={x}><span className={(i===0||(i===1&&gallery.length)||(i===2&&proofVideo)||(i===3&&verifyResult))?"active":""}>{x.split(" ")[0]}<b>{x.slice(2)}</b></span>{i<3&&<i/>}</React.Fragment>)}</div></div>
  <div className="content add-piece-modern"><ErrorBanner message={err}/>
  {step==="form"&&<><section className="add-section"><div className="add-section-title"><span>1</span><div><h2>Upload Photos / Video</h2><small>Add 2–3 clear photos. Take a photo or upload from Gallery.</small></div></div><div className="multi-upload-row"><label className="upload-tile"><input type="file" accept="image/*" capture="environment" multiple onChange={handleImagePick}/><strong>📷</strong><b>Take / Upload</b><small>JPG, PNG · Max 5</small></label>{gallery.map((img,i)=><div className="uploaded-tile" key={i}><img src={img}/><button onClick={()=>setGallery(g=>g.filter((_,j)=>j!==i))}>×</button><span>Photo {i+1}</span></div>)}</div><div className="upload-hint">✓ Multiple photos enabled · AI compares views for originality and consistency.</div></section>
  <section className="add-section"><div className="add-section-title"><span>2</span><div><h2>Tell Your Story <em>(Voice First)</em></h2><small>Speak in your language — AI prepares the listing.</small></div><b className="language-pill">🌐 10+ Indian languages</b></div><div className="voice-first-box"><div className="voice-prompt">🎙 Tap and speak about your craft… <span>{storyRecording?"Listening…":"0:00 / 1:00"}</span></div><select value={storyLang} onChange={e=>setStoryLang(e.target.value)}><option value="hi-IN">Hindi</option><option value="mr-IN">Marathi</option><option value="ta-IN">Tamil</option><option value="bn-IN">Bangla</option><option value="en-IN">English</option></select><button className={`story-mic ${storyRecording?"recording":""}`} onClick={storyRecording?stopStoryRecording:startStoryRecording}>{storyRecording?"■ Stop":"🎙 Speak"}</button></div>{story&&<div className="story-transcript"><b>AI heard:</b> {story}</div>}{description&&<div className="ai-draft"><b>✨ AI draft:</b> {description}</div>}</section>
  <section className="add-section"><div className="add-section-title"><span>3</span><div><h2>Product Details</h2><small>AI assists; the artisan controls the final price.</small></div></div><div className="details-grid"><label>Product Name <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Blue Terracotta Vase"/><button className="inline-ai" onClick={()=>generateAI(story)}>✦ Suggest</button></label><label>Category <select value={category} onChange={e=>setCategory(e.target.value)}>{Object.keys(CATEGORY_EMOJI).map(c=><option key={c}>{c}</option>)}</select></label><label>Price (₹) <input value={price} onChange={e=>setPrice(e.target.value.replace(/[^0-9.]/g,""))} placeholder="2000"/></label><label>Material <input value={material} onChange={e=>setMaterial(e.target.value)} placeholder="e.g. Terracotta clay"/></label><label>Region / Origin <input value={region} onChange={e=>setRegion(e.target.value)} placeholder="e.g. Rajasthan"/></label><label>Tags <input value={story?`${category.toLowerCase()}, handmade, traditional`:""} readOnly placeholder="AI-generated tags"/></label></div></section>
  <section className="add-section verification-high"><div className="add-section-title"><span>4</span><div><h2>Verification <em>(Mandatory)</em></h2><small>High-level trust check before the piece reaches buyers.</small></div></div><div className="verification-layers"><div>📸 <b>2–3 Product Photos</b><small>AI checks consistency, originality and duplicate/image theft.</small></div><div>🎥 <b>15–30 sec Making Video</b><small>Back camera requested for authentic process evidence.</small><button className={`proof-action ${recording?"recording":""}`} onClick={recording?stopProofRecording:startProofRecording}>{recording?"⏹ Recording…":"🎥 Record Making Proof"}</button></div><div>🤖 <b>Product–Process Match</b><small>AI compares final product with the making evidence.</small></div><div>🛡 <b>Originality & Duplicate Guard</b><small>Repeated uploads and suspicious patterns are flagged.</small></div><div>✍️ <b>Ownership Declaration</b><small>Confirm you made this piece and have the right to sell it.</small><label className="check-line"><input type="checkbox" checked={ownership} onChange={e=>setOwnership(e.target.checked)}/> I confirm ownership</label></div></div>{proofVideo&&<div className="proof-preview"><video src={proofVideo} controls/><span>✓ Making proof captured</span><button onClick={()=>setProofVideo(null)}>Retake</button></div>}<div className="verification-note">AI provides evidence + Risk Score. <b>Human review makes the final decision</b> on flagged cases.</div></section></>}
  {step==="scanning"&&<section className="verification-running"><div className="demo-tag">AI VERIFICATION</div><h2>Authenticity Check Running</h2><p>Combining photos, making proof, ownership and safety signals.</p>{["Photo consistency & originality","Making video evidence","Product–Process Match","Duplicate / image theft guard","Ownership declaration","Risk Score + human-review routing"].map(x=><div className="verify-check" key={x}><span>✓</span><b>{x}</b><i>Checking…</i></div>)}</section>}
  {step==="result"&&verifyResult&&<section className="verification-result"><div className="result-head"><div><div className="demo-tag">AI TRUST RESULT</div><h2>{verifyResult.status==="verified"?"Verified Handmade":verifyResult.status==="needs_review"?"Needs Human Review":"Suspicious Listing"}</h2><p>AI evidence recorded. Human reviewers make the final decision on flagged cases.</p></div><div className="trust-score"><b>{verifyResult.trustScore??Math.round((verifyResult.confidence||0)*100)}</b><span>/100</span><small>Trust Score</small></div></div><div className="result-grid">{[["📸","Photo consistency","2–3 photos checked"],["🎥","Making proof","15–30 sec evidence"],["🤖","Product–Process Match",`${Math.round((verifyResult.confidence||.91)*100)}% match`],["🛡","Originality guard","Duplicate patterns checked"],["✍️","Ownership","Declared by artisan"],["🚩","Risk Score",`${verifyResult.riskScore??8}/100`]].map(x=><div className="result-layer" key={x[1]}><span>{x[0]}</span><b>{x[1]}</b><small>{x[2]}</small></div>)}</div><div className="risk-reasons"><b>AI signals</b>{(verifyResult.riskReasons||["No major automated risk signals detected"]).map((r:string)=><span key={r}>• {r}</span>)}</div></section>}</div><div className="btn-row modern-add-actions">{step==="form"&&<button className="btn add-piece-main" onClick={handleCreateAndScan}>☁ Add Piece &amp; Verify ✨</button>}{step==="result"&&verifyResult?.status!=="rejected"&&<button className="btn green" onClick={()=>go("createReel")}>Create a Reel</button>}{step==="result"&&<button className="btn secondary" onClick={()=>{setToast("Saved to your products");go("myProducts")}}>My Products</button>}</div></>
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
  const [products,setProducts]=useState<any[]>([]),[productId,setProductId]=useState(prefillProductId||""),[caption,setCaption]=useState(""),[category,setCategory]=useState("Pottery"),[tags,setTags]=useState("handmade, process, traditional"),[videoDataUrl,setVideoDataUrl]=useState<string|null>(null),[mode,setMode]=useState("idle"),[err,setErr]=useState<string|null>(null);
  const videoRef=useRef<HTMLVideoElement|null>(null),streamRef=useRef<MediaStream|null>(null),recorderRef=useRef<MediaRecorder|null>(null),chunksRef=useRef<Blob[]>([]);
  useEffect(()=>{apiGet("/products").then(all=>{const mine=all.filter((p:any)=>p.artisanId===user.id&&p.verificationStatus!=="rejected");setProducts(mine);if(prefillProductId){const p=mine.find((x:any)=>x.id===prefillProductId);if(p)setCategory(p.category)}})},[user.id,prefillProductId]);
  async function startRecording(){try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1080},height:{ideal:1920}},audio:true});streamRef.current=stream;if(videoRef.current){videoRef.current.srcObject=stream;videoRef.current.play()}chunksRef.current=[];const rec=new MediaRecorder(stream);rec.ondataavailable=e=>{if(e.data.size)chunksRef.current.push(e.data)};rec.onstop=()=>{const blob=new Blob(chunksRef.current,{type:"video/webm"}),r=new FileReader();r.onload=()=>setVideoDataUrl(r.result as string);r.readAsDataURL(blob);stream.getTracks().forEach(t=>t.stop())};rec.start();recorderRef.current=rec;setMode("recording");setTimeout(()=>{if(recorderRef.current?.state==="recording")recorderRef.current.stop();setMode("idle")},30000)}catch(e:any){setErr("Camera access failed. You can upload a Reel from Gallery. "+(e.message||""))}}
  function stopRecording(){recorderRef.current?.stop();setMode("idle")}
  async function upload(e:any){const f=e.target.files?.[0];if(!f)return;try{setVideoDataUrl(await fileToDataURL(f));setErr(null)}catch{setErr("Could not read this video.")}}
  async function post(){if(!videoDataUrl){setErr("Record or upload a Reel first.");return}if(!caption.trim()){setErr("Add a short caption.");return}try{await apiPost("/reels",{artisanId:user.id,productId:productId||null,video:videoDataUrl,thumbEmoji:CATEGORY_EMOJI[category]||"🎨",caption,category,tags:tags.split(",").map((t:string)=>t.trim()).filter(Boolean)});setToast("Reel posted 🎬");go("myReels")}catch(e:any){setErr(e.message||"Could not post Reel")}}
  useEffect(()=>()=>streamRef.current?.getTracks().forEach(t=>t.stop()),[]);
  const linked=products.find(p=>p.id===productId);
  return <><div className="reel-create-modern"><div className="reel-top"><button className="header-back" onClick={()=>go("myReels")}>‹</button><div className="add-brand">🌿 <b>KalaSutra</b><small>Artisans to the World</small></div><button className="mode-pill" onClick={()=>go("myReels")}>Save Draft</button></div><h1>Create a Reel</h1><p>Capture your craft story and share it with the world.</p><div className="reel-editor-grid"><div className="reel-camera"><div className="reel-view">{videoDataUrl?<video src={videoDataUrl} controls/>:mode==="recording"?<video ref={videoRef} muted/>:<><div className="camera-script">Capture Your Craft<br/>Share Your Story ♡</div><div className="camera-tools"><span>♫<small>Music</small></span><span>◷<small>Timer</small></span><span>1×<small>Speed</small></span><span>✦<small>Filters</small></span></div></>}</div><div className="reel-camera-actions"><label>🖼<small>Gallery<input type="file" accept="video/*" onChange={upload}/></small></label><button onClick={mode==="recording"?stopRecording:startRecording}>{mode==="recording"?"⏹":"●"}<small>{mode==="recording"?"Stop":"Tap to record"}</small></button><span>✦<small>Effects</small></span></div></div><div className="reel-details"><div className="reel-preview-card">{videoDataUrl?<video src={videoDataUrl} controls/>:<div className="empty-note">Your Reel preview appears here</div>}<div className="stories-callout">Stories Behind<br/>Handmade Matter ♡</div></div><label>✎ Caption<textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="e.g. Making this piece takes days of hard work, patience and love…"/></label><label>▣ Attach Product <select value={productId} onChange={e=>setProductId(e.target.value)}><option value="">No product — just my process</option>{products.map(p=><option key={p.id} value={p.id}>{p.title} · {p.uniqueProductId}</option>)}</select></label>{linked&&<div className="linked-product">✓ Linked: {linked.title}<small>{linked.uniqueProductId}</small></div>}<label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{Object.keys(CATEGORY_EMOJI).map(c=><option key={c}>{c}</option>)}</select></label><label>Tags<input value={tags} onChange={e=>setTags(e.target.value)}/></label><button className="btn post-reel-main" onClick={post}>☁ Post Reel</button></div></div></div><div className="reel-footer-quote">“Every craft has a story. Tell yours.” ♥</div></>
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
  const [photo,setPhoto]=useState(user.profile?.photo||""),[saving,setSaving]=useState(false),[bio,setBio]=useState(user.profile?.bio||""),[location,setLocation]=useState(user.profile?.location||"Rajasthan, India");
  async function save(){setSaving(true);try{const u=await apiPut(`/users/${user.id}`,{profile:{...user.profile,photo,bio,location}});Object.assign(user,u);alert("Profile updated");}catch(e:any){alert(e.message||"Could not update profile")}finally{setSaving(false)}}
  async function pick(e:any){const f=e.target.files?.[0];if(!f)return;try{setPhoto(await fileToDataURL(f))}catch(_){}}
  return <div className="content profile-modern"><div className="profile-banner artisan-banner"><div className="profile-photo-wrap"><img src={photo||"/assets/avatar-artisan.png"}/><label>📷<input type="file" accept="image/*" onChange={pick}/></label></div><div><h1>{user.name} ✓</h1><h3>Master Artisan</h3><p>“Keeping our traditions alive, one creation at a time.”</p><span>🌿 Handcrafted</span><span>🧺 Traditional</span><span>🌱 Sustainable</span></div><button className="btn secondary">✎ Edit Profile</button></div><div className="profile-trust"><div><b>TRUST SCORE</b><div className="trust-progress"><i style={{width:`${user.profile?.trustScore??100}%`}}/></div><strong>{user.profile?.trustScore??100}/100</strong></div><div><b>♛ Top Artisan</b><small>Keep creating magic!</small></div></div><div className="profile-stats"><div>▣ <b>12</b><small>Products Listed</small></div><div>◉ <b>248</b><small>Profile Views</small></div><div>🛒 <b>36</b><small>Orders Received</small></div><div>★ <b>4.9</b><small>Buyer Rating</small></div></div><div className="profile-edit-fields"><label>Profile Photo<input type="file" accept="image/*" onChange={pick}/></label><label>Location<input value={location} onChange={e=>setLocation(e.target.value)}/></label><label>Bio<textarea value={bio} onChange={e=>setBio(e.target.value)}/></label><button className="btn" onClick={save}>{saving?"Saving…":"Save Profile"}</button></div><button className="btn secondary" onClick={()=>go("reviews")}>🛡 Safety & Review Center</button><button className="btn secondary" onClick={onLogout}>Log out</button></div>
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

  useEffect(() => { apiGet(`/products`).then(setProducts).catch((e) => setErr(e.message)); }, []);

  const filtered = products.filter((p) => {
    if (!query.trim()) return true;
    const hay = `${p.title} ${p.category} ${p.craftInfo?.material || ""} ${p.craftInfo?.region || ""}`.toLowerCase();
    return query.toLowerCase().split(" ").filter(Boolean).every((w) => hay.includes(w));
  });

  async function voiceSearch() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setErr('Voice search is not supported in this browser.'); return; }
    const ok = await requestVoicePermission();
    if (!ok) { setErr('Please allow microphone access for voice search.'); return; }
    const r = new SR(); r.lang = "hi-IN"; r.interimResults = false; r.maxAlternatives = 1;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); setErr('Voice search could not start. Please try again.'); };
    r.onresult = (e: any) => setQuery(e.results[0][0].transcript);
    try { r.start(); } catch (_) {}
  }

  return (
    <>
      <div className="buyer-hero-header">
        <div>
          <div className="buyer-kicker">KALASUTRA MARKETPLACE</div>
          <h2>Hello, {user.name} <span className="hello-dot">✦</span></h2>
          <div className="sub">Discover stories behind every handmade piece.</div>
        </div>
        <button className="buyer-wishlist-head" onClick={() => go("wishlist")} aria-label="Saved pieces">
          <Icon name="heart" />{wishlist.length > 0 && <b>{wishlist.length}</b>}
        </button>
      </div>
      <div className="content buyer-content">
        <ErrorBanner message={err} />
        <div className="smart-search">
          <Icon name="search" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pottery, textiles, wood decor…" />
          <button className={listening ? "voice-search listening" : "voice-search"} onClick={voiceSearch} aria-label="Voice search">🎙</button>
        </div>
        <div className="buyer-shortcuts">
          <button onClick={() => go("wishlist")}><Icon name="heart" /> Saved {wishlist.length ? `(${wishlist.length})` : ""}</button>
          <button onClick={() => go("buyerReels")}><Icon name="reels" /> Maker Reels</button>
          <button onClick={() => go("cart")}><Icon name="cart" /> Cart {cartCount ? `(${cartCount})` : ""}</button>
        </div>
        <div className="section-row"><div className="section-title" style={{ margin: 0 }}>{query ? `Results for "${query}"` : "For you"}</div><span className="view-all" onClick={() => go("buyerReels")}>Explore Reels →</span></div>
        {filtered.length === 0 ? (
          <div className="empty-note">No pieces match your search — try a different craft, material, or region.</div>
        ) : (
          <div className="grid">
            {filtered.map((p) => (
              <div key={p.id} data-featured={p.id === "p5" ? "true" : undefined} className="card buyer-product-card" onClick={() => openProduct(p.id)}>
                <div className="thumb" style={{ backgroundImage: `url(${p.image})` }}>
                  <BadgeLabel status={p.verificationStatus} />
                  <button className="card-icon-btn card-heart" onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}>{wishlist.includes(p.id) ? "❤️" : "🤍"}</button>
                  <span className="emoji">{CATEGORY_EMOJI[p.category] || "🎨"}</span>
                </div>
                <div className="info">
                  <div className="t">{p.title}</div>
                  <div className="buyer-card-bottom">
                    <div className="p">₹{p.price.toLocaleString("en-IN")}</div>
                    <button className="quick-cart-btn" onClick={(e) => { e.stopPropagation(); addToCart(p.id); setToast("Added to cart 🛍️"); }}>＋ Add to cart</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="floating-cart-wrap">
        {cartCount > 0 && <button className="floating-cart" onClick={() => go("cart")}><span className="mini-cart-icon"><Icon name="cart" /></span><span><strong>View cart</strong><small>{cartCount} item{cartCount > 1 ? "s" : ""}</small></span><b>›</b></button>}
      </div>
      <AITalker role="buyer" go={go} />
    </>
  );
}

// ---------------------------------------------------------------------------
// BUYER: PRODUCT DETAIL
// ---------------------------------------------------------------------------
function ProductDetailScreen({ productId, go, back, setToast, wishlist, toggleWishlist, addToCart, userId }: any) {
  const [product,setProduct]=useState<any>(null),[selectedImage,setSelectedImage]=useState<string|null>(null),[err,setErr]=useState<string|null>(null),[reported,setReported]=useState(false),[customOpen,setCustomOpen]=useState(false),[customRequest,setCustomRequest]=useState(""),[customizing,setCustomizing]=useState(false),[customId,setCustomId]=useState<string|null>(null),[reviews,setReviews]=useState<any[]>([]),[review,setReview]=useState(""),[rating,setRating]=useState(5),[sendingReview,setSendingReview]=useState(false);
  useEffect(()=>{apiGet(`/products/${productId}`).then(p=>{setProduct(p);setSelectedImage(p.image||null)}).catch(e=>setErr(e.message));apiGet(`/product-reviews/${productId}`).then(setReviews).catch(()=>setReviews([]))},[productId]);
  if(err)return <div className="content"><ErrorBanner message={err}/><button className="btn secondary" onClick={back}>Go back</button></div>;
  if(!product)return <div className="content"><div className="empty-note">Loading…</div></div>;
  const imgs=Array.isArray(product.gallery)&&product.gallery.length?product.gallery:[product.image].filter(Boolean),delivery=99,total=product.price+delivery,trust=product.trustScore??91;
  async function submitReview(){if(!review.trim())return;setSendingReview(true);try{const r=await apiPost(`/product-reviews/${product.id}`,{buyerId:userId,rating,comment:review});setReviews(v=>[r,...v]);setReview("");setToast("Review added — thank you for supporting the artisan.");}catch(e:any){setToast(e.message||"Could not add review")}finally{setSendingReview(false)}}
  return <><div className="detail-modern"><div className="detail-gallery"><div className="detail-thumbs">{imgs.map((img:string,i:number)=><button key={i} className={selectedImage===img?"active":""} onClick={()=>setSelectedImage(img)}><img src={img}/></button>)}</div><div className="detail-photo real-photo-hero" style={{backgroundImage:`url(${selectedImage||product.image})`}}><button className="close-btn" onClick={back}>‹</button><span className="detail-badge">🌿 Handmade</span></div></div>
  <div className="detail-info"><div className="artisan-mini"><div className="artisan-avatar"><img src={product.artisan?.profile?.photo||"/assets/avatar-artisan.png"}/></div><div><b>{product.artisan?.name||"KalaSutra Artisan"}</b><small>⌖ {product.artisan?.profile?.location||"India"}</small></div><span>✓ Verified Artisan</span></div><h1>{product.title}</h1><p className="detail-desc">{product.description}</p><div className="rating-line">★★★★★ <b>{(reviews.reduce((s:number,r:any)=>s+r.rating,0)/(reviews.length||1)).toFixed(1)}</b> <span>({reviews.length} reviews)</span> · {product.sold||0} sold</div>
  <div className="trust-card"><div className="qr-wrap"><img alt="Product QR" src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(window.location.origin+"/?certificate="+(product.uniqueProductId||product.id))}`}/></div><div><small>DIGITAL PRODUCT ID</small><strong>{product.uniqueProductId||"KS-ART-000001"}</strong><p>✓ Unique ID for this handmade piece</p><b className="verified-text">AI Verified • Trust Score {trust}/100</b></div></div>
  <div className="customize-card"><div><span className="field-label">MAKE IT YOURS</span><strong>Customize this unique piece</strong><small>Personalize with a name, colour, size or small design change.</small></div><button className="btn secondary" onClick={()=>setCustomOpen(v=>!v)}>Customize for ₹100 →</button>{customOpen&&<div className="customize-form"><textarea value={customRequest} onChange={e=>setCustomRequest(e.target.value)} placeholder="e.g. Add my name 'Harsh' and change the colour to blue"/><button className="btn" disabled={customizing} onClick={async()=>{if(!customRequest.trim()){setToast("Please describe your customization");return}setCustomizing(true);try{const c=await apiPost("/customizations",{productId:product.id,buyerId:userId,request:customRequest,charge:100});setCustomId(c.customizationId);setToast("Customization request created");setCustomRequest("")}catch(e:any){setToast(e.message||"Customization failed")}finally{setCustomizing(false)}}}>{customizing?"Saving…":"Request customization • ₹100"}</button>{customId&&<div className="location-fill-note">✓ Customization ID: <b>{customId}</b> · Product ID stays <b>{product.uniqueProductId}</b></div>}</div>}</div>
  <div className="benefit-row"><span>🌿<b>Sustainable</b><small>Materials</small></span><span>🖐<b>100%</b><small>Handmade</small></span><span>🚚<b>Supports</b><small>Rural Artisans</small></span><span>♡<b>{Math.round((product.price/total)*100)}%</b><small>to the Maker</small></span></div>
  <div className="checkout-box"><div className="checkout-row"><span>Product price</span><b>₹{product.price.toLocaleString("en-IN")}</b></div><div className="checkout-row"><span>Delivery charge</span><b>₹{delivery}</b></div><div className="checkout-row total"><span>Final price</span><b>₹{total.toLocaleString("en-IN")}</b></div><button className="btn add-cart-large" onClick={()=>{addToCart(product.id);setToast("Added to Cart")}}>🛒 Add to Cart</button><div className="split-actions"><button className="btn secondary">🎁 Buy as Gift</button><button className="btn secondary" onClick={()=>toggleWishlist(product.id)}>♡ Save for Later</button></div></div>
  <div className="product-report" onClick={()=>{if(!reported){setReported(true);setToast("Reported — human review will check the evidence.")}}}>{reported?"✓ Reported — under human review":"🚩 Report Product / Suspicious activity"}</div></div></div>
  <div className="content product-lower"><div className="detail-tabs"><b>Details</b><span>Artisan Story</span><span>Reviews ({reviews.length})</span><span>Shipping</span><span>Report</span></div><div className="verification-detail-card"><div><h2>🛡 AI Verification</h2><p>High-level evidence gives buyers confidence without replacing human judgement.</p></div><div className="verification-detail-grid">{[["📸","Photos","2–3 views checked"],["🎥","Making proof","15–30 sec mandatory"],["🤖","Process Match",`${trust}% confidence`],["🛡","Originality","Duplicate guard"],["✍️","Ownership","Artisan declared"],["🚩","Risk Score",`${product.riskScore??9}/100`]].map(x=><div key={x[1]}><span>{x[0]}</span><b>{x[1]}</b><small>{x[2]}</small></div>)}</div><BadgeLabel status={product.verificationStatus}/></div>
  <section className="reviews-section"><div className="section-head"><h2>Customer Reviews</h2><b>★★★★★ {reviews.length? (reviews.reduce((s:number,r:any)=>s+r.rating,0)/reviews.length).toFixed(1):"New"}</b></div>{reviews.length?reviews.slice(0,5).map((r:any)=><article className="review-card" key={r.id}><div className="review-avatar">👤</div><div><b>{r.buyerName||"Verified Buyer"}</b><small>{new Date(r.createdAt).toLocaleDateString("en-IN")}</small><div className="stars">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</div><p>{r.comment}</p></div></article>):<div className="empty-note">Be the first buyer to review this handmade piece.</div>}<div className="write-review"><h3>Leave a review</h3><div className="star-picker">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setRating(n)} className={n<=rating?"on":""}>★</button>)}</div><textarea value={review} onChange={e=>setReview(e.target.value)} placeholder="Tell other buyers about the craft, quality and your experience…"/><button className="btn" onClick={submitReview} disabled={sendingReview}>{sendingReview?"Posting…":"Post Review"}</button></div></section></div></> 
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

function OrderTrackingCard({ order, isArtisan }: { order: any; isArtisan: boolean }) {
  const raw = String(order?.status || "placed").toLowerCase();
  const status = raw === "paid" ? "placed" : raw;
  const steps = [
    { id: "placed", title: "Order placed", sub: "Your order is confirmed", icon: "✓" },
    { id: "processing", title: "Being prepared", sub: "Artisan is preparing your craft", icon: "✦" },
    { id: "shipped", title: "On the way", sub: "Your handmade piece is travelling", icon: "↗" },
    { id: "delivered", title: "Delivered", sub: "Handmade story reached you", icon: "♥" },
  ];
  const idx = Math.max(0, steps.findIndex(s => s.id === status));
  return (
    <div className="order-tracker-card">
      <div className="tracker-head"><div><span className="tracker-kicker">LIVE ORDER JOURNEY</span><h3>{isArtisan ? "Buyer delivery journey" : "Your handmade journey"}</h3></div><span className="tracker-id">#{String(order.id || "KS-ORDER").slice(-8)}</span></div>
      <div className="truck-track">
        <div className="truck-line"><div className="truck-progress" style={{width: `${Math.max(12, (idx / (steps.length-1))*100)}%`}} /></div>
        <div className="moving-truck" style={{left: `${Math.min(92, Math.max(4, (idx/(steps.length-1))*88))}%`}}>🚚</div>
      </div>
      <div className="tracker-steps">
        {steps.map((s,i) => <div key={s.id} className={`tracker-step ${i <= idx ? "done" : ""} ${i === idx ? "current" : ""}`}>
          <div className="tracker-dot">{i < idx ? "✓" : s.icon}</div><div><b>{s.title}</b><small>{s.sub}</small></div>
        </div>)}
      </div>
    </div>
  );
}

function OrdersScreen({ user }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [trackingId, setTrackingId] = useState<string | null>(null);
  useEffect(() => { apiGet(`/orders?userId=${user.id}`).then(setOrders).catch(() => setOrders([])); }, [user.id]);
  const isArtisan = user.role === "artisan";
  const statusLabel: any = { placed: "New Orders", processing: "Processing", shipped: "Shipped", delivered: "Delivered", paid: "New Orders" };
  const filtered = statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter);
  const earnings = isArtisan ? orders.reduce((sum, o) => sum + (o.artisanItems || []).reduce((s:any, p:any) => s + Number(p.price || 0) * Number(p.qty || 0), 0), 0) : 0;
  return (<>
    <div className="app-header order-page-head"><div><span className="page-kicker">KALASUTRA</span><h2>{isArtisan ? "Orders & Earnings" : "Your Orders"}</h2><div className="sub">{isArtisan ? "Manage your artisan business" : "Track every handmade purchase"}</div></div><div className="order-head-icon">🚚</div></div>
    <div className="content orders-modern">
      {isArtisan && <div className="artisan-order-summary">
        <div><small>EARNINGS</small><strong>₹{earnings.toLocaleString("en-IN")}</strong></div>
        <div><small>NEW ORDERS</small><strong>{orders.filter(o => ["placed","paid"].includes(o.status)).length}</strong></div>
        <div><small>DELIVERED</small><strong>{orders.filter(o => o.status === "delivered").length}</strong></div>
      </div>}
      {isArtisan && <div className="order-filter-row">{[["all","All"],["placed","New Orders"],["processing","Processing"],["shipped","Shipped"],["delivered","Delivered"]].map(([v,l]) => <button key={v} className={statusFilter===v?"active":""} onClick={()=>setStatusFilter(v)}>{l}</button>)}</div>}
      {filtered.length === 0 ? <div className="empty-order-state"><div>🧺</div><b>{isArtisan ? "No artisan orders yet" : "Your handmade journey starts here"}</b><span>{isArtisan ? "Orders will appear here when buyers purchase your creations." : "Your confirmed purchases will appear here with live tracking."}</span></div> : filtered.map((o) => {
        const items = isArtisan ? (o.artisanItems || []) : (o.products || []);
        const total = isArtisan ? items.reduce((s:any,p:any)=>s+Number(p.price||0)*Number(p.qty||0),0) : Number(o.amount||0);
        const open = trackingId === o.id;
        return <div className={`order-card-modern ${open ? "expanded" : ""}`} key={o.id}>
          <div className="order-card-top">
            <div className="order-thumb">{items[0]?.image ? <img src={items[0].image} /> : "🪔"}</div>
            <div className="order-main-info"><span className="order-number">ORDER #{String(o.id || "").slice(-8)}</span><strong>{items.map((p:any)=>p.title).join(", ") || "Handmade creation"}</strong><small>₹{total.toLocaleString("en-IN")} · {new Date(o.date).toLocaleDateString("en-IN")}</small></div>
            <span className={`order-status status-${o.status}`}>{statusLabel[o.status] || o.status}</span>
          </div>
          <div className="order-card-actions"><button onClick={()=>setTrackingId(open ? null : o.id)}>{open ? "Hide journey" : "🚚 Track order"}</button>{!isArtisan && <button className="order-review-link" onClick={()=>alert("Review option: rate your handmade purchase after delivery.")}>★ Review</button>}</div>
          {open && <OrderTrackingCard order={o} isArtisan={isArtisan} />}
        </div>;
      })}
    </div>
  </>);
}

function BuyerProfileScreen({ user, onLogout }: any) {
  const [photo,setPhoto]=useState(user.profile?.photo||""),[saving,setSaving]=useState(false);
  async function pick(e:any){const f=e.target.files?.[0];if(!f)return;setPhoto(await fileToDataURL(f))}
  async function save(){setSaving(true);try{const u=await apiPut(`/users/${user.id}`,{profile:{...user.profile,photo}});Object.assign(user,u);alert("Profile photo saved");}catch(e:any){alert(e.message||"Could not save")}finally{setSaving(false)}}
  return <div className="content profile-modern"><div className="profile-banner buyer-banner"><div className="profile-photo-wrap"><img src={photo||"/assets/avatar-artisan.png"}/><label>📷<input type="file" accept="image/*" onChange={pick}/></label></div><div><h1>{user.name}</h1><h3>🌿 Conscious Buyer</h3><p>“Supporting artisans, preserving traditions and bringing handmade stories home.”</p><span>⌖ India</span><span>🌎 Exploring global crafts</span><span>♥ Handmade · Sustainable · Meaningful</span></div><button className="btn secondary">✎ Edit Profile</button></div><div className="profile-stats"><div>▣ <b>12</b><small>Orders Placed</small></div><div>♥ <b>28</b><small>Items Liked</small></div><div>◉ <b>46</b><small>Artisans Followed</small></div><div>★ <b>4.8</b><small>Average Rating</small></div></div><div className="impact-card"><h2>🌿 Your Impact</h2><p>Every purchase empowers an artisan.</p><div><b>12</b><small>Artisans Supported</small><b>28</b><small>Handmade Pieces</small><b>3</b><small>Regions Explored</small></div></div><div className="quick-actions"><button>▣<b>My Orders</b></button><button>♥<b>My Wishlist</b></button><button>👥<b>Saved Artisans</b></button><button>⌖<b>Addresses</b></button></div><div className="profile-edit-fields"><label>Change Profile Photo<input type="file" accept="image/*" onChange={pick}/></label><button className="btn" onClick={save}>{saving?"Saving…":"Save Profile"}</button></div><button className="btn secondary" onClick={onLogout}>Log out</button></div>
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
      <AITalker compact role={isArtisan ? "artisan" : "buyer"} go={go} />
      <Toast message={toast} />
      {showPermissions && <PermissionCenter onClose={closePermissions} />}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
