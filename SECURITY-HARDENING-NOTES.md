This build includes:
- service worker cache list updates
- manifest icon purpose fixes
- removed .bak files
- admin dashboard XSS escaping
- shared secure cookie helper via lib/api-security.js
- API login rate limiting via checkRateLimit()
- builtin admins file disabled by default unless ALLOW_BUILTIN_ADMINS_FILE=true
- builtin admins repo file replaced with []

Still recommended:
- move CDN scripts to local files to avoid missing SRI
- migrate homework student identity to admin-managed student ID + PIN registry
- set BUILTIN_ADMINS_JSON in Vercel with pbkdf2 hashes
