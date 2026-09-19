/* KalaSutra — Video-style Animated Login Flow
   Add this ONE file to the project as:
   public/kalasutra-login-flow.js

   Then add this one line to index.html BEFORE app.tsx:
   <script src="./kalasutra-login-flow.js"></script>

   It keeps the existing React login/OTP/captcha logic and only upgrades
   the presentation + animation.
*/
(function () {
  "use strict";

  const css = `
    .ks-login-video-flow {
      position: relative !important;
      overflow: hidden !important;
      min-height: 100vh !important;
      background:
        radial-gradient(circle at 50% 8%, rgba(255,255,255,.95), transparent 32%),
        linear-gradient(180deg,#fbf2e7 0%,#f7eadc 55%,#f3dfcd 100%) !important;
      color:#33251d !important;
      animation: ksPageIn .7s ease both;
    }

    .ks-login-video-flow::before,
    .ks-login-video-flow::after {
      content:"";
      position:absolute;
      pointer-events:none;
      border-radius:50%;
      filter:blur(2px);
      opacity:.35;
    }
    .ks-login-video-flow::before {
      width:220px;height:220px;left:-100px;top:12%;
      background:#d79a6d;
      animation:ksFloat 6s ease-in-out infinite;
    }
    .ks-login-video-flow::after {
      width:180px;height:180px;right:-80px;bottom:12%;
      background:#b8a878;
      animation:ksFloat 7s ease-in-out infinite reverse;
    }

    .ks-login-back {
      position:absolute !important;
      z-index:20 !important;
      top:22px !important;
      left:20px !important;
      width:46px !important;
      height:46px !important;
      border:1px solid rgba(112,65,39,.18) !important;
      border-radius:50% !important;
      background:rgba(255,255,255,.72) !important;
      color:#6b351d !important;
      font-size:25px !important;
      display:flex !important;
      align-items:center !important;
      justify-content:center !important;
      box-shadow:0 8px 22px rgba(85,48,28,.10) !important;
      cursor:pointer !important;
      transition:.25s ease !important;
    }
    .ks-login-back:hover { transform:translateX(-3px) scale(1.04); }

    .ks-login-content {
      position:relative;
      z-index:2;
      width:min(100%,430px);
      margin:auto;
      padding:28px 24px 42px;
    }

    .ks-login-art {
      width:116px !important;
      height:116px !important;
      margin:8px auto 12px !important;
      border-radius:50% !important;
      display:flex !important;
      align-items:center !important;
      justify-content:center !important;
      background:rgba(255,255,255,.72) !important;
      border:1px solid rgba(126,72,42,.12) !important;
      box-shadow:0 18px 45px rgba(102,55,31,.16) !important;
      animation:ksArtIn .9s cubic-bezier(.2,.8,.2,1) both;
    }
    .ks-login-art img {
      width:94px !important;
      height:94px !important;
      object-fit:contain !important;
      animation:ksArtFloat 3.8s ease-in-out infinite;
    }

    .ks-login-brand {
      text-align:center;
      margin:4px 0 24px;
      animation:ksFadeUp .7s .18s ease both;
    }
    .ks-login-brand img {
      width:auto !important;
      height:54px !important;
      max-width:210px !important;
      object-fit:contain !important;
    }
    .ks-login-brand small {
      display:block;
      margin-top:2px;
      color:#80563f;
      font-size:10px;
      letter-spacing:1.5px;
      text-transform:uppercase;
    }

    .ks-login-heading {
      animation:ksFadeUp .7s .28s ease both;
    }
    .ks-login-heading h2 {
      font-size:34px !important;
      line-height:1.05 !important;
      margin:0 0 8px !important;
      color:#35231a !important;
      font-family:Georgia,serif !important;
    }
    .ks-login-heading p {
      font-size:14px !important;
      color:#745b4c !important;
      margin:0 0 24px !important;
    }

    .ks-login-card {
      padding:20px !important;
      border:1px solid rgba(117,70,42,.13) !important;
      border-radius:26px !important;
      background:rgba(255,255,255,.68) !important;
      box-shadow:0 18px 55px rgba(78,44,25,.12) !important;
      backdrop-filter:blur(12px);
      animation:ksCardIn .75s .36s ease both;
    }

    .ks-login-card .field { margin-bottom:16px !important; }
    .ks-login-card .field-label {
      color:#634535 !important;
      font-weight:700 !important;
      font-size:11px !important;
      letter-spacing:1px !important;
      text-transform:uppercase !important;
      margin-bottom:8px !important;
    }
    .ks-login-card input:not([type="checkbox"]) {
      width:100% !important;
      min-height:56px !important;
      border:1.5px solid #c8aa91 !important;
      border-radius:17px !important;
      background:#fffaf5 !important;
      color:#33251d !important;
      padding:0 17px !important;
      font-size:16px !important;
      outline:none !important;
      transition:.25s ease !important;
    }
    .ks-login-card input:not([type="checkbox"]):focus {
      border-color:#8b4828 !important;
      box-shadow:0 0 0 4px rgba(139,72,40,.10) !important;
      transform:translateY(-1px);
    }

    .ks-login-card .captcha-card {
      border-radius:19px !important;
      border:1px solid rgba(117,70,42,.12) !important;
      background:#fffaf5 !important;
      box-shadow:none !important;
      margin:14px 0 18px !important;
      padding:15px !important;
      animation:ksFadeUp .5s ease both;
    }

    .ks-login-card .btn {
      width:100% !important;
      min-height:56px !important;
      border:0 !important;
      border-radius:18px !important;
      background:linear-gradient(135deg,#7d351c,#a9572e) !important;
      color:white !important;
      font-size:16px !important;
      font-weight:800 !important;
      box-shadow:0 12px 28px rgba(125,53,28,.24) !important;
      transition:.25s ease !important;
    }
    .ks-login-card .btn:hover {
      transform:translateY(-2px);
      box-shadow:0 16px 32px rgba(125,53,28,.30) !important;
    }
    .ks-login-card .btn:active { transform:scale(.98); }

    .ks-login-progress {
      display:flex;
      gap:7px;
      margin:0 0 18px;
    }
    .ks-login-progress span {
      height:4px;
      flex:1;
      border-radius:10px;
      background:#ead9cb;
      transition:.35s ease;
    }
    .ks-login-progress span.active {
      background:#934723;
      box-shadow:0 2px 8px rgba(147,71,35,.25);
    }

    .ks-login-step-in {
      animation:ksStepIn .48s cubic-bezier(.2,.8,.2,1) both;
    }

    @keyframes ksPageIn { from{opacity:0} to{opacity:1} }
    @keyframes ksArtIn {
      from{opacity:0;transform:translateY(-24px) scale(.78)}
      to{opacity:1;transform:translateY(0) scale(1)}
    }
    @keyframes ksArtFloat {
      0%,100%{transform:translateY(0) rotate(0)}
      50%{transform:translateY(-7px) rotate(1deg)}
    }
    @keyframes ksFadeUp {
      from{opacity:0;transform:translateY(16px)}
      to{opacity:1;transform:translateY(0)}
    }
    @keyframes ksCardIn {
      from{opacity:0;transform:translateY(24px) scale(.98)}
      to{opacity:1;transform:translateY(0) scale(1)}
    }
    @keyframes ksStepIn {
      from{opacity:0;transform:translateX(24px)}
      to{opacity:1;transform:translateX(0)}
    }
    @keyframes ksFloat {
      0%,100%{transform:translateY(0)}
      50%{transform:translateY(-18px)}
    }

    @media(max-width:520px) {
      .ks-login-content { padding:22px 17px 34px; }
      .ks-login-art { width:102px !important;height:102px !important; }
      .ks-login-art img { width:82px !important;height:82px !important; }
      .ks-login-heading h2 { font-size:31px !important; }
      .ks-login-card { padding:16px !important;border-radius:23px !important; }
    }

    @media(prefers-reduced-motion:reduce) {
      .ks-login-video-flow *, .ks-login-video-flow::before,
      .ks-login-video-flow::after { animation:none !important;transition:none !important; }
    }
  `;

  function injectStyle() {
    if (document.getElementById("kalasutra-login-video-style")) return;
    const s = document.createElement("style");
    s.id = "kalasutra-login-video-style";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function enhance() {
    const root = document.querySelector(".login-screen");
    if (!root || root.dataset.ksEnhanced === "1") return;
    root.dataset.ksEnhanced = "1";
    root.classList.add("ks-login-video-flow");

    // Back/X button — returns to the splash screen.
    const back = document.createElement("button");
    back.className = "ks-login-back";
    back.type = "button";
    back.setAttribute("aria-label", "Back");
    back.textContent = "×";
    back.onclick = function () {
      // The current React app uses the splash phase before login.
      location.reload();
    };
    root.appendChild(back);

    const old = root.querySelector(".login-art-wrap");
    const content = root.querySelector(":scope > div:last-child");
    if (!old || !content) return;

    // Wrap existing login content so all existing OTP/captcha handlers stay intact.
    const inner = document.createElement("div");
    inner.className = "ks-login-content";

    // Move the existing artisan image into the animated art block.
    const art = document.createElement("div");
    art.className = "ks-login-art";
    const image = old.querySelector("img");
    if (image) art.appendChild(image.cloneNode(true));
    old.remove();

    // KalaSutra brand/logo above the form.
    const brand = document.createElement("div");
    brand.className = "ks-login-brand";
    brand.innerHTML =
      '<img src="/assets/logo.png" alt="KalaSutra">' +
      '<small>Artisans to the World</small>';

    const heading = document.createElement("div");
    heading.className = "ks-login-heading";

    const h2 = content.querySelector("h2");
    const p = content.querySelector("p");
    if (h2) heading.appendChild(h2);
    if (p) heading.appendChild(p);

    // Put remaining existing form elements inside the animated card.
    const card = document.createElement("div");
    card.className = "ks-login-card";

    const progress = document.createElement("div");
    progress.className = "ks-login-progress";
    progress.innerHTML = '<span class="active"></span><span></span><span></span>';

    while (content.firstChild) {
      const node = content.firstChild;
      if (node === h2 || node === p) {
        content.removeChild(node);
      } else {
        card.appendChild(node);
      }
    }

    inner.appendChild(art);
    inner.appendChild(brand);
    inner.appendChild(heading);
    inner.appendChild(progress);
    inner.appendChild(card);

    content.remove();
    root.appendChild(inner);

    updateStep(root);
  }

  function updateStep(root) {
    const card = root.querySelector(".ks-login-card");
    if (!card) return;

    const inputs = card.querySelectorAll("input");
    let step = 0;
    if ([...inputs].some(i => i.placeholder === "••••")) step = 1;
    if ([...inputs].some(i => i.placeholder === "Your full name")) step = 2;

    const bars = root.querySelectorAll(".ks-login-progress span");
    bars.forEach((b,i) => b.classList.toggle("active", i <= step));

    card.classList.remove("ks-login-step-in");
    void card.offsetWidth;
    card.classList.add("ks-login-step-in");
  }

  injectStyle();

  // React can replace the login subtree when OTP/name steps change.
  const observer = new MutationObserver(function () {
    const root = document.querySelector(".login-screen");
    if (!root) return;
    if (root.dataset.ksEnhanced !== "1") enhance();
    else updateStep(root);
  });

  observer.observe(document.body, { childList:true, subtree:true });

  document.addEventListener("DOMContentLoaded", enhance);
  setTimeout(enhance, 50);
  setTimeout(enhance, 500);
})();
/* ------------------------------------------------------------------
   KALASUTRA ADDITIVE UI PATCH
   Loaded automatically because index.html already loads this file.
   This patch does NOT replace React screens or remove functionality.
------------------------------------------------------------------- */
(function(){
  "use strict";
  function injectFixes(){
    if(document.getElementById("ks-ui-fix-style")) return;
    const s=document.createElement("style");
    s.id="ks-ui-fix-style";
    s.textContent=`
.app-shell{overflow-x:hidden;min-width:0}
.app-header{position:relative;z-index:10;min-height:68px;box-sizing:border-box;align-items:center}
.app-header>div{min-width:0}.app-header h2{line-height:1.15;overflow-wrap:anywhere}.app-header .sub{line-height:1.3}
.screen-orders .app-header>div:nth-child(2),.screen-cart .app-header-title,.screen-myReels .app-header>div:nth-child(2){padding-right:88px;box-sizing:border-box}
.screen-myReels .app-header .fab{flex:0 0 auto}
.header-back{flex:0 0 42px!important;width:42px!important;height:42px!important;display:flex!important;align-items:center!important;justify-content:center!important;position:relative!important;inset:auto!important;z-index:12!important;font-size:28px!important}
.content{box-sizing:border-box;min-width:0;padding-bottom:calc(120px + env(safe-area-inset-bottom))!important}
.order-item{min-width:0;gap:10px;align-items:flex-start}.order-item>div:first-child{min-width:0;flex:1;overflow-wrap:anywhere}.order-item .st{flex:0 0 auto;white-space:nowrap}
.artisan-order-summary{min-width:0}.artisan-order-summary>div{min-width:0;overflow:hidden}.order-filter-row{max-width:100%;overflow-x:auto;scrollbar-width:none}.order-filter-row::-webkit-scrollbar{display:none}
.my-reel-row{min-width:0;align-items:flex-start}.my-reel-row>div:nth-child(2){min-width:0;overflow-wrap:anywhere}.my-reel-row textarea{max-width:100%;box-sizing:border-box}
.buyer-reference-hero{padding:14px 16px 12px;background:linear-gradient(145deg,#fffaf3,#f1e3d4);border-bottom:1px solid #dfd0c1;min-width:0}
.buyer-reference-top{display:flex;align-items:center;justify-content:space-between;gap:12px}.buyer-reference-logo{width:145px;max-width:62%;height:auto;object-fit:contain}
.buyer-reference-copy{padding:14px 2px 10px}.buyer-reference-copy h1{margin:3px 0 6px;font:600 28px Fraunces,serif;color:#30251f}.buyer-reference-copy p{margin:0 0 12px;color:#756257;font-size:11px;line-height:1.45;max-width:310px}
.buyer-explore-cta{border:0;background:#342a24;color:#fff;border-radius:22px;padding:10px 15px;font-size:10px;font-weight:800;box-shadow:0 8px 18px rgba(50,38,29,.18)}.buyer-explore-cta span{margin-left:8px}
.buyer-explore-crafts{margin:20px 0 12px}.buyer-section-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin-bottom:11px}.buyer-section-heading span{font-size:8px;letter-spacing:1.4px;font-weight:900;color:#9a6b51}.buyer-section-heading h2{margin:3px 0 0;font:700 20px Fraunces,serif;color:#3a2b23}.buyer-section-heading button{border:0;background:none;color:#8b6653;font-size:9px;font-weight:800;white-space:nowrap}
.craft-scroll{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}.craft-chip{border:0;background:transparent;padding:0;min-width:0;color:#493a31}.craft-chip-art{display:flex;align-items:center;justify-content:center;width:100%;aspect-ratio:1;border-radius:50%;background:#efe2d3;border:1px solid #dfcfbf;font-size:25px;box-shadow:0 6px 15px rgba(78,51,33,.07)}.craft-chip strong{display:block;margin-top:6px;font-size:8.5px;line-height:1.15}
.buyer-trust-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:17px 0 5px}.buyer-trust-strip>div{display:flex;align-items:center;gap:6px;padding:9px 7px;border-radius:14px;background:#fffaf4;border:1px solid #e4d5c6}.buyer-trust-strip b{font-size:15px;color:#8c5235}.buyer-trust-strip span{font-size:7.5px;line-height:1.25;font-weight:800;color:#6d5c50}
.reels-wrap{padding-bottom:calc(105px + env(safe-area-inset-bottom));box-sizing:border-box;min-height:100vh}.reel{height:calc(100dvh - 4px)!important;min-height:520px;box-sizing:border-box;padding-bottom:calc(92px + env(safe-area-inset-bottom))}.reel-overlay{padding:18px 16px calc(26px + env(safe-area-inset-bottom))!important;gap:12px}.reel-info{min-width:0;max-width:calc(100% - 62px)}.reel-info span{display:block;overflow-wrap:anywhere;line-height:1.35}.reel-actions{flex:0 0 48px;gap:12px!important;margin-bottom:18px}.reel-comments-sheet{bottom:calc(94px + env(safe-area-inset-bottom))!important;max-height:42vh;box-sizing:border-box}.buyer-bottom-nav,.bottom-nav{bottom:max(8px,env(safe-area-inset-bottom))!important}.floating-cart-wrap{bottom:calc(84px + env(safe-area-inset-bottom))!important}
@media(max-width:600px){.app-header{padding:12px 13px 11px!important;gap:8px!important}.app-header h2{font-size:18px!important}.content{padding-left:13px!important;padding-right:13px!important}.craft-scroll{grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.craft-chip-art{font-size:21px}.buyer-reference-logo{width:132px}.buyer-reference-copy h1{font-size:25px}.reel-info{max-width:calc(100% - 58px)}.reel-actions{gap:9px!important;margin-bottom:10px}}
@media(max-width:380px){.craft-scroll{grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.craft-chip strong{font-size:7.5px}.buyer-trust-strip span{font-size:7px}.reel-actions .act .ic{font-size:19px!important}.reel-actions .act{font-size:8px!important}}
`;
    document.head.appendChild(s);
  }
  function buyerEnhance(){
    const shell=document.querySelector(".screen-buyerHome");
    if(!shell) return;
    const content=shell.querySelector(".buyer-content");
    if(!content) return;
    if(!content.querySelector(".buyer-explore-crafts")){
      const shortcuts=content.querySelector(".buyer-shortcuts");
      if(shortcuts){
        const sec=document.createElement("section");sec.className="buyer-explore-crafts";
        sec.innerHTML='<div class="buyer-section-heading"><div><span>DISCOVER</span><h2>EXPLORE BY CRAFT</h2></div><button type="button" class="ks-craft-all">View all</button></div><div class="craft-scroll">'+[["Pottery","🏺"],["Textiles","🧣"],["Woodwork","🪵"],["Metalwork","🪔"],["Cane & Bamboo","🧺"],["Jewellery","💍"],["Home Decor","🏠"],["More","✦"]].map(x=>'<button type="button" class="craft-chip" data-craft="'+x[0]+'"><span class="craft-chip-art">'+x[1]+'</span><strong>'+x[0]+'</strong></button>').join("")+'</div>';
        shortcuts.after(sec);
        const search=content.querySelector(".smart-search input");
        sec.querySelectorAll(".craft-chip").forEach(btn=>btn.addEventListener("click",()=>{const name=btn.getAttribute("data-craft")||"";if(search){search.value=name==="More"?"":name;search.dispatchEvent(new Event("input",{bubbles:true}));}const grid=content.querySelector(".grid");if(grid)setTimeout(()=>grid.scrollIntoView({behavior:"smooth",block:"start"}),60);}));
        sec.querySelector(".ks-craft-all")?.addEventListener("click",()=>{if(search){search.value="";search.dispatchEvent(new Event("input",{bubbles:true}));}});
      }
    }
    if(!content.querySelector(".buyer-trust-strip")){const t=document.createElement("section");t.className="buyer-trust-strip";t.innerHTML='<div><b>✓</b><span>Verified<br>Handmade</span></div><div><b>♡</b><span>Direct to<br>Artisan</span></div><div><b>↗</b><span>Fair &amp;<br>Traceable</span></div>';content.appendChild(t);}
    const header=shell.querySelector(".buyer-hero-header");
    if(header&&!shell.querySelector(".buyer-reference-hero")){
      const logoButton=header.querySelector(".buyer-wishlist-head");
      const name=(header.querySelector("h2")?.textContent||"Hello").replace("✦","").trim();
      const hero=document.createElement("div");hero.className="buyer-reference-hero";
      const top=document.createElement("div");top.className="buyer-reference-top";
      const img=document.createElement("img");img.className="buyer-reference-logo";img.src="/assets/logo.png";img.alt="KalaSutra";top.appendChild(img);if(logoButton)top.appendChild(logoButton);
      hero.appendChild(top);
      const copy=document.createElement("div");copy.className="buyer-reference-copy";copy.innerHTML='<div class="buyer-kicker">ART LIVES HERE ♡</div><h1>'+name+' <span class="hello-dot">✦</span></h1><p>Discover something made by hand, made with a story.</p><button class="buyer-explore-cta" type="button">Explore Handmade <span>→</span></button>';hero.appendChild(copy);
      header.replaceWith(hero);
      copy.querySelector(".buyer-explore-cta")?.addEventListener("click",()=>document.querySelector(".buyer-explore-crafts")?.scrollIntoView({behavior:"smooth",block:"start"}));
    }
  }
  function cartBack(){
    const shell=document.querySelector(".screen-cart");if(!shell)return;const header=shell.querySelector(".app-header");if(!header||header.querySelector(".ks-cart-back"))return;
    const b=document.createElement("button");b.className="header-back ks-cart-back";b.setAttribute("aria-label","Back");b.textContent="‹";
    b.onclick=()=>document.querySelector(".buyer-bottom-nav .nav-btn")?.click();
    header.insertBefore(b,header.firstChild);
  }
  function run(){injectFixes();buyerEnhance();cartBack();}
  const obs=new MutationObserver(run);
  function start(){run();obs.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
