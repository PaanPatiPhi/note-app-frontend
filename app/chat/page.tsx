"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, ChevronUp, Info, Send, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useAssistantChat } from "@/lib/use-assistant-chat";
import { Navbar } from "@/components/Navbar";
import { ChatExchange } from "@/components/chat/ChatExchange";
import Loading from "@/components/Loading";

const MAX_TEXT_LENGTH = 2000;

export default function ChatPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [historyError, setHistoryError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sending, send, undo, loadHistory, loadOlder, hasOlder, loadingHistory } = useAssistantChat({
    unavailableText: t("assistant_unavailable"),
    undoFailedText: t("assistant_undo_failed"),
  });

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login?redirect=/chat");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadHistory().catch(() => setHistoryError(true));
  }, [isAuthenticated, loadHistory]);

  // เลื่อนลงล่างสุดเมื่อมีข้อความใหม่หรือ AI ตอบ (ไม่เลื่อนตอนโหลดข้อความเก่าด้านบน)
  const lastKey = messages[messages.length - 1]?.key;
  const lastReply = messages[messages.length - 1]?.reply;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lastKey, lastReply]);

  const submit = () => {
    if (!text.trim() || sending) return;
    send(text);
    setText("");
    inputRef.current?.focus();
  };

  if (isAuthLoading || !isAuthenticated) {
    return <Loading fullScreen text={t("common_loading")} />;
  }

  const examples = [t("chat_example_1"), t("chat_example_2"), t("chat_example_3"), t("chat_example_4")];

  return (
    <div className="flex h-dvh flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col px-4 sm:px-6">
        <header className="py-4 border-b border-[#D1CEC5]/60">
          <h1 className="flex items-center gap-2 text-base sm:text-lg font-bold text-[#3D5A73]">
            <Bot className="h-5 w-5" /> {t("chat_title")}
          </h1>
          <p className="mt-1 flex items-start gap-1 text-[11px] sm:text-xs text-[#66737D]">
            <Info className="h-3.5 w-3.5 shrink-0 mt-px" /> {t("chat_subtitle")}
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto py-4" aria-live="polite">
          {hasOlder && (
            <div className="mb-4 flex justify-center">
              <button
                type="button"
                onClick={() => loadOlder().catch(() => setHistoryError(true))}
                disabled={loadingHistory}
                className="inline-flex items-center gap-1 rounded-lg border border-[#D1CEC5] bg-white px-3 py-1 text-[11px] font-semibold text-[#3D5A73] hover:bg-[#E6E3DC]/60 disabled:opacity-50 cursor-pointer"
              >
                <ChevronUp className="h-3 w-3" /> {t("chat_load_older")}
              </button>
            </div>
          )}

          {loadingHistory && messages.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loading size="sm" text={t("chat_loading_history")} />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3D5A73]/10 text-[#3D5A73] mb-3">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-[#26343F]">{t("chat_empty_title")}</p>
              <p className="mt-1 max-w-xs text-xs text-[#66737D]">{t("chat_empty_desc")}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {examples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => send(ex)}
                    disabled={sending}
                    className="rounded-full border border-[#D1CEC5] bg-white px-3 py-1.5 text-xs text-[#26343F] hover:border-[#3D5A73]/50 hover:bg-[#E6E3DC]/40 disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ol className="space-y-3">
              {messages.map((m) => (
                <ChatExchange key={m.key} message={m} onUndo={undo} showMeta />
              ))}
            </ol>
          )}

          {historyError && (
            <p className="mt-3 text-center text-[11px] text-[#A34F45]">{t("chat_history_error")}</p>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          className="border-t border-[#D1CEC5]/60 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                // Enter = ส่ง, Shift+Enter = ขึ้นบรรทัดใหม่ (ไม่ส่งระหว่างพิมพ์ภาษาไทยด้วย IME)
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              maxLength={MAX_TEXT_LENGTH}
              placeholder={t("assistant_placeholder")}
              aria-label={t("chat_title")}
              className="max-h-32 min-h-[42px] min-w-0 flex-1 resize-none rounded-xl border border-[#D1CEC5] bg-white px-3.5 py-2.5 text-sm text-[#26343F] placeholder-[#9AA4AA] shadow-2xs focus:border-[#3D5A73] focus:outline-hidden focus:ring-2 focus:ring-[#3D5A73]/20 transition-all"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              aria-label={t("assistant_send")}
              className="inline-flex h-[42px] shrink-0 items-center gap-1.5 rounded-xl bg-[#3D5A73] px-4 text-sm font-semibold text-[#FAF9F6] shadow-md hover:bg-[#30475C] disabled:opacity-50 disabled:cursor-default cursor-pointer transition-all"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">{t("assistant_send")}</span>
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-[#9AA4AA]">{t("chat_input_hint")}</p>
        </form>
      </main>
    </div>
  );
}
