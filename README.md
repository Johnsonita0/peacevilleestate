# Peaceville Estate Management

React/Vite frontend for estate administration and resident services. Estate records are loaded and changed through the authenticated backend API; Supabase Auth remains the browser sign-in provider.

## Local Setup

1. Apply `backend/supabase/schema.sql` to the Supabase project.
2. Copy `backend/.env.example` to `backend/.env` and set the Supabase project URL, publishable key, and server-only secret key.
3. Copy `frontend/.env.example` to `frontend/.env.local` and set the same Supabase URL and publishable key plus `VITE_API_BASE_URL=http://localhost:3000/api`.
4. Start the API from `backend/` with `npm install` and `npm run dev`.
5. Start the frontend from `frontend/` with `npm install` and `npm run dev`.

Never put a Supabase secret/service-role key or a payment secret in a `VITE_` variable. The browser bundle is public.

## API Endpoints

All routes below require a Supabase bearer access token except `GET /api/health` and `POST /api/webhooks/paystack`.

- `GET /api/admin/overview`
- `GET|POST /api/admin/resources/:resource` and `PATCH /api/admin/resources/:resource/:id` for allowlisted estate records
- `POST /api/admin/residents/invitations`
- `POST /api/admin/payments/:paymentId/verify`
- `GET /api/admin/reports/:report`
- `GET /api/admin/chat/rooms` and room message `GET|POST` routes
- `GET /api/resident/dashboard`, `POST /api/resident/incidents`
- `GET /api/resident/chat/rooms` and room message `GET|POST` routes
- `POST /api/resident/payments/:levyId/checkout` and `GET /api/resident/payments/verify/:reference`
- `POST /api/visitors`

Resource and report identifiers are allowlisted by the API; they are not arbitrary database table access. RLS policies remain enabled as a second authorization boundary.

## Online Payments

Paystack checkout is enabled only when `PAYSTACK_SECRET_KEY` is configured on the backend. Configure the Paystack webhook to call `https://<api-host>/api/webhooks/paystack`, and set `PAYSTACK_CALLBACK_URL` to the frontend payment return route. The webhook validates Paystack's HMAC signature and verifies the recorded amount and currency before marking a payment successful.

## Production Checklist

Set `ALLOWED_ORIGINS` to the deployed frontend origin, configure the Supabase Auth redirect URLs, apply the schema, and deploy the backend and frontend with their respective environment variables. Verify `/api/health`, a real admin session, resident session scoping, and a Paystack test transaction before enabling production payment collection.
