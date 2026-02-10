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

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const userId = session.client_reference_id ?? session.metadata?.userId ?? body?.user_id ?? body?.userId;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing user reference (client_reference_id or metadata.userId)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // One-time payment (mode === "payment"): check payment_status and set premium
    if (session.mode === "payment") {
      if (session.payment_status !== "paid") {
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
        JSON.stringify({ ok: true, success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Subscription mode (legacy): sync to subscriptions table
    const subscription = session.subscription as Stripe.Subscription | null;
    if (!subscription) {
      return new Response(
        JSON.stringify({ error: "No subscription on session" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let status: "active" | "canceled" | "trialing" | "past_due" = "active";
    if (subscription.status === "canceled" || subscription.status === "unpaid") status = "canceled";
    else if (subscription.status === "past_due") status = "past_due";
    else if (subscription.status === "trialing") status = "trialing";

    const currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    const row = {
      user_id: userId,
      stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
      stripe_subscription_id: subscription.id,
      plan: session.metadata?.planId ?? session.metadata?.plan ?? "unknown",
      status,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const { error } = existing
      ? await supabase.from("subscriptions").update(row).eq("user_id", userId)
      : await supabase.from("subscriptions").insert(row);

    if (error) {
      console.error("Supabase subscriptions error:", error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Grant premium access in profiles so the app shows unlocked
    if (status === "active" || status === "trialing") {
      await supabase.from("profiles").upsert({ id: userId, is_premium: true }, { onConflict: "id" });
    }

    return new Response(
      JSON.stringify({ ok: true, success: true, session: { id: session.id } }),
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
