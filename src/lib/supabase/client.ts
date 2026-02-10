import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Do not persist sessions in localStorage; treat auth as per‑tab/session only.
        // This means closing the tab or doing a full reload will require logging in again.
        persistSession: false,
      },
    }
  );
}
