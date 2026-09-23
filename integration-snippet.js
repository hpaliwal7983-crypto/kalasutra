/*
 * V6 integration — keep your V6 UI and router intact.
 * Do NOT replace app.tsx/app.js.
 */

// 1) Load these two addon files once, after React/ReactDOM are available:
//    frontend/karigar-warm-welcome-v7.js
//    frontend/karigar-warm-welcome-v7.css

// 2) After your existing V6 go(screen) function exists:
//    window.__KALASUTRA_GO__ = go;
//    window.KalaSutraV7.mount({ go, open: false });

// 3) Change ONLY the existing V6 “Start Talking” button handler to:
//    onClick={() => window.KalaSutraV7.startConversation()}
//    Keep the button/UI itself exactly as it is.

// 4) Or, from any existing V6 voice-command handler, call:
//    window.KalaSutraV7.runCommand(transcript);
//    Example transcript: “Aaj mujhe ek product add karna hai.”
//
//    The Warm Welcome Center will appear, respond in voice, and the
//    Realtime assistant can call open_add_product to route to your
//    EXISTING V6 Add Product screen.

// 5) Optional current-screen hook:
//    window.__KALASUTRA_SCREEN__ = screen;

// 6) When Add Product advances, dispatch these events if you want the avatar
//    to guide each step:
//    window.dispatchEvent(new CustomEvent('kalasutra:copilot-flow', { detail: { step:'photos' } }));
//    window.dispatchEvent(new CustomEvent('kalasutra:copilot-flow', { detail: { step:'details' } }));
//    window.dispatchEvent(new CustomEvent('kalasutra:copilot-flow', { detail: { step:'video' } }));
//    window.dispatchEvent(new CustomEvent('kalasutra:copilot-flow', { detail: { step:'review' } }));
