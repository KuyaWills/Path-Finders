"use client";

import dynamic from "next/dynamic";

const LoginForm = dynamic(() => import("./LoginForm"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5b6cf2] border-t-transparent" />
    </div>
  ),
});

export default function LoginFormLoader() {
  return <LoginForm />;
}
