/**
 * Environment variable validation
 * Throws in build/runtime if required vars are missing
 */

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value && typeof window === "undefined") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? "";
}

export function getSupabaseUrl(): string {
  return getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey(): string {
  return getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
