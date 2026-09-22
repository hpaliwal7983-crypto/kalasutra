
# ROLE -> LANGUAGE -> COPILOT FLOW

Target flow:

KalaSutra opening
 -> Get Started
 -> Login / Signup
 -> OTP
 -> Name/Profile
 -> Role selection
    [I’m an Artisan] [I’m a Buyer]
    language selector directly UNDER these role buttons
 -> user chooses language
 -> chosen role experience opens
 -> Karigar AI starts in that selected language

The Copilot listens for:
kalasutra:language-changed

and persists:
localStorage["kalasutra_language"]

For role selection, keep the existing auth/onboarding implementation.
Do NOT create a new full-screen language page.

The buyer Copilot is intentionally not enabled as the primary task in V7.
Buyer visual references are included only as design reference for the next phase.
