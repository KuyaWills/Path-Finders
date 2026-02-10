# Stripe payment setup (Supabase Edge Functions)

The offer page redirects to Stripe Checkout using **Supabase Edge Functions**:

- **`stripe_payment`** – Creates the checkout session and returns the Stripe checkout URL (user selects plan, then is redirected).
- **`stripe_session`** – Called after return from Stripe with `session_id`; verifies the payment and grants premium.

## Supabase secrets

Set these in your Supabase project so the Edge Functions can create the correct Stripe checkout:

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Project Settings** → **Edge Functions** → **Secrets** (or **Settings** → **Edge Functions**).
2. Add:

| Secret                     | Description                                      |
|----------------------------|--------------------------------------------------|
| `STRIPE_SECRET_KEY`        | Stripe secret key (starts with `sk_`).           |
| `STRIPE_PRICE_STARTER`     | Stripe Price ID for the $10 Starter plan.        |
| `STRIPE_PRICE_LIFETIME`    | Stripe Price ID for the $15 Lifetime plan.       |

You already have **STRIPE_PRICE_STARTER** and **STRIPE_PRICE_LIFETIME** in Supabase secrets, and pricing configured in Stripe. Ensure **STRIPE_SECRET_KEY** is also set there so `stripe_payment` can create checkout sessions.

## Stripe Dashboard

- Create two one-time products in [Stripe Dashboard → Products](https://dashboard.stripe.com/products): e.g. “Starter” ($10) and “Lifetime” ($15).
- Copy each product’s **Price ID** (`price_xxx`) and set them as `STRIPE_PRICE_STARTER` and `STRIPE_PRICE_LIFETIME` in Supabase secrets.

## Flow

1. User clicks **Proceed to checkout** on `/offer` → app calls `stripe_payment` with `planId: "starter"` or `"lifetime"` and `cancelUrl` (current offer page URL, e.g. `https://yoursite.com/en/offer`).
2. Edge function creates a Stripe Checkout Session using the matching price ID, sets **`cancel_url`** to the received `cancelUrl` so the Stripe “back” button returns to `/offer`, and returns `{ url }`.
3. User is redirected to Stripe, pays, then Stripe redirects back to `/offer?session_id=...`.
4. App calls `stripe_session` with `session_id`; the function verifies the payment and (typically) sets `is_premium` on the user’s profile.
5. User sees the “You’re in! Premium unlocked.” state.
