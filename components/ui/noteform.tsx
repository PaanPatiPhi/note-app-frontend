"use client";

import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { useLanguage } from "@/lib/language-context";
import { createNote } from "@/lib/api";
import Loading from "@/components/Loading";
import { Send, CheckSquare, FileText, Info, Sparkles } from "lucide-react";

type NoteFormProps = {
  onSubmit?: (content: string, items?: string[]) => Promise<void> | void;
};

/**
 * แยกข้อความ checklist ให้เป็น title และ items ได้อย่างถูกต้อง:
 * - "ซื้อของ 1, 2, 3" -> title: "ซื้อของ", items: ["1", "2", "3"]
 * - "ซื้อของ: 1, 2, 3" -> title: "ซื้อของ", items: ["1", "2", "3"]
 * - "ซื้อของ\n1\n2\n3" -> title: "ซื้อของ", items: ["1", "2", "3"]
 * - "ซื้อของ, 1, 2, 3" -> title: "ซื้อของ", items: ["1", "2", "3"]
 */
export function parseChecklistInput(raw: string): { title: string; items: string[] } {
  const trimmed = raw.trim();
  if (!trimmed) return { title: "", items: [] };

  // 1. หลายบรรทัด: บรรทัดแรกเป็นชื่อ บรรทัดต่อๆ มาเป็นรายการ
  if (trimmed.includes("\n")) {
    const lines = trimmed
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length > 1) {
      const title = lines[0].replace(/[:：]$/, "").trim();
      const items = lines
        .slice(1)
        .flatMap((line) =>
          line
            .split(/[,，]/)
            .map((item) => item.replace(/^(\d+[.)]\s+|[-*•]\s*)/, "").trim())
            .filter(Boolean)
        );
      return { title, items };
    }
  }

  // 2. คั่นด้วย Colon เช่น "ซื้อของ: 1, 2, 3"
  if (trimmed.includes(":") || trimmed.includes("：")) {
    const colonIdx = trimmed.search(/[:：]/);
    const title = trimmed.slice(0, colonIdx).trim();
    const rest = trimmed.slice(colonIdx + 1).trim();
    const items = rest
      .split(/[,，]/)
      .map((i) => i.trim())
      .filter(Boolean);
    if (title && items.length > 0) {
      return { title, items };
    }
  }

  // 3. คั่นด้วยจุลภาค เช่น "ซื้อของ 1, 2, 3" หรือ "ซื้อของ, 1, 2, 3"
  if (trimmed.includes(",") || trimmed.includes("，")) {
    const commaParts = trimmed.split(/[,，]/).map((p) => p.trim()).filter(Boolean);
    if (commaParts.length > 0) {
      const firstPart = commaParts[0];
      // ตรวจสอบว่าในชิ้นแรกมีเว้นวรรคคั่นระหว่างชื่อกับไอเทมแรกหรือไม่
      // เช่น "ซื้อของ 1" -> title = "ซื้อของ", firstItem = "1"
      const lastSpaceIdx = firstPart.lastIndexOf(" ");
      if (lastSpaceIdx > 0) {
        const title = firstPart.slice(0, lastSpaceIdx).trim();
        const firstItem = firstPart.slice(lastSpaceIdx + 1).trim();
        const restItems = commaParts.slice(1);
        return {
          title,
          items: [firstItem, ...restItems].filter(Boolean),
        };
      } else {
        // เช่น "ซื้อของ, 1, 2, 3"
        if (commaParts.length > 1) {
          return {
            title: commaParts[0],
            items: commaParts.slice(1),
          };
        }
      }
    }
  }

  // 4. ไม่มีจุลภาค แต่มีเว้นวรรคในโหมดเช็คลิสต์ เช่น "ซื้อของ 1"
  const lastSpaceIdx = trimmed.lastIndexOf(" ");
  if (lastSpaceIdx > 0) {
    const title = trimmed.slice(0, lastSpaceIdx).trim();
    const firstItem = trimmed.slice(lastSpaceIdx + 1).trim();
    return {
      title,
      items: [firstItem],
    };
  }

  return { title: trimmed, items: [] };
}

export function NoteForm({ onSubmit }: NoteFormProps) {
  const { t } = useLanguage();
  const [content, setContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"note" | "checklist">("note");

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      toast.add({ type: "error", description: t("noteform_empty_error") });
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "checklist") {
        const { title, items } = parseChecklistInput(trimmed);
        if (onSubmit) {
          if (items.length > 0) {
            await onSubmit(title, items);
          } else {
            await onSubmit(trimmed);
          }
        } else {
          if (items.length > 0) {
            await createNote(title, items);
          } else {
            await createNote(trimmed);
          }
          toast.add({
            type: "success",
            title: t("noteform_success_title"),
            description: items.length > 0 ? t("noteform_success_checklist") : t("noteform_success_note"),
          });
        }
      } else {
        if (onSubmit) {
          await onSubmit(trimmed);
        } else {
          await createNote(trimmed);
          toast.add({
            type: "success",
            title: t("noteform_success_title"),
            description: t("noteform_success_note"),
          });
        }
      }
      setContent("");
    } catch (error: any) {
      console.error("Failed to add note:", error);
      toast.add({
        type: "error",
        title: t("noteform_failed_title"),
        description: error.message || t("noteform_failed_title"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Mode Switcher */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#E6E3DC]/60 border border-[#D1CEC5] w-fit">
        <button
          type="button"
          onClick={() => setMode("note")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mode === "note"
              ? "bg-white text-[#3D5A73] shadow-xs"
              : "text-[#66737D] hover:text-[#26343F]"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>{t("noteform_mode_note")}</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("checklist")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mode === "checklist"
              ? "bg-white text-[#3D5A73] shadow-xs"
              : "text-[#66737D] hover:text-[#26343F]"
          }`}
        >
          <CheckSquare className="h-3.5 w-3.5" />
          <span>{t("noteform_mode_checklist")}</span>
        </button>
      </div>

      {/* Writing Area */}
      <div className="relative rounded-xl border border-[#D1CEC5] bg-white p-3 shadow-2xs focus-within:border-[#3D5A73] focus-within:ring-2 focus-within:ring-[#3D5A73]/20 transition-all">
        <textarea
          rows={mode === "checklist" ? 2 : 3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === "checklist"
              ? t("noteform_placeholder_checklist")
              : t("noteform_placeholder_note")
          }
          className="w-full resize-none border-none bg-transparent text-sm text-[#26343F] placeholder-[#9AA4AA] focus:outline-hidden leading-relaxed"
          disabled={isSubmitting}
        />

        <div className="flex items-center justify-between pt-2 border-t border-[#D1CEC5]/40 mt-1">
          <div className="flex items-center gap-1 text-[11px] text-[#66737D]">
            {mode === "checklist" ? (
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-[#D8B968]" /> {t("noteform_hint_checklist")}
              </span>
            ) : (
              <span className="hidden sm:inline-block">
                {t("noteform_hint_shortcut_pre")} <kbd className="px-1 py-0.5 rounded bg-[#FAF9F6] border border-[#D1CEC5] text-[10px] font-mono">Ctrl</kbd> + <kbd className="px-1 py-0.5 rounded bg-[#FAF9F6] border border-[#D1CEC5] text-[10px] font-mono">Enter</kbd> {t("noteform_hint_shortcut_post")}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-[#3D5A73] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#30475C] active:scale-98 disabled:opacity-40 transition-all cursor-pointer"
          >
            {isSubmitting ? <Loading size="xs" /> : <Send className="h-3.5 w-3.5" />}
            <span>{isSubmitting ? t("noteform_btn_submitting") : t("noteform_btn_submit")}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
