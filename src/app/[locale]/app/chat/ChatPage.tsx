"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { Lock, Send, Loader2 } from "lucide-react";

type Props = { isPremium: boolean };

export function ChatPage({ isPremium }: Props) {
  const t = useTranslations("app");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || !isPremium) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Request failed");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: full };
          return next;
        });
      }
    } catch (e) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. " + (e instanceof Error ? e.message : ""),
        };
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-zinc-900">{t("aiHelper")}</h1>
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <Lock className="h-12 w-12 text-amber-600" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-900">{t("premiumRequired")}</h2>
          <p className="mt-2 text-zinc-600">{t("unlockPremium")}</p>
          <Link href="/offer" className="mt-6">
            <Button variant="primary" size="lg" className="rounded-lg">
              Unlock premium
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <h1 className="text-2xl font-bold text-zinc-900">{t("aiHelper")}</h1>
      <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex max-h-[60vh] flex-1 flex-col overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-zinc-500">Ask anything about your dev growth plan.</p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`mb-3 rounded-lg px-3 py-2 ${
                m.role === "user" ? "ml-8 bg-[#2563eb] text-white" : "mr-8 bg-zinc-100 text-zinc-900"
              }`}
            >
              {m.content || (loading && i === messages.length - 1 ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                </span>
              ) : null)}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form
          className="flex gap-2 border-t border-zinc-200 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" variant="primary" size="icon" disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
