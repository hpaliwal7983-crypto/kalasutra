(function(){
  const {useState,useEffect,useRef} = React;
  const API = '/api';
  const LANGS = {
    hi:{name:'Hindi',voice:'hi-IN'}, en:{name:'English',voice:'en-IN'}, mr:{name:'Marathi',voice:'mr-IN'},
    gu:{name:'Gujarati',voice:'gu-IN'}, pa:{name:'Punjabi',voice:'pa-IN'}, bn:{name:'Bengali',voice:'bn-IN'},
    ta:{name:'Tamil',voice:'ta-IN'}, te:{name:'Telugu',voice:'te-IN'}, kn:{name:'Kannada',voice:'kn-IN'},
    ml:{name:'Malayalam',voice:'ml-IN'}, or:{name:'Odia',voice:'or-IN'}, ur:{name:'Urdu',voice:'ur-IN'}
  };
  const langName=()=>LANGS[localStorage.getItem('kalasutra_language')||'hi']?.name||'Hindi';
  const voiceCode=()=>LANGS[localStorage.getItem('kalasutra_language')||'hi']?.voice||'hi-IN';
  function speak(text,setSpeaking){
    try{
      if(!window.speechSynthesis){setSpeaking(false);return;}
      window.speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(String(text));
      u.lang=voiceCode(); u.rate=0.94; u.pitch=1.02; u.volume=1;
      const voices=window.speechSynthesis.getVoices?.()||[];
      const base=u.lang.split('-')[0];
      const v=voices.find(x=>x.lang===u.lang)||voices.find(x=>x.lang?.toLowerCase().startsWith(base));
      if(v)u.voice=v;
      u.onstart=()=>setSpeaking(true); u.onend=()=>setSpeaking(false); u.onerror=()=>setSpeaking(false);
      setSpeaking(true); window.speechSynthesis.speak(u);
    }catch(_){setSpeaking(false)}
  }
  function getContext(user,screen,task){
    let photoCount=0,story='',proof=false;
    try{
      photoCount=document.querySelectorAll('.addpiece-page .photo-tile img').length;
      story=document.querySelector('.story-box-new')?.value||'';
      proof=!!document.querySelector('.addpiece-page .proof-preview');
    }catch(_){ }
    return {screen,task,role:(user&&user.role)||'artisan',userName:user?.name||'',photoCount,storyProvided:!!story.trim(),proofVideoAdded:proof};
  }
  function intent(text,role){
    const t=text.toLowerCase();
    if(/\b(add|create|new|list)\b.*\b(product|piece|item)\b|product.*(add|new)|नया.*(product|पीस|सामान)|product.*करना|पीस.*जोड़/.test(t))return 'addProduct';
    if(/\b(order|orders|earning|earnings|sale|sales|कमाई|ऑर्डर)\b/.test(t))return 'orders';
    if(/\b(reel|reels|रील)\b/.test(t))return 'reel';
    if(/\b(profile|प्रोफाइल)\b/.test(t))return 'profile';
    if(/\b(product|products|listing|listings|मेरे products|मेरे प्रोडक्ट)\b/.test(t)&&role==='artisan')return 'myProducts';
    if(/\b(material|raw material|कच्चा माल|सामान चाहिए)\b/.test(t))return 'materials';
    if(/\b(fair price|price|दाम|कीमत)\b/.test(t))return 'price';
    if(/\b(passport|craft passport)\b|पासपोर्ट/.test(t))return 'passport';
    if(/\b(buyer|buyers|market match|buyer dhundo|खरीदार)\b/.test(t))return 'market';
    if(/\b(design|idea|डिजाइन|आइडिया)\b/.test(t))return 'design';
    if(/\b(gurukul|teach|सिखाना|सीखना)\b/.test(t))return 'gurukul';
    return null;
  }
  function setReactField(el,value){
    if(!el)return false;
    const setter=Object.getOwnPropertyDescriptor(el.__proto__,'value')?.set || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
    if(setter)setter.call(el,value);else el.value=value;
    el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return true;
  }
  function applyAddProductDetails(text){
    const t=String(text||'').trim(); let changed=false;
    const name=t.match(/(?:name|naam|नाम)\s*(?:is|hai|:)?\s*(.+?)(?=\s+(?:price|कीमत|दाम|material|सामग्री|region|इलाका|category|श्रेणी)\b|$)/i);
    const price=t.match(/(?:price|कीमत|दाम|₹|rs\.?|rupees)\s*(?:is|hai|:)?\s*([0-9,]+)/i);
    const material=t.match(/(?:material|सामग्री)\s*(?:is|hai|:)?\s*([^,.;]+)/i);
    const region=t.match(/(?:region|location|इलाका|जगह)\s*(?:is|hai|:)?\s*([^,.;]+)/i);
    const nameEl=document.querySelector('.details-card-new input');
    const inputs=[...document.querySelectorAll('.details-card-new input')];
    if(name&&nameEl)changed=setReactField(nameEl,name[1].trim())||changed;
    if(price&&inputs[1])changed=setReactField(inputs[1],price[1].replace(/,/g,''))||changed;
    if(material&&inputs[2])changed=setReactField(inputs[2],material[1].trim())||changed;
    if(region&&inputs[3])changed=setReactField(inputs[3],region[1].trim())||changed;
    if(/\b(pottery|ceramic|मिट्टी|कुम्हारी)\b/i.test(t)){const sel=document.querySelector('.details-card-new select');if(sel){setReactField(sel,'Pottery');changed=true}}
    return changed;
  }
  function addProductNextMessage(){
    const photo=document.querySelectorAll('.addpiece-page .photo-tile img').length;
    const story=(document.querySelector('.story-box-new')?.value||'').trim();
    const proof=!!document.querySelector('.addpiece-page .proof-preview');
    const price=[...document.querySelectorAll('.details-card-new input')].some(x=>x.value&&/\d/.test(x.value));
    if(!photo)return {text:'Bilkul. Chalo pehle tumhare piece ki ek clear photo lete hain. Neeche Camera dabao—main yahin hoon.',scroll:'.capture-card'};
    if(!story)return {text:'Photo mil gayi ✨ Ab bas apni craft ki kahani apni awaaz mein batao. Tum jaise naturally bolte ho waise hi bolo.',scroll:'.story-card-new'};
    if(!price)return {text:'Bahut badhiya. Ab iska selling price bata do. Jo price tumhe sahi lage, wahi rakhenge.',scroll:'.details-card-new'};
    if(!proof)return {text:'Bas ek chhota making-proof video aur. 5 seconds ka enough hai—camera se record kar lo.',scroll:'.capture-card'};
    return {text:'Sab ready hai. Agar tum bolo, main ab verification start karwa deta hoon.',scroll:'.verification-card-new'};
  }
  function doAction(action,go,user,setTask,setMessage,setSpeaking){
    if(action==='addProduct'){
      setTask('addProduct'); go?.('addProduct');
      setTimeout(()=>{window.scrollTo({top:0,behavior:'smooth'}); const n=addProductNextMessage(); setMessage(n.text); speak(n.text,setSpeaking);},350);
      return true;
    }
    if(action==='orders'){go?.('orders'); const text=(user&&user.role)==='artisan'?'Chalo, tumhare orders aur earnings dekhte hain.':'Chalo, tumhare orders dekhte hain.'; setMessage(text); speak(text,setSpeaking); return true;}
    if(action==='reel'){go?.('createReel'); const text='Haan, chalo Reel banate hain. Main product ke saath flow set karwa deta hoon.';setMessage(text);speak(text,setSpeaking);return true;}
    if(action==='profile'){go?.((user&&user.role)==='artisan'?'profile':'buyerProfile');const text='Bilkul, profile khol raha hoon. Jo change karna ho, bata dena.';setMessage(text);speak(text,setSpeaking);return true;}
    if(action==='myProducts'){go?.('myProducts');const text='Chalo tumhari listed pieces dekhte hain.';setMessage(text);speak(text,setSpeaking);return true;}
    const map={materials:'Market Hub',price:'Fair Price AI',passport:'Craft Passport',market:'Direct Market Match',design:'Design Lab',gurukul:'Craft Gurukul'};
    if(map[action]){go?.('dashboard');const text=`Haan, ${map[action]} wali help karte hain. Main tumhe next step batata hoon.`;setTask(action);setMessage(text);speak(text,setSpeaking);return true;}
    return false;
  }
  function KarigarCopilot({user,screen,go}){
    const [open,setOpen]=useState(true);
    const [listening,setListening]=useState(false);
    const [speaking,setSpeaking]=useState(false);
    const [busy,setBusy]=useState(false);
    const [task,setTask]=useState('');
    const [message,setMessage]=useState('');
    const [input,setInput]=useState('');
    const recRef=useRef(null);
    const historyRef=useRef([]);
    const greetedRef=useRef(false);
    const key=`kalasutra_copilot_${user?.id||'demo'}_${(user&&user.role)||'artisan'}`;
    useEffect(()=>{
      try{historyRef.current=JSON.parse(localStorage.getItem(key)||'[]').slice(-10)}catch(_){historyRef.current=[]}
      if(!greetedRef.current){
        greetedRef.current=true;
        const first=localStorage.getItem('kalasutra_copilot_seen')==='1';
        const text=(user&&user.role)==='artisan' ? (first ? `Welcome back, ${user.name}. Main Karigar AI hoon. Aaj craft ke saath kya karna hai?` : `Welcome to KalaSutra, ${user.name}. Main Karigar AI hoon. Aaj kya karna hai?`) : `Welcome to KalaSutra, ${user?.name||''}. Main Karigar AI hoon. Kya explore karein?`;
        setMessage(text); setTimeout(()=>speak(text,setSpeaking),280);
        localStorage.setItem('kalasutra_copilot_seen','1');
      }
      return()=>{try{recRef.current?.stop()}catch(_){} try{window.speechSynthesis?.cancel()}catch(_){}};
    },[key]);
    useEffect(()=>{if(screen==='addProduct')setTask('addProduct');},[screen]);
    async function send(text,opts={}){
      const clean=String(text||'').trim(); if(!clean||busy)return;
      setInput('');
      const action=intent(clean,(user&&user.role)||'artisan');
      if(action && doAction(action,go,user,setTask,setMessage,setSpeaking)){
        historyRef.current=[...historyRef.current,{role:'user',content:clean},{role:'assistant',content:message||'Done'}].slice(-10);
        try{localStorage.setItem(key,JSON.stringify(historyRef.current))}catch(_){ }
        return;
      }
      if((task==='addProduct'||screen==='addProduct') && applyAddProductDetails(clean)){
        const n=addProductNextMessage();
        setMessage('Got it. Maine details update kar di hain. ' + n.text); if(n.scroll)document.querySelector(n.scroll)?.scrollIntoView({behavior:'smooth',block:'center'}); speak('Got it. Maine details update kar di hain. ' + n.text,setSpeaking); return;
      }
      const storyBox=document.querySelector('.story-box-new');
      const storyEmpty=!storyBox || !storyBox.value;
      const knownIntent=!!intent(clean,(user&&user.role)||'artisan');
      if((task==='addProduct'||screen==='addProduct') && storyEmpty && clean.length>20 && !knownIntent){
        if(storyBox){setReactField(storyBox,clean); const n='Bahut badhiya - tumhari story save kar li. Ab price bata do.';setMessage(n);speak(n,setSpeaking);return;}
      }
      if((task==='addProduct'||screen==='addProduct') && /\b(haan|yes|done|ho gaya|kar diya|ready|next|आगे|हो गया|हाँ|कर दिया)\b/i.test(clean)){
        const n=addProductNextMessage();
        setMessage(n.text); if(n.scroll)document.querySelector(n.scroll)?.scrollIntoView({behavior:'smooth',block:'center'}); speak(n.text,setSpeaking);
        return;
      }
      if((task==='addProduct'||screen==='addProduct') && /\b(verify|verification|publish|submit|start)\b|सत्यापन|publish/i.test(clean)){
        const btn=document.querySelector('.addpiece-main-btn');
        if(btn){btn.click(); const text='Perfect. Verification start kar diya. Result aate hi main tumhe bataunga.';setMessage(text);speak(text,setSpeaking);return;}
      }
      setBusy(true); setMessage('');
      const ctx=getContext(user,screen,task);
      const msgs=[...historyRef.current,{role:'user',content:clean}].slice(-10);
      try{
        const res=await fetch(`${API}/ai/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:langName(),role:(user&&user.role)||'artisan',messages:msgs,context:ctx})});
        const data=await res.json(); if(!res.ok)throw new Error(data.error||'AI request failed');
        const reply=data.reply||'Bilkul. Chaliye next step karte hain.';
        historyRef.current=[...historyRef.current,{role:'user',content:clean},{role:'assistant',content:reply}].slice(-10);
        try{localStorage.setItem(key,JSON.stringify(historyRef.current))}catch(_){ }
        setMessage(reply); speak(reply,setSpeaking);
      }catch(e){
        const fallback='Haan, main tumhare saath hoon. Jo kaam karna hai seedha batao—jaise “product add karna hai” ya “orders dikhao”.';
        setMessage(fallback); speak(fallback,setSpeaking);
      }finally{setBusy(false)}
    }
    function startListening(){
      const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!SR){const t='Voice input is not available here. Neeche type karke bhi mujhse baat kar sakte ho.';setMessage(t);speak(t,setSpeaking);return;}
      try{
        window.speechSynthesis?.cancel();
        const r=new SR(); r.lang=voiceCode(); r.interimResults=false; r.continuous=false; r.maxAlternatives=1;
        r.onstart=()=>setListening(true); r.onend=()=>setListening(false);
        r.onerror=()=>{setListening(false);const t='Awaaz clear nahi mili. Ek baar phir bolo.';setMessage(t);speak(t,setSpeaking)};
        r.onresult=e=>{const heard=e.results?.[0]?.[0]?.transcript||'';setListening(false);if(heard)send(heard)};
        recRef.current=r; r.start();
      }catch(_){setListening(false)}
    }
    function quick(text){send(text)}
    if(!user)return null;
    return React.createElement('div',{className:`ks-copilot ${open?'open':'closed'} ${listening?'is-listening':''}`},
      open ? React.createElement(React.Fragment,null,
        React.createElement('div',{className:'ks-copilot-head'},
          React.createElement('div',{className:'ks-copilot-avatar'},React.createElement('img',{src:'/assets/ai-talker.png',alt:'Karigar AI'})),
          React.createElement('div',{className:'ks-copilot-title'},React.createElement('strong',null,'Karigar AI'),React.createElement('small',null,speaking?'Speaking…':listening?'Listening…':'Your craft copilot')),
          React.createElement('button',{className:'ks-copilot-min',onClick:()=>setOpen(false),'aria-label':'Minimize Karigar AI'},'−')),
        React.createElement('div',{className:'ks-copilot-bubble'},message||'Bolo, aaj kya karna hai?'),
        React.createElement('div',{className:'ks-copilot-quick'},
          user.role==='artisan' && React.createElement('button',{onClick:()=>quick('Aaj pehle product add karte hain')},'＋ Add product'),
          React.createElement('button',{onClick:()=>quick(user.role==='artisan'?'Mere orders batao':'Mere orders dikhao')},'Orders'),
          user.role==='artisan' && React.createElement('button',{onClick:()=>quick('Meri fair price check karo')},'Fair price')),
        React.createElement('div',{className:'ks-copilot-input'},
          React.createElement('button',{className:`ks-copilot-mic ${listening?'active':''}`,onClick:startListening},listening?'●':'🎙'),
          React.createElement('input',{value:input,onChange:e=>setInput(e.target.value),onKeyDown:e=>{if(e.key==='Enter')send(input)},placeholder:'Bolo ya type karo…'}),
          React.createElement('button',{className:'ks-copilot-send',onClick:()=>send(input),disabled:busy},busy?'…':'↑')))
      : React.createElement('button',{className:'ks-copilot-orb',onClick:()=>setOpen(true),'aria-label':'Open Karigar AI'},React.createElement('img',{src:'/assets/ai-talker.png',alt:'Karigar AI'}),listening&&React.createElement('i',null))
    );
  }
  window.KarigarCopilot=KarigarCopilot;
})();
