"use client";

import { Link } from "@/i18n/navigation";
import { Sparkles } from "lucide-react";

type OtpAuthLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
};

export function OtpAuthLayout({ children, title, subtitle }: OtpAuthLayoutProps) {
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
        <Link href="/" className="mb-10 flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center bg-[#5b6cf2] text-white font-bold"
            style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
          >
            PF
          </div>
          <h1 className="text-2xl font-bold text-zinc-800">PathFinders</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Figure out your career bottlenecks and get a daily growth plan
          </p>
        </Link>

        <div className="w-full max-w-[420px] rounded-2xl border border-white/60 bg-white/90 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

type OtpAuthFooterProps = {
  prompt: string;
  linkText: string;
  linkHref: string;
  builtForText: string;
};

export function OtpAuthFooter({ prompt, linkText, linkHref, builtForText }: OtpAuthFooterProps) {
  return (
    <>
      <p className="mt-6 text-center text-sm text-zinc-500">
        {prompt}{" "}
        <Link
          href={linkHref}
          className="font-medium text-[#2563eb] underline underline-offset-2 hover:text-[#1d4ed8]"
        >
          {linkText}
        </Link>
      </p>
      <p className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-slate-50/80 py-2.5 text-xs text-zinc-500">
        <Sparkles className="h-4 w-4 text-amber-500" />
        {builtForText}
      </p>
    </>
  );
}
