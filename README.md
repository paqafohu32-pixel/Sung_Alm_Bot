# NOVA Installation Platform

Editable React + Vite frontend for the existing NOVA Node.js backend.

## Run
`npm install` → `npm run dev`; production: `npm run build`.
Serve `dist/` from the backend origin or proxy `/api/*` to the existing Node server.

## Installation flow
- Egypt is the default country.
- The website uses the fixed primary NOVA pairing code `TAHANOVA`.
- The code is displayed immediately when a valid installation request is submitted; the UI does not wait for a newly generated code.
- The backend request still runs in the background so the existing `POST /api/install/whatsapp` session creation stays in place.
- Explicit `connected: true` from the backend switches the UI to ONLINE; otherwise the fixed code remains visible.

## API
- `GET /api/health` checks backend reachability.
- `POST /api/install/whatsapp` JSON `{ "phone": "international digits" }` creates/starts the WhatsApp session.

## UI
- Space-themed NOVA design with stars, nebulae, orbital rings, glow, and NOVA-style symbols.
- Functional left hamburger drawer with working page navigation.
- Arabic/English navigation with Egypt as the default country.
- Background NOVA music attempts autoplay on page entry and retries after the first user interaction if browser autoplay policy blocks unmuted audio.
- Main assets and tutorial links remain editable from `src/App.jsx`.

## Files
- `src/App.jsx` — pages, navigation drawer, installation flow, fixed code, background audio.
- `src/styles.css` — full responsive NOVA space theme.
- `src/i18n/ar.js` / `src/i18n/en.js` — localized UI text.
- `src/api/novaApi.js` — backend API boundary.
