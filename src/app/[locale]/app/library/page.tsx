import { setRequestLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ locale: string }> };

export default async function LibraryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("library_items")
    .select("id, title, description, kind")
    .order("sort_order", { ascending: true });
  const t = await getTranslations("app");
  const list = items ?? [];
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-900">{t("library")}</h1>
      <ul className="mt-4 space-y-3">
        {list.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow"
          >
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              {item.kind}
            </span>
            <h2 className="mt-2 font-semibold text-zinc-900">{item.title}</h2>
            {item.description && (
              <p className="mt-1 text-sm text-zinc-600">{item.description}</p>
            )}
          </li>
        ))}
      </ul>
      {list.length === 0 && (
        <p className="mt-6 text-center text-zinc-500">No items in the library yet.</p>
      )}
    </div>
  );
}
