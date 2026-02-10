import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { BookOpen } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export default async function LibraryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app");
  const supabase = await createClient();

  const { data: list } = await supabase
    .from("daily_content")
    .select("id, title, body, slug")
    .neq("slug", "today-tip")
    .order("created_at", { ascending: false })
    .limit(20);

  const items = list ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-900">{t("library")}</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Guides, tips, and exercises to level up your skills.
      </p>

      {items.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {items.map((item) => (
            <li key={item.id}>
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2563eb]/10 text-[#2563eb]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-zinc-900">{item.title}</h2>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 line-clamp-3">
                      {item.body}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-zinc-400" />
          <p className="mt-3 text-zinc-600">No library items yet.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Add rows to <code className="rounded bg-zinc-200 px-1">daily_content</code> in Supabase
            with slugs other than &quot;today-tip&quot; (e.g. &quot;debugging-guide&quot;,
            &quot;code-review-tips&quot;).
          </p>
        </div>
      )}
    </div>
  );
}
