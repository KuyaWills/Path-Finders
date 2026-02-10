import { setRequestLocale } from "next-intl/server";
import { QuizFunnel } from "./QuizFunnel";

// Quiz depends on client auth state and local storage,
// so we mark it as dynamic to skip static prerendering at build time.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function QuizPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <QuizFunnel />;
}
