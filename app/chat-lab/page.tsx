"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowUp, LayoutList, MessageCircle, Sparkles, Undo2, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useAssistantChat, type ChatMessage } from "@/lib/use-assistant-chat";
import { getAvatarUrl } from "@/lib/api";
import { LiveCards } from "@/components/chat-lab/LiveCards";
import Loading from "@/components/Loading";

const MAX_TEXT_LENGTH = 2000;

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[#9AA4AA]"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

type Me = { avatarUrl?: string; name?: string };

// รูปโปรไฟล์ของผู้ใช้ (รูปที่ตั้งไว้ → รูปจาก LINE → ตัวอักษรแรกของชื่อ) เหมือนใน Navbar
function UserAvatar({ me }: { me: Me }) {
  if (me.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={getAvatarUrl(me.avatarUrl)}
        alt={me.name || "User"}
        className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-[#D1CEC5]"
      />
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E6E3DC] text-xs font-bold text-[#3D5A73] ring-1 ring-[#D1CEC5]">
      {me.name?.charAt(0).toUpperCase() || "U"}
    </span>
  );
}

function Message({ m, me, onUndo }: { m: ChatMessage; me: Me; onUndo: (m: ChatMessage) => void }) {
  const { t } = useLanguage();
  return (
    <motion.li initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-3">
      <div className="flex items-end justify-end gap-2.5">
        <div className="flex min-w-0 max-w-[80%] flex-col items-end">
          {m.channel === "line" && (
            <span className="mb-1 inline-flex items-center gap-1 text-[10px] font-medium text-[#06A045]">
              <MessageCircle className="h-3 w-3" /> LINE
            </span>
          )}
          {/* bubble ผู้ใช้: มุมล่างขวาแหลมชี้ไปที่รูปโปรไฟล์ */}
          <p className="rounded-3xl rounded-br-md bg-[#E9E6DF] px-4 py-2.5 text-[15px] leading-relaxed text-[#26343F] whitespace-pre-wrap break-words">
            {m.text}
          </p>
        </div>
        <UserAvatar me={me} />
      </div>

      <div className="flex items-start gap-2.5">
        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3D5A73] text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="flex min-w-0 max-w-[80%] flex-col items-start">
          {/* bubble AI: มุมบนซ้ายแหลมชี้ไปที่ avatar */}
          <div
            className={`rounded-3xl rounded-tl-md px-4 py-2.5 shadow-[0_1px_3px_rgba(38,52,63,0.08)] ring-1 ${
              m.failed ? "bg-[#FBF1EF] ring-[#A34F45]/25" : "bg-white ring-[#E6E3DC]"
            }`}
          >
            {m.reply === undefined ? (
              <TypingDots />
            ) : (
              <p
                className={`text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
                  m.failed ? "text-[#A34F45]" : "text-[#26343F]"
                }`}
              >
                {m.reply}
              </p>
            )}
          </div>
          {m.undoable && m.actionId && (
            <button
              type="button"
              onClick={() => onUndo(m)}
              disabled={m.undoing || m.undone}
              className="mt-1 ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-[#66737D] hover:bg-[#E9E6DF] hover:text-[#26343F] disabled:opacity-60 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default transition-colors"
            >
              <Undo2 className="h-3.5 w-3.5" />
              {m.undone ? t("assistant_undone") : t("assistant_undo")}
            </button>
          )}
        </div>
      </div>
    </motion.li>
  );
}

// หน้าทดสอบ UI: แชทแบบ AI assistant (ซ้าย) + การ์ดรายการที่อัปเดตสด (ขวา / แผงเลื่อนในมือถือ)
export default function ChatLabPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthenticated, user, identities } = useAuth();
  const me = {
    avatarUrl: user?.avatar_url || identities.find((i) => i.provider === "line")?.avatar_url,
    name: user?.display_name,
  };
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [version, setVersion] = useState(0);
  const [cardCount, setCardCount] = useState(0);
  const [cardsOpen, setCardsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const { messages, sending, send, undo, loadHistory, loadOlder, hasOlder, loadingHistory } = useAssistantChat({
    onChanged: bump,
    unavailableText: t("assistant_unavailable"),
    undoFailedText: t("assistant_undo_failed"),
  });

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) router.push("/login?redirect=/chat-lab");
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) loadHistory().catch(() => {});
  }, [isAuthenticated, loadHistory]);

  const lastKey = messages[messages.length - 1]?.key;
  const lastReply = messages[messages.length - 1]?.reply;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lastKey, lastReply]);

  // ช่องพิมพ์ขยายตามข้อความ (สูงสุด ~6 บรรทัด)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [text]);

  const submit = (value = text) => {
    if (!value.trim() || sending) return;
    send(value);
    setText("");
    inputRef.current?.focus();
  };

  if (isAuthLoading || !isAuthenticated) {
    return <Loading fullScreen text={t("common_loading")} />;
  }

  const examples = [t("chat_example_1"), t("chat_example_2"), t("chat_example_3"), t("chat_example_4")];
  const name = user?.display_name?.split(" ")[0];

  const cardsHeader = (
    <div className="flex items-center justify-between border-b border-[#E6E3DC] px-5 py-3.5">
      <h2 className="text-sm font-semibold text-[#26343F]">{t("lab_cards_title")}</h2>
      <span className="flex items-center gap-1.5 text-[11px] text-[#66737D]">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2E7D32] opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2E7D32]" />
        </span>
        {t("lab_live")}
      </span>
    </div>
  );

  return (
    // ไม่ใส่พื้นหลังเอง: ใช้ลายสมุดจาก body (globals.css) เหมือนหน้าอื่น
    <div className="flex h-dvh flex-col">
      {/* แถบบนแบบเรียบ */}
      <header className="flex h-14 shrink-0 items-center justify-between px-4 sm:px-6">
        <Link
          href="/notes"
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-[#66737D] hover:bg-[#E9E6DF] hover:text-[#26343F] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> {t("nav_notes")}
        </Link>
        <span className="text-sm font-semibold text-[#3D5A73]">
          JodJod <span className="ml-1 rounded-full bg-[#D8B968]/30 px-1.5 py-0.5 text-[10px] font-bold text-[#8C6D1F]">LAB</span>
        </span>
        <button
          type="button"
          onClick={() => setCardsOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-[#66737D] hover:bg-[#E9E6DF] hover:text-[#26343F] lg:invisible cursor-pointer"
        >
          <LayoutList className="h-4 w-4" /> {t("lab_cards_button")} ({cardCount})
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* แชท */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
              {hasOlder && (
                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={() => loadOlder().catch(() => {})}
                    disabled={loadingHistory}
                    className="rounded-full px-3 py-1 text-xs text-[#66737D] hover:bg-[#E9E6DF] disabled:opacity-50 cursor-pointer"
                  >
                    {t("chat_load_older")}
                  </button>
                </div>
              )}

              {messages.length === 0 && !loadingHistory ? (
                <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#3D5A73] text-white">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <h1 className="text-2xl font-semibold text-[#26343F]">
                    {name ? `${t("lab_greeting_with_name")} ${name}` : t("lab_greeting")}
                  </h1>
                  <p className="mt-2 text-sm text-[#66737D]">{t("lab_greeting_sub")}</p>
                  <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                    {examples.map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => submit(ex)}
                        disabled={sending}
                        className="rounded-2xl bg-white px-4 py-3 text-left text-sm text-[#26343F] shadow-[0_1px_2px_rgba(38,52,63,0.06)] ring-1 ring-[#E6E3DC] hover:ring-[#3D5A73]/40 disabled:opacity-50 cursor-pointer transition-shadow"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <ol className="space-y-8 py-6" aria-live="polite">
                  {messages.map((m) => (
                    <Message key={m.key} m={m} me={me} onUndo={undo} />
                  ))}
                </ol>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* ช่องพิมพ์ */}
          <div className="shrink-0 px-4 pb-4 sm:px-6">
            <form
              className="mx-auto flex w-full max-w-2xl items-end gap-2 rounded-3xl bg-white p-2 pl-4 shadow-[0_2px_12px_rgba(38,52,63,0.08)] ring-1 ring-[#E6E3DC] focus-within:ring-[#3D5A73]/40 transition-shadow"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={1}
                maxLength={MAX_TEXT_LENGTH}
                placeholder={t("lab_placeholder")}
                aria-label={t("chat_title")}
                className="min-h-[40px] flex-1 resize-none bg-transparent py-2 text-[15px] text-[#26343F] placeholder-[#9AA4AA] focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                aria-label={t("assistant_send")}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#26343F] text-white hover:bg-[#3D5A73] disabled:bg-[#D1CEC5] cursor-pointer disabled:cursor-default transition-colors"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </form>
            <p className="mx-auto mt-2 max-w-2xl text-center text-[11px] text-[#9AA4AA]">{t("lab_footer")}</p>
          </div>
        </main>

        {/* การ์ดรายการ (จอใหญ่) */}
        <aside className="hidden w-[380px] shrink-0 flex-col border-l border-[#E6E3DC] bg-[#FAF9F6]/85 backdrop-blur-sm lg:flex">
          {cardsHeader}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <LiveCards version={version} onCount={setCardCount} />
          </div>
        </aside>
      </div>

      {/* การ์ดรายการ (มือถือ: แผงเลื่อนจากขวา) */}
      <AnimatePresence>
        {cardsOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-[#26343F]/30 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCardsOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 right-0 z-50 flex w-[88%] max-w-sm flex-col bg-[#FAF9F6] shadow-xl lg:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">{cardsHeader}</div>
                <button
                  type="button"
                  onClick={() => setCardsOpen(false)}
                  className="mr-3 rounded-full p-1.5 text-[#66737D] hover:bg-[#E9E6DF] cursor-pointer"
                  aria-label={t("common_close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <LiveCards version={version} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
