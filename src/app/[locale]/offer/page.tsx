import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { OfferView } from "./OfferView";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string; cancelled?: string }>;
};

export default async function OfferPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { session_id: sessionId, cancelled } = await searchParams;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect the offer page: require login before viewing or purchasing.
  if (!user) {
    redirect(`/${locale}/login?redirect=/offer`);
  }

  // Only consider premium state immediately after a successful Stripe checkout,
  // when we have a session_id. On normal visits, always show the unlock view
  // even if the user previously purchased.
  const isPremium = sessionId ? await checkPremium(supabase, user.id) : false;

  return (
    <OfferView
      isPremium={isPremium}
      userId={user.id}
      sessionId={sessionId ?? null}
      cancelled={!!cancelled}
    />
  );
}

async function checkPremium(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", userId)
      .maybeSingle();
    return !!data?.is_premium;
  } catch {
    return false;
  }
}
