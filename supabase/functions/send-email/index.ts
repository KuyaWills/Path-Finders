import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = (Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string)?.replace(
  "v1,whsec_",
  ""
);

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
              <p style="margin: 16px 0 0 0; font-size: 13px; color: #a1a1aa;">This code expires in 1 hour.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Not allowed", { status: 405 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  try {
    if (!hookSecret) {
      throw new Error("SEND_EMAIL_HOOK_SECRET is not set");
    }

    const wh = new Webhook(hookSecret);
    const { user, email_data } = (await wh.verify(payload, headers)) as {
      user: { email?: string };
      email_data: {
        token: string;
        token_hash: string;
        email_action_type: string;
        token_new?: string;
      };
    };

    const recipientEmail = user.email;
    if (!recipientEmail) {
      throw new Error("No recipient email");
    }

    const token =
      email_data.token || email_data.token_new || "";
    if (!token) {
      throw new Error("No token in email_data");
    }

    const subject =
      email_data.email_action_type === "signup"
        ? "Welcome to PathFinders – Your sign-in code"
        : "Your PathFinders login code";

    const { error } = await resend.emails.send({
      from: "PathFinders <onboarding@resend.dev>",
      to: [recipientEmail],
      subject,
      html: buildOtpEmailHtml(token),
      text: `Your PathFinders login code is: ${token}\n\nThis code expires in 1 hour.`,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Send email hook error:", err);
    return new Response(
      JSON.stringify({
        error: {
          message: err instanceof Error ? err.message : "Unknown error",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
