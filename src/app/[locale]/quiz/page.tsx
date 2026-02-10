import { setRequestLocale } from "next-intl/server";
import { QuizFunnel } from "./QuizFunnel";

type Props = { params: Promise<{ locale: string }> };

export default async function QuizPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <QuizFunnel />;
}
