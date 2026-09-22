(() => {
  "use strict";

  // KalaSutra — Karigar AI upgrade
  // This file is additive: it does not replace app.js or remove existing screens.
  // It enhances the existing AITalker with language-aware speech, first-run
  // onboarding/role handoff, Market Hub + Craft Capital voice intents, and a
  // language-change button.

  const LANGS = [
    ["hi", "hi-IN", "हिंदी"],
    ["en", "en-IN", "English"],
    ["mr", "mr-IN", "मराठी"],
    ["gu", "gu-IN", "ગુજરાતી"],
    ["pa", "pa-IN", "ਪੰਜਾਬੀ"],
    ["bn", "bn-IN", "বাংলা"],
    ["ta", "ta-IN", "தமிழ்"],
    ["te", "te-IN", "తెలుగు"],
    ["kn", "kn-IN", "ಕನ್ನಡ"],
    ["ml", "ml-IN", "മലയാളം"],
    ["or", "or-IN", "ଓଡ଼ିଆ"],
    ["ur", "ur-IN", "اردو"]
  ];

  const COPY = {
    hi: {
      welcome: "Namaste! Main Karigar AI hoon. Aap photo lo, apni craft story batao — baaki system main sambhalunga.",
      buyerWelcome: "Namaste! Main aapki craft journey mein help karunga.",
      listening: "🎙️ Main sun raha hoon… bas boliye.",
      addProduct: "Bilkul! Naya product khol raha hoon. Photo, story aur verification mein main aapko guide karunga.",
      reel: "Bilkul! Create Reel khol raha hoon. Aapke craft ki story ko Reel mein badalte hain.",
      orders: "Bilkul! Aapke orders khol raha hoon.",
      artisanOrders: "Bilkul! Orders aur earnings khol raha hoon.",
      earnings: "Bilkul! Aapki earnings khol raha hoon.",
      fairPrice: "Fair Price AI khol raha hoon. Aapke time, material aur craft value ko dhyan mein rakhenge.",
      capital: "Craft Capital khol raha hoon. Agle order ke liye working-capital plan banaate hain.",
      material: "Market Hub khol raha hoon. Raw material aur collective-buy options dekhte hain.",
      design: "Design Lab khol raha hoon. Traditional skill ko modern product idea mein badalte hain.",
      passport: "Craft Passport khol raha hoon. Aapke piece ki traceable story banate hain.",
      market: "Direct Market Match khol raha hoon. Aapke craft ke liye buyer demand dekhte hain.",
      gurukul: "Craft Gurukul khol raha hoon. Aap apni craft knowledge next generation ko sikha sakte hain.",
      profile: "Bilkul! Profile khol raha hoon.",
      products: "Bilkul! Aapke products khol raha hoon.",
      home: "Chaliye, aapka KalaSutra home kholte hain.",
      cart: "Bilkul! Aapka cart khol raha hoon.",
      wishlist: "Aapki saved crafts list khol raha hoon.",
      voiceUnavailable: "Is browser mein voice recognition available nahi hai. Aap supported browser mein KalaSutra kholkar voice try kar sakte hain.",
      unknown: "Main Karigar AI hoon. Aap bas bataiye ki aapko kya karna hai — main step by step guide karunga.",
      openModule: (title) => title + " khol raha hoon. Aap bas bolte rahiye."
    },
    en: {
      welcome: "Namaste! I am Karigar AI. Take a photo, tell me your craft story — I will handle the system work.",
      buyerWelcome: "Namaste! I’ll help you on your craft journey.",
      listening: "🎙️ I am listening… tell me what you need.",
      addProduct: "Absolutely! Opening Add Product. I will guide you through the photo, story and verification.",
      reel: "Opening Create Reel. Let’s turn your craft story into a Reel.",
      orders: "Opening your orders.",
      artisanOrders: "Opening your orders and earnings.",
      earnings: "Opening your earnings.",
      fairPrice: "Opening Fair Price AI. We’ll factor in your time, material and craft value.",
      capital: "Opening Craft Capital. Let’s prepare a working-capital plan for your next order.",
      material: "Opening Market Hub for raw-material and collective-buy options.",
      design: "Opening Design Lab for modern ideas built around your traditional skill.",
      passport: "Opening Craft Passport to build a traceable story for your piece.",
      market: "Opening Direct Market Match to explore buyer demand for your craft.",
      gurukul: "Opening Craft Gurukul so you can pass your craft knowledge to the next generation.",
      profile: "Opening your profile.",
      products: "Opening your products.",
      home: "Let’s go to your KalaSutra home.",
      cart: "Opening your cart.",
      wishlist: "Opening your saved crafts.",
      voiceUnavailable: "Voice recognition is not available in this browser. Please try a supported browser for voice on KalaSutra.",
      unknown: "I am Karigar AI. Tell me what you want to do and I will guide you step by step.",
      openModule: (title) => "Opening " + title + ". Keep talking — I’m with you."
    },
    mr: {
      welcome: "नमस्कार! मी Karigar AI आहे. फोटो घ्या, तुमच्या कलेची गोष्ट सांगा — बाकीचे काम मी सांभाळेन.",
      buyerWelcome: "नमस्कार! तुमच्या craft journey मध्ये मी मदत करेन.",
      listening: "🎙️ मी ऐकत आहे… सांगा.",
      addProduct: "नक्की! Add Product उघडत आहे. फोटो, गोष्ट आणि verification मध्ये मी मार्गदर्शन करेन.",
      reel: "Create Reel उघडत आहे. तुमच्या कलेची गोष्ट Reel मध्ये बदलूया.",
      orders: "तुमचे orders उघडत आहे.",
      artisanOrders: "तुमचे orders आणि earnings उघडत आहे.",
      earnings: "तुमची earnings उघडत आहे.",
      fairPrice: "Fair Price AI उघडत आहे. वेळ, material आणि craft value लक्षात घेऊ.",
      capital: "Craft Capital उघडत आहे. पुढच्या order साठी plan तयार करूया.",
      material: "Market Hub उघडत आहे. Raw material आणि collective-buy पर्याय पाहूया.",
      design: "Design Lab उघडत आहे. पारंपरिक skill साठी modern ideas पाहूया.",
      passport: "Craft Passport उघडत आहे. तुमच्या piece ची traceable story तयार करूया.",
      market: "Direct Market Match उघडत आहे. तुमच्या craft साठी buyer demand पाहूया.",
      gurukul: "Craft Gurukul उघडत आहे. तुमची craft knowledge पुढच्या पिढीला शिकवूया.",
      profile: "तुमचे profile उघडत आहे.",
      products: "तुमचे products उघडत आहे.",
      home: "तुमचे KalaSutra home उघडूया.",
      cart: "तुमचा cart उघडत आहे.",
      wishlist: "तुमच्या saved crafts उघडत आहे.",
      voiceUnavailable: "या browser मध्ये voice recognition उपलब्ध नाही. KalaSutra साठी supported browser वापरा.",
      unknown: "मी Karigar AI आहे. तुम्हाला काय करायचे आहे ते सांगा, मी step by step मार्गदर्शन करेन.",
      openModule: (title) => title + " उघडत आहे. तुम्ही बोलत राहा."
    },
    gu: {
      welcome: "નમસ્તે! હું Karigar AI છું. ફોટો લો, તમારી કળાની વાર્તા કહો — બાકીનું કામ હું સંભાળીશ.",
      buyerWelcome: "નમસ્તે! તમારી craft journey માં હું મદદ કરીશ.",
      listening: "🎙️ હું સાંભળી રહ્યો છું… બોલો.",
      addProduct: "હા! Add Product ખોલી રહ્યો છું. ફોટો, વાર્તા અને verification માં હું માર્ગદર્શન આપીશ.",
      reel: "Create Reel ખોલી રહ્યો છું. તમારી craft story ને Reel માં ફેરવીએ.",
      orders: "તમારા orders ખોલી રહ્યો છું.",
      artisanOrders: "તમારા orders અને earnings ખોલી રહ્યો છું.",
      earnings: "તમારી earnings ખોલી રહ્યો છું.",
      fairPrice: "Fair Price AI ખોલી રહ્યો છું. સમય, material અને craft value ધ્યાનમાં લઈશું.",
      capital: "Craft Capital ખોલી રહ્યો છું. આગળના order માટે plan બનાવીએ.",
      material: "Market Hub ખોલી રહ્યો છું. Raw material અને collective-buy options જોઈએ.",
      design: "Design Lab ખોલી રહ્યો છું. Traditional skill માટે modern ideas જોઈએ.",
      passport: "Craft Passport ખોલી રહ્યો છું. Piece માટે traceable story બનાવીએ.",
      market: "Direct Market Match ખોલી રહ્યો છું. તમારા craft માટે buyer demand જોઈએ.",
      gurukul: "Craft Gurukul ખોલી રહ્યો છું. Craft knowledge આગળની પેઢીને શીખવીએ.",
      profile: "તમારું profile ખોલી રહ્યો છું.",
      products: "તમારા products ખોલી રહ્યો છું.",
      home: "ચાલો, તમારું KalaSutra home ખોલીએ.",
      cart: "તમારો cart ખોલી રહ્યો છું.",
      wishlist: "તમારી saved crafts ખોલી રહ્યો છું.",
      voiceUnavailable: "આ browser માં voice recognition ઉપલબ્ધ નથી. KalaSutra માટે supported browser અજમાવો.",
      unknown: "હું Karigar AI છું. તમે શું કરવું છે તે કહો, હું step by step માર્ગદર્શન આપીશ.",
      openModule: (title) => title + " ખોલી રહ્યો છું. બોલતા રહો."
    },
    pa: {
      welcome: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ Karigar AI ਹਾਂ। ਫੋਟੋ ਲਓ, ਆਪਣੀ ਕਲਾ ਦੀ ਕਹਾਣੀ ਦੱਸੋ — ਬਾਕੀ ਕੰਮ ਮੈਂ ਸੰਭਾਲਾਂਗਾ।",
      buyerWelcome: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡੀ craft journey ਵਿੱਚ ਮਦਦ ਕਰਾਂਗਾ।",
      listening: "🎙️ ਮੈਂ ਸੁਣ ਰਿਹਾ ਹਾਂ… ਬੋਲੋ।",
      addProduct: "ਬਿਲਕੁਲ! Add Product ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ। ਫੋਟੋ, ਕਹਾਣੀ ਅਤੇ verification ਵਿੱਚ ਮੈਂ guide ਕਰਾਂਗਾ।",
      reel: "Create Reel ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ। ਤੁਹਾਡੀ craft story ਨੂੰ Reel ਵਿੱਚ ਬਦਲਦੇ ਹਾਂ।",
      orders: "ਤੁਹਾਡੇ orders ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ।",
      artisanOrders: "ਤੁਹਾਡੇ orders ਅਤੇ earnings ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ।",
      earnings: "ਤੁਹਾਡੀ earnings ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ।",
      fairPrice: "Fair Price AI ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ। ਸਮਾਂ, material ਅਤੇ craft value ਦੇਖਾਂਗੇ।",
      capital: "Craft Capital ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ। ਅਗਲੇ order ਲਈ plan ਬਣਾਈਏ।",
      material: "Market Hub ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ। Raw material ਅਤੇ collective-buy options ਵੇਖੀਏ।",
      design: "Design Lab ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ। Traditional skill ਲਈ modern ideas ਵੇਖੀਏ।",
      passport: "Craft Passport ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ। Piece ਦੀ traceable story ਬਣਾਈਏ।",
      market: "Direct Market Match ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ। ਤੁਹਾਡੇ craft ਲਈ buyer demand ਵੇਖੀਏ।",
      gurukul: "Craft Gurukul ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ। ਆਪਣੀ craft knowledge ਅਗਲੀ ਪੀੜ੍ਹੀ ਨੂੰ ਸਿਖਾਈਏ।",
      profile: "ਤੁਹਾਡਾ profile ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ।",
      products: "ਤੁਹਾਡੇ products ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ।",
      home: "ਚਲੋ, ਤੁਹਾਡਾ KalaSutra home ਖੋਲ੍ਹਦੇ ਹਾਂ।",
      cart: "ਤੁਹਾਡਾ cart ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ।",
      wishlist: "ਤੁਹਾਡੀਆਂ saved crafts ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ।",
      voiceUnavailable: "ਇਸ browser ਵਿੱਚ voice recognition ਉਪਲਬਧ ਨਹੀਂ। KalaSutra ਲਈ supported browser ਵਰਤੋ।",
      unknown: "ਮੈਂ Karigar AI ਹਾਂ। ਤੁਸੀਂ ਕੀ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ ਦੱਸੋ, ਮੈਂ step by step guide ਕਰਾਂਗਾ।",
      openModule: (title) => title + " ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ। ਬੋਲਦੇ ਰਹੋ।"
    },
    bn: {
      welcome: "নমস্কার! আমি Karigar AI। ছবি তুলুন, আপনার কারুকাজের গল্প বলুন — বাকি কাজ আমি সামলাব।",
      buyerWelcome: "নমস্কার! আপনার craft journey-তে আমি সাহায্য করব।",
      listening: "🎙️ আমি শুনছি… বলুন।",
      addProduct: "অবশ্যই! Add Product খুলছি। ছবি, গল্প ও verification-এ আমি সাহায্য করব।",
      reel: "Create Reel খুলছি। আপনার craft story-কে Reel বানাই।",
      orders: "আপনার orders খুলছি।",
      artisanOrders: "আপনার orders এবং earnings খুলছি।",
      earnings: "আপনার earnings খুলছি।",
      fairPrice: "Fair Price AI খুলছি। সময়, material ও craft value বিবেচনা করব।",
      capital: "Craft Capital খুলছি। পরের order-এর জন্য plan বানাই।",
      material: "Market Hub খুলছি। Raw material ও collective-buy options দেখি।",
      design: "Design Lab খুলছি। Traditional skill-এর জন্য modern ideas দেখি।",
      passport: "Craft Passport খুলছি। Piece-এর traceable story বানাই।",
      market: "Direct Market Match খুলছি। আপনার craft-এর buyer demand দেখি।",
      gurukul: "Craft Gurukul খুলছি। আপনার craft knowledge পরের প্রজন্মকে শেখাই।",
      profile: "আপনার profile খুলছি।",
      products: "আপনার products খুলছি।",
      home: "চলুন, আপনার KalaSutra home-এ যাই।",
      cart: "আপনার cart খুলছি।",
      wishlist: "আপনার saved crafts খুলছি।",
      voiceUnavailable: "এই browser-এ voice recognition নেই। KalaSutra-তে supported browser ব্যবহার করুন।",
      unknown: "আমি Karigar AI। আপনি কী করতে চান বলুন, আমি ধাপে ধাপে সাহায্য করব।",
      openModule: (title) => title + " খুলছি। কথা বলতে থাকুন।"
    },
    ta: {
      welcome: "வணக்கம்! நான் Karigar AI. புகைப்படம் எடுத்து, உங்கள் கைவினைக் கதையை சொல்லுங்கள் — மீதியை நான் பார்த்துக்கொள்கிறேன்.",
      buyerWelcome: "வணக்கம்! உங்கள் craft journey-யில் நான் உதவுகிறேன்.",
      listening: "🎙️ நான் கேட்கிறேன்… சொல்லுங்கள்.",
      addProduct: "சரி! Add Product திறக்கிறேன். புகைப்படம், கதை மற்றும் verification-ல் வழிகாட்டுகிறேன்.",
      reel: "Create Reel திறக்கிறேன். உங்கள் craft story-யை Reel ஆக மாற்றலாம்.",
      orders: "உங்கள் orders-ஐ திறக்கிறேன்.",
      artisanOrders: "உங்கள் orders மற்றும் earnings-ஐ திறக்கிறேன்.",
      earnings: "உங்கள் earnings-ஐ திறக்கிறேன்.",
      fairPrice: "Fair Price AI திறக்கிறேன். நேரம், material மற்றும் craft value கணக்கில் கொள்வோம்.",
      capital: "Craft Capital திறக்கிறேன். அடுத்த order-க்கு plan செய்வோம்.",
      material: "Market Hub திறக்கிறேன். Raw material மற்றும் collective-buy options பார்ப்போம்.",
      design: "Design Lab திறக்கிறேன். உங்கள் traditional skill-க்கு modern ideas பார்ப்போம்.",
      passport: "Craft Passport திறக்கிறேன். உங்கள் piece-க்கு traceable story உருவாக்கலாம்.",
      market: "Direct Market Match திறக்கிறேன். உங்கள் craft-க்கு buyer demand பார்ப்போம்.",
      gurukul: "Craft Gurukul திறக்கிறேன். உங்கள் craft knowledge-ஐ அடுத்த தலைமுறைக்கு கற்பிக்கலாம்.",
      profile: "உங்கள் profile-ஐ திறக்கிறேன்.",
      products: "உங்கள் products-ஐ திறக்கிறேன்.",
      home: "உங்கள் KalaSutra home-க்கு போகலாம்.",
      cart: "உங்கள் cart-ஐ திறக்கிறேன்.",
      wishlist: "உங்கள் saved crafts-ஐ திறக்கிறேன்.",
      voiceUnavailable: "இந்த browser-ல் voice recognition இல்லை. KalaSutra-க்கு supported browser பயன்படுத்துங்கள்.",
      unknown: "நான் Karigar AI. என்ன செய்ய வேண்டும் என்று சொல்லுங்கள், step by step வழிகாட்டுகிறேன்.",
      openModule: (title) => title + " திறக்கிறேன். பேசிக்கொண்டே இருங்கள்."
    },
    te: {
      welcome: "నమస్తే! నేను Karigar AI. ఫోటో తీసి, మీ కళ కథ చెప్పండి — మిగతా పని నేను చూసుకుంటాను.",
      buyerWelcome: "నమస్తే! మీ craft journeyలో నేను సహాయం చేస్తాను.",
      listening: "🎙️ నేను వింటున్నాను… చెప్పండి.",
      addProduct: "సరే! Add Product తెరిస్తున్నాను. ఫోటో, కథ, verificationలో నేను మార్గదర్శనం చేస్తాను.",
      reel: "Create Reel తెరిస్తున్నాను. మీ craft storyని Reelగా మార్చుదాం.",
      orders: "మీ orders తెరిస్తున్నాను.",
      artisanOrders: "మీ orders మరియు earnings తెరిస్తున్నాను.",
      earnings: "మీ earnings తెరిస్తున్నాను.",
      fairPrice: "Fair Price AI తెరిస్తున్నాను. సమయం, material, craft value పరిగణిస్తాం.",
      capital: "Craft Capital తెరిస్తున్నాను. తదుపరి order కోసం plan చేద్దాం.",
      material: "Market Hub తెరిస్తున్నాను. Raw material మరియు collective-buy options చూద్దాం.",
      design: "Design Lab తెరిస్తున్నాను. Traditional skillకి modern ideas చూద్దాం.",
      passport: "Craft Passport తెరిస్తున్నాను. Pieceకి traceable story తయారు చేద్దాం.",
      market: "Direct Market Match తెరిస్తున్నాను. మీ craftకి buyer demand చూద్దాం.",
      gurukul: "Craft Gurukul తెరిస్తున్నాను. మీ craft knowledgeని next generationకి నేర్పుదాం.",
      profile: "మీ profile తెరిస్తున్నాను.",
      products: "మీ products తెరిస్తున్నాను.",
      home: "మీ KalaSutra homeకి వెళ్దాం.",
      cart: "మీ cart తెరిస్తున్నాను.",
      wishlist: "మీ saved crafts తెరిస్తున్నాను.",
      voiceUnavailable: "ఈ browserలో voice recognition లేదు. KalaSutra కోసం supported browser ఉపయోగించండి.",
      unknown: "నేను Karigar AI. మీరు ఏం చేయాలనుకుంటున్నారో చెప్పండి, step by step guide చేస్తాను.",
      openModule: (title) => title + " తెరిస్తున్నాను. మాట్లాడుతూనే ఉండండి."
    },
    kn: {
      welcome: "ನಮಸ್ಕಾರ! ನಾನು Karigar AI. ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ, ನಿಮ್ಮ craft story ಹೇಳಿ — ಉಳಿದುದನ್ನು ನಾನು ನೋಡಿಕೊಳ್ಳುತ್ತೇನೆ.",
      buyerWelcome: "ನಮಸ್ಕಾರ! ನಿಮ್ಮ craft journeyಯಲ್ಲಿ ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.",
      listening: "🎙️ ನಾನು ಕೇಳುತ್ತಿದ್ದೇನೆ… ಹೇಳಿ.",
      addProduct: "ಖಂಡಿತ! Add Product ತೆರೆಯುತ್ತಿದ್ದೇನೆ. ಫೋಟೋ, ಕಥೆ ಮತ್ತು verificationನಲ್ಲಿ ಮಾರ್ಗದರ್ಶನ ಕೊಡುತ್ತೇನೆ.",
      reel: "Create Reel ತೆರೆಯುತ್ತಿದ್ದೇನೆ. ನಿಮ್ಮ craft storyಯನ್ನು Reel ಆಗಿ ಮಾಡೋಣ.",
      orders: "ನಿಮ್ಮ orders ತೆರೆಯುತ್ತಿದ್ದೇನೆ.",
      artisanOrders: "ನಿಮ್ಮ orders ಮತ್ತು earnings ತೆರೆಯುತ್ತಿದ್ದೇನೆ.",
      earnings: "ನಿಮ್ಮ earnings ತೆರೆಯುತ್ತಿದ್ದೇನೆ.",
      fairPrice: "Fair Price AI ತೆರೆಯುತ್ತಿದ್ದೇನೆ. ಸಮಯ, material ಮತ್ತು craft value ಗಮನಿಸುತ್ತೇವೆ.",
      capital: "Craft Capital ತೆರೆಯುತ್ತಿದ್ದೇನೆ. ಮುಂದಿನ orderಗಾಗಿ plan ಮಾಡೋಣ.",
      material: "Market Hub ತೆರೆಯುತ್ತಿದ್ದೇನೆ. Raw material ಮತ್ತು collective-buy options ನೋಡೋಣ.",
      design: "Design Lab ತೆರೆಯುತ್ತಿದ್ದೇನೆ. Traditional skillಗೆ modern ideas ನೋಡೋಣ.",
      passport: "Craft Passport ತೆರೆಯುತ್ತಿದ್ದೇನೆ. Pieceಗೆ traceable story ಮಾಡೋಣ.",
      market: "Direct Market Match ತೆರೆಯುತ್ತಿದ್ದೇನೆ. ನಿಮ್ಮ craftಗೆ buyer demand ನೋಡೋಣ.",
      gurukul: "Craft Gurukul ತೆರೆಯುತ್ತಿದ್ದೇನೆ. ನಿಮ್ಮ craft knowledge ಮುಂದಿನ ಪೀಳಿಗೆಗೆ ಕಲಿಸೋಣ.",
      profile: "ನಿಮ್ಮ profile ತೆರೆಯುತ್ತಿದ್ದೇನೆ.",
      products: "ನಿಮ್ಮ products ತೆರೆಯುತ್ತಿದ್ದೇನೆ.",
      home: "ನಿಮ್ಮ KalaSutra homeಗೆ ಹೋಗೋಣ.",
      cart: "ನಿಮ್ಮ cart ತೆರೆಯುತ್ತಿದ್ದೇನೆ.",
      wishlist: "ನಿಮ್ಮ saved crafts ತೆರೆಯುತ್ತಿದ್ದೇನೆ.",
      voiceUnavailable: "ಈ browserನಲ್ಲಿ voice recognition ಲಭ್ಯವಿಲ್ಲ. KalaSutraಗಾಗಿ supported browser ಬಳಸಿ.",
      unknown: "ನಾನು Karigar AI. ನೀವು ಏನು ಮಾಡಬೇಕು ಹೇಳಿ, ನಾನು step by step guide ಮಾಡುತ್ತೇನೆ.",
      openModule: (title) => title + " ತೆರೆಯುತ್ತಿದ್ದೇನೆ. ಮಾತನಾಡುತ್ತಿರಿ."
    },
    ml: {
      welcome: "നമസ്കാരം! ഞാൻ Karigar AI. ഒരു ഫോട്ടോ എടുക്കൂ, നിങ്ങളുടെ craft story പറയൂ — ബാക്കി ഞാൻ നോക്കും.",
      buyerWelcome: "നമസ്കാരം! നിങ്ങളുടെ craft journeyയിൽ ഞാൻ സഹായിക്കും.",
      listening: "🎙️ ഞാൻ കേൾക്കുന്നു… പറയൂ.",
      addProduct: "തീർച്ചയായും! Add Product തുറക്കുന്നു. ഫോട്ടോ, കഥ, verification എന്നിവയിൽ ഞാൻ സഹായിക്കും.",
      reel: "Create Reel തുറക്കുന്നു. നിങ്ങളുടെ craft story Reel ആക്കാം.",
      orders: "നിങ്ങളുടെ orders തുറക്കുന്നു.",
      artisanOrders: "നിങ്ങളുടെ orders ഉം earnings ഉം തുറക്കുന്നു.",
      earnings: "നിങ്ങളുടെ earnings തുറക്കുന്നു.",
      fairPrice: "Fair Price AI തുറക്കുന്നു. സമയം, material, craft value കണക്കാക്കാം.",
      capital: "Craft Capital തുറക്കുന്നു. അടുത്ത order-ിനുള്ള plan തയ്യാറാക്കാം.",
      material: "Market Hub തുറക്കുന്നു. Raw material, collective-buy options നോക്കാം.",
      design: "Design Lab തുറക്കുന്നു. Traditional skill-ന് modern ideas നോക്കാം.",
      passport: "Craft Passport തുറക്കുന്നു. Piece-ന് traceable story ഉണ്ടാക്കാം.",
      market: "Direct Market Match തുറക്കുന്നു. നിങ്ങളുടെ craft-ന് buyer demand നോക്കാം.",
      gurukul: "Craft Gurukul തുറക്കുന്നു. നിങ്ങളുടെ craft knowledge അടുത്ത തലമുറയ്ക്ക് പഠിപ്പിക്കാം.",
      profile: "നിങ്ങളുടെ profile തുറക്കുന്നു.",
      products: "നിങ്ങളുടെ products തുറക്കുന്നു.",
      home: "നിങ്ങളുടെ KalaSutra home-ലേക്ക് പോകാം.",
      cart: "നിങ്ങളുടെ cart തുറക്കുന്നു.",
      wishlist: "നിങ്ങളുടെ saved crafts തുറക്കുന്നു.",
      voiceUnavailable: "ഈ browser-ൽ voice recognition ലഭ്യമല്ല. KalaSutra-യിൽ supported browser ഉപയോഗിക്കുക.",
      unknown: "ഞാൻ Karigar AI ആണ്. എന്താണ് ചെയ്യേണ്ടത് പറയൂ, step by step ഞാൻ സഹായിക്കും.",
      openModule: (title) => title + " തുറക്കുന്നു. സംസാരിച്ചുകൊണ്ടിരിക്കുക."
    },
    or: {
      welcome: "ନମସ୍କାର! ମୁଁ Karigar AI। ଫଟୋ ନିଅନ୍ତୁ, ଆପଣଙ୍କ craft story କହନ୍ତୁ — ବାକି କାମ ମୁଁ ସମ୍ଭାଳିବି।",
      buyerWelcome: "ନମସ୍କାର! ଆପଣଙ୍କ craft journeyରେ ମୁଁ ସହଯୋଗ କରିବି।",
      listening: "🎙️ ମୁଁ ଶୁଣୁଛି… କହନ୍ତୁ।",
      addProduct: "ନିଶ୍ଚିତ! Add Product ଖୋଲୁଛି। ଫଟୋ, story ଏବଂ verificationରେ ମୁଁ guide କରିବି।",
      reel: "Create Reel ଖୋଲୁଛି। ଆପଣଙ୍କ craft storyକୁ Reel କରିବା।",
      orders: "ଆପଣଙ୍କ orders ଖୋଲୁଛି।",
      artisanOrders: "ଆପଣଙ୍କ orders ଏବଂ earnings ଖୋଲୁଛି।",
      earnings: "ଆପଣଙ୍କ earnings ଖୋଲୁଛି।",
      fairPrice: "Fair Price AI ଖୋଲୁଛି। ସମୟ, material ଏବଂ craft value ଧ୍ୟାନରେ ରଖିବା।",
      capital: "Craft Capital ଖୋଲୁଛି। ପରବର୍ତ୍ତୀ order ପାଇଁ plan କରିବା।",
      material: "Market Hub ଖୋଲୁଛି। Raw material ଏବଂ collective-buy options ଦେଖିବା।",
      design: "Design Lab ଖୋଲୁଛି। Traditional skill ପାଇଁ modern ideas ଦେଖିବା।",
      passport: "Craft Passport ଖୋଲୁଛି। Piece ପାଇଁ traceable story ତିଆରି କରିବା।",
      market: "Direct Market Match ଖୋଲୁଛି। ଆପଣଙ୍କ craft ପାଇଁ buyer demand ଦେଖିବା।",
      gurukul: "Craft Gurukul ଖୋଲୁଛି। ଆପଣଙ୍କ craft knowledge ଆଗାମୀ ପିଢ଼ିକୁ ଶିଖାଇବା।",
      profile: "ଆପଣଙ୍କ profile ଖୋଲୁଛି।",
      products: "ଆପଣଙ୍କ products ଖୋଲୁଛି।",
      home: "ଚାଲନ୍ତୁ, ଆପଣଙ୍କ KalaSutra homeକୁ ଯିବା।",
      cart: "ଆପଣଙ୍କ cart ଖୋଲୁଛି।",
      wishlist: "ଆପଣଙ୍କ saved crafts ଖୋଲୁଛି।",
      voiceUnavailable: "ଏହି browserରେ voice recognition ନାହିଁ। KalaSutra ପାଇଁ supported browser ବ୍ୟବହାର କରନ୍ତୁ।",
      unknown: "ମୁଁ Karigar AI। କଣ କରିବାକୁ ଚାହୁଁଛନ୍ତି କହନ୍ତୁ, ମୁଁ step by step guide କରିବି।",
      openModule: (title) => title + " ଖୋଲୁଛି। କଥା କହୁଥାନ୍ତୁ।"
    },
    ur: {
      welcome: "السلام علیکم! میں Karigar AI ہوں۔ تصویر لیں، اپنے ہنر کی کہانی بتائیں — باقی کام میں سنبھال لوں گا۔",
      buyerWelcome: "السلام علیکم! میں آپ کی craft journey میں مدد کروں گا۔",
      listening: "🎙️ میں سن رہا ہوں… بولیے۔",
      addProduct: "بالکل! Add Product کھول رہا ہوں۔ تصویر، کہانی اور verification میں میں آپ کی رہنمائی کروں گا۔",
      reel: "Create Reel کھول رہا ہوں۔ آپ کی craft story کو Reel میں بدلتے ہیں۔",
      orders: "آپ کے orders کھول رہا ہوں۔",
      artisanOrders: "آپ کے orders اور earnings کھول رہا ہوں۔",
      earnings: "آپ کی earnings کھول رہا ہوں۔",
      fairPrice: "Fair Price AI کھول رہا ہوں۔ وقت، material اور craft value کو دیکھیں گے۔",
      capital: "Craft Capital کھول رہا ہوں۔ اگلے order کے لیے plan بناتے ہیں۔",
      material: "Market Hub کھول رہا ہوں۔ Raw material اور collective-buy options دیکھتے ہیں۔",
      design: "Design Lab کھول رہا ہوں۔ Traditional skill کے لیے modern ideas دیکھتے ہیں۔",
      passport: "Craft Passport کھول رہا ہوں۔ Piece کی traceable story بناتے ہیں۔",
      market: "Direct Market Match کھول رہا ہوں۔ آپ کی craft کے لیے buyer demand دیکھتے ہیں۔",
      gurukul: "Craft Gurukul کھول رہا ہوں۔ اپنی craft knowledge اگلی نسل کو سکھاتے ہیں۔",
      profile: "آپ کا profile کھول رہا ہوں۔",
      products: "آپ کے products کھول رہا ہوں۔",
      home: "چلیے، آپ کے KalaSutra home پر چلتے ہیں۔",
      cart: "آپ کا cart کھول رہا ہوں۔",
      wishlist: "آپ کی saved crafts کھول رہا ہوں۔",
      voiceUnavailable: "اس browser میں voice recognition دستیاب نہیں۔ KalaSutra کے لیے supported browser استعمال کریں۔",
      unknown: "میں Karigar AI ہوں۔ بتائیے آپ کیا کرنا چاہتے ہیں، میں step by step رہنمائی کروں گا۔",
      openModule: (title) => title + " کھول رہا ہوں۔ آپ بولتے رہیے۔"
    }
  };

  let lastVoiceIntent = "";
  let lastIntentAt = 0;
  let rolePreference = null;
  let rolePickedAutomatically = false;

  function languageCode() {
    try {
      const stored = localStorage.getItem("kalasutra_language");
      if (stored && COPY[stored]) return stored;
    } catch (_) {}
    return "hi";
  }

  function voiceLanguage() {
    const entry = LANGS.find(item => item[0] === languageCode());
    return entry ? entry[1] : "hi-IN";
  }

  function say(key, ...args) {
    const pack = COPY[languageCode()] || COPY.hi;
    const value = pack[key] || COPY.hi[key] || "";
    return typeof value === "function" ? value(...args) : value;
  }

  function setIntent(intent) {
    lastVoiceIntent = intent;
    lastIntentAt = Date.now();
    setTimeout(() => {
      if (Date.now() - lastIntentAt > 3500) lastVoiceIntent = "";
    }, 3600);
  }

  function intentFromText(text) {
    const q = (text || "").toLowerCase().trim();
    if (!q) return "";
    if (q.includes("craft capital") || q.includes("working capital") || q.includes("capital") || q.includes("funding") || q.includes("पूंजी")) return "capital";
    if (q.includes("market hub") || q.includes("raw material") || q.includes("material hub") || q.includes("कच्चा माल") || q.includes("मटेरियल")) return "material";
    if (q.includes("fair price") || q.includes("fair daam") || q.includes("सही कीमत") || q.includes("कीमत")) return "fairPrice";
    if (q.includes("design lab") || q.includes("design idea") || q.includes("design") || q.includes("डिजाइन")) return "design";
    if (q.includes("craft passport") || q.includes("passport") || q.includes("पासपोर्ट")) return "passport";
    if (q.includes("direct market match") || q.includes("buyer dhundo") || q.includes("buyer") || q.includes("बायर")) return "market";
    if (q.includes("craft gurukul") || q.includes("gurukul") || q.includes("sikhana") || q.includes("सीखना")) return "gurukul";
    if (q.includes("reel") || q.includes("रील")) return "reel";
    if (q.includes("add product") || q.includes("new product") || q.includes("naya product") || q.includes("प्रोडक्ट")) return "addProduct";
    if (q.includes("order") || q.includes("ऑर्डर")) return "orders";
    if (q.includes("earning") || q.includes("कमाई")) return "earnings";
    return "";
  }

  function localizeUtterance(original) {
    const text = String(original || "");
    const lower = text.toLowerCase();

    if (Date.now() - lastIntentAt < 2500 && /^maine suna:/i.test(text) && lastVoiceIntent) {
      return say(lastVoiceIntent);
    }

    if (lower.includes("is browser mein voice recognition available nahi hai") || lower.includes("voice recognition is not available")) {
      return say("voiceUnavailable");
    }
    if (lower.includes("main sun raha hoon")) return say("listening");
    if (lower.includes("namaste! main karigar ai hoon") && lower.includes("photo")) return say("welcome");
    if (lower.includes("namaste! main karigar ai hoon") && lower.includes("bas boliye")) return say("welcome");
    if (lower.includes("namaste! main aapki craft journey")) return say("buyerWelcome");
    if (lower.includes("chaliye aapka naya product") || lower.includes("naya product khol raha")) return say("addProduct");
    if (lower.includes("create reel khol raha")) return say("reel");
    if (lower.includes("orders aur earnings")) return say("artisanOrders");
    if (lower.includes("aapke orders khol")) return say("orders");
    if (lower.includes("aapki earnings khol")) return say("earnings");
    if (lower.includes("profile khol raha")) return say("profile");
    if (lower.includes("aapke products khol")) return say("products");
    if (lower.includes("aapka kalasutra home")) return say("home");
    if (lower.includes("aapka cart khol")) return say("cart");
    if (lower.includes("saved crafts list")) return say("wishlist");

    const titleMap = [
      ["fair price ai", "fairPrice"],
      ["craft capital", "capital"],
      ["material hub", "material"],
      ["market hub", "material"],
      ["design lab", "design"],
      ["craft passport", "passport"],
      ["direct market match", "market"],
      ["craft gurukul", "gurukul"]
    ];
    for (const [title, key] of titleMap) {
      if (lower.includes(title)) return say(key);
    }

    if (lower.includes("maine suna:")) return say("unknown");
    return text;
  }

  function patchSpeechSynthesis() {
    try {
      if (!window.speechSynthesis || window.speechSynthesis.__ksKarigarPatched) return;
      const synth = window.speechSynthesis;
      const nativeSpeak = synth.speak.bind(synth);
      synth.speak = (utterance) => {
        try {
          utterance.text = localizeUtterance(utterance.text);
          utterance.lang = voiceLanguage();
        } catch (_) {}
        return nativeSpeak(utterance);
      };
      synth.__ksKarigarPatched = true;
    } catch (_) {}
  }

  function handleVoiceIntent(text) {
    const intent = intentFromText(text);
    if (!intent) return;
    setIntent(intent);

    if (intent === "capital") {
      setTimeout(() => clickGrowthModule("Craft Capital"), 550);
    } else if (intent === "material") {
      setTimeout(() => clickGrowthModule("Material Hub"), 550);
    } else if (intent === "fairPrice") {
      setTimeout(() => clickGrowthModule("Fair Price AI"), 550);
    } else if (intent === "design") {
      setTimeout(() => clickGrowthModule("Design Lab"), 550);
    } else if (intent === "passport") {
      setTimeout(() => clickGrowthModule("Craft Passport"), 550);
    } else if (intent === "market") {
      setTimeout(() => clickGrowthModule("Direct Market Match"), 550);
    } else if (intent === "gurukul") {
      setTimeout(() => clickGrowthModule("Craft Gurukul"), 550);
    }
  }

  function wrapRecognitionConstructor(name) {
    try {
      const Native = window[name];
      if (!Native || Native.__ksKarigarWrapped) return;

      const Wrapped = function() {
        const recognition = new Native();

        try {
          const nativeStart = recognition.start.bind(recognition);
          recognition.start = function() {
            try { recognition.lang = voiceLanguage(); } catch (_) {}
            return nativeStart();
          };

          if (typeof recognition.addEventListener === "function") {
            recognition.addEventListener("result", (event) => {
              try {
                const transcript = event.results?.[0]?.[0]?.transcript || "";
                handleVoiceIntent(transcript);
              } catch (_) {}
            });
          }
        } catch (_) {}

        return recognition;
      };

      Wrapped.prototype = Native.prototype;
      Wrapped.__ksKarigarWrapped = true;
      window[name] = Wrapped;
    } catch (_) {}
  }

  function clickGrowthModule(title) {
    const wanted = String(title).toLowerCase();
    const buttons = Array.from(document.querySelectorAll("button"));
    const exact = buttons.find(btn => {
      const text = (btn.textContent || "").trim().toLowerCase();
      return text === wanted;
    });
    const partial = buttons.find(btn => {
      const text = (btn.textContent || "").trim().toLowerCase();
      return text.includes(wanted);
    });
    const target = exact || partial;
    if (target) {
      target.click();
      return true;
    }
    return false;
  }

  function autoPickRole() {
    if (!rolePreference || rolePickedAutomatically) return;
    const wanted = rolePreference === "artisan" ? "i'm an artisan" : "i'm a buyer";
    const buttons = Array.from(document.querySelectorAll("button"));

    const target = buttons.find(btn => {
      const t = (btn.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      return t.includes(wanted);
    });

    if (target) {
      rolePickedAutomatically = true;
      target.click();
    }
  }

  function listenForRoleSelection() {
    window.addEventListener("kalasutra:role-selected", (event) => {
      const role = event?.detail?.role;
      if (role !== "artisan" && role !== "buyer") return;
      rolePreference = role;
      try {
        localStorage.setItem("kalasutra_role_preference", role);
        localStorage.setItem("kalasutra_welcome_seen", "1");
        localStorage.setItem("kalasutra_voice_lang", voiceLanguage());
      } catch (_) {}
      rolePickedAutomatically = false;
      setTimeout(autoPickRole, 350);
      setTimeout(autoPickRole, 900);
      setTimeout(autoPickRole, 1600);
      setTimeout(autoPickRole, 2600);
    });

    try {
      const stored = localStorage.getItem("kalasutra_role_preference");
      if (stored === "artisan" || stored === "buyer") rolePreference = stored;
    } catch (_) {}
  }

  function addLanguageButton() {
    if (document.getElementById("ks-ai-language-button")) return;

    const header = document.querySelector(".ai-talker-embedded .ai-talker-head") ||
                   document.querySelector(".ai-talker .ai-talker-head");
    if (!header) return;

    const btn = document.createElement("button");
    btn.id = "ks-ai-language-button";
    btn.type = "button";
    btn.textContent = "Language";
    btn.title = "Change KalaSutra language";
    btn.addEventListener("click", () => {
      try { localStorage.removeItem("kalasutra_welcome_seen"); } catch (_) {}
      window.KalaSutraLanguage?.mount?.();
      const overlay = document.getElementById("kalasutra-language-overlay");
      if (overlay) overlay.style.display = "flex";
    });
    header.appendChild(btn);
  }

  function injectStyles() {
    if (document.getElementById("ks-ai-upgrade-style")) return;
    const style = document.createElement("style");
    style.id = "ks-ai-upgrade-style";
    style.textContent = `
      #ks-ai-language-button{
        margin-left:8px;
        border:1px solid rgba(111,78,55,.18);
        background:#fff;
        color:#6f4e37;
        border-radius:999px;
        padding:6px 9px;
        font-size:10px;
        font-weight:800;
        cursor:pointer;
      }
      #ks-ai-language-button:active{transform:scale(.97)}
      .ks-lang-ai-line{
        margin:0 0 18px;
        padding:11px 13px;
        border-radius:14px;
        background:#f8f0e6;
        border:1px solid rgba(111,78,55,.10);
        color:#6f4e37;
        font-size:12px;
        line-height:1.45;
        font-weight:800;
      }
      .ks-lang-ai-line span{font-weight:600;color:#7e6a5a}
      @media(max-width:540px){
        #ks-ai-language-button{padding:6px 8px;font-size:9px}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureOverlayCopyEnhancement() {
    const overlay = document.getElementById("kalasutra-language-overlay");
    if (!overlay) return;
    if (!overlay.querySelector(".ks-lang-ai-line")) {
      const p = overlay.querySelector("#ks-lang-subtitle");
      if (p) {
        const line = document.createElement("div");
        line.className = "ks-lang-ai-line";
        line.innerHTML = "✦ Karigar AI is ready — <span>take a photo, tell your story, and let AI do the rest.</span>";
        p.insertAdjacentElement("afterend", line);
      }
    }
  }

  function startObservers() {
    const observer = new MutationObserver(() => {
      ensureOverlayCopyEnhancement();
      if (rolePreference) autoPickRole();
      addLanguageButton();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(() => { ensureOverlayCopyEnhancement(); addLanguageButton(); autoPickRole(); }, 250);
    setTimeout(() => { addLanguageButton(); autoPickRole(); }, 900);
    setTimeout(() => { addLanguageButton(); autoPickRole(); }, 1800);
  }

  function boot() {
    injectStyles();
    patchSpeechSynthesis();
    wrapRecognitionConstructor("SpeechRecognition");
    wrapRecognitionConstructor("webkitSpeechRecognition");
    listenForRoleSelection();
    startObservers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
