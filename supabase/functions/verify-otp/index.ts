import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    const { email, code, redirectTo } = (await req.json()) as {
      email?: string;
      code?: string;
      redirectTo?: string;
    };

    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedCode = code?.trim();
    if (!trimmedCode || trimmedCode.length !== 6) {
      return new Response(
        JSON.stringify({ error: "Valid 6-digit code required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find valid, unused OTP
    const { data: rows, error: fetchError } = await supabase
      .from("otp_codes")
      .select("id")
      .eq("email", normalizedEmail)
      .eq("code", trimmedCode)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Fetch OTP error:", fetchError);
      throw fetchError;
    }

    if (!rows?.length) {
      return new Response(
        JSON.stringify({ error: "Code expired or invalid. Request a new code." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as used
    await supabase
      .from("otp_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", rows[0].id);

    // Generate magic link to establish Supabase session (creates user if needed)
    const redirectUrl = redirectTo && redirectTo.startsWith("http") ? redirectTo : undefined;
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
      options: redirectUrl ? { redirectTo: redirectUrl } : undefined,
    });

    if (linkError) {
      console.error("Generate link error:", linkError);
      throw linkError;
    }

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) {
      throw new Error("No action link returned");
    }

    return new Response(
      JSON.stringify({ success: true, actionLink }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-otp error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Verification failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});