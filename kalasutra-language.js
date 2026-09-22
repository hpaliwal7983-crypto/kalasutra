/* KalaSutra Language Layer — role-first, inline selector */
(function () {
  "use strict";
  const LANGS = [
    { code: "hi", label: "हिन्दी", voice: "hi-IN" },
    { code: "en", label: "English", voice: "en-IN" },
    { code: "mr", label: "मराठी", voice: "mr-IN" },
    { code: "gu", label: "ગુજરાતી", voice: "gu-IN" },
    { code: "pa", label: "ਪੰਜਾਬੀ", voice: "pa-IN" },
    { code: "bn", label: "বাংলা", voice: "bn-IN" },
    { code: "ta", label: "தமிழ்", voice: "ta-IN" },
    { code: "te", label: "తెలుగు", voice: "te-IN" },
    { code: "kn", label: "ಕನ್ನಡ", voice: "kn-IN" },
    { code: "ml", label: "മലയാളം", voice: "ml-IN" },
    { code: "or", label: "ଓଡ଼ିଆ", voice: "or-IN" },
    { code: "ur", label: "اردو", voice: "ur-IN" }
  ];
  const COPY = {
    hi: { label: "भाषा", hint: "अपनी भाषा चुनें" },
    en: { label: "Language", hint: "Choose your language" },
    mr: { label: "भाषा", hint: "तुमची भाषा निवडा" },
    gu: { label: "ભાષા", hint: "તમારી ભાષા પસંદ કરો" },
    pa: { label: "ਭਾਸ਼ਾ", hint: "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ" },
    bn: { label: "ভাষা", hint: "আপনার ভাষা বেছে নিন" },
    ta: { label: "மொழி", hint: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்" },
    te: { label: "భాష", hint: "మీ భాషను ఎంచుకోండి" },
    kn: { label: "ಭಾಷೆ", hint: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ" },
    ml: { label: "ഭാഷ", hint: "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക" },
    or: { label: "ଭାଷା", hint: "ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ" },
    ur: { label: "زبان", hint: "اپنی زبان منتخب کریں" }
  };
  function getLanguage(){ return localStorage.getItem('kalasutra_language') || 'hi'; }
  function getVoice(){ return (LANGS.find(x=>x.code===getLanguage()) || LANGS[0]).voice; }
  function setLanguage(code){
    const safe = LANGS.some(x=>x.code===code) ? code : 'hi';
    localStorage.setItem('kalasutra_language', safe);
    localStorage.setItem('kalasutra_voice_lang', (LANGS.find(x=>x.code===safe)||LANGS[0]).voice);
    document.documentElement.setAttribute('data-kalasutra-lang', safe);
    window.dispatchEvent(new CustomEvent('kalasutra:language-changed',{detail:{code:safe,voice:getVoice()}}));
  }
  function mountInline(){
    const role = document.querySelector('.role-options');
    if(!role || document.querySelector('.ks-inline-language')) return;
    const wrap = document.createElement('div');
    wrap.className='ks-inline-language';
    const select=document.createElement('select');
    select.id='ks-role-language';
    LANGS.forEach(l=>{ const o=document.createElement('option'); o.value=l.code; o.textContent=l.label; if(l.code===getLanguage()) o.selected=true; select.appendChild(o); });
    wrap.innerHTML='<div class="ks-inline-language-copy"><strong></strong><span></span></div>';
    wrap.appendChild(select);
    role.parentNode.insertBefore(wrap, role.nextSibling);
    const update=()=>{
      const c=COPY[getLanguage()]||COPY.hi;
      wrap.querySelector('strong').textContent=c.label;
      wrap.querySelector('span').textContent=c.hint;
      select.value=getLanguage();
    };
    select.addEventListener('change',e=>{ setLanguage(e.target.value); update(); });
    update();
  }
  window.KalaSutraLanguage={LANGS,getLanguage,getVoice,setLanguage,mount:mountInline};
  const observe=()=>{
    mountInline();
    if(!window.__KS_LANGUAGE_OBSERVER){
      const obs=new MutationObserver(()=>mountInline());
      obs.observe(document.body,{childList:true,subtree:true});
      window.__KS_LANGUAGE_OBSERVER=obs;
    }
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',observe,{once:true}); else observe();
})();
