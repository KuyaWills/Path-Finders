import type { SupabaseClient } from "@supabase/supabase-js";
import type { OtpResult } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Send OTP via custom Edge Function (generates code, stores in DB, sends via Resend)
 * @param mode "login" = only if email already registered | "signup" = only if email not yet registered
 */
export async function sendOtp(email: string, mode?: "login" | "signup"): Promise<OtpResult> {
  const res = await fetch(`${supabaseUrl}/functions/v1/send-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ email, mode }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data?.error ?? "Failed to send code" };
  }
  return { success: true };
}

/**
 * Verify OTP via custom Edge Function, returns actionLink to complete Supabase session
 */
export async function verifyOtp(
  email: string,
  code: string,
  redirectTo?: string
): Promise<{ success: true; actionLink: string } | { success: false; error: string }> {
  const res = await fetch(`${supabaseUrl}/functions/v1/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ email, code, redirectTo }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data?.error ?? "Verification failed" };
  }
  if (!data.actionLink) {
    return { success: false, error: "Invalid response" };
  }
  return { success: true, actionLink: data.actionLink };
}

/**
 * Send OTP magic link to email (legacy – uses Supabase Auth)
 * @deprecated Use sendOtp for custom OTP flow
 */
export async function signInWithOtp(
  supabase: SupabaseClient,
  email: string,
  redirectTo: string
): Promise<OtpResult> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Build auth callback redirect URL
 * Extracted for testability
 */
export function buildAuthRedirectUrl(origin: string, path = "/"): string {
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Build login error redirect URL (with default locale for i18n)
 */
export function buildLoginErrorRedirectUrl(origin: string, locale = "en"): string {
  return `${origin}/${locale}/login?error=auth`;
}

/**
 * Verify 6-digit OTP code (Supabase Auth email OTP flow)
 * @deprecated Use verifyOtp for custom OTP flow
 */
export async function verifyOtpCode(
  supabase: SupabaseClient,
  email: string,
  token: string
): Promise<OtpResult> {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: token.trim(),
    type: "email",
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
