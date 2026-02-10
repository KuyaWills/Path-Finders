import { createClient } from "@/lib/supabase/server";
import {
  buildAuthRedirectUrl,
  buildLoginErrorRedirectUrl,
} from "@/services/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(buildAuthRedirectUrl(origin, next));
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(buildAuthRedirectUrl(origin, next));
    }
  }

  const locale = searchParams.get("locale") ?? "en";
  return NextResponse.redirect(buildLoginErrorRedirectUrl(origin, locale));
}
