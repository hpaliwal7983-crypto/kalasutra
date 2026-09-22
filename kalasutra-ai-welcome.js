(function () {
  'use strict';

  // KalaSutra additive AI layer.
  // IMPORTANT: this file intentionally does not replace React screens/components.
  // It enhances the already-running app through DOM/event integration.

  const LANGS = [
    { code: 'hi-IN', label: 'हिंदी', short: 'हिंदी' },
    { code: 'en-IN', label: 'English', short: 'English' },
    { code: 'mr-IN', label: 'मराठी', short: 'मराठी' },
    { code: 'gu-IN', label: 'ગુજરાતી', short: 'ગુજરાતી' },
    { code: 'pa-IN', label: 'ਪੰਜਾਬੀ', short: 'ਪੰਜਾਬੀ' },
    { code: 'bn-IN', label: 'বাংলা', short: 'বাংলা' },
    { code: 'ta-IN', label: 'தமிழ்', short: 'தமிழ்' },
    { code: 'te-IN', label: 'తెలుగు', short: 'తెలుగు' },
    { code: 'kn-IN', label: 'ಕನ್ನಡ', short: 'ಕನ್ನಡ' },
    { code: 'ml-IN', label: 'മലയാളം', short: 'മലയാളം' },
    { code: 'or-IN', label: 'ଓଡ଼ିଆ', short: 'ଓଡ଼ିଆ' },
    { code: 'ur-IN', label: 'اردو', short: 'اردو' }
  ];

  const COPY = {
    'hi-IN': {
      welcome: 'Welcome to KalaSutra! Main Karigar AI hoon. Aaj kya karna hai?',
      ask: 'Bas normal tarike se batao — main saath hoon.',
      listen: 'Sun raha hoon… bolo.',
      thinking: 'Samajh raha hoon…',
      add: 'Bilkul! Chalo naya product add karte hain. Pehle product ki ek achhi photo lete hain.',
      orders: 'Haan, chalo aaj ke orders dekhte hain.',
      earnings: 'Chalo aapki earnings check karte hain.',
      reel: 'Chalo is product ki Reel banate hain.',
      price: 'Chalo is product ki fair price nikalte hain.',
      material: 'Chalo material hub kholte hain aur raw material dekhte hain.',
      market: 'Chalo Market Match dekhte hain aur suitable buyers check karte hain.',
      design: 'Chalo Design Lab mein kuch fresh ideas dekhte hain.',
      passport: 'Chalo aapka Craft Passport dekhte hain.',
      gurukul: 'Chalo Craft Gurukul kholte hain.',
      profile: 'Chalo profile kholte hain.',
      home: 'Chalo KalaSutra home par chalte hain.',
      buyerSearch: 'Theek hai, main uske liye products dhoondhta hoon.'
    },
    'en-IN': {
      welcome: 'Welcome to KalaSutra! I am Karigar AI. What should we do today?',
      ask: 'Just talk normally. I am right here with you.',
      listen: 'I am listening… go ahead.',
      thinking: 'Got it…',
      add: 'Absolutely! Let’s add your new product. First, let’s take a clear photo.',
      orders: 'Sure, let’s check today’s orders.',
      earnings: 'Let’s check your earnings.',
      reel: 'Let’s turn this product into a Reel.',
      price: 'Let’s work out a fair price for this product.',
      material: 'Let’s open Material Hub and check raw materials.',
      market: 'Let’s open Market Match and see the buyer opportunities.',
      design: 'Let’s explore fresh ideas in Design Lab.',
      passport: 'Let’s open your Craft Passport.',
      gurukul: 'Let’s open Craft Gurukul.',
      profile: 'Let’s open your profile.',
      home: 'Let’s go back to your KalaSutra home.',
      buyerSearch: 'Sure. I’ll find matching products for you.'
    },
    'mr-IN': {
      welcome: 'Welcome to KalaSutra! मी Karigar AI आहे. आज काय करूया?',
      ask: 'जसं नेहमी बोलता तसं बोला. मी तुमच्यासोबत आहे.',
      listen: 'ऐकतोय… बोला.',
      thinking: 'समजून घेतोय…',
      add: 'नक्की! चला नवीन प्रॉडक्ट add करूया. आधी एक छान फोटो घेऊया.',
      orders: 'चला, आजचे orders पाहूया.',
      earnings: 'चला, तुमची कमाई पाहूया.',
      reel: 'चला या प्रॉडक्टची Reel बनवूया.',
      price: 'चला या प्रॉडक्टची योग्य किंमत ठरवूया.',
      material: 'चला Material Hub उघडूया आणि raw material पाहूया.',
      market: 'चला Market Match पाहूया आणि योग्य buyers शोधूया.',
      design: 'चला Design Lab मध्ये नवीन ideas पाहूया.',
      passport: 'चला तुमचा Craft Passport पाहूया.',
      gurukul: 'चला Craft Gurukul उघडूया.',
      profile: 'चला profile उघडूया.',
      home: 'चला KalaSutra home वर जाऊया.',
      buyerSearch: 'नक्की. मी तुमच्यासाठी योग्य products शोधतो.'
    },
    'gu-IN': {
      welcome: 'Welcome to KalaSutra! હું Karigar AI છું. આજે શું કરીએ?',
      ask: 'જેમ સામાન્ય રીતે વાત કરો છો એમ જ બોલો. હું તમારી સાથે છું.',
      listen: 'સાંભળી રહ્યો છું… બોલો.',
      thinking: 'સમજી રહ્યો છું…',
      add: 'હા ચોક્કસ! ચાલો નવું product add કરીએ. પહેલા એક સરસ photo લઈએ.',
      orders: 'ચાલો, આજના orders જોઈએ.',
      earnings: 'ચાલો, તમારી કમાણી જોઈએ.',
      reel: 'ચાલો આ product ની Reel બનાવીએ.',
      price: 'ચાલો આ product ની યોગ્ય કિંમત નક્કી કરીએ.',
      material: 'ચાલો Material Hub ખોલીએ અને raw material જોઈએ.',
      market: 'ચાલો Market Match ખોલીએ અને buyers જોઈએ.',
      design: 'ચાલો Design Lab માં નવા ideas જોઈએ.',
      passport: 'ચાલો તમારો Craft Passport ખોલીએ.',
      gurukul: 'ચાલો Craft Gurukul ખોલીએ.',
      profile: 'ચાલો profile ખોલીએ.',
      home: 'ચાલો KalaSutra home પર જઈએ.',
      buyerSearch: 'બરાબર. હું તમારા માટે યોગ્ય products શોધું છું.'
    },
    'pa-IN': {
      welcome: 'Welcome to KalaSutra! ਮੈਂ Karigar AI ਹਾਂ। ਅੱਜ ਕੀ ਕਰੀਏ?',
      ask: 'ਜਿਵੇਂ ਆਮ ਤਰ੍ਹਾਂ ਗੱਲ ਕਰਦੇ ਹੋ, ਓਸੇ ਤਰ੍ਹਾਂ ਬੋਲੋ। ਮੈਂ ਨਾਲ ਹਾਂ।',
      listen: 'ਸੁਣ ਰਿਹਾ ਹਾਂ… ਬੋਲੋ।',
      thinking: 'ਸਮਝ ਰਿਹਾ ਹਾਂ…',
      add: 'ਬਿਲਕੁਲ! ਚਲੋ ਨਵਾਂ product add ਕਰੀਏ। ਪਹਿਲਾਂ ਇੱਕ ਵਧੀਆ photo ਲੈਂਦੇ ਹਾਂ।',
      orders: 'ਚਲੋ ਅੱਜ ਦੇ orders ਵੇਖੀਏ।',
      earnings: 'ਚਲੋ ਤੁਹਾਡੀ ਕਮਾਈ ਵੇਖੀਏ।',
      reel: 'ਚਲੋ ਇਸ product ਦੀ Reel ਬਣਾਈਏ।',
      price: 'ਚਲੋ ਇਸ product ਦੀ ਸਹੀ ਕੀਮਤ ਕੱਢੀਏ।',
      material: 'ਚਲੋ Material Hub ਖੋਲ੍ਹ ਕੇ raw material ਵੇਖੀਏ।',
      market: 'ਚਲੋ Market Match ਵੇਖੀਏ ਅਤੇ buyers ਲੱਭੀਏ।',
      design: 'ਚਲੋ Design Lab ਵਿੱਚ ਨਵੇਂ ideas ਵੇਖੀਏ।',
      passport: 'ਚਲੋ Craft Passport ਖੋਲ੍ਹੀਏ।',
      gurukul: 'ਚਲੋ Craft Gurukul ਖੋਲ੍ਹੀਏ।',
      profile: 'ਚਲੋ profile ਖੋਲ੍ਹੀਏ।',
      home: 'ਚਲੋ KalaSutra home ਤੇ ਚੱਲੀਏ।',
      buyerSearch: 'ਠੀਕ ਹੈ। ਮੈਂ ਤੁਹਾਡੇ ਲਈ matching products ਲੱਭਦਾ ਹਾਂ।'
    },
    'bn-IN': {
      welcome: 'Welcome to KalaSutra! আমি Karigar AI। আজ কী করা যাক?',
      ask: 'যেভাবে স্বাভাবিকভাবে কথা বলেন, সেভাবেই বলুন। আমি আছি।',
      listen: 'শুনছি… বলুন।',
      thinking: 'বুঝছি…',
      add: 'অবশ্যই! চলুন নতুন product add করি। আগে একটা ভালো photo নিই।',
      orders: 'চলুন আজকের orders দেখি।',
      earnings: 'চলুন আপনার earnings দেখি।',
      reel: 'চলুন এই product-এর Reel বানাই।',
      price: 'চলুন এই product-এর সঠিক দাম বের করি।',
      material: 'চলুন Material Hub খুলে raw material দেখি।',
      market: 'চলুন Market Match দেখে buyers খুঁজি।',
      design: 'চলুন Design Lab-এ নতুন ideas দেখি।',
      passport: 'চলুন আপনার Craft Passport খুলি।',
      gurukul: 'চলুন Craft Gurukul খুলি।',
      profile: 'চলুন profile খুলি।',
      home: 'চলুন KalaSutra home-এ যাই।',
      buyerSearch: 'অবশ্যই। আমি আপনার জন্য উপযুক্ত products খুঁজে দিচ্ছি।'
    },
    'ta-IN': {
      welcome: 'Welcome to KalaSutra! நான் Karigar AI. இன்று என்ன செய்யலாம்?',
      ask: 'நீங்கள் இயல்பாக பேசுவது போலவே பேசுங்கள். நான் உங்களுடன் இருக்கிறேன்.',
      listen: 'கேட்கிறேன்… சொல்லுங்கள்.',
      thinking: 'புரிந்துகொள்கிறேன்…',
      add: 'சரி! புதிய product add செய்வோம். முதலில் ஒரு நல்ல photo எடுப்போம்.',
      orders: 'இன்றைய orders-ஐ பார்ப்போம்.',
      earnings: 'உங்கள் earnings-ஐ பார்ப்போம்.',
      reel: 'இந்த product-க்கு Reel செய்வோம்.',
      price: 'இந்த product-க்கு சரியான விலையை பார்க்கலாம்.',
      material: 'Material Hub திறந்து raw materials பார்ப்போம்.',
      market: 'Market Match திறந்து buyers பார்ப்போம்.',
      design: 'Design Lab-ல் புதிய ideas பார்ப்போம்.',
      passport: 'உங்கள் Craft Passport-ஐ திறப்போம்.',
      gurukul: 'Craft Gurukul-ஐ திறப்போம்.',
      profile: 'Profile-ஐ திறப்போம்.',
      home: 'KalaSutra home-க்கு போகலாம்.',
      buyerSearch: 'சரி. உங்களுக்கு பொருத்தமான products-ஐ தேடுகிறேன்.'
    },
    'te-IN': {
      welcome: 'Welcome to KalaSutra! నేను Karigar AI. ఈరోజు ఏం చేద్దాం?',
      ask: 'మీరు సహజంగా మాట్లాడినట్లే మాట్లాడండి. నేను మీతోనే ఉన్నాను.',
      listen: 'వింటున్నాను… చెప్పండి.',
      thinking: 'అర్థం చేసుకుంటున్నాను…',
      add: 'ఖచ్చితంగా! కొత్త product add చేద్దాం. ముందుగా మంచి photo తీసుకుందాం.',
      orders: 'ఈరోజు orders చూద్దాం.',
      earnings: 'మీ earnings చూద్దాం.',
      reel: 'ఈ product కి Reel చేద్దాం.',
      price: 'ఈ product కి సరైన ధర చూద్దాం.',
      material: 'Material Hub ఓపెన్ చేసి raw material చూద్దాం.',
      market: 'Market Match ఓపెన్ చేసి buyers చూద్దాం.',
      design: 'Design Lab లో కొత్త ideas చూద్దాం.',
      passport: 'మీ Craft Passport ఓపెన్ చేద్దాం.',
      gurukul: 'Craft Gurukul ఓపెన్ చేద్దాం.',
      profile: 'Profile ఓపెన్ చేద్దాం.',
      home: 'KalaSutra home కి వెళ్దాం.',
      buyerSearch: 'సరే. మీకు సరిపోయే products కోసం చూస్తాను.'
    },
    'kn-IN': {
      welcome: 'Welcome to KalaSutra! ನಾನು Karigar AI. ಇಂದು ಏನು ಮಾಡೋಣ?',
      ask: 'ನೀವು ಸಹಜವಾಗಿ ಮಾತನಾಡುವ ಹಾಗೆಯೇ ಮಾತನಾಡಿ. ನಾನು ನಿಮ್ಮ ಜೊತೆಯಲ್ಲಿದ್ದೇನೆ.',
      listen: 'ಕೇಳುತ್ತಿದ್ದೇನೆ… ಹೇಳಿ.',
      thinking: 'ಅರ್ಥಮಾಡಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ…',
      add: 'ಖಂಡಿತ! ಹೊಸ product add ಮಾಡೋಣ. ಮೊದಲು ಒಳ್ಳೆಯ photo ತೆಗೆದುಕೊಳ್ಳೋಣ.',
      orders: 'ಇವತ್ತಿನ orders ನೋಡೋಣ.',
      earnings: 'ನಿಮ್ಮ earnings ನೋಡೋಣ.',
      reel: 'ಈ product ಗೆ Reel ಮಾಡೋಣ.',
      price: 'ಈ product ಗೆ ಸರಿಯಾದ ಬೆಲೆ ನೋಡೋಣ.',
      material: 'Material Hub ತೆರಳಿ raw material ನೋಡೋಣ.',
      market: 'Market Match ತೆರಳಿ buyers ನೋಡೋಣ.',
      design: 'Design Lab ನಲ್ಲಿ ಹೊಸ ideas ನೋಡೋಣ.',
      passport: 'ನಿಮ್ಮ Craft Passport ತೆರೆಯೋಣ.',
      gurukul: 'Craft Gurukul ತೆರೆಯೋಣ.',
      profile: 'Profile ತೆರೆಯೋಣ.',
      home: 'KalaSutra home ಗೆ ಹೋಗೋಣ.',
      buyerSearch: 'ಸರಿ. ನಿಮಗೆ ಹೊಂದುವ products ಹುಡುಕುತ್ತೇನೆ.'
    },
    'ml-IN': {
      welcome: 'Welcome to KalaSutra! ഞാൻ Karigar AI ആണ്. ഇന്ന് എന്ത് ചെയ്യാം?',
      ask: 'നിങ്ങൾ സാധാരണ സംസാരിക്കുന്ന പോലെ തന്നെ സംസാരിക്കൂ. ഞാൻ കൂടെയുണ്ട്.',
      listen: 'കേൾക്കുകയാണ്… പറയൂ.',
      thinking: 'മനസ്സിലാക്കുകയാണ്…',
      add: 'തീർച്ചയായും! പുതിയ product add ചെയ്യാം. ആദ്യം ഒരു നല്ല photo എടുക്കാം.',
      orders: 'ഇന്നത്തെ orders നോക്കാം.',
      earnings: 'നിങ്ങളുടെ earnings നോക്കാം.',
      reel: 'ഈ product-ന് Reel ഉണ്ടാക്കാം.',
      price: 'ഈ product-ന്റെ ശരിയായ വില നോക്കാം.',
      material: 'Material Hub തുറന്ന് raw material നോക്കാം.',
      market: 'Market Match തുറന്ന് buyers നോക്കാം.',
      design: 'Design Lab-ൽ പുതിയ ideas നോക്കാം.',
      passport: 'നിങ്ങളുടെ Craft Passport തുറക്കാം.',
      gurukul: 'Craft Gurukul തുറക്കാം.',
      profile: 'Profile തുറക്കാം.',
      home: 'KalaSutra home-ലേക്ക് പോകാം.',
      buyerSearch: 'ശരി. നിങ്ങൾക്കൊത്ത products ഞാൻ കണ്ടെത്താം.'
    },
    'or-IN': {
      welcome: 'Welcome to KalaSutra! ମୁଁ Karigar AI। ଆଜି କଣ କରିବା?',
      ask: 'ଯେମିତି ସାଧାରଣଭାବେ କଥା ହୁଅନ୍ତି ସେମିତି କହନ୍ତୁ। ମୁଁ ଅଛି।',
      listen: 'ଶୁଣୁଛି… କହନ୍ତୁ।',
      thinking: 'ବୁଝୁଛି…',
      add: 'ନିଶ୍ଚୟ! ଚାଲନ୍ତୁ ନୂଆ product add କରିବା। ପ୍ରଥମେ ଏକ ଭଲ photo ନେବା।',
      orders: 'ଚାଲନ୍ତୁ ଆଜିର orders ଦେଖିବା।',
      earnings: 'ଆପଣଙ୍କ earnings ଦେଖିବା।',
      reel: 'ଏହି product ର Reel କରିବା।',
      price: 'ଏହି product ର ଭଲ ଦାମ ଦେଖିବା।',
      material: 'Material Hub ଖୋଲି raw material ଦେଖିବା।',
      market: 'Market Match ଖୋଲି buyers ଦେଖିବା।',
      design: 'Design Lab ରେ ନୂଆ ideas ଦେଖିବା।',
      passport: 'ଆପଣଙ୍କ Craft Passport ଖୋଲିବା।',
      gurukul: 'Craft Gurukul ଖୋଲିବା।',
      profile: 'Profile ଖୋଲିବା।',
      home: 'KalaSutra home କୁ ଯିବା।',
      buyerSearch: 'ଠିକ୍ ଅଛି। ଆପଣଙ୍କ ପାଇଁ ଠିକ୍ products ଖୋଜୁଛି।'
    },
    'ur-IN': {
      welcome: 'Welcome to KalaSutra! میں Karigar AI ہوں۔ آج کیا کریں؟',
      ask: 'جیسے عام طور پر بات کرتے ہیں ویسے ہی بات کریں۔ میں آپ کے ساتھ ہوں۔',
      listen: 'سن رہا ہوں… بولیے۔',
      thinking: 'سمجھ رہا ہوں…',
      add: 'بالکل! نیا product add کرتے ہیں۔ پہلے ایک اچھی photo لیتے ہیں۔',
      orders: 'چلیں آج کے orders دیکھتے ہیں۔',
      earnings: 'چلیں آپ کی earnings دیکھتے ہیں۔',
      reel: 'چلیں اس product کی Reel بناتے ہیں۔',
      price: 'چلیں اس product کی مناسب قیمت نکالتے ہیں۔',
      material: 'Material Hub کھول کر raw material دیکھتے ہیں۔',
      market: 'Market Match کھول کر buyers دیکھتے ہیں۔',
      design: 'Design Lab میں نئے ideas دیکھتے ہیں۔',
      passport: 'آپ کا Craft Passport کھولتے ہیں۔',
      gurukul: 'Craft Gurukul کھولتے ہیں۔',
      profile: 'Profile کھولتے ہیں۔',
      home: 'KalaSutra home پر چلتے ہیں۔',
      buyerSearch: 'ضرور۔ میں آپ کے لیے مناسب products ڈھونڈتا ہوں۔'
    }
  };

  const VOICE_HINTS = {
    'hi-IN': ['hi', 'hindi', 'hindi india', 'google हिन्दी', 'हिं'],
    'en-IN': ['en-in', 'english india', 'google us english', 'english'],
    'mr-IN': ['mr', 'marathi'],
    'gu-IN': ['gu', 'gujarati'],
    'pa-IN': ['pa', 'punjabi'],
    'bn-IN': ['bn', 'bengali'],
    'ta-IN': ['ta', 'tamil'],
    'te-IN': ['te', 'telugu'],
    'kn-IN': ['kn', 'kannada'],
    'ml-IN': ['ml', 'malayalam'],
    'or-IN': ['or', 'odia'],
    'ur-IN': ['ur', 'urdu']
  };

  function getLang() {
    const saved = localStorage.getItem('kalasutra_ai_language') || localStorage.getItem('kalasutra_language') || 'hi-IN';
    return LANGS.some(x => x.code === saved) ? saved : 'hi-IN';
  }

  function getCopy() { return COPY[getLang()] || COPY['hi-IN']; }

  function speak(text) {
    if (!text) return;
    try {
      window.speechSynthesis?.cancel();
      if (!window.speechSynthesis) return;
      const utterance = new SpeechSynthesisUtterance(text);
      const lang = getLang();
      utterance.lang = lang;
      utterance.rate = 0.93;
      utterance.pitch = 1.02;
      const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      const hints = VOICE_HINTS[lang] || [];
      const voice = voices.find(v => {
        const hay = `${v.name} ${v.lang}`.toLowerCase();
        return hints.some(h => hay.includes(h.toLowerCase()));
      }) || voices.find(v => (v.lang || '').toLowerCase().startsWith(lang.slice(0,2).toLowerCase()));
      if (voice) utterance.voice = voice;
      utterance.onend = () => window.dispatchEvent(new Event('ks-ai-speech-end'));
      window.speechSynthesis.speak(utterance);
    } catch (_) {}
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  function injectStyle() {
    if (document.getElementById('ks-ai-v2-style')) return;
    const css = `
      .ks-ai-role-lang{margin:10px auto 0;max-width:480px;padding:10px 12px;background:rgba(255,255,255,.82);border:1px solid rgba(111,78,55,.14);border-radius:18px;box-shadow:0 8px 24px rgba(72,48,31,.08)}
      .ks-ai-role-lang label{display:block;font-size:11px;font-weight:800;color:#7a604e;letter-spacing:.4px;margin-bottom:7px}
      .ks-ai-role-lang select{width:100%;border:1px solid #d7c4b4;background:#fffaf3;color:#3e2a20;padding:10px 12px;border-radius:12px;font-weight:700;outline:none}
      .ks-artisan-ai-card{margin:16px 0 12px;padding:16px;border-radius:26px;background:linear-gradient(145deg,#fffaf2,#f7ebe0);border:1px solid rgba(111,78,55,.15);box-shadow:0 18px 40px rgba(72,48,31,.10);position:relative;overflow:hidden}
      .ks-artisan-ai-card::after{content:"";position:absolute;inset:auto -50px -80px auto;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(194,116,73,.18),transparent 70%)}
      .ks-ai-row{display:flex;align-items:center;gap:12px;position:relative;z-index:1}
      .ks-ai-avatar{width:58px;height:58px;border-radius:50%;padding:4px;background:linear-gradient(135deg,#f5c5a2,#fff);box-shadow:0 8px 20px rgba(120,72,42,.18);flex:0 0 auto}
      .ks-ai-avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%}
      .ks-ai-copy{min-width:0;flex:1}
      .ks-ai-copy .kicker{font-size:11px;font-weight:900;letter-spacing:1px;color:#9a6a4e}
      .ks-ai-copy h3{font-family:Georgia,serif;font-size:20px;color:#3e2a20;margin:2px 0 4px}
      .ks-ai-copy p{font-size:12.5px;line-height:1.45;color:#6f5a4b;margin:0}
      .ks-ai-talk{border:0;border-radius:15px;background:#8c4025;color:#fff;padding:12px 16px;font-weight:900;white-space:nowrap;box-shadow:0 9px 18px rgba(140,64,37,.18)}
      .ks-ai-talk.listening{background:#248c5d}
      .ks-ai-status{margin-top:10px;padding:10px 12px;background:rgba(255,255,255,.72);border-radius:15px;font-size:12px;color:#6b5445;min-height:18px}
      .ks-ai-insights{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}
      .ks-ai-insight{background:rgba(255,255,255,.76);border:1px solid rgba(111,78,55,.10);border-radius:15px;padding:10px}
      .ks-ai-insight small{display:block;color:#8c745f;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.4px}
      .ks-ai-insight strong{display:block;color:#3e2a20;font-size:18px;margin-top:4px}
      .ks-ai-insight span{display:block;color:#7b6757;font-size:10.5px;margin-top:2px}
      .ks-ai-modal{position:fixed;inset:0;z-index:100050;background:rgba(28,20,16,.62);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:18px}
      .ks-ai-modal-card{width:min(100%,420px);border-radius:34px;background:linear-gradient(150deg,#fffaf2,#f8ede1);padding:22px 18px 18px;box-shadow:0 28px 90px rgba(24,16,12,.38);text-align:center;position:relative;overflow:hidden}
      .ks-ai-orb{width:210px;height:210px;margin:6px auto 14px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;background:radial-gradient(circle at 50% 35%,#fff3e6 0 18%,#ffcfae 18% 30%,#b96743 30% 46%,#6c3b28 46% 63%,rgba(108,59,40,.08) 64% 70%,transparent 71%);box-shadow:0 0 0 12px rgba(225,148,107,.10),0 0 0 28px rgba(225,148,107,.06),0 24px 65px rgba(110,58,35,.25)}
      .ks-ai-orb img{width:125px;height:125px;border-radius:50%;object-fit:cover;box-shadow:0 10px 28px rgba(55,35,25,.22);border:4px solid rgba(255,255,255,.72)}
      .ks-ai-wave{position:absolute;inset:16px;border:2px solid rgba(241,170,132,.38);border-radius:50%;animation:ksPulse 1.8s infinite}
      .ks-ai-wave.two{inset:-2px;animation-delay:.35s}.ks-ai-wave.three{inset:-22px;animation-delay:.7s}
      @keyframes ksPulse{0%,100%{transform:scale(.93);opacity:.35}50%{transform:scale(1.04);opacity:.9}}
      .ks-ai-modal h2{font-family:Georgia,serif;color:#3e2a20;font-size:26px;margin:0 0 6px}
      .ks-ai-modal p{margin:0 auto;color:#6f5a4b;line-height:1.5;font-size:14px;max-width:320px}
      .ks-ai-modal .heard{margin-top:10px;padding:10px 12px;background:#fff;border-radius:14px;color:#745f4f;font-size:12px;min-height:16px}
      .ks-ai-modal-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
      .ks-ai-main-btn,.ks-ai-secondary-btn{border:0;border-radius:15px;padding:13px 12px;font-weight:900}
      .ks-ai-main-btn{background:#8c4025;color:#fff}.ks-ai-main-btn.listening{background:#248c5d}.ks-ai-secondary-btn{background:#fff8f0;color:#6d4c38;border:1px solid #dfc7b3}
      .ks-ai-close{position:absolute;right:12px;top:12px;width:36px;height:36px;border-radius:50%;border:1px solid #ddc7b7;background:#fff8f0;color:#5b4030;font-size:22px}
      .ks-ai-quick{display:flex;gap:7px;overflow:auto;margin-top:12px;padding-bottom:2px}.ks-ai-quick button{white-space:nowrap;border:1px solid #e1ccba;background:#fff9f2;border-radius:999px;padding:9px 11px;color:#5e4333;font-size:11px;font-weight:800}
      .ks-ai-textrow{display:flex;gap:8px;margin-top:10px}.ks-ai-textrow input{flex:1;border:1px solid #dfc9b7;background:#fff;border-radius:13px;padding:11px 12px;font-size:13px;outline:none}.ks-ai-textrow button{border:0;border-radius:13px;background:#6d402d;color:#fff;padding:0 13px;font-weight:900}
      @media(max-width:420px){.ks-ai-insights{grid-template-columns:1fr}.ks-ai-row{align-items:flex-start}.ks-ai-talk{padding:10px 12px}.ks-ai-orb{width:185px;height:185px}}
      .ks-buyer-ai{margin:12px 0;padding:14px;border-radius:22px;background:linear-gradient(145deg,#fffaf2,#f6ebe0);border:1px solid rgba(111,78,55,.14);display:flex;align-items:center;gap:12px;box-shadow:0 10px 26px rgba(72,48,31,.08)}
      .ks-buyer-ai .mini{width:52px;height:52px;border-radius:50%;overflow:hidden;flex:0 0 auto}.ks-buyer-ai .mini img{width:100%;height:100%;object-fit:cover}.ks-buyer-ai strong{display:block;color:#3e2a20}.ks-buyer-ai span{display:block;color:#725e4e;font-size:11.5px;margin-top:3px}.ks-buyer-ai button{margin-left:auto;border:0;border-radius:13px;background:#8c4025;color:#fff;padding:10px 13px;font-weight:900}
    `;
    const style = document.createElement('style');
    style.id = 'ks-ai-v2-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function clickByText(texts) {
    const wanted = texts.map(x => x.toLowerCase());
    const buttons = Array.from(document.querySelectorAll('button'));
    const exact = buttons.find(b => wanted.includes((b.textContent || '').trim().toLowerCase()));
    if (exact) { exact.click(); return true; }
    const partial = buttons.find(b => wanted.some(x => (b.textContent || '').toLowerCase().includes(x)));
    if (partial) { partial.click(); return true; }
    return false;
  }

  function routeIntent(text) {
    const q = String(text || '').toLowerCase().trim();
    const artisan = !!document.querySelector('.artisan-home');
    const c = getCopy();
    let response = c.ask;
    let actionDone = false;

    const sayAnd = (reply, action) => {
      response = reply;
      actionDone = !!action && action();
    };

    if (/add|new product|product add|naya product|प्रोडक्ट|उत्पाद|पीस|listing|list/.test(q)) {
      sayAnd(c.add, () => clickByText(['＋ Add Piece', 'Add Product', 'Add']));
    } else if (/order|orders|ऑर्डर|pedido/.test(q)) {
      sayAnd(c.orders, () => clickByText(['Orders', 'Orders & Earnings']));
    } else if (/earning|income|kamai|कमाई|earnings/.test(q)) {
      sayAnd(c.earnings, () => clickByText(['Orders & Earnings', 'Orders']));
    } else if (/reel|video|रील/.test(q)) {
      sayAnd(c.reel, () => clickByText(['▶ Create Reel', 'Reels']));
    } else if (/fair price|price|daam|कीमत|दाम|pricing/.test(q)) {
      sayAnd(c.price, () => clickByText(['Fair Price AI', '₹ Fair Price']));
    } else if (/material|raw material|kaccha maal|कच्चा माल|मटेरियल/.test(q)) {
      sayAnd(c.material, () => clickByText(['Material Hub']));
    } else if (/market match|buyer dhund|buyer dhoond|buyers|buyer|बायर|बाज़ार|market/.test(q)) {
      sayAnd(c.market, () => clickByText(['Direct Market Match', 'Market Match']));
    } else if (/design|idea|डिजाइन/.test(q)) {
      sayAnd(c.design, () => clickByText(['Design Lab']));
    } else if (/passport|पासपोर्ट/.test(q)) {
      sayAnd(c.passport, () => clickByText(['Craft Passport']));
    } else if (/gurukul|sikh|teach|सिख/.test(q)) {
      sayAnd(c.gurukul, () => clickByText(['Craft Gurukul']));
    } else if (/profile|प्रोफाइल/.test(q)) {
      sayAnd(c.profile, () => clickByText(['Profile']));
    } else if (!artisan && /cart|कार्ट/.test(q)) {
      sayAnd('Sure, I’ll open your cart.', () => clickByText(['Cart']));
    } else if (!artisan && /wishlist|saved|पसंद/.test(q)) {
      sayAnd('Sure, I’ll open your saved crafts.', () => clickByText(['Saved', 'Wishlist']));
    } else if (!artisan && /search|find|show me|dikhao|दिखाओ|चाहिए|want/.test(q)) {
      sayAnd(c.buyerSearch, () => { const input=document.querySelector('.buyer-ref-search input'); if(input){ input.focus(); input.value=text; input.dispatchEvent(new Event('input',{bubbles:true})); return true;} return false; });
    } else if (/home|dashboard|होम/.test(q)) {
      sayAnd(c.home, () => clickByText(['Home']));
    } else {
      response = c.ask;
    }

    if (actionDone) window.setTimeout(() => window.dispatchEvent(new CustomEvent('ks-ai-action', {detail:{text, response}})), 200);
    return response;
  }

  function startRecognition(controller) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      controller.setState('VOICE_UNAVAILABLE');
      controller.setMessage('Voice recognition is not available in this browser. You can still type to me.');
      return;
    }
    try { controller.recognition?.stop(); } catch (_) {}
    const r = new SR();
    r.lang = getLang();
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.continuous = false;
    r.onstart = () => { controller.setListening(true); controller.setState('LISTENING'); controller.setMessage(getCopy().listen); };
    r.onresult = (ev) => {
      const heard = ev.results?.[0]?.[0]?.transcript || '';
      controller.setHeard(heard);
      controller.setState('THINKING');
      const reply = routeIntent(heard);
      controller.setMessage(reply);
      speak(reply);
      window.setTimeout(() => controller.setState('READY'), 500);
    };
    r.onerror = () => { controller.setListening(false); controller.setState('READY'); controller.setMessage(getCopy().ask); };
    r.onend = () => controller.setListening(false);
    controller.recognition = r;
    controller.setListening(false);
    try { r.start(); } catch (_) { controller.setState('READY'); }
  }

  function createController() {
    const state = { recognition:null, listening:false, state:'READY', message:getCopy().welcome, heard:'' };
    const listeners = [];
    return {
      ...state,
      subscribe(fn){ listeners.push(fn); },
      emit(){ listeners.forEach(fn => fn(this)); },
      setListening(v){ this.listening=v; this.emit(); },
      setState(v){ this.state=v; this.emit(); },
      setMessage(v){ this.message=v; this.emit(); },
      setHeard(v){ this.heard=v; this.emit(); },
      start(){ startRecognition(this); }
    };
  }

  let dashboardModalShown = false;

  function createModal(controller) {
    if (document.getElementById('ks-ai-modal')) return document.getElementById('ks-ai-modal');
    const modal = document.createElement('div');
    modal.id = 'ks-ai-modal';
    modal.className = 'ks-ai-modal';
    modal.innerHTML = `
      <div class="ks-ai-modal-card">
        <button class="ks-ai-close" aria-label="Close">×</button>
        <div class="ks-ai-orb"><div class="ks-ai-wave"></div><div class="ks-ai-wave two"></div><div class="ks-ai-wave three"></div><img src="/assets/avatar-artisan.png" alt="Karigar AI"></div>
        <h2 class="ks-ai-title"></h2>
        <p class="ks-ai-sub"></p>
        <div class="heard ks-ai-heard"></div>
        <div class="ks-ai-quick">
          <button data-i="add">Add Product</button><button data-i="orders">Orders</button><button data-i="price">Fair Price</button><button data-i="market">Market Match</button>
        </div>
        <div class="ks-ai-modal-actions"><button class="ks-ai-main-btn">🎙️ Talk to Karigar AI</button><button class="ks-ai-secondary-btn">Just type</button></div>
        <div class="ks-ai-textrow" style="display:none"><input aria-label="Message Karigar AI" placeholder="Type what you want to do…"><button>Send</button></div>
      </div>`;
    document.body.appendChild(modal);
    const render = () => {
      modal.querySelector('.ks-ai-title').textContent = controller.state === 'LISTENING' ? (getLang()==='en-IN'?'I’m listening…':'सुन रहा हूँ…') : getCopy().welcome;
      modal.querySelector('.ks-ai-sub').textContent = controller.message || getCopy().ask;
      modal.querySelector('.ks-ai-heard').textContent = controller.heard ? `“${controller.heard}”` : '';
      const btn = modal.querySelector('.ks-ai-main-btn');
      btn.classList.toggle('listening', controller.listening);
      btn.textContent = controller.listening ? (getLang()==='en-IN' ? '🎙️ Listening…' : '🎙️ सुन रहा हूँ…') : (getLang()==='en-IN' ? '🎙️ Talk to Karigar AI' : '🎙️ कारीगर AI से बात करें');
    };
    controller.subscribe(render);
    render();
    modal.querySelector('.ks-ai-close').onclick = () => { modal.remove(); dashboardModalShown = true; };
    modal.querySelector('.ks-ai-main-btn').onclick = () => controller.start();
    modal.querySelector('.ks-ai-secondary-btn').onclick = () => { modal.querySelector('.ks-ai-textrow').style.display='flex'; modal.querySelector('.ks-ai-textrow input').focus(); };
    const sendText = () => { const input=modal.querySelector('.ks-ai-textrow input'); const value=input.value.trim(); if(!value)return; controller.setHeard(value); controller.setState('THINKING'); const reply=routeIntent(value); controller.setMessage(reply); speak(reply); input.value=''; window.setTimeout(()=>controller.setState('READY'),400); };
    modal.querySelector('.ks-ai-textrow button').onclick=sendText;
    modal.querySelector('.ks-ai-textrow input').addEventListener('keydown',e=>{if(e.key==='Enter')sendText();});
    modal.querySelectorAll('.ks-ai-quick button').forEach(b=>b.onclick=()=>{ const key=b.dataset.i; const map={add:'add a new product',orders:'show my orders',price:'fair price',market:'market match'}; controller.setHeard(b.textContent); controller.setState('THINKING'); const reply=routeIntent(map[key]); controller.setMessage(reply); speak(reply); window.setTimeout(()=>controller.setState('READY'),400); });
    return modal;
  }

  function showAutoWelcome() {
    if (!document.querySelector('.artisan-home')) return;
    if (dashboardModalShown) return;
    const controller = createController();
    createModal(controller);
    window.setTimeout(() => speak(getCopy().welcome), 220);
    // Attempt automatic listening after the greeting. Browsers may require a user gesture.
    window.setTimeout(() => {
      if (document.getElementById('ks-ai-modal')) controller.start();
    }, 2300);
  }

  function addArtisanCard(root) {
    if (root.querySelector('.ks-artisan-ai-card')) return;
    const existing = root.querySelector('.artisan-greeting');
    const card = document.createElement('div');
    card.className='ks-artisan-ai-card';
    card.innerHTML=`<div class="ks-ai-row"><div class="ks-ai-avatar"><img src="/assets/avatar-artisan.png" alt="Karigar AI"></div><div class="ks-ai-copy"><div class="kicker">KARIGAR AI</div><h3>Welcome to KalaSutra ✨</h3><p class="ks-ai-card-copy"></p></div><button class="ks-ai-talk">Talk</button></div><div class="ks-ai-status">${escapeHtml(getCopy().ask)}</div><div class="ks-ai-insights"><div class="ks-ai-insight"><small>Orders</small><strong>—</strong><span>Loading today</span></div><div class="ks-ai-insight"><small>Earnings</small><strong>—</strong><span>Today</span></div><div class="ks-ai-insight"><small>Market Match</small><strong>Ready</strong><span>Buyer opportunities</span></div></div>`;
    const ref = existing?.nextSibling || root.querySelector('.content')?.firstChild || null;
    if (ref) ref.parentNode.insertBefore(card, ref); else root.prepend(card);
    const cardCopy=card.querySelector('.ks-ai-card-copy');
    cardCopy.textContent=getCopy().welcome;
    card.querySelector('.ks-ai-talk').onclick=()=>{
      dashboardModalShown=false;
      showAutoWelcome();
    };
    fetchTodayStats(card);
  }

  async function fetchTodayStats(card){
    try{
      const text=document.querySelector('.artisan-home .artisan-greeting h2')?.textContent || '';
      const name=(text.replace(/^Hello,\s*/,'')||'Artisan').trim();
      const userId=window.__KALASUTRA_USER_ID__ || null;
      const url=userId ? `/api/orders?userId=${encodeURIComponent(userId)}` : '/api/orders';
      const res=await fetch(url); if(!res.ok) return; const orders=await res.json();
      const today=new Date().toDateString();
      const todayOrders=Array.isArray(orders)?orders.filter(o=>new Date(o.date||Date.now()).toDateString()===today):[];
      const earnings=todayOrders.reduce((sum,o)=>sum+(o.artisanItems||[]).reduce((s,p)=>s+Number(p.price||0)*Number(p.qty||0),0),0);
      const vals=card.querySelectorAll('.ks-ai-insight');
      if(vals[0]) vals[0].querySelector('strong').textContent=todayOrders.filter(o=>['placed','paid'].includes(o.status)).length;
      if(vals[1]) vals[1].querySelector('strong').textContent=`₹${earnings.toLocaleString('en-IN')}`;
      if(vals[0]) vals[0].querySelector('span').textContent='New today';
      if(vals[1]) vals[1].querySelector('span').textContent=`${name.split(' ')[0]}'s sales`;
    }catch(_){ }
  }

  function addBuyerCard(root){
    if(root.querySelector('.ks-buyer-ai'))return;
    const host=root.querySelector('.buyer-reference-home') || root;
    const card=document.createElement('div'); card.className='ks-buyer-ai';
    card.innerHTML=`<div class="mini"><img src="/assets/avatar-artisan.png" alt="KalaSutra AI"></div><div><strong>KalaSutra AI</strong><span>${escapeHtml(getCopy().ask)}</span></div><button>Talk</button>`;
    const anchor=host.querySelector('.buyer-ref-search')?.parentNode; if(anchor) anchor.insertBefore(card,host.querySelector('.buyer-ref-search').nextSibling); else host.prepend(card);
    card.querySelector('button').onclick=()=>openBuyerModal();
  }

  function openBuyerModal(){
    const controller=createController(); const modal=createModal(controller); modal.querySelector('.ks-ai-title').textContent='KalaSutra AI'; modal.querySelector('.ks-ai-sub').textContent='I’m here to help you discover something made by hand.'; controller.setMessage(getCopy().buyerSearch); speak(getCopy().buyerSearch); }

  function enhanceRoleScreen(){
    const roleOptions=document.querySelector('.role-options');
    if(!roleOptions || document.querySelector('.ks-ai-role-lang'))return;
    const wrap=document.createElement('div'); wrap.className='ks-ai-role-lang';
    wrap.innerHTML='<label for="ks-role-language">Choose your language / अपनी भाषा चुनें</label><select id="ks-role-language"></select>';
    const select=wrap.querySelector('select');
    LANGS.forEach(l=>{const o=document.createElement('option');o.value=l.code;o.textContent=l.label; if(l.code===getLang())o.selected=true;select.appendChild(o);});
    select.onchange=()=>{localStorage.setItem('kalasutra_ai_language',select.value);localStorage.setItem('kalasutra_language',select.value);window.dispatchEvent(new CustomEvent('kalasutra:language-changed',{detail:{code:select.value}}));};
    roleOptions.parentNode.insertBefore(wrap,roleOptions.nextSibling);
  }

  function watchApp(){
    let lastRole=false;
    const observer=new MutationObserver(()=>{
      injectStyle();
      const role=!!document.querySelector('.role-options');
      if(role && !lastRole) enhanceRoleScreen();
      lastRole=role;
      const artisan=document.querySelector('.artisan-home');
      if(artisan){ addArtisanCard(artisan); showAutoWelcome(); }
      const buyer=document.querySelector('.buyer-reference-home');
      if(buyer) addBuyerCard(buyer);
    });
    observer.observe(document.body,{subtree:true,childList:true});
    window.setInterval(()=>{
      injectStyle();
      if(document.querySelector('.role-options')) enhanceRoleScreen();
      const artisan=document.querySelector('.artisan-home'); if(artisan) addArtisanCard(artisan);
      const buyer=document.querySelector('.buyer-reference-home'); if(buyer) addBuyerCard(buyer);
    },1200);
  }

  function init(){
    injectStyle();
    watchApp();
    window.speechSynthesis?.addEventListener?.('voiceschanged',()=>{});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
