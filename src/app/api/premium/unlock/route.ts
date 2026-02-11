import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, is_premium: true }, { onConflict: "id" });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  } catch {
    return NextResponse.json(
      { error: "Server error. Ensure profiles table exists with id (uuid), is_premium (boolean)." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
