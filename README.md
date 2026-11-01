# Peaceville Estate Web

The web frontend for the Peaceville Estate Management, Security and Community Communication Platform. This is the Phase 1 frontend foundation: a responsive React shell, installable PWA configuration, and clearly labelled preview dashboard.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

Run the API from the workspace's `backend/` folder in one terminal:

```powershell
npm install
npm run dev
```

Run the frontend from this `frontend/` folder in a second terminal:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. To verify a production build:

```powershell
npm run build
npm run preview
```

## Configuration

Copy `.env.example` to `.env.local` when the development Supabase project and API are ready. Variables prefixed with `VITE_` are included in the browser bundle and must never contain secrets. In particular, do not put a Supabase service-role key, payment secret, webhook secret, JWT secret, or OTP pepper in this project.

## Source layout

- `src/App.jsx` connects navigation and page views.
- `src/components/` contains reusable interface components.
- `src/pages/` contains the overview and section pages.
- `src/css/` contains application styles.

## Current scope

The frontend checks the API's `/health` endpoint and includes a reusable request helper that can attach a Supabase access token. Resident records, authentication, payments, and security workflows are not connected yet. Add those API routes and Supabase Auth integration before using real data; enforce authorization in the API and RLS policies.
