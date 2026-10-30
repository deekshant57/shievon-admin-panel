# Vendor order alerts (admin panel)

When a shop owner's online order is paid, the open admin panel shows a card (order number,
amount, **View order** / **Dismiss**), rings for about 10 seconds (or until dismissed) and,
if the tab is in the background and the vendor allowed it, shows a desktop notification.
The code is in `src/utils/order-alert/`, `src/utils/play-new-order-alert-sound.ts` and
`src/components/order-alert/`, wired in from `components/layouts/topbar/recent-order-bar.tsx`.

**The full production checklist (new Pusher app, API env, deploy order, smoke test, rollback,
known limits) is in the API repo: `api-server-shievon/docs/vendor-order-notifications-deployment.md`.**
This page is the admin-side short version. Names only; never put values in git.

## Environment variables (build time)

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_API_BROADCAST_DRIVER` | must be `pusher` |
| `NEXT_PUBLIC_PUSHER_ENABLED` | must be `true` |
| `NEXT_PUBLIC_PUSHER_APP_KEY` | public key of the same Pusher app the API publishes to (production: shievon-prod, never the dev app) |
| `NEXT_PUBLIC_PUSHER_APP_CLUSTER` | `ap2` (defaults to `ap2` if empty) |
| `NEXT_PUBLIC_REST_API_ENDPOINT` | API URL **with the scheme** (`https://...`); channel auth is `<this>/broadcasting/auth` |
| `NEXT_PUBLIC_BROADCAST_AUTH_URL` | optional override for the auth URL |
| `NEXT_PUBLIC_ORDER_CREATED_CHANNEL_PRIVATE` | must equal the API's `VENDOR_ORDER_PUSHER_CHANNEL_PREFIX` (default `private-order.created`) |
| `NEXT_PUBLIC_ORDER_CREATED_EVENT` | must equal the API's `VENDOR_ORDER_PUSHER_EVENT` (default `order.create.event`) |
| `NEXT_PUBLIC_PUSHER_DEV_MOOD` | leave empty in production |

`.env.example` lists every name with an empty value. **The Pusher secret is API-only and must
never appear here or in any `NEXT_PUBLIC_*` variable.**

## Rebuild required

`NEXT_PUBLIC_*` values are inlined into the bundle when the admin is built. After changing
any of them, **rebuild and redeploy** the admin (in `next dev`, restart the server). Deploy the
API first, then the admin. The admin must be served over **https**.

## Settings toggle

The bell only appears when the order notification is switched on. A **super admin** turns it on
in **Settings → Events** (`/settings/events`) → "Realtime notification setting" → "Select
Notification Options" → the order option → Save. Without it nothing rings.

## For vendors

Keep an admin tab open, click once on the page to enable sound, allow notifications when asked,
and use the speaker (mute) switch next to the bell if you need silence. On the web it rings only
while a tab is open; the mobile app's push covers the rest.
