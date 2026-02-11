"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Mail, Loader2 } from "lucide-react";
import { sendOtp } from "@/services/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OtpAuthLayout, OtpAuthFooter } from "@/components/auth/OtpAuthLayout";
import { useOtpResendTimer } from "@/hooks/useOtpResendTimer";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const submittingRef = useRef(false);

  const { canResend, waitSec } = useOtpResendTimer(lastSentAt);

  useEffect(() => {
    if (searchParams.get("error") === "auth") {
      setError("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const redirect = searchParams.get("redirect");
        router.replace(redirect && redirect.startsWith("/") ? redirect : "/quiz");
      }
    });
  }, [router, searchParams]);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || submittingRef.current || !canResend) return;
    submittingRef.current = true;
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectPath = searchParams.get("redirect") ?? "/quiz";
      const path = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;
      const basePath = `/${locale}${path}`;
      const nextPath = path === "/quiz" ? `${basePath}?new_session=1` : basePath;
      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const result = await sendOtp(supabase, email, {
        emailRedirectTo: callbackUrl,
        mode: "login",
      });
      if (result.success) {
        setSent(true);
        setLastSentAt(Date.now());
      } else {
        setError(result.error ?? "Failed to send link");
        if (result.error?.toLowerCase().includes("wait")) {
          setLastSentAt(Date.now());
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleResend = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!canResend || loading) return;
    handleSendLink(e as unknown as React.FormEvent);
  };

  return (
    <OtpAuthLayout
      title="Welcome back 👋"
      subtitle={sent ? t("checkInboxClickLink") : t("loginPromptLink")}
    >
      {sent ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-medium">{t("checkInbox")}</p>
            <p className="mt-1 text-emerald-700">
              Sent to <strong>{email}</strong>
            </p>
            <p className="mt-2 text-xs text-emerald-600">{t("clickLinkToLogin")}</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            disabled={!canResend || loading}
            onClick={handleResend}
            className="text-sm font-medium text-[#5b6cf2] hover:underline disabled:cursor-not-allowed disabled:text-zinc-500 disabled:no-underline"
          >
            {canResend ? t("resendLink") : `Wait ${waitSec}s`}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSendLink} className="mt-6 space-y-4">
          <label htmlFor="email" className="block text-sm font-medium text-zinc-900">
            {t("email")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">
              {error}
              {(error.toLowerCase().includes("sign up") || error.toLowerCase().includes("not registered")) && (
                <span className="ml-1">
                  <Link
                    href="/signup"
                    className="font-medium text-[#2563eb] underline underline-offset-2 hover:text-[#1d4ed8]"
                  >
                    {t("needSignUpFirst")}
                  </Link>
                </span>
              )}
            </p>
          )}
          <Button type="submit" variant="primary" className="h-11 w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending...
              </>
            ) : (
              t("sendLink")
            )}
          </Button>
        </form>
      )}

      <OtpAuthFooter
        prompt={t("dontHaveAccount")}
        linkText={t("signup")}
        linkHref="/signup"
        builtForText={t("builtForJuniorDevs")}
      />
    </OtpAuthLayout>
  );
}
