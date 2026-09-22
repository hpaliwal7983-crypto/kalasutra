KALASUTRA LANGUAGE PACK
=======================

This package adds a lightweight multilingual language-selection entry experience
for KalaSutra without replacing your existing app files.

Included:
- kalasutra-language.js  -> language selector + saved preference + voice-language event
- kalasutra-language.css -> mobile-first visual styling

Supported languages:
Hindi, English, Marathi, Gujarati, Punjabi, Bengali, Tamil, Telugu,
Kannada, Malayalam, Odia, Urdu.

Integration (one line):
Add these before your closing </body> in index.html:

<link rel="stylesheet" href="/kalasutra-language.css">
<script src="/kalasutra-language.js"></script>

The selector stores:
localStorage key: kalasutra_language

Events:
kalasutra:language-changed
kalasutra:role-selected

Important:
This pack does not delete or overwrite your existing UI. It only adds the entry
screen and emits events so your existing app can react to the selected language
and role. Your current app logic can then connect to those events.
