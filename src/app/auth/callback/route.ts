import { createClient } from "@/lib/supabase/server";
import {
  buildAuthRedirectUrl,
  buildLoginErrorRedirectUrl,
} from "@/services/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(buildAuthRedirectUrl(origin, next));
      }
    } catch {
      // Fall through to error redirect
    }
  }

  const locale = searchParams.get("locale") ?? "en";
  return NextResponse.redirect(buildLoginErrorRedirectUrl(origin, locale));
}
