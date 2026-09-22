(function(global){
  const LANGS = {
    'hi-IN':{name:'Hindi',tts:'hi-IN'}, 'en-IN':{name:'English',tts:'en-IN'}, 'mr-IN':{name:'Marathi',tts:'mr-IN'},
    'gu-IN':{name:'Gujarati',tts:'gu-IN'}, 'pa-IN':{name:'Punjabi',tts:'pa-IN'}, 'bn-IN':{name:'Bengali',tts:'bn-IN'},
    'ta-IN':{name:'Tamil',tts:'ta-IN'}, 'te-IN':{name:'Telugu',tts:'te-IN'}, 'kn-IN':{name:'Kannada',tts:'kn-IN'},
    'ml-IN':{name:'Malayalam',tts:'ml-IN'}, 'or-IN':{name:'Odia',tts:'or-IN'}, 'ur-IN':{name:'Urdu',tts:'ur-IN'}
  };

  const DEFAULT_LINES = {
    'hi-IN':'Namaste! Main Karigar AI hoon. Aaj kya banana hai?',
    'en-IN':'Hi! I’m Karigar AI. What would you like to work on today?',
    'mr-IN':'Namaskar! Mi Karigar AI aahe. Aaj kay karaycha aahe?',
    'gu-IN':'Namaste! Hu Karigar AI chhu. Aaje shu karvu chhe?',
    'pa-IN':'Sat Sri Akal! Main Karigar AI haan. Ajj ki karna hai?',
    'bn-IN':'Nomoshkar! Ami Karigar AI. Aaj ki korte chai?',
    'ta-IN':'Vanakkam! Naan Karigar AI. Inru enna seyyalaam?',
    'te-IN':'Namaskaram! Nenu Karigar AI. Ee roju emi cheddam?',
    'kn-IN':'Namaskara! Naanu Karigar AI. Ivattu enu maadona?',
    'ml-IN':'Namaskaram! Njaan Karigar AI aanu. Innu entha cheyyendathu?',
    'or-IN':'Namaskar! Mu Karigar AI. Aaji kana kariba?',
    'ur-IN':'Assalamualaikum! Main Karigar AI hoon. Aaj kya karna hai?'
  };

  class KarigarAI {
    constructor(options={}){
      this.options=Object.assign({
        mode:'compact', apiBase:'/api/karigar-ai', language:'hi-IN', avatarSrc:'', autoStart:false,
        onAction:()=>{}, onLanguageChange:()=>{}, onStateChange:()=>{}, onTranscript:()=>{}
      },options);
      this.language=LANGS[this.options.language]?this.options.language:'hi-IN';
      this.root=null; this.state='idle'; this.recognition=null; this.busy=false; this.synth=window.speechSynthesis||null;
      this.flow={step:'idle', photos:0, details:{}, video:false, confirmed:false};
      this.history=[];
      this._speechToken=0;
    }

    mount(host=document.body){
      if(this.root) return this;
      this.root=document.createElement('div'); this.root.className='ks-ai-root';
      host.appendChild(this.root); this.render(); this.bind();
      if(this.options.autoStart) setTimeout(()=>this.startConversation(),450);
      return this;
    }

    setLanguage(lang){
      if(!LANGS[lang]) return;
      this.language=lang; this.options.onLanguageChange(lang); this.render();
    }

    render(){
      if(!this.root) return;
      const avatar=this.options.avatarSrc || '';
      const img=avatar ? `<img class="ks-ai-avatar" src="${escapeAttr(avatar)}" alt="Karigar AI">` : `<div class="ks-ai-avatar" aria-hidden="true"></div>`;
      const cimg=avatar ? `<img class="ks-ai-compact-avatar" src="${escapeAttr(avatar)}" alt="">` : `<div class="ks-ai-compact-avatar"></div>`;
      if(this.options.mode==='immersive'){
        this.root.innerHTML=`<div class="ks-ai-immersive ${stateClass(this.state)}">
          <select class="ks-ai-language" aria-label="Language">${Object.entries(LANGS).map(([k,v])=>`<option value="${k}" ${k===this.language?'selected':''}>${v.name}</option>`).join('')}</select>
          <div class="ks-ai-panel"><div class="ks-ai-avatar-wrap">${img}</div><div class="ks-ai-speech" data-speech>${escapeHtml(this.currentSpeech||'')}</div><div class="ks-ai-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><div class="ks-ai-status" data-state>${stateLabel(this.state)}</div><button class="ks-ai-cancel" data-cancel>Cancel</button></div>
        </div>`;
      } else {
        this.root.innerHTML=`<div class="ks-ai-compact ${stateClass(this.state)}"><div>${cimg}</div><div class="ks-ai-compact-copy"><div class="ks-ai-name">Karigar AI</div><div class="ks-ai-state" data-state>${escapeHtml(this.currentSpeech||stateLabel(this.state))}</div><div class="ks-ai-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></div><button class="ks-ai-mic" data-mic aria-label="Speak">●</button></div>`;
      }
    }

    bind(){
      this.root.addEventListener('click',e=>{
        if(e.target.closest('[data-mic]')) this.toggleListening();
        if(e.target.closest('[data-cancel]')) this.cancel();
      });
      this.root.addEventListener('change',e=>{ if(e.target.matches('.ks-ai-language')) this.setLanguage(e.target.value); });
    }

    async startConversation(){
      if(this.currentSpeech) return;
      await this.say(DEFAULT_LINES[this.language]||DEFAULT_LINES['hi-IN'],{listenAfter:true});
    }

    async toggleListening(){
      if(this.state==='listening'){ this.stopListening(); return; }
      this.startListening();
    }

    startListening(){
      const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!SR){ this.setState('error','Voice input is not supported on this browser.'); return; }
      if(this.synth) this.synth.cancel();
      try{
        this.recognition=new SR();
        this.recognition.lang=this.language; this.recognition.interimResults=false; this.recognition.continuous=false; this.recognition.maxAlternatives=1;
        this.recognition.onstart=()=>this.setState('listening','Listening…');
        this.recognition.onresult=async ev=>{
          const text=(ev.results?.[0]?.[0]?.transcript||'').trim();
          if(!text) return;
          this.options.onTranscript(text); await this.handleUserText(text);
        };
        this.recognition.onerror=()=>this.setState('error','I couldn’t hear that. Let’s try once more.');
        this.recognition.onend=()=>{ if(this.state==='listening') this.setState('idle','Tap the mic to speak'); };
        this.recognition.start();
      }catch(e){ this.setState('error','Mic permission is needed for voice control.'); }
    }

    stopListening(){ try{this.recognition?.stop()}catch{} this.setState('idle','Tap the mic to speak'); }

    async handleUserText(text){
      const intent=this.detectIntent(text);
      if(intent==='ADD_PRODUCT_START'){
        this.flow.step='photos';
        await this.say(await this.aiReply(text,'ADD_PRODUCT_START'),{listenAfter:false});
        this.emit('ADD_PRODUCT_START',{step:'photos'});
        await this.say(await this.aiReply('', 'PHOTO_GUIDE'),{listenAfter:false});
        this.emit('PHOTO_GUIDE',{});
        return;
      }
      if(this.flow.step==='photos' && /(photo|photos|picture|pic|फोटो|तस्वीर|छायाचित्र|फोटो काढ)/i.test(text)){
        this.emit('PHOTO_CAPTURE_REQUEST',{source:'voice'}); return;
      }
      const reply=await this.aiReply(text,'GENERAL_ADD_PRODUCT');
      await this.say(reply,{listenAfter:true});
    }

    detectIntent(text){
      const t=text.toLowerCase();
      if(/add (a )?(new )?product|new product|list (a )?product|product add|product banana|product डाल|product जोड़|product jod|naya product|नया प्रोडक्ट|प्रोडक्ट.*जोड़|नया.*उत्पाद|उत्पाद.*जोड़|नवीन.*उत्पादन|नवीन.*प्रोडक्ट/i.test(t)) return 'ADD_PRODUCT_START';
      return 'GENERAL';
    }

    async aiReply(userText,stage){
      const fallback={
        ADD_PRODUCT_START:{'hi-IN':'Bilkul. Chalo, ek naya product add karte hain. Main tumhare saath hoon.','en-IN':'Absolutely. Let’s add a new product. I’ll stay with you through the whole process.'},
        PHOTO_GUIDE:{'hi-IN':'Pehle ek clear photo lete hain. Product ko achhi roshni mein rakho, main yahin hoon.','en-IN':'First, let’s take a clear photo. Put the product in good light — I’m right here with you.'},
        GENERAL_ADD_PRODUCT:{'hi-IN':'Haan, bolo. Main product add karne ke saath-saath tumhe guide karta hoon.','en-IN':'Yes, tell me. I’ll guide you while we build the product listing.'}
      };
      const key=stage==='PHOTO_GUIDE'?'PHOTO_GUIDE':stage==='ADD_PRODUCT_START'?'ADD_PRODUCT_START':'GENERAL_ADD_PRODUCT';
      try{
        const r=await fetch(this.options.apiBase+'/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:this.language,stage,userText,history:this.history.slice(-8),flow:this.flow})});
        if(!r.ok) throw new Error('chat endpoint unavailable');
        const data=await r.json();
        const answer=(data.text||data.output_text||'').trim();
        if(answer){this.history.push({role:'user',content:userText},{role:'assistant',content:answer}); return answer;}
      }catch(e){}
      return fallback[key]?.[this.language] || fallback[key]?.['hi-IN'] || fallback.GENERAL_ADD_PRODUCT['en-IN'];
    }

    async say(text,{listenAfter=false}={}){
      if(!text) return;
      this.currentSpeech=text; this._speechToken++; const token=this._speechToken; this.setState('speaking',text);
      try{
        const r=await fetch(this.options.apiBase+'/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,language:this.language})});
        if(r.ok){ const blob=await r.blob(); const url=URL.createObjectURL(blob); const audio=new Audio(url); audio.onended=()=>{URL.revokeObjectURL(url); if(token===this._speechToken){this.setState('idle',text); if(listenAfter)setTimeout(()=>this.startListening(),180)}}; await audio.play(); return; }
      }catch(e){}
      if(this.synth){
        this.synth.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang=this.language; u.rate=0.94; u.pitch=1.02; u.volume=1;
        const voices=this.synth.getVoices(); const exact=voices.find(v=>v.lang===this.language)||voices.find(v=>v.lang?.startsWith(this.language.split('-')[0])); if(exact) u.voice=exact;
        u.onend=()=>{if(token===this._speechToken){this.setState('idle',text); if(listenAfter)setTimeout(()=>this.startListening(),180)}};
        this.synth.speak(u);
      } else { this.setState('idle',text); if(listenAfter)this.startListening(); }
    }

    notifyHost(event,payload={}){ this.emit(event,payload); }
    emit(action,payload){ this.options.onAction({action,payload,language:this.language,flow:this.flow}); }
    setState(state,label){this.state=state; this.currentSpeech=label||this.currentSpeech||''; this.options.onStateChange({state,label,language:this.language}); this.render();}
    cancel(){this._speechToken++; try{this.recognition?.stop()}catch{} if(this.synth)this.synth.cancel(); this.setState('idle','Tap the mic to speak'); this.emit('AI_CANCEL',{});}
    setFlowStep(step,payload={}){this.flow.step=step; Object.assign(this.flow,payload); this.emit('FLOW_STEP',{step,payload});}
  }

  function stateClass(s){return 'ks-ai-'+s}
  function stateLabel(s){return ({idle:'Tap the mic to speak',listening:'Listening…',speaking:'Speaking…',error:'Voice needs a retry'})[s]||'Karigar AI'}
  function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function escapeAttr(s){return escapeHtml(s)}
  global.KarigarAI=KarigarAI; global.KarigarAILanguages=LANGS;
})(window);
