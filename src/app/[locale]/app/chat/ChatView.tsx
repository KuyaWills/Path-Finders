"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Lock } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatView() {
  const t = useTranslations("app");
  const tOffer = useTranslations("offer");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [premiumBlocked, setPremiumBlocked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    setPremiumBlocked(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (res.status === 403) {
        setPremiumBlocked(true);
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      if (!res.ok) {
        const err = await res.text();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${err || "Something went wrong"}` },
        ]);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "No response received." },
        ]);
        return;
      }

      const decoder = new TextDecoder();
      let full = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: full };
          return next;
        });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "Failed to get response.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (premiumBlocked) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-zinc-900">{t("aiHelper")}</h1>
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <Lock className="mx-auto h-12 w-12 text-amber-600" />
          <p className="mt-3 font-medium text-amber-900">{t("premiumRequired")}</p>
          <p className="mt-1 text-sm text-amber-800">{t("unlockPremium")}</p>
          <Link href="/offer" className="mt-4 inline-block">
            <Button variant="primary" size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" />
              {tOffer("cta")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-2xl flex-col">
      <h1 className="text-2xl font-bold text-zinc-900">{t("aiHelper")}</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Ask questions about coding, career growth, and learning habits.
      </p>

      <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
              <Sparkles className="h-10 w-10 text-[#2563eb]/50" />
              <p className="mt-2 text-sm">Send a message to start the conversation.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 ${
                  m.role === "user"
                    ? "bg-[#2563eb] text-white"
                    : "bg-zinc-100 text-zinc-800"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{m.content || "…"}</p>
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role === "assistant" && (
            <span className="inline-block animate-pulse text-zinc-400">▋</span>
          )}
          <div ref={scrollRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-zinc-200 p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" variant="primary" disabled={loading} className="gap-1">
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
