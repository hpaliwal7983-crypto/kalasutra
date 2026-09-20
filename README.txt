KALASUTRA PRE-REFERENCE RESTORE

This package restores the earlier KalaSutra frontend source:
- public/app.tsx = earlier 99,666-byte app(1).tsx base
- public/styles.css = earlier 58,723-byte styles.css base
- public/app.js = precompiled version of that base app
- public/index.html = production loader using app.js
- public/kalasutra-login-flow.js = earlier login animation helper

Keep the existing public/assets folder. Do NOT delete or replace assets.
Replace only the files listed above inside your existing public/ folder.
