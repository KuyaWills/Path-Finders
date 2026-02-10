import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Supabase client (service role for writing)
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Stripe client
const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
if (!stripeSecret) throw new Error("STRIPE_SECRET_KEY not configured");
const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const plan = (body.plan || body.planId || "lifetime").toLowerCase();
    const userId = body.userId;

    // Normalize to only supported plans
    const planId = plan === "starter" ? "starter" : "lifetime";

    const originHeader = req.headers.get("origin");
    const origin =
      originHeader && originHeader !== "null"
        ? originHeader
        : Deno.env.get("APP_URL") || "http://localhost:3000";

    // Prevent creating new subscription if user already has an active one
    if (userId) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", userId)
        .maybeSingle();

      const now = new Date();
      const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end) : null;
      const isActive = sub?.status === "active" && (!periodEnd || periodEnd > now);

      if (isActive) {
        return new Response(
          JSON.stringify({ error: "User already has an active subscription" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Stripe price mapping: Starter ($10) and Lifetime ($15)
    const priceMap: Record<string, string | undefined> = {
      starter: Deno.env.get("STRIPE_PRICE_STARTER"),
      lifetime: Deno.env.get("STRIPE_PRICE_LIFETIME"),
    };
    const priceId = priceMap[planId]?.trim();

    // Fallback amounts in cents per month if no price ID ($10 = 1000, $15 = 1500)
    const planAmounts: Record<string, number> = { starter: 1000, lifetime: 1500 };
    const unitAmount = planAmounts[planId] ?? 1500;

    // Success & cancel URLs (cancelUrl from frontend returns user to /offer)
    const successUrl = body.successUrl || `${origin}/offer?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body.cancelUrl || `${origin}/offer`;

    // Build Stripe line item (monthly subscription)
    const lineItem = priceId?.startsWith("price_")
      ? { price: priceId, quantity: 1 }
      : {
          price_data: {
            currency: "usd",
            product_data: { name: planId === "starter" ? "Starter (monthly)" : "Lifetime (monthly)" },
            unit_amount: unitAmount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        };

    // Create Stripe Checkout session (monthly subscription)
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [lineItem],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { planId, ...(userId && { userId }) },
      ...(body.customerEmail && { customer_email: body.customerEmail }),
      ...(userId && { client_reference_id: userId }),
    });

    if (!session.url) {
      return new Response(
        JSON.stringify({ error: "Stripe did not return a checkout URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Stripe error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
