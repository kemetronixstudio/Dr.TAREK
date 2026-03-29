
# KG English Quiz App

A flat-file static website for GitHub upload with no folders required.

## Included upgrades
- Student progress saved with `localStorage`
- Premium certificate with PDF export and QR code
- Teacher dashboard and simple admin panel
- Smarter weakness analysis by skill
- Gamification with stars and confetti
- Read-aloud voice support and sound feedback
- PWA install support with `manifest.json` and `service-worker.js`
- Adaptive question selection and no-repeat question generator
- Question editor with optional image upload saved in browser storage

## Admin accounts
- **Dr. Tarek** / `T01032188008`
- **HITMAN** / `01002439054`

## Notes
- This is a pure front-end project. Admin passwords are not secure for production because there is no backend.
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
- Admin login is client-side only, so it is suitable for demo/school local use, not high-security hosting.


## Cache reset after update
If you tested older versions before, clear site data once so the new service worker takes over.
