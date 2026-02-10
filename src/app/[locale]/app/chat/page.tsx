import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ChatPage } from "./ChatPage";

type Props = { params: Promise<{ locale: string }> };

export default async function AppChatPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isPremium = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .maybeSingle();
    isPremium = !!profile?.is_premium;
  }
  return <ChatPage isPremium={isPremium} />;
}
