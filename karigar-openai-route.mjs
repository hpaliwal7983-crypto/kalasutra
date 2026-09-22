import express from 'express';

const router = express.Router();
router.use(express.json({limit:'1mb'}));

const SYSTEM_PROMPT = `You are Karigar AI inside KalaSutra. You are clearly an AI voice companion. Speak naturally, warmly and concisely, like a thoughtful conversational assistant. Never sound like a form, call center or robot. The selected language is authoritative; answer in that language. Support Hindi, English, Marathi, Gujarati, Punjabi, Bengali, Tamil, Telugu, Kannada, Malayalam, Odia and Urdu. The current production scope is Add Product. Guide the artisan one small step at a time, remember details already given, ask only for missing information, and never invent product facts. No long lists. No technical terms. Keep spoken replies to 1–2 short sentences unless more is explicitly requested.`;

router.post('/chat', async (req,res)=>{
  try{
    if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:'OPENAI_API_KEY is not configured on the server'});
    const {language='hi-IN',stage='GENERAL_ADD_PRODUCT',userText='',history=[],flow={}}=req.body||{};
    const input=[
      {role:'system',content:[{type:'input_text',text:SYSTEM_PROMPT}]},
      ...history.slice(-8).map(m=>({role:m.role==='assistant'?'assistant':'user',content:[{type:'input_text',text:String(m.content||'')}] })),
      {role:'user',content:[{type:'input_text',text:`Selected language: ${language}\nStage: ${stage}\nFlow state: ${JSON.stringify(flow)}\nArtisan says: ${userText||'(continue the current step)'}`}]} 
    ];
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_TEXT_MODEL||'gpt-5.6-luna',input,temperature:0.6,max_output_tokens:180})});
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json({error:data?.error?.message||'OpenAI request failed'});
    res.json({text:data.output_text||''});
  }catch(err){res.status(500).json({error:err.message||'AI server error'});}
});

router.post('/speak', async (req,res)=>{
  try{
    if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:'OPENAI_API_KEY is not configured on the server'});
    const {text,language='hi-IN'}=req.body||{};
    if(!text) return res.status(400).json({error:'text is required'});
    const instructions = `Warm, natural Indian conversational delivery. Speak like a helpful voice companion. Use gentle pauses, varied emphasis and an encouraging tone. Do not sound like a navigation system or announcement. Language/locale: ${language}.`;
    const r=await fetch('https://api.openai.com/v1/audio/speech',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_TTS_MODEL||'gpt-4o-mini-tts',voice:'marin',input:String(text),instructions,response_format:'mp3'})});
    if(!r.ok){const d=await r.text();return res.status(r.status).json({error:d||'TTS request failed'});}
    const buf=Buffer.from(await r.arrayBuffer()); res.setHeader('Content-Type','audio/mpeg'); res.send(buf);
  }catch(err){res.status(500).json({error:err.message||'TTS server error'});}
});

export default router;
