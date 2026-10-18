"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BellRing, Check, ListChecks, StickyNote } from "lucide-react";
import { getFeed, toggleItem } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import type { Note } from "@/lib/types";

type Mark = "new" | "updated";

type LiveCardsProps = {
  // เพิ่มค่าทุกครั้งที่ AI เขียน/ยกเลิกข้อมูล → โหลดรายการใหม่ทันที
  version: number;
  // แจ้งจำนวนรายการ (ใช้แสดงบนปุ่มเปิดแผงในมือถือ)
  onCount?: (n: number) => void;
};

const POLL_MS = 10_000;
const MARK_MS = 6_000;

// ลายเซ็นของโน้ต ใช้เทียบว่ามีอะไรเปลี่ยนตั้งแต่โหลดครั้งก่อน
function signature(n: Note): string {
  return JSON.stringify([n.content, n.remind_at, n.is_done, n.items?.map((i) => [i.text, i.is_done])]);
}

function formatWhen(iso: string, lang: "th" | "en"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(d) - startOf(now)) / 86_400_000);
  const time = d.toLocaleTimeString(lang === "th" ? "th-TH" : "en-GB", { hour: "2-digit", minute: "2-digit" });
  const th = { 0: "วันนี้", 1: "พรุ่งนี้", 2: "มะรืน" } as Record<number, string>;
  const en = { 0: "Today", 1: "Tomorrow" } as Record<number, string>;
  const label = (lang === "th" ? th : en)[days];
  if (label) return `${label} ${time}`;
  return d.toLocaleString(lang === "th" ? "th-TH" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// แผงการ์ดรายการแบบสด: โหลดใหม่เมื่อ AI เขียนข้อมูล และทุก 10 วินาที (ข้อมูลจาก LINE จะขึ้นตามด้วย)
export function LiveCards({ version, onCount }: LiveCardsProps) {
  const { t, language } = useLanguage();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const prevSigs = useRef<Map<string, string> | null>(null);

  // รับผลจาก server แล้วเทียบกับรอบก่อน เพื่อติดป้าย "ใหม่"/"อัปเดต"
  const applyFeed = useCallback(
    (feed: { notes: Note[] }) => {
      const next = new Map(feed.notes.map((n) => [n.id, signature(n)]));
      const prev = prevSigs.current;
      if (prev) {
        const changed: Record<string, Mark> = {};
        for (const [id, sig] of next) {
          if (!prev.has(id)) changed[id] = "new";
          else if (prev.get(id) !== sig) changed[id] = "updated";
        }
        if (Object.keys(changed).length > 0) {
          setMarks((m) => ({ ...m, ...changed }));
          setTimeout(() => {
            setMarks((m) => {
              const rest = { ...m };
              for (const id of Object.keys(changed)) delete rest[id];
              return rest;
            });
          }, MARK_MS);
        }
      }
      prevSigs.current = next;
      setNotes(feed.notes);
      onCount?.(feed.notes.length);
    },
    [onCount]
  );

  // state ถูกตั้งใน .then หลังโหลดเสร็จเท่านั้น (ไม่ setState ตรงๆ ใน effect)
  const refresh = useCallback(
    () =>
      getFeed({ limit: 50 })
        .then(applyFeed)
        .catch((err) => console.error("Live cards refresh error:", err)),
    [applyFeed]
  );

  useEffect(() => {
    refresh();
  }, [version, refresh]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const onToggle = async (note: Note, itemId: string, done: boolean) => {
    // อัปเดตบนจอทันที แล้วค่อยส่งไป server (ถ้าล้มเหลวจะถูกแก้กลับตอนโหลดรอบถัดไป)
    setNotes((list) =>
      list?.map((n) =>
        n.id === note.id ? { ...n, items: n.items?.map((i) => (i.id === itemId ? { ...i, is_done: done } : i)) } : n
      ) ?? null
    );
    try {
      await toggleItem(note.id, itemId, done);
    } catch (err) {
      console.error("Toggle item error:", err);
    }
    refresh();
  };

  if (notes === null) {
    return <div className="p-6 text-xs text-[#9AA4AA]">{t("common_loading")}</div>;
  }

  const reminders = notes
    .filter((n) => n.type === "reminder")
    .sort((a, b) => (a.remind_at ?? "").localeCompare(b.remind_at ?? ""));
  const lists = notes.filter((n) => n.type === "checklist");
  const plain = notes.filter((n) => n.type === "note" || n.type === "todo");

  const sections: { key: string; title: string; icon: React.ReactNode; items: Note[] }[] = [
    { key: "reminder", title: t("lab_section_reminders"), icon: <BellRing className="h-3.5 w-3.5" />, items: reminders },
    { key: "list", title: t("lab_section_lists"), icon: <ListChecks className="h-3.5 w-3.5" />, items: lists },
    { key: "note", title: t("lab_section_notes"), icon: <StickyNote className="h-3.5 w-3.5" />, items: plain },
  ];

  if (notes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="text-sm font-semibold text-[#26343F]">{t("lab_cards_empty_title")}</p>
        <p className="mt-1 text-xs text-[#66737D]">{t("lab_cards_empty_desc")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-5">
      {sections
        .filter((s) => s.items.length > 0)
        .map((s) => (
          <section key={s.key}>
            <h3 className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-[#66737D]">
              {s.icon} {s.title}
              <span className="text-[#9AA4AA]">· {s.items.length}</span>
            </h3>
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {s.items.map((n) => (
                  <motion.li
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25 }}
                    className={`relative rounded-2xl bg-white p-3.5 shadow-[0_1px_3px_rgba(38,52,63,0.08)] ring-1 transition-[box-shadow,ring-color] duration-700 ${
                      marks[n.id] ? "ring-2 ring-[#D8B968]" : "ring-[#E6E3DC]"
                    }`}
                  >
                    {marks[n.id] && (
                      <span className="absolute -top-2 right-3 rounded-full bg-[#D8B968] px-2 py-0.5 text-[10px] font-bold text-[#26343F] shadow-xs">
                        {marks[n.id] === "new" ? t("lab_badge_new") : t("lab_badge_updated")}
                      </span>
                    )}

                    {n.type === "reminder" && n.remind_at && (
                      <p className="mb-1 text-[11px] font-semibold text-[#A34F45]">{formatWhen(n.remind_at, language)}</p>
                    )}

                    {n.type === "checklist" ? (
                      <>
                        <div className="mb-2 flex items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold text-[#26343F]">{n.content}</p>
                          <span className="shrink-0 text-[11px] text-[#9AA4AA]">
                            {n.items?.filter((i) => i.is_done).length ?? 0}/{n.items?.length ?? 0}
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {n.items?.map((it) => (
                            <li key={it.id}>
                              <button
                                type="button"
                                onClick={() => onToggle(n, it.id, !it.is_done)}
                                className="flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-left text-sm hover:bg-[#F0EFEB] cursor-pointer"
                                aria-pressed={it.is_done}
                              >
                                <span
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                    it.is_done ? "border-[#3D5A73] bg-[#3D5A73] text-white" : "border-[#C9C5BB] bg-white"
                                  }`}
                                >
                                  {it.is_done && <Check className="h-3 w-3" />}
                                </span>
                                <span className={it.is_done ? "text-[#9AA4AA] line-through" : "text-[#26343F]"}>{it.text}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm text-[#26343F]">{n.content}</p>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </section>
        ))}
    </div>
  );
}
