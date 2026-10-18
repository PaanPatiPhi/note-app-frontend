"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, MessagesSquare, Send } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useAssistantChat } from "@/lib/use-assistant-chat";
import { ChatExchange } from "@/components/chat/ChatExchange";

type AssistantBoxProps = {
  // เรียกเมื่อ AI สร้าง/แก้/ยกเลิกข้อมูล ให้หน้าโน้ตโหลดรายการใหม่
  onChanged?: () => void | Promise<void>;
};

const MAX_TEXT_LENGTH = 2000;

// กล่อง "บอก JodJod" แบบย่อบนหน้าโน้ต (แสดงแค่ไม่กี่ข้อความล่าสุด; ดูทั้งหมดที่ /chat)
export function AssistantBox({ onChanged }: AssistantBoxProps) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const { messages, sending, send, undo } = useAssistantChat({
    onChanged,
    keep: 5,
    unavailableText: t("assistant_unavailable"),
    undoFailedText: t("assistant_undo_failed"),
  });

  return (
    <section className="mb-6 rounded-2xl border border-[#3D5A73]/30 bg-[#FAF9F6] p-4 sm:p-5 shadow-xs">
      <div className="mb-3 pb-2 border-b border-[#D1CEC5]/50 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-[#3D5A73] flex items-center gap-1.5">
            <Bot className="h-4 w-4" /> {t("assistant_title")}
          </h2>
          <p className="text-[11px] text-[#66737D] mt-0.5">{t("assistant_subtitle")}</p>
        </div>
        <Link
          href="/chat"
          className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-[#D1CEC5] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#3D5A73] hover:bg-[#E6E3DC]/60 transition-colors"
        >
          <MessagesSquare className="h-3 w-3" /> {t("assistant_open_chat")}
        </Link>
      </div>

      {messages.length > 0 && (
        <ol className="mb-3 space-y-2.5" aria-live="polite">
          {messages.map((m) => (
            <ChatExchange key={m.key} message={m} onUndo={undo} />
          ))}
        </ol>
      )}

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
          setText("");
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
