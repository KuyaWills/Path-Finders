"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signInWithOtp } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function Login() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("error") === "auth") {
      setError("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const result = await signInWithOtp(supabase, email, redirectTo);

      if (result.success) {
        setSent(true);
      } else {
        setError(result.error ?? "Something went wrong");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Background */}
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

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
      {/* Brand */}
      <div className="mb-10 flex flex-col items-center text-center">
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center bg-[#5b6cf2] text-white font-bold"
          style={{
            clipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          }}
        >
          PF
        </div>
        <h1 className="text-2xl font-bold text-zinc-800">PathFinders</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Figure out your career bottlenecks and get a daily growth plan
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-white/60 bg-white/90 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm duration-500">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-zinc-900">Welcome back 👋</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Enter your email — we&apos;ll send a magic link. No password to remember.
          </p>
        </div>

        {sent ? (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 rounded-lg bg-emerald-50 p-5 text-sm text-emerald-800 duration-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-medium">Check your inbox!</p>
                <p className="mt-1 text-emerald-700">
                  We sent a login link to <strong>{email}</strong>. Click it to sign in — you&apos;re almost there!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-zinc-900"
              >
                Email
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
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              className="h-11 w-full transition-transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending your link...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-[#2563eb] underline underline-offset-2 transition-colors hover:text-[#1d4ed8]"
          >
            Get Started
          </Link>
        </p>

        <p className="mt-6 flex items-center justify-center gap-1.5 rounded-lg bg-slate-50/80 py-2.5 text-xs text-zinc-500">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Built for junior devs — one step closer to your goals
        </p>
      </div>
      </div>
    </div>
  );
}
