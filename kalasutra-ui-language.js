/* Isolated UI localization companion: translates interface copy without changing V6 layout or routes. */
(() => {
  const langs = { hi:"Hindi", en:"English", mr:"Marathi", gu:"Gujarati", pa:"Punjabi", bn:"Bengali", ta:"Tamil", te:"Telugu", kn:"Kannada", ml:"Malayalam", or:"Odia", ur:"Urdu" };
  const originals = new WeakMap();
  const suppressedMutations = new WeakMap();
  const cache = new Map();
  const pending = new Set();
  const unavailable = new Set();
  let locale = (localStorage.getItem("kalasutra_language") || "hi").slice(0, 2);
  let busy = false, timer = 0;
  function setText(node, value) {
    if (!node || node.nodeValue === value) return;
    suppressedMutations.set(node, (suppressedMutations.get(node) || 0) + 1);
    node.nodeValue = value;
  }
  function skip(node) {
    const parent = node.parentElement;
    if (!parent || !node.textContent.trim()) return true;
    if (node.textContent.trim().length > 110 || /^([\d\s₹$.,%+\-/:#]+|https?:\/\/\S+)$/.test(node.textContent.trim())) return true;
    if (parent.closest("script,style,textarea,input,select,option,svg,[contenteditable='true'],[data-no-translate],.product-card,.home-product-card,.product-title,.artisan-profile-page,.profile-identity,.reel-card,.review-card")) return true;
    return false;
  }
  function original(node) { if (!originals.has(node)) originals.set(node, node.textContent); return originals.get(node); }
  function queue(node) {
    if (skip(node)) return;
    const text = original(node).trim();
    if (!text || text.length > 110 || locale === "en") { if (locale === "en" && originals.has(node)) setText(node, originals.get(node)); return; }
    const key = `${locale}\n${text}`;
    if (cache.has(key)) { setText(node, cache.get(key)); return; }
    pending.add(node);
    clearTimeout(timer); timer = setTimeout(flush, 120);
  }
  async function flush() {
    if (busy || !pending.size) return;
    if (locale === "en" || unavailable.has(locale)) { pending.clear(); return; }
    busy = true;
    const requestLocale = locale;
    const nodes = [...pending].filter(n => n.isConnected && !skip(n)); pending.clear();
    const unique = [...new Set(nodes.map(n => original(n).trim()))];
    try {
      const response = await fetch("/api/ai/translate", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ locale:requestLocale, texts:unique }) });
      if (!response.ok) throw new Error("Translation service unavailable");
      const data = await response.json();
      unique.forEach((text, i) => cache.set(`${requestLocale}\n${text}`, String(data.translations?.[i] || text)));
      if (locale === requestLocale) nodes.forEach(n => { const translated = cache.get(`${requestLocale}\n${original(n).trim()}`); if (translated) setText(n, translated); });
    } catch (_) { unavailable.add(requestLocale); /* Keep the original V6 text available if online translation is not configured. */ }
    busy = false;
    if (pending.size) flush();
  }
  function scan(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node; while ((node = walker.nextNode())) queue(node);
  }
  window.addEventListener("kalasutra:language-changed", event => {
    const next = String(event.detail?.code || event.detail?.locale || localStorage.getItem("kalasutra_language") || "hi").slice(0, 2);
    if (!langs[next]) return;
    locale = next;
    document.documentElement.lang = next;
    scan(document.body);
  });
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === "characterData") {
        const suppressed = suppressedMutations.get(record.target) || 0;
        if (suppressed) {
          if (suppressed === 1) suppressedMutations.delete(record.target);
          else suppressedMutations.set(record.target, suppressed - 1);
          continue;
        }
        // Keep the first source string across React updates and language changes.
        if (!originals.has(record.target)) originals.set(record.target, record.oldValue || "");
        queue(record.target);
      }
      else record.addedNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) queue(n); else if (n.nodeType === Node.ELEMENT_NODE) scan(n); });
    }
  }).observe(document.documentElement, { childList:true, subtree:true, characterData:true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => scan(document.body), { once:true }); else scan(document.body);
})();
