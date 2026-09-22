# Integration checklist

- [ ] Keep the existing KalaSutra app/router unchanged.
- [ ] Add `src/karigar-ai.css`.
- [ ] Add `src/karigar-ai.js`.
- [ ] Pass the existing Karigar AI character asset as `avatarSrc`.
- [ ] Pass the currently selected KalaSutra language into `language`.
- [ ] Connect `ADD_PRODUCT_START` to the existing Add Product route/screen.
- [ ] On photo capture, call `ai.setFlowStep('details', {photos: count})`.
- [ ] On video capture, call `ai.setFlowStep('review', {video: true})`.
- [ ] On final confirmation, show the existing Review/Publish UI; do not auto-publish.
- [ ] Mount the server router at `/api/karigar-ai`.
- [ ] Set `OPENAI_API_KEY` only in Render Environment Variables.
- [ ] Test every supported language on the target device/browser.
- [ ] Confirm microphone permission and speaker output on iPad/iPhone.
- [ ] Confirm the AI remains visible/available while Add Product changes steps.
