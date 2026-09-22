/* KalaSutra Language — role-screen inline selector only.
   IMPORTANT: No startup language overlay/popup.
   Language is selected after Artisan/Buyer role appears.
*/
(function () {
  "use strict";

  const LANGS = [
    {code:"hi",label:"हिंदी",voice:"hi-IN"},
    {code:"en",label:"English",voice:"en-IN"},
    {code:"mr",label:"मराठी",voice:"mr-IN"},
    {code:"gu",label:"ગુજરાતી",voice:"gu-IN"},
    {code:"pa",label:"ਪੰਜਾਬੀ",voice:"pa-IN"},
    {code:"bn",label:"বাংলা",voice:"bn-IN"},
    {code:"ta",label:"தமிழ்",voice:"ta-IN"},
    {code:"te",label:"తెలుగు",voice:"te-IN"},
    {code:"kn",label:"ಕನ್ನಡ",voice:"kn-IN"},
    {code:"ml",label:"മലയാളം",voice:"ml-IN"},
    {code:"or",label:"ଓଡ଼ିଆ",voice:"or-IN"},
    {code:"ur",label:"اردو",voice:"ur-IN"}
  ];

  const COPY = {
    hi:{label:"भाषा",hint:"अपनी भाषा चुनें"},
    en:{label:"Language",hint:"Choose your language"},
    mr:{label:"भाषा",hint:"तुमची भाषा निवडा"},
    gu:{label:"ભાષા",hint:"તમારી ભાષા પસંદ કરો"},
    pa:{label:"ਭਾਸ਼ਾ",hint:"ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ"},
    bn:{label:"ভাষা",hint:"আপনার ভাষা বেছে নিন"},
    ta:{label:"மொழி",hint:"உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்"},
    te:{label:"భాష",hint:"మీ భాషను ఎంచుకోండి"},
    kn:{label:"ಭಾಷೆ",hint:"ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ"},
    ml:{label:"ഭാഷ",hint:"നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക"},
    or:{label:"ଭାଷା",hint:"ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ"},
    ur:{label:"زبان",hint:"اپنی زبان منتخب کریں"}
  };

  function removeLegacyLanguageOverlays(){
    document.querySelectorAll(
      '#kalasutra-language-overlay,.kalasutra-language-overlay,.ks-lang-card,.ks-lang-overlay'
    ).forEach(el => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
  }

  function getLanguage(){
    const code = localStorage.getItem("kalasutra_language") || "hi";
    return LANGS.some(x=>x.code===code) ? code : "hi";
  }

  function getVoice(){
    return (LANGS.find(x=>x.code===getLanguage()) || LANGS[0]).voice;
  }

  function setLanguage(code){
    const safe = LANGS.some(x=>x.code===code) ? code : "hi";
    localStorage.setItem("kalasutra_language",safe);
    localStorage.setItem(
      "kalasutra_voice_lang",
      (LANGS.find(x=>x.code===safe)||LANGS[0]).voice
    );
    document.documentElement.setAttribute("data-kalasutra-lang",safe);
    window.dispatchEvent(new CustomEvent("kalasutra:language-changed",{
      detail:{code:safe,voice:getVoice()}
    }));
  }

  function mountInline(){
    removeLegacyLanguageOverlays();

    const role = document.querySelector(".role-options");
    if(!role || document.querySelector(".ks-inline-language")) return;

    const wrap=document.createElement("div");
    wrap.className="ks-inline-language";

    const copy=document.createElement("div");
    copy.className="ks-inline-language-copy";
    const strong=document.createElement("strong");
    const span=document.createElement("span");
    copy.append(strong,span);

    const select=document.createElement("select");
    select.id="ks-role-language";
    select.setAttribute("aria-label","Choose language");

    LANGS.forEach(l=>{
      const option=document.createElement("option");
      option.value=l.code;
      option.textContent=l.label;
      select.appendChild(option);
    });

    wrap.append(copy,select);
    role.parentNode.insertBefore(wrap,role.nextSibling);

    function update(){
      const code=getLanguage();
      const c=COPY[code]||COPY.hi;
      strong.textContent=c.label;
      span.textContent=c.hint;
      select.value=code;
    }

    select.addEventListener("change",e=>{
      setLanguage(e.target.value);
      update();
    });

    update();
  }

  window.KalaSutraLanguage={
    LANGS,getLanguage,getVoice,setLanguage,mount:mountInline
  };

  function observe(){
    removeLegacyLanguageOverlays();
    mountInline();

    if(!window.__KS_LANGUAGE_OBSERVER){
      const obs=new MutationObserver(()=>{
        removeLegacyLanguageOverlays();
        mountInline();
      });
      obs.observe(document.body,{childList:true,subtree:true});
      window.__KS_LANGUAGE_OBSERVER=obs;
    }
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",observe,{once:true});
  } else {
    observe();
  }
})();
