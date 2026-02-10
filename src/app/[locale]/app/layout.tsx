import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AppNav } from "./AppNav";
import { ChatWidget } from "./ChatWidget";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export default async function AppLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .maybeSingle();
  const isPremium = !!profile?.is_premium;

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <AppNav isPremium={isPremium} />
      <main className="flex-1 p-4 sm:p-6">{children}</main>
      <ChatWidget />
    </div>
  );
}
