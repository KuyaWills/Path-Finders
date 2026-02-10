"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { Mail, Loader2, Sparkles } from "lucide-react";
import { sendOtp, verifyOtp } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

export default function SignupForm() {
  const locale = useLocale();
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await sendOtp(email, "signup");
      if (result.success) {
        setSent(true);
        setCode("");
      } else {
        setError(result.error ?? "Failed to send code");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setError(null);
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/${locale}/login`;
      const result = await verifyOtp(email, code, redirectTo);
      if (result.success) {
        window.location.href = result.actionLink;
      } else {
        setError(result.error ?? "Invalid code. Try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40" />
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.15) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-10 flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center bg-[#5b6cf2] text-white font-bold"
            style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
          >
            PF
          </div>
          <h1 className="text-2xl font-bold text-zinc-800">PathFinders</h1>
          <p className="mt-1 text-sm text-zinc-500">Figure out your career bottlenecks and get a daily growth plan</p>
        </div>

        <div className="w-full max-w-[420px] rounded-2xl border border-white/60 bg-white/90 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-zinc-900">Let&apos;s get started 🚀</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {sent ? t("enterCode") : "Enter your email — we'll send a 6-digit code."}
            </p>
          </div>

          {sent ? (
            <>
              <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                <p className="font-medium">{t("checkInbox")}</p>
                <p className="mt-0.5 text-emerald-700">Sent to <strong>{email}</strong></p>
              </div>
              <form onSubmit={handleVerifyCode} className="mt-6 space-y-4">
                <label htmlFor="code" className="block text-sm font-medium text-zinc-900">{t("enterCode")}</label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-lg tracking-[0.5em]"
                  disabled={loading}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" variant="primary" className="h-11 w-full" disabled={loading || code.length !== 6}>
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</> : t("verify")}
                </Button>
              </form>
            </>
          ) : (
            <form onSubmit={handleSendCode} className="mt-6 space-y-4">
              <label htmlFor="email" className="block text-sm font-medium text-zinc-900">{t("email")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10" disabled={loading} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" variant="primary" className="h-11 w-full" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : t("sendCode")}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#2563eb] underline underline-offset-2 hover:text-[#1d4ed8]">
              Log in
            </Link>
          </p>
          <p className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-slate-50/80 py-2.5 text-xs text-zinc-500">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Built for junior devs
          </p>
        </div>
      </div>
    </div>
  );
}
