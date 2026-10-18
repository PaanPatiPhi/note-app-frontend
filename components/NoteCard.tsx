"use client";

import { useEffect, useState } from "react";
import type { Note, NoteKind } from "@/lib/types";
import { useLanguage } from "@/lib/language-context";
import { DropdownButton } from "./ui/dropdownbutton";
import { toggleItem } from "@/lib/api";
import { BellRing, Check, Clock, CheckSquare, FileText, ListTodo } from "lucide-react";

function formatFormattedDate(isoString: string, lang: "th" | "en"): string {
  try {
    const date = new Date(isoString);
    if (lang === "en") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${day} ${month} ${year} • ${hours}:${minutes}`;
    } else {
      const months = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
      ];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = (date.getFullYear() + 543).toString().slice(-2);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${day} ${month} ${year} • ${hours}:${minutes} น.`;
    }
  } catch {
    return "";
  }
}

type NoteCardProps = {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
};

export default function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const { language, t } = useLanguage();
  const [localItems, setLocalItems] = useState(note.items || []);

  useEffect(() => {
    setLocalItems(note.items || []);
  }, [note.items]);

  const handleCheck = async (itemId: string) => {
    const currentItem = localItems.find((item) => item.id === itemId);
    if (!currentItem) return;

    const newStatus = !currentItem.is_done;

    // Optimistic update
    setLocalItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, is_done: newStatus } : item))
    );

    try {
      await toggleItem(note.id, itemId, newStatus);
    } catch (error) {
      // Rollback
      setLocalItems(note.items || []);
      console.error("Failed to toggle item:", error);
    }
  };

  const typeConfig: Record<
    NoteKind,
    { label: string; icon: React.ComponentType<{ className?: string }>; badgeClass: string }
  > = {
    checklist: {
      label: t("notecard_type_checklist"),
      icon: CheckSquare,
      badgeClass: "bg-[#D8B968]/15 text-[#8C6D1F] border-[#D8B968]/40",
    },
    todo: {
      label: t("notecard_type_todo"),
      icon: ListTodo,
      badgeClass: "bg-[#3D5A73]/15 text-[#3D5A73] border-[#3D5A73]/30",
    },
    note: {
      label: t("notecard_type_note"),
      icon: FileText,
      badgeClass: "bg-[#26343F]/10 text-[#26343F] border-[#26343F]/20",
    },
    reminder: {
      label: t("notecard_type_reminder"),
      icon: BellRing,
      badgeClass: "bg-[#A34F45]/10 text-[#A34F45] border-[#A34F45]/30",
    },
  };

  const typeInfo = typeConfig[note.type] || typeConfig.note;
  const TypeIcon = typeInfo.icon;

  // Checklist completion stats
  const totalItems = localItems.length;
  const completedItems = localItems.filter((i) => i.is_done).length;
  const isAllDone = totalItems > 0 && completedItems === totalItems;

  return (
    <article className="group relative rounded-2xl border border-[#D1CEC5] bg-[#FAF9F6] p-4 sm:p-5 shadow-xs hover:border-[#3D5A73]/60 hover:shadow-md transition-all">
      {/* Top Accent Strip */}
      <div className="absolute top-0 left-6 right-6 h-1 bg-[#3D5A73]/20 rounded-b-sm group-hover:bg-[#3D5A73] transition-colors" />

      {/* Header: Note Type Badge, Timestamp & Menu */}
      <div className="flex items-center justify-between gap-2 mb-2.5 pt-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${typeInfo.badgeClass}`}
          >
            <TypeIcon className="h-3 w-3" />
            <span>{typeInfo.label}</span>
          </span>

          <span className="flex items-center gap-1 text-[11px] text-[#66737D]">
            <Clock className="h-3 w-3" />
            <time dateTime={note.created_at}>{formatFormattedDate(note.created_at, language)}</time>
          </span>

          {note.remind_at && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-[#A34F45]">
              <BellRing className="h-3 w-3" />
              {t("notecard_remind_at")}{" "}
              <time dateTime={note.remind_at}>{formatFormattedDate(note.remind_at, language)}</time>
            </span>
          )}
        </div>

        <DropdownButton onEdit={() => onEdit(note)} onDelete={() => onDelete(note.id)} />
      </div>

      {/* Main Content */}
      <div className="text-sm font-medium text-[#26343F] whitespace-pre-wrap break-words leading-relaxed mb-1">
        {note.content}
      </div>

      {/* Checklist Items if present */}
      {totalItems > 0 && (
        <div className="mt-3.5 space-y-2 border-t border-[#D1CEC5]/50 pt-3">
          {/* Progress Bar & Counter */}
          <div className="flex items-center justify-between text-xs text-[#66737D] mb-2">
            <span className="font-medium text-[11px]">
              {isAllDone
                ? (language === "en" ? "Awesome, all done! 🎉" : "เก่งมากทำเสร็จหมดแล้วนะ 🎉")
                : (language === "en" ? `Progress: ${completedItems}/${totalItems} items` : `ความคืบหน้า ${completedItems}/${totalItems} รายการ`)}
            </span>
            <div className="w-20 h-1.5 bg-[#E6E3DC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3D5A73] transition-all duration-300 rounded-full"
                style={{ width: `${(completedItems / totalItems) * 100}%` }}
              />
            </div>
          </div>

          <ul className="space-y-1.5">
            {localItems.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-2.5 text-xs py-0.5 group/item cursor-pointer select-none"
                onClick={() => handleCheck(item.id)}
              >
                <button
                  type="button"
                  aria-checked={item.is_done}
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-all ${
                    item.is_done
                      ? "bg-[#3D5A73] border-[#3D5A73] text-white shadow-2xs"
                      : "border-[#D1CEC5] bg-white group-hover/item:border-[#3D5A73]"
                  }`}
                >
                  {item.is_done && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </button>
                <span
                  className={`flex-1 min-w-0 break-words transition-all ${
                    item.is_done
                      ? "line-through text-[#66737D]/60"
                      : "text-[#26343F]"
                  }`}
                >
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}