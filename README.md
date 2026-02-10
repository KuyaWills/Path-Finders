# PathFinders

PathFinders is a small web app that helps junior developers:
- Take a short quiz about debugging, learning habits, and code review.
- Get a personalized profile and improvement plan.
- Optionally unlock premium content with a one‑time Stripe payment.

The app is built with **Next.js (App Router + next-intl)** and **Supabase** (auth + data) and uses **Supabase Edge Functions** for OTP and Stripe flows.

---

## 1. Setup

### 1.1 Prerequisites

- **Node.js**: v18+ (recommended v20)
- **npm**: v9+ (or pnpm/yarn if you prefer)
- **Supabase** project (URL, anon key, service role key)
- **Stripe** account with Checkout prices
- (Optional) **Resend** account for sending OTP emails
- Supabase CLI installed (`npm install -g supabase`)

### 1.2 Clone & Install

```bash
git clone https://github.com/KuyaWills/Path-Finders.git
cd Path-Finders

npm install
```

---

## 2. Environment Variables

Create a `.env` file in the project root (do **not** commit it):

```bash
# Supabase (frontend)
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Supabase (server / edge functions)
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# Stripe (payments)
STRIPE_SECRET_KEY=sk_test_xxx

# Prices used in /offer and stripe_payment function
STRIPE_PRICE_STARTER=price_xxx       # optional, can omit if only lifetime
STRIPE_PRICE_LIFETIME=price_yyy      # main price used

# OpenAI (for /api/chat)
NEXT_OPENAI_API_KEY=sk-...

# Optional: for Supabase Edge Functions that send email
RESEND_API_KEY=your_resend_api_key
RESEND_OTP=your_resend_otp_key
SEND_EMAIL_HOOK_SECRET=your_send_email_hook_secret

# App base URL (used by Supabase functions for success/cancel URLs)
APP_URL=http://localhost:3000

# Optional: simulate premium without Stripe (for testing)
# SIMULATE_PREMIUM=1              # Chat API treats all authenticated users as premium
# NEXT_PUBLIC_SIMULATE_PREMIUM_UNLOCK=1  # Shows "Unlock for testing" button on offer page
```

> Supabase Edge Functions use environment variables managed in the Supabase dashboard. Keep values in `.env` for local dev, but also set them in Supabase under Project Settings → API / Functions.

---

## 3. Database & Migrations

If you want to use the original schema (profiles, daily content, OTP codes, etc.), run the migrations contained under `supabase/migrations/` in your own Supabase project.

### 3.1 Link Supabase project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

(You can find `YOUR_PROJECT_REF` in your Supabase project URL.)

### 3.2 Apply migrations

If using the migration files as‑is:

```bash
# Push existing SQL migrations to your project
supabase db push
```

Alternatively, you can run individual `.sql` files manually via the Supabase SQL editor if you prefer.

### 3.3 Seed library content

To populate the Library page with sample content, run `supabase/seed_library.sql` in the Supabase SQL Editor (Dashboard → SQL Editor → New query → Paste the file contents → Run).

---

## 4. Supabase Edge Functions

The app relies on a few Edge Functions (Deno):

- `send-otp` – sends 6‑digit login/signup code via email.
- `verify-otp` – verifies the code and issues a Supabase magic link / session.
- `stripe_payment` – creates Stripe Checkout session (one‑time payment).
- `stripe_session` – verifies Stripe checkout session and marks the user `is_premium`.

### 4.1 Deploy functions

From the repo root:

```bash
supabase functions deploy send-otp verify-otp stripe_payment stripe_session
```

Make sure the folder names in `supabase/functions/` match the function names above.

---

## 5. Running the App

### 5.1 Development server

```bash
npm run dev
```

Then open:

- `http://localhost:3000` → redirects to default locale (e.g. `/en`).

### 5.2 Production build

```bash
npm run build
npm start
```

---

## 6. Tests

If you have tests configured (via Vitest or Jest):

```bash
# Example (adjust to your scripts)
npm test
# or
npm run test:unit
```

Linting and type‑check:

```bash
npm run lint
npm run build
```

---

## 7. Languages & URLs

The app uses **next-intl** and an `[locale]` segment in URLs.

- Landing page:
  - English: `/{locale}` → `/en`
  - Traditional Chinese: `/zh-TW`
- Login:
  - `/en/login`
  - `/zh-TW/login`
- Signup:
  - `/en/signup`
  - `/zh-TW/signup`
- Quiz:
  - `/en/quiz`
  - `/zh-TW/quiz`
- Offer (Stripe checkout):
  - `/en/offer`
  - `/zh-TW/offer`

### 7.1 Switching Languages

- The landing header has a language toggle button that:
  - On English: links to `/zh-TW`
  - On Chinese: links to `/en`

You can also manually switch by changing the locale part of the URL, e.g.:

- `http://localhost:3000/en/quiz` → `http://localhost:3000/zh-TW/quiz`

---

## 8. Stripe Instructions

### 8.1 Create Prices

In your Stripe dashboard:

- Create a **Product** “PathFinders – Lifetime” with a one‑time price (e.g. `$15`).
- (Optional) Create a “Starter” product and price (`$10`).

Copy the **Price IDs** into `.env`:

```bash
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_LIFETIME=price_...
```

### 8.2 Flow Summary

1. User lands on `/{locale}/offer`.
2. Clicks **Proceed to checkout**.
3. Frontend calls the `stripe_payment` Edge Function:
   - Creates a **Checkout Session** with `mode: "payment"`.
   - Uses your `STRIPE_PRICE_*` IDs or fallback amounts.
   - Sets success URL to `/{locale}/offer?session_id={CHECKOUT_SESSION_ID}`.
4. After paying, Stripe redirects back with `session_id`.
5. `OfferView` calls `stripe_session`:
   - Verifies session & `payment_status`.
   - Upserts `profiles.is_premium = true`.
   - Responds with `{ success: true, planId }`.
6. UI shows a **Thank you** + order summary screen (plan name, price, purchased date).
7. A small toast on the landing page also shows “Thank you for your purchase” and the order summary, based on `localStorage`.

---

## 9. Demo Script (Happy Path)

Use these steps to demo the app end‑to‑end in ~2–3 minutes:

1. **Landing page**  
   - Go to `https://your-deploy.com/en`.  
   - Briefly explain the “junior dev growth plan” positioning.

2. **Start quiz**  
   - Click **Start the quiz**.  
   - If not logged in, you’ll be redirected to `/en/login?redirect=/quiz`.

3. **Login via OTP**  
   - Enter your email on `/en/login`.  
   - Receive the 6‑digit code via email, paste it, and verify.  
   - You’re redirected back to `/en/quiz` and see step 1.

4. **Complete quiz**  
   - Walk through the 6 steps quickly.  
   - On the last step, click **See my result** to go to `/en/quiz/result`.

5. **Show result & offer**  
   - On `/en/quiz/result`, scroll to the personalized analysis and plan.  
   - Click the call‑to‑action to “Unlock your full plan” → goes to `/en/offer`.

6. **Stripe checkout**  
   - On `/en/offer`, choose a plan (e.g. Lifetime) and click **Proceed to checkout**.  
   - Complete payment in Stripe Checkout.

7. **Thank‑you & landing notice**  
   - After redirect back to `/en/offer?session_id=...`, verification runs.  
   - You see the **Thank you for your purchase** screen with order summary (plan + price + date).  
   - Click **Go to landing now** → back to `/en`.  
   - At the top, a small toast appears: “Thank you for your purchase – Order summary: [plan, price, date].”

8. **(Optional) Language switch**  
   - Click the language toggle to show the same experience in `/zh-TW`.

