"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Sparkles, Lock } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const OPEN_CHAT_EVENT = "pathfinders:openChat";

export function ChatWidget() {
  const t = useTranslations("app");
  const tOffer = useTranslations("offer");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, handler);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handler);
  }, []);
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

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-lg transition-transform hover:scale-105 hover:shadow-xl"
        aria-label={t("aiHelper")}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Popup chatbox */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative flex h-[min(32rem,85vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#2563eb]" />
                <span className="font-semibold text-zinc-900">{t("aiHelper")}</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {premiumBlocked ? (
                <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                  <Lock className="h-12 w-12 text-amber-600" />
                  <p className="mt-3 font-medium text-amber-900">{t("premiumRequired")}</p>
                  <p className="mt-1 text-sm text-amber-800">{t("unlockPremium")}</p>
                  <Link href="/offer" className="mt-4">
                    <Button variant="primary" size="lg" className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      {tOffer("cta")}
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
                        <p className="text-sm">Send a message to start.</p>
                      </div>
                    )}
                    {messages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                            m.role === "user"
                              ? "bg-[#2563eb] text-white"
                              : "bg-zinc-100 text-zinc-800"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.content || "…"}</p>
                        </div>
                      </div>
                    ))}
                    {loading && messages[messages.length - 1]?.role === "assistant" && (
                      <span className="inline-block animate-pulse text-zinc-400">▋</span>
                    )}
                    <div ref={scrollRef} />
                  </div>

                  <form onSubmit={handleSubmit} className="border-t border-zinc-200 p-3">
                    <div className="flex gap-2">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        className="flex-1"
                        disabled={loading}
                      />
                      <Button type="submit" variant="primary" disabled={loading} size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
