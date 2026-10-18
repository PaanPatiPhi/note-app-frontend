"use client";

import { MessageCircle, Undo2 } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import type { ChatMessage } from "@/lib/use-assistant-chat";
import Loading from "@/components/Loading";

type ChatExchangeProps = {
  message: ChatMessage;
  onUndo: (message: ChatMessage) => void;
  // แสดงเวลาและช่องทาง (LINE/เว็บ) ใต้ข้อความผู้ใช้ — ใช้ในหน้าแชทเต็ม
  showMeta?: boolean;
};

function formatTime(iso: string, lang: "th" | "en"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(lang === "th" ? "th-TH" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// หนึ่งรอบของแชท: ข้อความผู้ใช้ (ขวา) + คำตอบ AI (ซ้าย) + ปุ่มยกเลิก
export function ChatExchange({ message: m, onUndo, showMeta }: ChatExchangeProps) {
  const { t, language } = useLanguage();

  return (
    <li className="space-y-1.5">
      <div className="flex flex-col items-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#3D5A73] px-3 py-2 text-xs sm:text-sm text-white whitespace-pre-wrap break-words">
          {m.text}
        </p>
        {showMeta && m.createdAt && (
          <span className="mt-0.5 flex items-center gap-1 text-[10px] text-[#9AA4AA]">
            {m.channel === "line" && (
              <span className="inline-flex items-center gap-0.5 rounded-sm bg-[#06C755]/15 px-1 font-semibold text-[#06A045]">
                <MessageCircle className="h-2.5 w-2.5" /> LINE
              </span>
            )}
            {formatTime(m.createdAt, language)}
          </span>
        )}
      </div>

      <div className="flex justify-start">
        {m.reply === undefined ? (
          <div className="rounded-2xl rounded-bl-sm border border-[#D1CEC5] bg-white px-3 py-2">
            <Loading size="sm" text={t("assistant_thinking")} />
          </div>
        ) : (
          <div
            className={`max-w-[85%] rounded-2xl rounded-bl-sm border px-3 py-2 text-xs sm:text-sm whitespace-pre-wrap break-words ${
              m.failed ? "border-[#A34F45]/40 bg-[#A34F45]/5 text-[#A34F45]" : "border-[#D1CEC5] bg-white text-[#26343F]"
            }`}
          >
            {m.reply}
            {m.undoable && m.actionId && (
              <div className="mt-1.5">
                <button
                  type="button"
                  onClick={() => onUndo(m)}
                  disabled={m.undoing || m.undone}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#D1CEC5] bg-[#FAF9F6] px-2.5 py-1 text-[11px] font-semibold text-[#3D5A73] hover:bg-[#E6E3DC]/60 disabled:opacity-50 disabled:cursor-default cursor-pointer transition-colors"
                >
                  <Undo2 className="h-3 w-3" />
                  {m.undone ? t("assistant_undone") : t("assistant_undo")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
