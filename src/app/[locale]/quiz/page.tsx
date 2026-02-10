import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { QuizFunnel } from "./QuizFunnel";
import { createClient } from "@/lib/supabase/server";

// Quiz depends on client auth state and local storage,
// so we mark it as dynamic to skip static prerendering at build time.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function QuizPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Require login before accessing the quiz. If not authenticated,
  // send the user to the localized login page with a redirect back to /quiz.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?redirect=/quiz`);
  }

  return <QuizFunnel />;
}
