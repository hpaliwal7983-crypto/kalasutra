/* Isolated UI localization companion: translates interface copy without changing V6 layout or routes. */
(() => {
  const langs = { hi:"Hindi", en:"English", mr:"Marathi", gu:"Gujarati", pa:"Punjabi", bn:"Bengali", ta:"Tamil", te:"Telugu", kn:"Kannada", ml:"Malayalam", or:"Odia", ur:"Urdu" };
  const originals = new WeakMap();
  const cache = new Map();
  const pending = new Set();
  const unavailable = new Set();
  let locale = (localStorage.getItem("kalasutra_language") || "hi").slice(0, 2);
  let busy = false, timer = 0;
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
    if (!text || text.length > 110 || locale === "en") { if (locale === "en" && originals.has(node)) node.textContent = originals.get(node); return; }
    const key = `${locale}\n${text}`;
    if (cache.has(key)) { if (node.textContent !== cache.get(key)) node.textContent = cache.get(key); return; }
    pending.add(node);
    clearTimeout(timer); timer = setTimeout(flush, 120);
  }
  async function flush() {
    if (busy || !pending.size || locale === "en" || unavailable.has(locale)) return;
    busy = true;
    const nodes = [...pending].filter(n => n.isConnected && !skip(n)); pending.clear();
    const unique = [...new Set(nodes.map(n => original(n).trim()))];
    try {
      const response = await fetch("/api/ai/translate", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ locale, texts:unique }) });
      if (!response.ok) throw new Error("Translation service unavailable");
      const data = await response.json();
      unique.forEach((text, i) => cache.set(`${locale}\n${text}`, String(data.translations?.[i] || text)));
      nodes.forEach(n => { const translated = cache.get(`${locale}\n${original(n).trim()}`); if (translated && n.textContent !== translated) n.textContent = translated; });
    } catch (_) { unavailable.add(locale); /* Keep the original V6 text available if online translation is not configured. */ }
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
    if (busy) return;
    for (const record of records) {
      if (record.type === "characterData") {
        // Keep the first source string. Replacing it with each oldValue makes
        // translated nodes bounce back and forth when the user switches locale.
        if (!originals.has(record.target)) originals.set(record.target, record.oldValue || "");
        queue(record.target);
      }
      else record.addedNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) queue(n); else if (n.nodeType === Node.ELEMENT_NODE) scan(n); });
    }
  }).observe(document.documentElement, { childList:true, subtree:true, characterData:true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => scan(document.body), { once:true }); else scan(document.body);
})();
