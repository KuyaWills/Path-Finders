import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
if (!stripeSecret) throw new Error("STRIPE_SECRET_KEY not configured");
const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body?.session_id ?? body?.sessionId;

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing session_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const userId = session.client_reference_id ?? session.metadata?.userId ?? body?.user_id ?? body?.userId;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing user reference (client_reference_id or metadata.userId)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For one-time payments, check payment_status and set premium.
    // For any other mode (legacy/unsupported), we still mark the user as premium
    // but we no longer touch a subscriptions table (which might not exist).
    const planId = (session.metadata?.planId as string | undefined) ?? "lifetime";

    if (session.mode === "payment" && session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Payment not completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, is_premium: true }, { onConflict: "id" });

    if (error) {
      console.error("Profiles upsert error:", error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, success: true, planId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Stripe session error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
