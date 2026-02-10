# Fix: Magic link / OTP emails not being sent

Supabase's **default email only sends to team members**. If you're not receiving emails, use one of these solutions:

---

## Option 1: Add your email to the team (quick test)

For testing with your own email only:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click your **Organization** name (top-left) → **Team**
3. **Invite member** → enter your email (e.g. `kentvillahermosa@gmail.com`)
4. Accept the invite in your email
5. Try the login again — emails should now be delivered

**Limit:** Default SMTP allows ~2 emails/hour. Only works for team member addresses.

---

## Option 2: Set up Resend (recommended for any email)

Use [Resend](https://resend.com) (free tier: 100 emails/day) to send to any address:

### 1. Resend setup

1. Create account at [resend.com](https://resend.com)
2. Go to **API Keys** → create an API key
3. Go to **Domains** → add your domain (or use `onboarding@resend.dev` for testing)

### 2. Supabase SMTP config

1. Supabase Dashboard → **Authentication** → **Email** → **SMTP Settings**
2. Enable custom SMTP
3. Use these values:

| Field | Value |
|-------|-------|
| **Sender email** | `onboarding@resend.dev` (testing) or `noreply@yourdomain.com` |
| **Sender name** | `PathFinders` |
| **Host** | `smtp.resend.com` |
| **Port** | `465` |
| **Username** | `resend` |
| **Password** | Your Resend API key |

4. Save

### 3. Redirect URL (important)

Add your app URL in Supabase:

1. **Authentication** → **URL Configuration**
2. **Site URL:** `http://localhost:3000` (dev) or your production URL
3. **Redirect URLs:** Add `http://localhost:3000/**` and your production URL

---

## Option 3: Magic link vs 6-digit code

Your app uses **6-digit OTP**. Ensure the Magic Link template includes the token:

1. **Authentication** → **Email Templates** → **Magic Link**
2. Body must include: `{{ .Token }}` (the 6-digit code)

Example:
```html
<p>Your login code is: <strong>{{ .Token }}</strong></p>
```

---

## Check Auth logs

To see if Supabase is processing the request:

1. Supabase Dashboard → **Logs** → **Auth**
2. Look for `/auth/v1/otp` entries
3. 200 = request accepted; check for error messages
