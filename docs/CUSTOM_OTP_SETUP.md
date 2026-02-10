# Custom OTP Flow Setup

PathFinders uses a **custom OTP flow** instead of Supabase Auth's built-in OTP:

- **Login**: Frontend → `POST /functions/v1/send-otp` (email, mode: "login") → checks if email exists in auth.users → only sends OTP if registered
- **Signup**: Frontend → `POST /functions/v1/send-otp` (email, mode: "signup") → checks email not already registered → sends OTP
- Edge Function generates 6-digit OTP, stores in `otp_codes` table, sends via Resend
- User enters code → Frontend → `POST /functions/v1/verify-otp` (email, code, redirectTo)
- Edge Function verifies against DB, generates Supabase magic link, returns `actionLink`
- Frontend redirects to `actionLink` → Supabase creates session and redirects to app

## 1. Run migrations

```bash
supabase db push
# or: supabase migration up
```

Migrations include `otp_codes` table and `user_exists_by_email` function (used by send-otp to check login vs signup).

## 2. Deploy Edge Functions

Use `--no-verify-jwt` so the browser’s preflight OPTIONS (without auth) succeeds:

```bash
supabase functions deploy send-otp --no-verify-jwt
supabase functions deploy verify-otp --no-verify-jwt
```

## 3. Set secrets

```bash
supabase secrets set RESEND_OTP=re_xxxxxxxx
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set automatically for Edge Functions.

## 4. Allow redirect URLs

In Supabase Dashboard → **Authentication** → **URL Configuration** → **Redirect URLs**, add:

- `http://localhost:3000/*` (dev)
- `https://yourdomain.com/*` (prod)

The magic link redirects to `/{locale}/quiz` after verification.

## 5. Disable Send Email Hook (optional)

If you previously used the Auth Hook (`resend-otp`), you can disable it in **Authentication** → **Hooks** → Send Email Hook. The custom flow no longer uses it.
