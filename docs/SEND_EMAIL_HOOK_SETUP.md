# Send Email Hook Setup (Edge Function + Resend)

This replaces Supabase's built-in email sending with an Edge Function that uses Resend's API. Benefits:

- **Full control** over email content (no tracking, no prefetching issues)
- **PathFinders branded** template in code
- **Fixes 403 "token expired"** by sending only the 6-digit code, no links

## Prerequisites

- Resend API key
- [Supabase CLI](https://supabase.com/docs/guides/cli#installation) installed

## 1. Generate the hook secret

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Authentication** → **Hooks** (in the left sidebar)
3. Under **Send Email Hook**, click **Create a new secret**
4. Copy the secret (format: `v1,whsec_xxx`)

## 2. Create `.env` for secrets

Create `supabase/.env` (or add to your root `.env`):

```env
RESEND_API_KEY=re_xxxxxxxx
SEND_EMAIL_HOOK_SECRET=v1,whsec_xxxxxxxx
```

**Important:** Do NOT commit `.env` to git. Add `supabase/.env` to `.gitignore`.

## 3. Set secrets in Supabase

```bash
cd pathfinders
supabase secrets set --env-file supabase/.env
```

Or set each manually:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
supabase secrets set SEND_EMAIL_HOOK_SECRET=v1,whsec_xxxxxxxx
```

## 4. Deploy the Edge Function

```bash
supabase functions deploy resend-otp --no-verify-jwt
```

The `--no-verify-jwt` flag is required because Supabase Auth calls this function internally (not from your app).

## 5. Configure the Auth Hook in Supabase

1. **Supabase Dashboard** → **Authentication** → **Hooks**
2. Find **Send Email Hook**
3. **Enable** the hook
4. Set **HTTP Endpoint** to:
   ```
   https://rfdrcbgrshppkviamcze.supabase.co/functions/v1/resend-otp
   ```
   (Replace with your project URL if different: `https://<project-ref>.supabase.co/functions/v1/resend-otp`)
5. Save

## 6. Disable SMTP (optional)

When the Auth Hook is enabled, Supabase uses the hook instead of SMTP. Your Resend SMTP config will be ignored for auth emails. You can leave it as-is or disable it.

## 7. Update the template

The template is in `supabase/functions/resend-otp/index.ts` in the `buildOtpEmailHtml` function. Edit it and redeploy:

```bash
supabase functions deploy resend-otp --no-verify-jwt
```

## Testing

1. Request a login code from your app
2. Check your email — you should receive the PathFinders branded email with the 6-digit code
3. Enter the code — verification should work without the 403 error

## Troubleshooting

- **401 from the hook**: Check that `SEND_EMAIL_HOOK_SECRET` matches the secret in Supabase Dashboard
- **No email received**: Check Resend Dashboard → Logs for delivery status
- **Function not found**: Ensure the function is deployed and the hook URL is correct
