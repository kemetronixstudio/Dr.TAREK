
# KG English Quiz App

A flat-file static website for GitHub upload with no folders required.

## Included upgrades
- Student progress saved with `localStorage`
- Premium certificate with PDF export and QR code
- Smarter weakness analysis by skill
- Gamification with stars and confetti
- Read-aloud voice support and sound feedback
- PWA install support with `manifest.json` and `service-worker.js`
- Adaptive question selection and no-repeat question generator
- Question editor with optional image upload saved in browser storage

## Notes
- Added questions and uploaded images are saved in the browser that created them.
- PDF generation uses CDN libraries, so internet access is needed the first time when deployed.

## GitHub upload
Upload all files in the ZIP directly to the repository root.

## Vercel
Import as a static site. No build step is required.


## KG2 Book Source

The KG2 quiz has been refreshed using the uploaded **Step Ahead KG2 Second Term** book themes, especially Unit 1 food vocabulary, phonics (Aa, Tt, Hh), numbers 11 and 12, and good manners / healthy habits.


## Production notes

- Upload **all files in the ZIP directly to the root of your GitHub repository**.
- If you were testing an older version before, clear old browser cache once after deployment.
- This version includes a refreshed service worker cache (`v12`) to avoid mixed old/new files.
- 

## Cache reset after update
If you tested older versions before, clear site data once so the new service worker takes over.

## v17 updates
- Read-aloud speech improved for better browser compatibility.


## Version
This package is the freeze-fix build v22. If you update from an older release, clear old browser cache/service worker once.


## v38 stable
This package restores a stable quiz flow build and bumps the cache version to avoid loading older broken cached files.
