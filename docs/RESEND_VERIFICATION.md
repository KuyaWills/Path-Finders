# Resend + Supabase Verification Checklist

## 1. Supabase SMTP Settings

**Path:** Supabase Dashboard → Authentication → Email → SMTP Settings

| Setting | Required Value |
|---------|----------------|
| Custom SMTP | **Enabled** |
| Sender email | `onboarding@resend.dev` (testing) or `noreply@yourdomain.com` |
| Sender name | `PathFinders` (or any name) |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Your Resend API key |

## 2. Supabase Redirect URLs

**Path:** Authentication → URL Configuration

- **Site URL:** `http://localhost:3000` (dev) or your production URL
- **Redirect URLs:** Add `http://localhost:3000/**` for local dev

## 3. Supabase Email Template (Magic Link)

**Path:** Authentication → Email Templates → **Magic Link**

The app uses **6-digit OTP** flow. The template **must** include `{{ .Token }}` — no links.

**⚠️ Remove any `{{ .ConfirmationURL }}`** — links can trigger email prefetchers and invalidate the code.

Example:
```html
<p>Your login code is: <strong>{{ .Token }}</strong></p>
```

## 4. OTP Expiration (fix 403 "Token expired or invalid")

**Path:** Supabase Dashboard → Authentication → Providers → Email

- Check **Email OTP expiration** — default is 3600 seconds (1 hour)
- If set very low (e.g. 60 seconds), codes expire before users can enter them
- **Flow tip:** Enter the code as soon as you receive the email. Don't open the email on multiple devices — some email clients prefetch links and can invalidate the token
- When you click "Send new code", the previous code is invalidated — always use the code from your **most recent** email

## 5. Resend Domain (if using custom domain)

- For `onboarding@resend.dev` → no setup needed, works immediately
- For your own domain → verify it in Resend Dashboard → Domains
