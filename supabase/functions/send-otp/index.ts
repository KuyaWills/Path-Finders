import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_OTP") as string);
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildOtpEmailHtml(token: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your login code - PathFinders</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f1f5f9; min-height: 100vh;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding: 40px 24px;" align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 420px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <tr>
            <td align="center">
              <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #18181b;">PathFinders</p>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #71717a;">Your login code</p>
              <div style="padding: 16px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
                <p style="margin: 0; font-size: 28px; font-weight: 700; color: #5b6cf2; letter-spacing: 0.3em;">${token}</p>
              </div>
              <p style="margin: 16px 0 0 0; font-size: 13px; color: #a1a1aa;">This code expires in 15 minutes.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { email, mode } = (await req.json()) as { email?: string; mode?: "login" | "signup" };
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Login: only send OTP if email is already registered
    if (mode === "login") {
      const { data: exists } = await supabase.rpc("user_exists_by_email", {
        check_email: normalizedEmail,
      });
      if (!exists) {
        return new Response(
          JSON.stringify({ error: "Email not registered. Please sign up first." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Signup: optionally check if already registered (user might want to log in instead)
    if (mode === "signup") {
      const { data: exists } = await supabase.rpc("user_exists_by_email", {
        check_email: normalizedEmail,
      });
      if (exists) {
        return new Response(
          JSON.stringify({ error: "Email already registered. Log in instead." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const { error: insertError } = await supabase.from("otp_codes").insert({
      email: normalizedEmail,
      code,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("Insert OTP error:", insertError);
      throw insertError;
    }

    const { error: resendError } = await resend.emails.send({
      from: "PathFinders <onboarding@resend.dev>",
      to: [normalizedEmail],
      subject: "Your PathFinders login code",
      html: buildOtpEmailHtml(code),
      text: `Your PathFinders login code is: ${code}\n\nThis code expires in 15 minutes.`,
    });

    if (resendError) {
      console.error("Resend error:", resendError);
      throw resendError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-otp error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Failed to send code",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
