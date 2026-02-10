import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

function getBaseUrl(req: Request): string {
  const url = new URL(req.url);
  return url.origin;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { planId?: string };
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }
  const planId = body.planId === "starter" || body.planId === "lifetime" ? body.planId : "lifetime";

  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId =
    planId === "starter"
      ? process.env.STRIPE_PRICE_STARTER
      : process.env.STRIPE_PRICE_LIFETIME ?? process.env.STRIPE_PRICE_ID;
  if (!secret || !priceId) {
    return NextResponse.json(
      { error: "Stripe is not configured (STRIPE_SECRET_KEY and STRIPE_PRICE_STARTER / STRIPE_PRICE_LIFETIME)" },
      { status: 503 }
    );
  }

  const baseUrl = getBaseUrl(req);
  const successUrl = `${baseUrl}/offer?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/offer?cancelled=1`;

  const stripe = new Stripe(secret);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { user_id: user.id },
    });

    const url = session.url;
    if (!url) {
      return NextResponse.json({ error: "No checkout URL" }, { status: 502 });
    }
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Stripe error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
