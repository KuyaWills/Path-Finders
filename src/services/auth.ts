import type { SupabaseClient } from "@supabase/supabase-js";
import type { OtpResult } from "@/types";

/**
 * Send magic link via Supabase (default built-in).
 * Configure the Magic Link template in Supabase Dashboard to use {{ .ConfirmationURL }}.
 */
export async function sendOtp(
  supabase: SupabaseClient,
  email: string,
  options?: { emailRedirectTo?: string; mode?: "login" | "signup" }
): Promise<OtpResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      shouldCreateUser: options?.mode === "login" ? false : true,
      emailRedirectTo: options?.emailRedirectTo,
    },
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
