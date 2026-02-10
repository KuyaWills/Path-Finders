import { setRequestLocale } from "next-intl/server";
import LoginFormLoader from "./LoginFormLoader";

type Props = { params: Promise<{ locale: string }> };

async function LoginPageContent({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LoginFormLoader />;
}

export default function LoginPage(props: Props) {
  return <LoginPageContent params={props.params} />;
}
