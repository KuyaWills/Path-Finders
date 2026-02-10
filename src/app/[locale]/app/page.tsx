import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ locale: string }> };

export default async function AppHomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data: daily } = await supabase
    .from("daily_content")
    .select("title, body, slug")
    .eq("slug", "today-tip")
    .maybeSingle();
  const t = await getTranslations("app");
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-900">{t("dailyTip")}</h1>
      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        {daily ? (
          <>
            <h2 className="text-lg font-semibold text-zinc-900">{daily.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-zinc-600">{daily.body}</p>
          </>
        ) : (
          <p className="text-zinc-500">No tip for today yet. Check back later!</p>
        )}
      </div>
    </div>
  );
}
