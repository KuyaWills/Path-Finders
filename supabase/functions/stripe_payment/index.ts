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

    // Use customer email from body, or fetch from Supabase Auth when we have userId (single source of truth)
    let customerEmail = body.customerEmail?.trim() || undefined;
    if (userId && !customerEmail) {
      const { data: { user } } = await supabase.auth.admin.getUserById(userId);
      if (user?.email) customerEmail = user.email;
    }

    const originHeader = req.headers.get("origin");
    const origin =
      originHeader && originHeader !== "null"
        ? originHeader
        : Deno.env.get("APP_URL") || "http://localhost:3000";

    // Stripe price mapping: Starter and Lifetime (one-time)
    const priceMap: Record<string, string | undefined> = {
      starter: Deno.env.get("STRIPE_PRICE_STARTER"),
      lifetime: Deno.env.get("STRIPE_PRICE_LIFETIME"),
    };
    const priceId = priceMap[planId]?.trim();

    // Fallback amounts in cents if no price ID ($10 = 1000, $15 = 1500)
    const planAmounts: Record<string, number> = { starter: 1000, lifetime: 1500 };
    const unitAmount = planAmounts[planId] ?? 1500;

    // Success & cancel URLs (cancelUrl from frontend returns user to /offer)
    const successUrl = body.successUrl || `${origin}/offer?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body.cancelUrl || `${origin}/offer`;

    // Build Stripe line item (one-time payment)
    const lineItem = priceId?.startsWith("price_")
      ? { price: priceId, quantity: 1 }
      : {
          price_data: {
            currency: "usd",
            product_data: { name: planId === "starter" ? "Starter" : "Lifetime" },
            unit_amount: unitAmount,
          },
          quantity: 1,
        };

    // Create Stripe Checkout session (one-time payment)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [lineItem],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { planId, ...(userId && { userId }) },
      ...(customerEmail && { customer_email: customerEmail }),
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
