"use client";

import { useRef, useState } from "react";
import { Bot, Send, Undo2, User } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { ApiError, sendAssistantMessage, undoAssistantAction } from "@/lib/api";
import Loading from "@/components/Loading";

type Exchange = {
  id: number;
  text: string;
  reply?: string;
  actionId?: string;
  undoable?: boolean;
  undone?: boolean;
  undoing?: boolean;
  failed?: boolean;
};

type AssistantBoxProps = {
  // เรียกเมื่อ AI สร้าง/แก้/ยกเลิกข้อมูล ให้หน้าโน้ตโหลดรายการใหม่
  onChanged?: () => void | Promise<void>;
};

// เก็บแค่ไม่กี่ข้อความล่าสุด (บทสนทนาไม่ได้ส่งกลับไปให้ AI: แต่ละข้อความทำงานแยกกันเหมือนใน LINE)
const MAX_EXCHANGES = 5;
const MAX_TEXT_LENGTH = 2000;

function errorReply(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.data?.reply || err.data?.message || fallback;
  }
  return fallback;
}

export function AssistantBox({ onChanged }: AssistantBoxProps) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const nextId = useRef(1);

  const update = (id: number, patch: Partial<Exchange>) =>
    setExchanges((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const send = async () => {
    const message = text.trim();
    if (!message || sending) return;

    const id = nextId.current++;
    setExchanges((prev) => [...prev, { id, text: message }].slice(-MAX_EXCHANGES));
    setText("");
    setSending(true);
    try {
      const res = await sendAssistantMessage(message);
      update(id, { reply: res.reply, actionId: res.action_id, undoable: res.undoable });
      if (res.wrote) await onChanged?.();
    } catch (err) {
      update(id, { reply: errorReply(err, t("assistant_unavailable")), failed: true });
    } finally {
      setSending(false);
    }
  };

  const undo = async (ex: Exchange) => {
    if (!ex.actionId || ex.undoing || ex.undone) return;
    update(ex.id, { undoing: true });
    try {
      const res = await undoAssistantAction(ex.actionId);
      update(ex.id, { undoing: false, undone: true, reply: `${ex.reply}\n${res.message}` });
      await onChanged?.();
    } catch (err) {
      // 409 = ยกเลิกไปแล้ว/เก่าเกิน: ไม่ต้องให้กดซ้ำอีก
      const finished = err instanceof ApiError && (err.status === 404 || err.status === 409);
      update(ex.id, {
        undoing: false,
        undone: finished,
        reply: `${ex.reply}\n${errorReply(err, t("assistant_undo_failed"))}`,
      });
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-[#3D5A73]/30 bg-[#FAF9F6] p-4 sm:p-5 shadow-xs">
      <div className="mb-3 pb-2 border-b border-[#D1CEC5]/50">
        <h2 className="text-sm font-bold text-[#3D5A73] flex items-center gap-1.5">
          <Bot className="h-4 w-4" /> {t("assistant_title")}
        </h2>
        <p className="text-[11px] text-[#66737D] mt-0.5">{t("assistant_subtitle")}</p>
      </div>

      {exchanges.length > 0 && (
        <ol className="mb-3 space-y-2.5" aria-live="polite">
          {exchanges.map((ex) => (
            <li key={ex.id} className="space-y-1.5">
              <div className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#3D5A73] px-3 py-2 text-xs sm:text-sm text-white whitespace-pre-wrap break-words">
                  <User className="inline h-3 w-3 mr-1 opacity-70" aria-hidden />
                  {ex.text}
                </p>
              </div>
              <div className="flex justify-start">
                {ex.reply === undefined ? (
                  <div className="rounded-2xl rounded-bl-sm border border-[#D1CEC5] bg-white px-3 py-2">
                    <Loading size="sm" text={t("assistant_thinking")} />
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] rounded-2xl rounded-bl-sm border px-3 py-2 text-xs sm:text-sm whitespace-pre-wrap break-words ${
                      ex.failed ? "border-[#A34F45]/40 bg-[#A34F45]/5 text-[#A34F45]" : "border-[#D1CEC5] bg-white text-[#26343F]"
                    }`}
                  >
                    {ex.reply}
                    {ex.undoable && ex.actionId && (
                      <div className="mt-1.5">
                        <button
                          type="button"
                          onClick={() => undo(ex)}
                          disabled={ex.undoing || ex.undone}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#D1CEC5] bg-[#FAF9F6] px-2.5 py-1 text-[11px] font-semibold text-[#3D5A73] hover:bg-[#E6E3DC]/60 disabled:opacity-50 disabled:cursor-default cursor-pointer transition-colors"
                        >
                          <Undo2 className="h-3 w-3" />
                          {ex.undone ? t("assistant_undone") : t("assistant_undo")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_TEXT_LENGTH}
          placeholder={t("assistant_placeholder")}
          aria-label={t("assistant_title")}
          disabled={sending}
          className="min-w-0 flex-1 rounded-xl border border-[#D1CEC5] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#26343F] placeholder-[#9AA4AA] shadow-2xs focus:border-[#3D5A73] focus:outline-hidden focus:ring-2 focus:ring-[#3D5A73]/20 disabled:opacity-60 transition-all"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#3D5A73] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#FAF9F6] shadow-md hover:bg-[#30475C] disabled:opacity-50 disabled:cursor-default cursor-pointer transition-all"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">{t("assistant_send")}</span>
        </button>
      </form>
    </section>
  );
}
