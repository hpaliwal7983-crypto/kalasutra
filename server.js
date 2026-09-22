const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const ROOT = path.join(__dirname, '..');
const DB_PATH = path.join(__dirname, 'db.json');

function readDB(){ try{return JSON.parse(fs.readFileSync(DB_PATH,'utf8'));}catch(_){return {users:[],products:[],wishlist:[],cart:[],orders:[],reels:[],reviews:[],reviewQueue:[],_meta:{nextId:1}};} }
function writeDB(db){fs.writeFileSync(DB_PATH,JSON.stringify(db,null,2));}
function id(db,prefix){return `${prefix}${db._meta.nextId++}`;}
function uniqueProductId(db){let n=(db._meta.nextProduct||1); db._meta.nextProduct=n+1; return `KS-ART-${String(n).padStart(6,'0')}`;}
function json(res,status,data){const b=JSON.stringify(data);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Cache-Control':'no-store'});res.end(b);}
function body(req){return new Promise((resolve,reject)=>{let a=[],n=0;req.on('data',c=>{n+=c.length;if(n>30*1024*1024){reject(new Error('Upload too large (30MB demo limit)'));req.destroy();return;}a.push(c)});req.on('end',()=>{try{resolve(a.length?JSON.parse(Buffer.concat(a).toString()):{})}catch(e){reject(new Error('Invalid JSON'))}});req.on('error',reject)});}
function sendFile(res,file){fs.readFile(file,(e,d)=>{if(e){res.writeHead(404);res.end('Not found');return;}const ext=path.extname(file).toLowerCase();const types={'.html':'text/html','.css':'text/css','.tsx':'text/plain','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.mp4':'video/mp4','.webm':'video/webm'};res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream'});res.end(d);});}
function staticFile(req,res){let u=decodeURIComponent(req.url.split('?')[0]);if(u==='/'||u==='')return sendFile(res,path.join(ROOT,'index.html'));let rel=u.replace(/^\/+/, '');if(rel.includes('..')){res.writeHead(403);return res.end('Forbidden');}let file=path.join(ROOT,rel);if(fs.existsSync(file)&&fs.statSync(file).isFile())return sendFile(res,file);file=path.join(ROOT,'public',rel.replace(/^public\//,''));if(fs.existsSync(file)&&fs.statSync(file).isFile())return sendFile(res,file);res.writeHead(404);res.end('Not found');}

function openAIRequest(payload){
  return new Promise((resolve,reject)=>{
    const key=process.env.OPENAI_API_KEY;
    if(!key) return reject(new Error('OPENAI_API_KEY is not configured on the server.'));
    const data=JSON.stringify(payload);
    const req=https.request({hostname:'api.openai.com',path:'/v1/responses',method:'POST',headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}},r=>{
      let out=''; r.on('data',c=>out+=c); r.on('end',()=>{let parsed;try{parsed=JSON.parse(out)}catch(_){parsed={error:{message:out||'OpenAI request failed'}}} if(r.statusCode>=200&&r.statusCode<300)resolve(parsed);else reject(new Error(parsed?.error?.message||`OpenAI returned ${r.statusCode}`));});
    });
    req.setTimeout(45000,()=>req.destroy(new Error('OpenAI request timed out.')));
    req.on('error',reject); req.write(data); req.end();
  });
}
function responseText(data){
  if(typeof data?.output_text==='string'&&data.output_text.trim()) return data.output_text.trim();
  const parts=[];
  for(const item of (data?.output||[])) for(const c of (item?.content||[])) if(typeof c?.text==='string') parts.push(c.text);
  return parts.join('\n').trim();
}

function verifyProduct(product){
  const proof=!!product.craftInfo?.verificationProof;
  const owned=product.craftInfo?.ownershipDeclared!==false;
  const gallery=Array.isArray(product.gallery)?product.gallery.length:0;
  const duplicate=!!product.duplicateFlag;
  const processMatch=proof?Math.min(99,88+Math.floor(Math.random()*11)):55;
  let risk=0; if(!proof)risk+=35; if(!owned)risk+=35; if(gallery<2)risk+=12; if(duplicate)risk+=45;
  risk=Math.min(100,risk+Math.floor(Math.random()*7));
  const confidence=Math.max(.55,Math.min(.99,1-risk/140));
  const status=risk>=60?'needs_review':'verified';
  return {status,confidence,notes:[gallery>=2?'Multiple photos supplied':'Add more photos','Making-process proof checked','Ownership declaration recorded'],trustScore:Math.max(60,Math.round(100-risk*.45)),riskScore:risk,productProcessMatch:processMatch,isDemo:true,duplicateFlag:duplicate};
}
async function api(req,res,url){
  const parts=url.pathname.split('/').filter(Boolean); const resource=parts[1]; const itemId=parts[2]; const db=readDB();
  try{

    if(resource==='ai'&&itemId==='chat'&&req.method==='POST'){
      const b=await body(req);
      const language=String(b.language||'Hindi');
      const role=String(b.role||'artisan');
      const context=b.context||{};
      const messages=Array.isArray(b.messages)?b.messages.slice(-12):[];
      const system=`You are Karigar AI, KalaSutra's warm voice-first copilot for ${role}s. You are clearly an AI assistant, never pretend to be human. Speak naturally like a helpful friend: short, warm, conversational, culturally respectful, and practical. Reply in the user's selected language (${language}) unless the user is clearly speaking another language. Avoid robotic phrases like "I am opening..." or long explanations. Keep most replies to 1-3 short sentences. Ask one useful follow-up question when needed. You help the artisan use the actual app, not just chat. Current app context: ${JSON.stringify(context)}. The user may be in an Add Product flow. If they say something is done, acknowledge it and guide only the next missing step. Never invent orders, earnings, buyers, products, trends, or other data; use only supplied context. Do not claim an action happened unless the client context says it did.`;
      const input=[{role:'developer',content:system}];
      for(const m of messages){if(!m||!m.role||!m.content)continue; input.push({role:m.role==='assistant'?'assistant':'user',content:String(m.content).slice(0,2000)});}
      const result=await openAIRequest({model:process.env.OPENAI_MODEL||'gpt-5.6-luna',input,max_output_tokens:220});
      return json(res,200,{reply:responseText(result)||'Bilkul. Chaliye next step karte hain.'});
    }
    if(resource==='users'){
      if(req.method==='POST'){const b=await body(req);let u=db.users.find(x=>x.contact===b.contact&&x.role===b.role);if(!u){u={id:id(db,'u'),name:b.name||'New User',contact:b.contact||'',role:b.role||'buyer',profile:b.role==='artisan'?{craft:'',location:'',bio:'',trustScore:100,photo:null}:{location:'',photo:null}};db.users.push(u)}else if(b.name)u.name=b.name;writeDB(db);return json(res,200,u)}
      if(itemId&&req.method==='PUT'){const b=await body(req);const u=db.users.find(x=>x.id===itemId);if(!u)return json(res,404,{error:'User not found'});u.profile={...(u.profile||{}),...(b.profile||{})};if(b.name)u.name=b.name;writeDB(db);return json(res,200,u)}
    }
    if(resource==='products'){
      if(req.method==='GET'&&!itemId)return json(res,200,db.products.map(p=>({...p,artisan:db.users.find(u=>u.id===p.artisanId)})));
      if(req.method==='GET'&&itemId){const p=db.products.find(x=>x.id===itemId);if(!p)return json(res,404,{error:'Product not found'});return json(res,200,{...p,artisan:db.users.find(u=>u.id===p.artisanId),reviews:db.reviews.filter(r=>r.productId===p.id)})}
      if(req.method==='POST'){const b=await body(req);const gallery=Array.isArray(b.gallery)?b.gallery:(Array.isArray(b.craftInfo?.gallery)?b.craftInfo.gallery:[]);const hash=crypto.createHash('sha256').update(String(b.image||'')).digest('hex');const duplicate=db.products.some(p=>p.imageHash&&p.imageHash===hash);const p={id:id(db,'p'),uniqueProductId:uniqueProductId(db),artisanId:b.artisanId,title:b.title||'Untitled handmade piece',description:b.description||'',price:Number(b.price)||0,category:b.category||'Other',image:b.image||null,gallery,verificationStatus:'unverified',availability:true,craftInfo:{...(b.craftInfo||{}),gallery,ownershipDeclared:b.craftInfo?.ownershipDeclared!==false},imageHash:hash,duplicateFlag:duplicate,trustScore:100,riskScore:0,productProcessMatch:0};db.products.unshift(p);writeDB(db);return json(res,201,p)}
    }
    if(resource==='scan'&&req.method==='POST'){const b=await body(req);const p=db.products.find(x=>x.id===b.productId);if(!p)return json(res,404,{error:'Product not found'});const r=verifyProduct(p);Object.assign(p,{verificationStatus:r.status,trustScore:r.trustScore,riskScore:r.riskScore,productProcessMatch:r.productProcessMatch,verificationDate:new Date().toISOString()});if(r.status==='needs_review')db.reviewQueue.unshift({id:id(db,'rvq'),productId:p.id,riskScore:r.riskScore,reason:'AI detected risk signals; human review required.',status:'pending'});writeDB(db);return json(res,200,r)}
    if(resource==='risk'&&req.method==='POST'){const b=await body(req);const p=db.products.find(x=>x.id===b.productId);if(!p)return json(res,404,{error:'Product not found'});return json(res,200,{riskScore:p.riskScore||0,level:(p.riskScore||0)>59?'high':(p.riskScore||0)>29?'medium':'low',reasons:p.duplicateFlag?['Possible duplicate/image reuse']:['No critical duplicate signal']})}
    if(resource==='wishlist'){
      const q=url.searchParams.get('userId'); if(req.method==='GET')return json(res,200,db.wishlist.filter(w=>w.userId===q).map(w=>db.products.find(p=>p.id===w.productId)).filter(Boolean));
      const b=await body(req);if(req.method==='POST'){if(!db.wishlist.some(w=>w.userId===b.userId&&w.productId===b.productId))db.wishlist.push({userId:b.userId,productId:b.productId});writeDB(db);return json(res,200,{ok:true})} if(req.method==='DELETE'){db.wishlist=db.wishlist.filter(w=>!(w.userId===b.userId&&w.productId===b.productId));writeDB(db);return json(res,200,{ok:true})}
    }
    if(resource==='cart'){
      const q=url.searchParams.get('userId'); if(req.method==='GET')return json(res,200,db.cart.filter(c=>c.userId===q).map(c=>({...c,product:db.products.find(p=>p.id===c.productId)})));
      const b=await body(req);if(req.method==='POST'){const c=db.cart.find(x=>x.userId===b.userId&&x.productId===b.productId);if(c)c.qty++;else db.cart.push({userId:b.userId,productId:b.productId,qty:1});writeDB(db);return json(res,200,{ok:true})}if(req.method==='DELETE'){db.cart=db.cart.filter(c=>!(c.userId===b.userId&&c.productId===b.productId));writeDB(db);return json(res,200,{ok:true})}
    }
    if(resource==='orders'&&req.method==='GET'){const q=url.searchParams.get('userId');const user=db.users.find(u=>u.id===q);let out=[];if(user?.role==='artisan'){out=db.orders.filter(o=>(o.products||[]).some(item=>{const p=db.products.find(x=>x.id===item.productId);return p&&p.artisanId===q;})).map(o=>({...o,artisanItems:(o.products||[]).filter(item=>{const p=db.products.find(x=>x.id===item.productId);return p&&p.artisanId===q;})}));}else{out=db.orders.filter(o=>o.buyerId===q).map(o=>({...o,artisanItems:o.products||[]}));}return json(res,200,out)}
    if(resource==='checkout'&&itemId==='cod'&&req.method==='POST'){const b=await body(req);const items=db.cart.filter(c=>c.userId===b.buyerId);const products=items.map(c=>{const p=db.products.find(x=>x.id===c.productId);return {productId:c.productId,title:p?.title||'Handmade piece',price:p?.price||0,qty:c.qty}});if(!products.length)return json(res,400,{error:'Cart is empty'});const order={id:id(db,'o'),buyerId:b.buyerId,products,amount:products.reduce((s,p)=>s+p.price*p.qty,0),status:'placed',date:new Date().toISOString(),address:b.address||{},paymentMethod:'cod'};db.orders.unshift(order);db.cart=db.cart.filter(c=>c.userId!==b.buyerId);writeDB(db);return json(res,201,order)}
    if(resource==='payment'&&itemId==='config'&&req.method==='GET')return json(res,200,{configured:!!(process.env.RAZORPAY_KEY_ID&&process.env.RAZORPAY_KEY_SECRET),keyId:process.env.RAZORPAY_KEY_ID||null});
    if(resource==='payment'&&itemId==='create-order'&&req.method==='POST')return json(res,503,{error:'Online payment is not configured. Use Cash on Delivery for the demo, or add Razorpay keys on the server.'});
    if(resource==='payment'&&itemId==='verify'&&req.method==='POST')return json(res,200,{ok:true});
    if(resource==='reels'){
      if(req.method==='GET'){const q=url.searchParams.get('artisanId');let rs=q?db.reels.filter(r=>r.artisanId===q):db.reels;return json(res,200,rs.map(r=>({...r,artisan:db.users.find(u=>u.id===r.artisanId),product:db.products.find(p=>p.id===r.productId)})))}
      if(req.method==='POST'){const b=await body(req);const r={id:id(db,'r'),...b,createdAt:new Date().toISOString(),likes:0,comments:0};db.reels.unshift(r);writeDB(db);return json(res,201,r)}
      if(itemId&&req.method==='PUT'){const b=await body(req);const r=db.reels.find(x=>x.id===itemId);if(!r)return json(res,404,{error:'Reel not found'});Object.assign(r,b);writeDB(db);return json(res,200,r)}
      if(itemId&&req.method==='DELETE'){db.reels=db.reels.filter(x=>x.id!==itemId);writeDB(db);return json(res,200,{ok:true})}
    }
    if(resource==='reviews'){
      if(req.method==='GET'){const productId=url.searchParams.get('productId');if(productId)return json(res,200,db.reviews.filter(r=>r.productId===productId));return json(res,200,db.reviewQueue.filter(x=>x.status==='pending').map(x=>({...x,product:db.products.find(p=>p.id===x.productId)})))}
      if(req.method==='POST'){const b=await body(req);const r={id:id(db,'rev'),productId:b.productId,buyerId:b.buyerId,buyerName:b.buyerName||'Buyer',stars:Math.max(1,Math.min(5,Number(b.stars)||5)),text:String(b.text||''),createdAt:new Date().toISOString()};db.reviews.unshift(r);writeDB(db);return json(res,201,r)}
      if(itemId&&req.method==='PUT'){const b=await body(req);const r=db.reviewQueue.find(x=>x.id===itemId);if(!r)return json(res,404,{error:'Review item not found'});r.status=b.status||r.status;r.note=b.note||'';writeDB(db);return json(res,200,r)}
    }
    if(resource==='customizations'&&req.method==='POST'){const b=await body(req);const c={id:id(db,'c'),customizationId:`KS-CUST-${String(db._meta.nextId).padStart(5,'0')}`,...b,createdAt:new Date().toISOString()};db.customizations=db.customizations||[];db.customizations.unshift(c);writeDB(db);return json(res,201,c)}
    if(resource==='certificate'&&itemId){const p=db.products.find(x=>x.uniqueProductId===decodeURIComponent(itemId)||x.id===decodeURIComponent(itemId));if(!p)return json(res,404,{error:'Certificate unavailable'});return json(res,200,{product:{...p,artisan:db.users.find(u=>u.id===p.artisanId),customizations:(db.customizations||[]).filter(c=>c.productId===p.id)}})}
    if(resource==='location'&&itemId==='reverse')return json(res,200,{area:'',city:'',pincode:'',displayName:''});
    return json(res,404,{error:'API route not found'});
  }catch(e){console.error(e);return json(res,500,{error:e.message||'Server error'});}
}

const server=http.createServer((req,res)=>{if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});return res.end();}const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);if(url.pathname.startsWith('/api/'))return api(req,res,url);return staticFile(req,res)});
server.listen(PORT,'0.0.0.0',()=>console.log(`KalaSutra running on http://0.0.0.0:${PORT}`));
