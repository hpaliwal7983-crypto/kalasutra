/* KalaSutra — Karigar AI V3
   Real conversational layer using the server-side OpenAI proxy.
   No API key is ever placed in browser code.
*/
(function(){
  'use strict';
  window.__KALASUTRA_MODERN_AI__ = true;
  const LANGS=(window.KalaSutraLanguage&&window.KalaSutraLanguage.LANGS)||[
    {code:'hi',label:'हिन्दी',voice:'hi-IN'},{code:'en',label:'English',voice:'en-IN'},
    {code:'mr',label:'मराठी',voice:'mr-IN'},{code:'gu',label:'ગુજરાતી',voice:'gu-IN'},
    {code:'pa',label:'ਪੰਜਾਬੀ',voice:'pa-IN'},{code:'bn',label:'বাংলা',voice:'bn-IN'},
    {code:'ta',label:'தமிழ்',voice:'ta-IN'},{code:'te',label:'తెలుగు',voice:'te-IN'},
    {code:'kn',label:'ಕನ್ನಡ',voice:'kn-IN'},{code:'ml',label:'മലയാളം',voice:'ml-IN'},
    {code:'or',label:'ଓଡ଼ିଆ',voice:'or-IN'},{code:'ur',label:'اردو',voice:'ur-IN'}
  ];
  const LANGNAME={hi:'Hindi',en:'English',mr:'Marathi',gu:'Gujarati',pa:'Punjabi',bn:'Bengali',ta:'Tamil',te:'Telugu',kn:'Kannada',ml:'Malayalam',or:'Odia',ur:'Urdu'};
  let history=[];
  let modal=null;
  let controller=null;
  let lastRole=null;
  let welcomeShown=false;
  let audio=null;

  function getLang(){return localStorage.getItem('kalasutra_language')||'hi';}
  function getVoice(){return (LANGS.find(x=>x.code===getLang())||LANGS[0]).voice;}
  function getLangName(){return LANGNAME[getLang()]||'Hindi';}
  function api(path,body){return fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})}).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'AI request failed');return d;});}

  function fallbackSpeak(text){
    try{ window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang=getVoice(); u.rate=.97; u.pitch=1.02; window.speechSynthesis.speak(u); }catch(_){ }
  }
  async function speak(text){
    if(!text) return;
    try{
      if(audio){try{audio.pause();}catch(_){} audio=null;}
      const r=await fetch('/api/ai/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,language:getLangName()})});
      if(!r.ok) throw new Error('tts');
      const blob=await r.blob();
      const url=URL.createObjectURL(blob);
      audio=new Audio(url);
      audio.onended=()=>{URL.revokeObjectURL(url);};
      await audio.play();
    }catch(_){ fallbackSpeak(text); }
  }

  async function getContext(role){
    const userId=window.__KALASUTRA_USER_ID__||null;
    let orders=[]; let products=[];
    try{ if(userId){ const r=await fetch('/api/orders?userId='+encodeURIComponent(userId)); if(r.ok) orders=await r.json(); } }catch(_){ }
    try{ const r=await fetch('/api/products'); if(r.ok) products=await r.json(); }catch(_){ }
    const today=new Date().toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata'});
    const todayOrders=orders.filter(o=>new Date(o.date||Date.now()).toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata'})===today);
    const activeOrders=orders.filter(o=>!['delivered','cancelled'].includes(o.status));
    let todayEarnings=0;
    if(role==='artisan'){
      todayEarnings=todayOrders.reduce((sum,o)=>sum+(o.artisanItems||[]).reduce((s,p)=>s+Number(p.price||0)*Number(p.qty||0),0),0);
    }
    return {date:today,todayOrders:todayOrders.length,newOrders:todayOrders.filter(o=>['placed','paid'].includes(o.status)).length,activeOrders:activeOrders.length,todayEarnings,productCount:role==='artisan'?products.filter(p=>p.artisanId===userId).length:products.length,recentProducts:products.slice(0,5).map(p=>({title:p.title,price:p.price,category:p.category}))};
  }

  function openAction(action,value){
    window.dispatchEvent(new CustomEvent('kalasutra:ai-action',{detail:{action,value:value||''}}));
  }

  function clearHistory(){history=[];}
  function pushHistory(role,text){history.push({role,text}); if(history.length>12) history=history.slice(-12);}

  async function ask(text,role){
    const message=String(text||'').trim(); if(!message) return;
    pushHistory('user',message);
    render(); setState('THINKING');
    try{
      const context=await getContext(role);
      const d=await api('/api/ai/chat',{message,role,language:getLang(),languageName:getLangName(),history,context,user:{id:window.__KALASUTRA_USER_ID__||'',name:document.querySelector('.artisan-greeting h2')?.textContent||document.querySelector('.buyer-ref-hero h1')?.textContent||''}});
      const reply=d.reply||''; pushHistory('assistant',reply); controller.message=reply; controller.heard=message; controller.action=d.action||null; controller.metrics=d.metrics||context; setState('READY'); render(); await speak(reply); if(d.action) openAction(d.action,d.value||message); return d;
    }catch(err){
      const reply=getLang()==='en'?'I am here. Let’s try that again.':getLang()==='hi'?'Haan, main yahin hoon. Chaliye ek baar phir karte hain.':'I’m here — let’s try that again.';
      pushHistory('assistant',reply); controller.message=reply; setState('READY'); render(); await speak(reply); return {reply,action:null};
    }
  }

  function setState(s){if(!controller)return;controller.state=s;controller.listening=s==='LISTENING';render();}

  function startListening(role){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setState('READY'); controller.message=getLang()==='en'?'Voice recognition is not available here. You can type instead.':'Is browser mein voice recognition available nahi hai. Aap type bhi kar sakte hain.'; render(); return;}
    try{controller.recognition&&controller.recognition.stop();}catch(_){}
    const r=new SR(); controller.recognition=r;
    r.lang=getVoice(); r.interimResults=true; r.maxAlternatives=1; r.continuous=false;
    r.onstart=()=>{controller.heard='';setState('LISTENING');};
    r.onresult=e=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;controller.heard=t;render();};
    r.onend=()=>{if(controller.state==='LISTENING'){const t=(controller.heard||'').trim();setState('READY');if(t)ask(t,role);}};
    r.onerror=()=>{setState('READY');controller.message=getLang()==='en'?'I didn’t catch that. Try again, I’m listening.':'Awaaz clear nahi mili. Dobara bol do, main sun raha hoon.';render();};
    try{r.start();}catch(_){setState('READY');}
  }

  function createController(role){
    controller={role,state:'READY',listening:false,message:'',heard:'',action:null,recognition:null,metrics:null};
    return controller;
  }

  function esc(v){return String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
  function roleName(role){return role==='artisan'?'Karigar AI':'KalaSutra AI';}
  function welcomeCopy(role){
    const l=getLang();
    if(role==='artisan'){
      const x={hi:'Welcome to KalaSutra! Main Karigar AI hoon. Aaj kya karna hai?',en:'Welcome to KalaSutra! I’m Karigar AI. What are we doing today?',mr:'KalaSutra मध्ये स्वागत! मी Karigar AI आहे. आज काय करूया?',gu:'KalaSutra માં આપનું સ્વાગત છે! હું Karigar AI છું. આજે શું કરીએ?',pa:'KalaSutra ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ! ਮੈਂ Karigar AI ਹਾਂ. ਅੱਜ ਕੀ ਕਰੀਏ?',bn:'KalaSutra-তে স্বাগতম! আমি Karigar AI. আজ কী করব?',ta:'KalaSutra-க்கு வரவேற்கிறோம்! நான் Karigar AI. இன்று என்ன செய்வோம்?',te:'KalaSutra కు స్వాగతం! నేను Karigar AI. ఈరోజు ఏమి చేద్దాం?',kn:'KalaSutra ಗೆ ಸ್ವಾಗತ! ನಾನು Karigar AI. ಇಂದು ಏನು ಮಾಡೋಣ?',ml:'KalaSutra-യിലേക്ക് സ്വാഗതം! ഞാൻ Karigar AI ആണ്. ഇന്ന് എന്ത് ചെയ്യാം?',or:'KalaSutra କୁ ସ୍ୱାଗତ! ମୁଁ Karigar AI. ଆଜି କ’ଣ କରିବା?',ur:'KalaSutra میں خوش آمدید! میں Karigar AI ہوں۔ آج کیا کریں؟'};return x[l]||x.hi;
    }
    const x={hi:'Welcome to KalaSutra! Main aapki shopping aur craft discovery mein help karunga. Aaj kya explore karein?',en:'Welcome to KalaSutra! I’m here to help you discover handmade crafts. What should we explore?',mr:'KalaSutra मध्ये स्वागत! मी तुम्हाला handmade crafts शोधायला मदत करतो. आज काय पाहूया?',gu:'KalaSutra માં આપનું સ્વાગત છે! હું તમને handmade crafts શોધવામાં મદદ કરીશ. આજે શું જોઈએ?',pa:'KalaSutra ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ! ਮੈਂ handmade crafts ਲੱਭਣ ਵਿੱਚ ਮਦਦ ਕਰਾਂਗਾ. ਅੱਜ ਕੀ ਵੇਖੀਏ?',bn:'KalaSutra-তে স্বাগতম! আমি handmade crafts খুঁজে দিতে সাহায্য করব। আজ কী দেখব?',ta:'KalaSutra-க்கு வரவேற்கிறோம்! நான் handmade crafts கண்டுபிடிக்க உதவுகிறேன். இன்று என்ன பார்ப்போம்?',te:'KalaSutra కు స్వాగతం! నేను handmade crafts కనుగొనడంలో సహాయం చేస్తాను. ఈరోజు ఏమి చూద్దాం?',kn:'KalaSutra ಗೆ ಸ್ವಾಗತ! handmade crafts ಹುಡುಕಲು ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಇಂದು ಏನು ನೋಡೋಣ?',ml:'KalaSutra-യിലേക്ക് സ്വാഗതം! handmade crafts കണ്ടെത്താൻ ഞാൻ സഹായിക്കാം. ഇന്ന് എന്ത് കാണാം?',or:'KalaSutra କୁ ସ୍ୱାଗତ! handmade crafts ଖୋଜିବାରେ ମୁଁ ସାହାଯ୍ୟ କରିବି। ଆଜି କ’ଣ ଦେଖିବା?',ur:'KalaSutra میں خوش آمدید! میں handmade crafts ڈھونڈنے میں مدد کروں گا۔ آج کیا دیکھیں؟'};return x[l]||x.hi;
  }

  function createModal(role,auto){
    if(modal){modal.remove();modal=null;}
    createController(role); clearHistory();
    modal=document.createElement('div'); modal.id='ks-modern-ai-modal'; modal.className='ks-modern-ai-modal';
    modal.innerHTML=`<div class="ks-modern-ai-card">
      <button class="ks-modern-close" aria-label="Close">×</button>
      <div class="ks-modern-orb-wrap"><div class="ks-modern-orb"><div class="ks-orb-ring r1"></div><div class="ks-orb-ring r2"></div><div class="ks-orb-ring r3"></div><img src="/assets/ai-talker.png" onerror="this.src='/assets/avatar-artisan.png'" alt="${esc(roleName(role))}"></div></div>
      <div class="ks-modern-kicker">KALASUTRA • ${esc(roleName(role).toUpperCase())}</div>
      <h2 class="ks-modern-title"></h2>
      <div class="ks-modern-chat"></div>
      <div class="ks-modern-heard"></div>
      <div class="ks-modern-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="ks-modern-actions"><button class="ks-modern-talk">🎙️ <span></span></button><button class="ks-modern-type">Type</button></div>
      <div class="ks-modern-input" hidden><input placeholder="Tell me what you need…"><button>Send</button></div>
      <div class="ks-modern-quick"></div>
    </div>`;
    document.body.appendChild(modal);
    const quick=modal.querySelector('.ks-modern-quick');
    const qs=role==='artisan' ? [['Add Product','ADD_PRODUCT'],['Orders','SHOW_ORDERS'],['Fair Price','OPEN_FAIR_PRICE'],['Market Match','OPEN_MARKET_MATCH'],['Craft Passport','OPEN_CRAFT_PASSPORT'],['Material Hub','OPEN_MATERIAL_HUB'],['Design Lab','OPEN_DESIGN_LAB'],['Craft Gurukul','OPEN_CRAFT_GURUKUL']] : [['Explore','OPEN_HOME'],['Search crafts','SEARCH_PRODUCTS'],['Cart','OPEN_CART'],['Orders','SHOW_ORDERS']];
    qs.forEach(([label,action])=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{openAction(action,label);const q={ADD_PRODUCT:'Mujhe naya product add karna hai',SHOW_ORDERS:'Mere orders batao',OPEN_FAIR_PRICE:'Fair price batao',OPEN_MARKET_MATCH:'Market match dikhao',OPEN_CRAFT_PASSPORT:'Craft passport bana do',OPEN_MATERIAL_HUB:'Raw material chahiye',OPEN_DESIGN_LAB:'Design idea do',OPEN_CRAFT_GURUKUL:'Craft Gurukul kholo',SEARCH_PRODUCTS:'Handmade crafts dikhao',OPEN_HOME:'Home kholo',OPEN_CART:'Cart kholo'};ask(q[action]||label,role)};quick.appendChild(b);});
    modal.querySelector('.ks-modern-close').onclick=()=>{welcomeShown=true;modal.remove();modal=null;};
    modal.querySelector('.ks-modern-talk').onclick=()=>startListening(role);
    modal.querySelector('.ks-modern-type').onclick=()=>{modal.querySelector('.ks-modern-input').hidden=false;modal.querySelector('.ks-modern-input input').focus();};
    modal.querySelector('.ks-modern-input button').onclick=()=>{const i=modal.querySelector('.ks-modern-input input');const t=i.value.trim();if(t){i.value='';ask(t,role);}};
    modal.querySelector('.ks-modern-input input').addEventListener('keydown',e=>{if(e.key==='Enter')modal.querySelector('.ks-modern-input button').click();});
    const initial=welcomeCopy(role); controller.message=initial; pushHistory('assistant',initial); render();
    if(auto) setTimeout(()=>{ speak(initial); },120);
    if(auto) setTimeout(()=>startListening(role),1700);
  }

  function render(){
    if(!modal||!controller)return;
    modal.querySelector('.ks-modern-title').textContent=controller.state==='LISTENING'?(getLang()==='en'?'I’m listening…':'सुन रहा हूँ…'):(controller.state==='THINKING'?'Thinking…':roleName(controller.role));
    const chat=modal.querySelector('.ks-modern-chat'); chat.innerHTML='';
    history.slice(-8).forEach((m,i)=>{const d=document.createElement('div');d.className='ks-msg '+m.role;d.textContent=m.text;chat.appendChild(d);});
    if(controller.heard) modal.querySelector('.ks-modern-heard').textContent='You: '+controller.heard; else modal.querySelector('.ks-modern-heard').textContent='';
    const t=modal.querySelector('.ks-modern-talk'); t.classList.toggle('listening',controller.listening); t.querySelector('span').textContent=controller.listening?(getLang()==='en'?'Listening…':'सुन रहा हूँ…'):(getLang()==='en'?'Talk to AI':'AI से बात करें');
    modal.querySelector('.ks-modern-wave').classList.toggle('active',controller.listening);
  }

  function injectStyle(){
    if(document.getElementById('ks-modern-ai-style'))return;
    const s=document.createElement('style');s.id='ks-modern-ai-style';s.textContent=`
      .ks-modern-ai-modal{position:fixed;inset:0;z-index:1000000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(48,31,21,.42);backdrop-filter:blur(8px)}
      .ks-modern-ai-card{width:min(430px,94vw);max-height:92vh;overflow:auto;border-radius:30px;padding:22px;background:linear-gradient(160deg,#fffaf4,#f5e9db);border:1px solid rgba(91,60,41,.14);box-shadow:0 30px 100px rgba(34,21,13,.30);position:relative;text-align:center;color:#3e2b20}
      .ks-modern-close{position:absolute;right:12px;top:10px;width:36px;height:36px;border:0;border-radius:50%;background:rgba(111,78,55,.08);font-size:24px;color:#6f4e37;cursor:pointer}
      .ks-modern-orb-wrap{display:flex;justify-content:center;padding:12px 0 6px}.ks-modern-orb{width:138px;height:138px;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#fff8ef 0,#dca275 28%,#9b5533 62%,#5a2f21 100%);box-shadow:0 16px 45px rgba(120,68,39,.26);overflow:hidden}.ks-modern-orb img{width:92px;height:92px;object-fit:contain;border-radius:50%;position:relative;z-index:2}.ks-orb-ring{position:absolute;inset:0;border:2px solid rgba(255,255,255,.35);border-radius:50%;animation:ksOrb 2.4s ease-out infinite}.ks-orb-ring.r2{animation-delay:.55s}.ks-orb-ring.r3{animation-delay:1.1s}@keyframes ksOrb{0%{transform:scale(.7);opacity:.6}100%{transform:scale(1.35);opacity:0}}
      .ks-modern-kicker{font-size:10px;letter-spacing:1.6px;color:#9b765b;font-weight:900;margin-top:5px}.ks-modern-title{font-size:21px;margin:6px 0 12px}.ks-modern-chat{display:flex;flex-direction:column;gap:8px;max-height:210px;overflow:auto;text-align:left;padding:3px}.ks-msg{max-width:85%;padding:10px 13px;border-radius:16px;font-size:13px;line-height:1.45}.ks-msg.user{align-self:flex-end;background:#6f4e37;color:#fff;border-bottom-right-radius:5px}.ks-msg.assistant{align-self:flex-start;background:#fff;color:#4b392d;border:1px solid #eadbce;border-bottom-left-radius:5px}.ks-modern-heard{min-height:16px;color:#8b7664;font-size:11px;margin:7px 0}.ks-modern-wave{height:35px;display:flex;align-items:center;justify-content:center;gap:5px}.ks-modern-wave i{width:4px;height:7px;border-radius:9px;background:#cbb29f;transition:.2s}.ks-modern-wave.active i:nth-child(1){height:14px}.ks-modern-wave.active i:nth-child(2){height:24px}.ks-modern-wave.active i:nth-child(3){height:30px}.ks-modern-wave.active i:nth-child(4){height:18px}.ks-modern-wave.active i:nth-child(5){height:28px}.ks-modern-wave.active i:nth-child(6){height:22px}.ks-modern-wave.active i:nth-child(7){height:12px}.ks-modern-actions{display:grid;grid-template-columns:1fr auto;gap:8px}.ks-modern-talk,.ks-modern-type{border:0;border-radius:16px;padding:13px 15px;font-weight:900;cursor:pointer}.ks-modern-talk{background:#6f4e37;color:#fff}.ks-modern-talk.listening{background:#238b5b}.ks-modern-type{background:#efe5da;color:#4d3b30}.ks-modern-input{display:flex;gap:7px;margin-top:8px}.ks-modern-input input{flex:1;border:1px solid #dfcfbf;border-radius:13px;padding:12px;background:#fff;font-size:14px}.ks-modern-input button{border:0;border-radius:13px;background:#6f4e37;color:#fff;padding:0 15px;font-weight:800}.ks-modern-quick{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;margin-top:12px}.ks-modern-quick button{border:1px solid #e3d6ca;background:#fff;color:#5a4536;border-radius:999px;padding:8px 10px;font-size:11px;font-weight:800;cursor:pointer}
      .ks-artisan-ai-card,.ks-buyer-ai{margin:0 16px 14px;padding:14px;border-radius:22px;background:linear-gradient(145deg,#fffaf2,#f3e6d7);border:1px solid rgba(111,78,55,.12);box-shadow:0 12px 30px rgba(72,48,31,.08)}
      .ks-ai-row{display:flex;align-items:center;gap:10px}.ks-ai-avatar,.ks-buyer-ai .mini{width:48px;height:48px;border-radius:50%;overflow:hidden;background:#ead9c9;display:flex;align-items:center;justify-content:center}.ks-ai-avatar img,.ks-buyer-ai .mini img{width:100%;height:100%;object-fit:cover}.ks-ai-copy{flex:1;text-align:left}.ks-ai-copy .kicker{font-size:9px;letter-spacing:1.1px;color:#9b765b;font-weight:900}.ks-ai-copy h3{font-size:17px;margin:2px 0}.ks-ai-copy p{font-size:11px;color:#7b6858;margin:0;line-height:1.35}.ks-ai-talk,.ks-buyer-ai button{border:0;border-radius:14px;background:#6f4e37;color:#fff;padding:10px 12px;font-weight:900}.ks-ai-status{font-size:11px;color:#725f4f;margin:10px 0;text-align:left}.ks-ai-insights{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.ks-ai-insight{padding:8px;border-radius:13px;background:#fff;text-align:left}.ks-ai-insight small{display:block;color:#9a826f;font-size:9px}.ks-ai-insight strong{display:block;font-size:16px;margin-top:2px}.ks-ai-insight span{font-size:8px;color:#8d7967}.ks-buyer-ai{display:flex;align-items:center;gap:9px}.ks-buyer-ai>div:nth-child(2){flex:1;text-align:left}.ks-buyer-ai strong{display:block;font-size:13px}.ks-buyer-ai span{display:block;font-size:10px;color:#7d6a5a;margin-top:2px}
    `;document.head.appendChild(s);
  }

  function fetchStatsCard(card){
    const uid=window.__KALASUTRA_USER_ID__; if(!uid)return;
    fetch('/api/orders?userId='+encodeURIComponent(uid)).then(r=>r.ok?r.json():[]).then(orders=>{
      const today=new Date().toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata'});
      const t=orders.filter(o=>new Date(o.date||Date.now()).toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata'})===today);
      const earnings=t.reduce((sum,o)=>sum+(o.artisanItems||[]).reduce((s,p)=>s+Number(p.price||0)*Number(p.qty||0),0),0);
      const cells=card.querySelectorAll('.ks-ai-insight'); if(cells[0])cells[0].querySelector('strong').textContent=t.filter(o=>['placed','paid'].includes(o.status)).length;if(cells[1])cells[1].querySelector('strong').textContent='₹'+earnings.toLocaleString('en-IN');
    }).catch(()=>{});
  }

  function addArtisanCard(root){
    if(root.querySelector('.ks-artisan-ai-card'))return;
    const card=document.createElement('div'); card.className='ks-artisan-ai-card';
    card.innerHTML='<div class="ks-ai-row"><div class="ks-ai-avatar"><img src="/assets/ai-talker.png" onerror="this.src=\'/assets/avatar-artisan.png\'" alt="Karigar AI"></div><div class="ks-ai-copy"><div class="kicker">KARIGAR AI</div><h3>Welcome to KalaSutra ✨</h3><p></p></div><button class="ks-ai-talk">Talk</button></div><div class="ks-ai-status"></div><div class="ks-ai-insights"><div class="ks-ai-insight"><small>Orders</small><strong>—</strong><span>Today</span></div><div class="ks-ai-insight"><small>Earnings</small><strong>—</strong><span>Today</span></div><div class="ks-ai-insight"><small>Market Match</small><strong>Ready</strong><span>Explore opportunities</span></div></div>';
    const ref=root.querySelector('.artisan-greeting'); if(ref)ref.parentNode.insertBefore(card,ref.nextSibling); else root.prepend(card);
    card.querySelector('p').textContent=welcomeCopy('artisan'); card.querySelector('.ks-ai-status').textContent=getLang()==='en'?'You can talk normally. I’ll understand and help with the app.':'Aap normal tarike se baat karo. Main samajhkar app mein kaam karunga.';
    card.querySelector('.ks-ai-talk').onclick=()=>createModal('artisan',false);
    fetchStatsCard(card);
  }
  function addBuyerCard(root){
    if(root.querySelector('.ks-buyer-ai'))return;
    const host=root.querySelector('.buyer-reference-home')||root; const card=document.createElement('div');card.className='ks-buyer-ai';
    card.innerHTML='<div class="mini"><img src="/assets/ai-talker.png" onerror="this.src=\'/assets/avatar-artisan.png\'" alt="KalaSutra AI"></div><div><strong>KalaSutra AI</strong><span></span></div><button>Talk</button>';
    const search=host.querySelector('.buyer-ref-search'); if(search&&search.parentNode)search.parentNode.insertBefore(card,search.nextSibling); else host.prepend(card);
    card.querySelector('span').textContent=welcomeCopy('buyer'); card.querySelector('button').onclick=()=>createModal('buyer',false);
  }

  function detectRole(){ if(document.querySelector('.artisan-home'))return'artisan'; if(document.querySelector('.buyer-reference-home'))return'buyer'; return null; }
  function watch(){
    injectStyle();
    const obs=new MutationObserver(()=>{
      injectStyle(); const role=detectRole();
      if(role==='artisan'){addArtisanCard(document.querySelector('.artisan-home')); if(lastRole!=='artisan'){lastRole='artisan'; if(!welcomeShown){createModal('artisan',true);welcomeShown=true;}}}
      if(role==='buyer'){addBuyerCard(document.querySelector('.buyer-reference-home')); if(lastRole!=='buyer'){lastRole='buyer'; if(!welcomeShown){createModal('buyer',true);welcomeShown=true;}}}
    }); obs.observe(document.body,{childList:true,subtree:true});
    setInterval(()=>{const role=detectRole(); if(role==='artisan')addArtisanCard(document.querySelector('.artisan-home')); if(role==='buyer')addBuyerCard(document.querySelector('.buyer-reference-home'));},1500);
  }
  function onLanguage(){if(modal){const r=controller?.role||detectRole(); if(r){modal.remove();modal=null;createModal(r,false);}}}
  window.addEventListener('kalasutra:language-changed',onLanguage);
  injectStyle();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
})();
