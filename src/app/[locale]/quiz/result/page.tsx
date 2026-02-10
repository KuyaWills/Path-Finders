import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { QuizResultView } from "./QuizResultView";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ locale: string }> };

export default async function QuizResultPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Require login before accessing the quiz result.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?redirect=/quiz/result`);
  }

  return <QuizResultView />;
}
