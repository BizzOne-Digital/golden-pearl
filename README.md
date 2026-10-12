# Golden Pearl — Online Food Store

Single-folder Next.js app (store + API + admin) with MongoDB Atlas.

## Features

- One-page store: hero, category tabs, product grid, cart, checkout
- MongoDB Atlas for menu + orders
- Admin at `/admin` — orders + sound on new **paid** orders
- Stripe Checkout optional; without Stripe, demo payment marks orders paid

## Local development

1. Copy `.env.example` → `.env.local` and set variables (see below).
2. `npm run scrape-menu` (optional — refreshes `data/menu.json` + images)
3. `npm run seed`
4. Add `public/sounds/order-notification.mp3` for admin alerts
5. `npm run dev` → http://localhost:3000

## Production

### 1. Build (verified)

```bash
npm ci
npm run build
npm run start
```

Runs on `PORT` (default **3000**). Use a process manager (PM2, Docker, or your host’s Node app).

### 2. Environment variables (hosting dashboard)

| Variable | Required | Notes |
|----------|----------|--------|
| `MONGODB_URI` | Yes | Atlas connection string; allow your server IP in Atlas Network Access |
| `ADMIN_EMAIL` | Yes | Admin login email |
| `ADMIN_PASSWORD` | Yes | Use a **strong** password in production |
| `ADMIN_JWT_SECRET` | Recommended | Long random string (session signing) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL, e.g. `https://yourdomain.com` |
| `STRIPE_SECRET_KEY` | For live pay | Live secret key `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | Live publishable `pk_live_...` (for future client Stripe UI) |
| `STRIPE_WEBHOOK_SECRET` | With Stripe | Webhook: `POST /api/webhooks/stripe` |

Do **not** commit `.env.local`. Set secrets only in the host.

### 3. Database

After deploy, from your machine (with `MONGODB_URI` in `.env.local`):

```bash
npm run seed
```

Re-run after menu updates (`npm run scrape-menu` then `npm run seed`).

### 4. Deploy on Vercel (example)

1. Import repo, root directory: `food-store`
2. Add all env vars above
3. Deploy — build command: `npm run build`, output: Next.js default
4. Run `npm run seed` locally against production `MONGODB_URI`
5. Stripe webhook URL: `https://yourdomain.com/api/webhooks/stripe`

### 5. Post-deploy checklist

- [ ] Store loads menu from MongoDB
- [ ] Test order + checkout (Stripe or demo mode)
- [ ] `/admin` login works; notification sound file present
- [ ] MongoDB Atlas IP / Vercel IP allowlist configured
- [ ] `NEXT_PUBLIC_APP_URL` matches live domain

## Scripts

| Command | Description |
|---------|-------------|
| `npm run scrape-menu` | Pull menu + download images to `public/menu/` |
| `npm run seed` | Upsert menu into MongoDB |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
