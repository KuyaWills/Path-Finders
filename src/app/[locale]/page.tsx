import { setRequestLocale } from "next-intl/server";
import { LandingContent } from "./LandingContent";

type Props = { params: Promise<{ locale: string }> };

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LandingContent />;
}
