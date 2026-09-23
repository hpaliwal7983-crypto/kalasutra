/* Add this near the existing V6 app render/router code.
 * Do NOT replace your V6 app.tsx/app.js.
 */

// 1) Load the CSS + JS files from this add-on in index.html, OR copy their contents
//    into your existing asset pipeline.
//
// 2) After the existing V6 `go()` function is available:
//
//    window.__KALASUTRA_GO__ = go;
//    window.KalaSutraV7.mount({ go, open: false });
//
// 3) If you want the Warm Welcome Center to open automatically on the artisan dashboard:
//
//    window.KalaSutraV7.mount({ go, open: true, autoWelcome: true });
//
// 4) When your V6 router changes screens, optionally expose the current screen:
//
//    window.__KALASUTRA_SCREEN__ = screen;
//
// 5) Add Product integration events. In the existing AddProductScreen, after the
//    relevant step changes, dispatch one of these:
//
//    window.dispatchEvent(new CustomEvent('kalasutra:copilot-flow', { detail: { step: 'photos' } }));
//    window.dispatchEvent(new CustomEvent('kalasutra:copilot-flow', { detail: { step: 'details' } }));
//    window.dispatchEvent(new CustomEvent('kalasutra:copilot-flow', { detail: { step: 'video' } }));
//    window.dispatchEvent(new CustomEvent('kalasutra:copilot-flow', { detail: { step: 'review' } }));
//
// The voice command “Aaj mujhe ek product add karna hai” already routes to addProduct.
