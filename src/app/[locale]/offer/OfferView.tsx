"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Lock, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type PlanId = "starter" | "lifetime";

type Props = {
  isPremium: boolean;
  userId?: string | null;
  sessionId?: string | null;
  cancelled?: boolean;
};

export function OfferView({
  isPremium: initialPremium,
  userId: serverUserId,
  sessionId: initialSessionId,
  cancelled,
}: Props) {
  const t = useTranslations("offer");
  const router = useRouter();
  const [isPremium, setIsPremium] = useState(initialPremium);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(!!initialSessionId && !initialPremium);
  const [error, setError] = useState<string | null>(null);
  const [clientUserId, setClientUserId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("lifetime");
  const [purchasedPlan, setPurchasedPlan] = useState<PlanId | null>(null);
  const [purchasedAt, setPurchasedAt] = useState<number | null>(null);

  const effectiveUserId = serverUserId ?? clientUserId;

  useEffect(() => {
    if (serverUserId) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) setClientUserId(user.id);
    });
  }, [serverUserId]);

  useEffect(() => {
    if (!initialSessionId || initialPremium) return;
    let cancelledEffect = false;
    (async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const res = await fetch(`${supabaseUrl}/functions/v1/stripe_session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ session_id: initialSessionId }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelledEffect) return;
        if (res.ok && !data.error) {
          const planId: PlanId =
            data.planId === "starter" ? "starter" : "lifetime";
          const now = Date.now();
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(
                "pathfinders_last_purchase",
                JSON.stringify({ planId, at: now })
              );
            } catch {
              // ignore storage errors
            }
          }
          setPurchasedPlan(planId);
          setPurchasedAt(now);
          // Stay on this thank-you screen; user can click the button to go back to landing.
          setIsPremium(true);
        } else {
          setError(data.error ?? "Verification failed");
        }
      } catch {
        if (!cancelledEffect) setError("Something went wrong");
      } finally {
        if (!cancelledEffect) setVerifying(false);
      }
    })();
    return () => {
      cancelledEffect = true;
    };
  }, [initialSessionId, initialPremium, router]);

  const handleUnlock = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const token = session?.access_token ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const cancelUrl = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : "";
      const res = await fetch(`${supabaseUrl}/functions/v1/stripe_payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: selectedPlan,
          cancelUrl: cancelUrl || undefined,
          userId: session?.user?.id ?? undefined,
          customerEmail: session?.user?.email ?? undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || (data.error && /sign up|log in|unauthorized/i.test(String(data.error)))) {
        router.push("/signup");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Failed to start checkout");
      if (typeof data.url === "string") {
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#2563eb]" />
        <p className="text-sm font-medium text-zinc-600">Completing your purchase…</p>
      </div>
    );
  }

  if (isPremium) {
    const planMeta =
      purchasedPlan === "starter"
        ? { name: t("planStarterName"), price: t("planStarterPrice") }
        : { name: t("planLifetimeName"), price: t("planLifetimePrice") };
    const purchasedOn =
      purchasedAt != null
        ? new Date(purchasedAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : null;

    return (
      <div className="min-h-screen bg-[#f5f5f5] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-white bg-white p-8 shadow-sm text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <h1 className="mt-4 text-2xl font-bold text-zinc-900">{t("unlocked")}</h1>
            <p className="mt-2 text-zinc-600">
              You now have access to daily tips and your personalized growth plan inside the app.
            </p>
            <div className="mt-6 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 text-left">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                {t("orderSummaryTitle")}
              </h2>
              <p className="mt-2 text-sm font-medium text-zinc-900">
                {planMeta.name} — {planMeta.price}
              </p>
              {purchasedOn && (
                <p className="mt-1 text-xs text-zinc-600">
                  Purchased on {purchasedOn}
                </p>
              )}
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              When you&apos;re ready, you can return to the main page below.
            </p>
            <Link href="/" className="mt-6 inline-block">
              <Button variant="primary" size="lg" className="rounded-lg">
                Go to landing now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const plans: { id: PlanId; nameKey: string; priceKey: string; descKey: string }[] = [
    { id: "starter", nameKey: "planStarterName", priceKey: "planStarterPrice", descKey: "planStarterDesc" },
    { id: "lifetime", nameKey: "planLifetimeName", priceKey: "planLifetimePrice", descKey: "planLifetimeDesc" },
  ];

  const selectedPlanInfo = plans.find((p) => p.id === selectedPlan)!;

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="rounded-2xl border border-white bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2563eb]/10">
              <Lock className="h-5 w-5 text-[#2563eb]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">{t("title")}</h1>
              <p className="text-sm text-zinc-500">{t("subtitle")}</p>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
            <h2 className="font-semibold text-zinc-900">{t("planName")}</h2>
            <p className="mt-1 text-sm text-zinc-600">{t("planDescription")}</p>
            <ul className="mt-4 space-y-2">
              {[t("planFeature1"), t("planFeature2"), t("planFeature3"), t("planFeature4")].map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            {t("choosePlan")}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`rounded-xl border-2 p-4 text-left transition-colors ${
                  selectedPlan === plan.id
                    ? "border-[#2563eb] bg-blue-50/50"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <p className="font-semibold text-zinc-900">{t(plan.nameKey)}</p>
                <p className="mt-0.5 text-lg font-bold text-[#2563eb]">{t(plan.priceKey)}</p>
                <p className="mt-1 text-xs text-zinc-600">{t(plan.descKey)}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            {t("orderSummaryTitle")}
          </h3>
          <div className="mt-3 flex items-center justify-between border-b border-zinc-200 pb-3">
            <span className="font-medium text-zinc-900">
              {t(selectedPlanInfo.nameKey)} — {t(selectedPlanInfo.priceKey)}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">{t(selectedPlanInfo.descKey)}</p>
          {cancelled && (
            <p className="mt-3 text-sm text-amber-600">{t("paymentCancelled")}</p>
          )}
          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
          <div className="mt-6">
            <Button
              variant="primary"
              size="lg"
              className="w-full rounded-lg"
              onClick={handleUnlock}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting to checkout…
                </>
              ) : (
                t("proceedToCheckout")
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
