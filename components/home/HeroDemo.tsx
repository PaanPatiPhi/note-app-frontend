"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  BellRing,
  CalendarDays,
  CalendarX,
  ListChecks,
  MousePointerClick,
  RotateCcw,
  Send,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import type { Language } from "@/lib/translations";

// เดโมใน hero เป็นสคริปต์ล้วน ไม่เรียก AI (ไม่เสียเงิน ไม่ช้า ไม่เปิดช่องให้ยิงข้อความใส่ AI)
// ตอนแรกเล่นเองวนไป พอผู้ใช้กดปุ่มคำสั่ง จะเปลี่ยนเป็นโหมดลองเอง: ปุ่มที่กดแล้วหายไป กดครบแล้วชวนสมัคร
type Card = { id: string; icon: LucideIcon; kind: string; title: string; meta: string; tone: string; badge?: string; faded?: boolean };
type Scene = { user: string; reply: string; apply: (cards: Card[]) => Card[] };

// เพิ่มการ์ดใหม่ไว้บนสุด หรือแก้การ์ดเดิมในที่เดิม
const put = (card: Card) => (cards: Card[]) =>
  cards.some((c) => c.id === card.id) ? cards.map((c) => (c.id === card.id ? card : c)) : [card, ...cards];
const edit = (id: string, change: Partial<Card>) => (cards: Card[]) => cards.map((c) => (c.id === id ? { ...c, ...change } : c));

type DemoCopy = {
  name: string;
  status: string;
  placeholderAuto: string;
  placeholderPlay: string;
  tryLabel: string;
  board: string;
  finished: string;
  signup: string;
  replay: string;
  greeting: string;
  autoScenes: Scene[];
  startBoard: Card[];
  playScenes: Scene[];
};

function buildCopy(lang: Language): DemoCopy {
  const th = lang === "th";
  const k = th
    ? { event: "นัด", list: "ลิสต์", reminder: "เตือน", note: "โน้ต", isNew: "ใหม่", moved: "เลื่อนแล้ว", done: "ติ๊กแล้ว", cancelled: "ยกเลิกแล้ว" }
    : { event: "Event", list: "List", reminder: "Reminder", note: "Note", isNew: "New", moved: "Moved", done: "Checked", cancelled: "Cancelled" };
  const meeting: Card = { id: "meeting", icon: CalendarDays, kind: k.event, title: th ? "ประชุมทีม" : "Team meeting", meta: th ? "พรุ่งนี้ 14:00–15:00" : "Tomorrow 2:00–3:00 PM", tone: "#3D5A73" };
  const shopping: Card = { id: "shopping", icon: ListChecks, kind: k.list, title: th ? "ซื้อของ" : "Groceries", meta: th ? "นม · ไข่" : "Milk · Eggs", tone: "#8C6D1F" };
  const dentist: Card = { id: "dentist", icon: CalendarDays, kind: k.event, title: th ? "หมอฟัน" : "Dentist", meta: th ? "พฤหัสนี้ 10:00–11:00" : "Thu 10:00–11:00 AM", tone: "#3D5A73" };
  const bill: Card = { id: "bill", icon: BellRing, kind: k.reminder, title: th ? "จ่ายค่าเน็ต" : "Pay internet bill", meta: th ? "วันที่ 25 · 20:00" : "The 25th · 8:00 PM", tone: "#A34F45" };

  return {
    name: th ? "พี่จ๊อด" : "Jod",
    status: th ? "พร้อมช่วย" : "Ready to help",
    placeholderAuto: th ? "บอกพี่จ๊อดได้เลย..." : "Tell Jod anything...",
    placeholderPlay: th ? "เลือกคำสั่งด้านล่าง..." : "Pick a command below...",
    tryLabel: th ? "ลองกดสั่งพี่จ๊อด" : "Try giving Jod a command",
    board: th ? "ตารางของคุณ" : "Your schedule",
    finished: th ? "ครบแล้วครับ อยากให้พี่จ๊อดช่วยจริงไหมครับ" : "That's all! Want Jod to help you for real?",
    signup: th ? "สมัครฟรี" : "Sign up free",
    replay: th ? "เล่นใหม่" : "Play again",
    greeting: th
      ? "เลือกคำสั่งด้านล่างได้เลยครับ ในตารางมีนัดกับลิสต์ตัวอย่างไว้ให้ลองเลื่อน ติ๊ก หรือยกเลิกครับ"
      : "Pick a command below. Your schedule has a sample meeting and list you can move, check off or cancel.",
    autoScenes: [
      {
        user: th ? "พรุ่งนี้บ่ายสองประชุมทีม" : "Team meeting tomorrow at 2pm",
        reply: th ? "เรียบร้อยครับ ลงนัด “ประชุมทีม” พรุ่งนี้ 14:00 ใน Google Calendar ให้แล้วครับ" : "Done. I added “Team meeting” tomorrow at 2:00 PM to your Google Calendar.",
        apply: put(meeting),
      },
      {
        user: th ? "ซื้อนม ไข่ ขนมปัง" : "Buy milk, eggs, bread",
        reply: th ? "จดลงลิสต์ “ซื้อของ” ให้แล้วครับ 3 รายการ" : "Added 3 items to your “Groceries” list.",
        apply: put({ ...shopping, meta: th ? "นม · ไข่ · ขนมปัง" : "Milk · Eggs · Bread" }),
      },
      {
        user: th ? "เตือนจ่ายค่าเน็ตวันที่ 25 สองทุ่ม" : "Remind me to pay the internet bill on the 25th at 8pm",
        reply: th ? "ได้ครับ จะเตือนวันที่ 25 เวลา 20:00 ครับ" : "Sure. I'll remind you on the 25th at 8:00 PM.",
        apply: put(bill),
      },
      {
        user: th ? "เลื่อนประชุมเป็นบ่ายสาม" : "Move the meeting to 3pm",
        reply: th ? "เลื่อน “ประชุมทีม” เป็น 15:00 ให้แล้วครับ" : "Moved “Team meeting” to 3:00 PM.",
        apply: edit("meeting", { meta: th ? "พรุ่งนี้ 15:00–16:00" : "Tomorrow 3:00–4:00 PM", badge: k.moved }),
      },
    ],
    startBoard: [meeting, shopping, dentist],
    playScenes: [
      {
        user: th ? "ศุกร์นี้ 10 โมงนัดลูกค้า" : "Client meeting this Friday at 10am",
        reply: th ? "เรียบร้อยครับ ลงนัด “นัดลูกค้า” ศุกร์นี้ 10:00 ใน Google Calendar ให้แล้วครับ" : "Done. “Client meeting” is in your Google Calendar for Friday at 10:00 AM.",
        apply: put({ id: "client", icon: CalendarDays, kind: k.event, title: th ? "นัดลูกค้า" : "Client meeting", meta: th ? "ศุกร์นี้ 10:00–11:00" : "Fri 10:00–11:00 AM", tone: "#3D5A73", badge: k.isNew }),
      },
      {
        user: th ? "เลื่อนประชุมทีมเป็นบ่ายสาม" : "Move the team meeting to 3pm",
        reply: th ? "เลื่อน “ประชุมทีม” จาก 14:00 เป็น 15:00 ให้แล้วครับ นัดเดิมนะครับ ไม่ได้สร้างใหม่" : "Moved “Team meeting” from 2:00 to 3:00 PM. Same event, no duplicate.",
        apply: edit("meeting", { meta: th ? "พรุ่งนี้ 15:00–16:00" : "Tomorrow 3:00–4:00 PM", badge: k.moved }),
      },
      {
        user: th ? "ซื้อนมแล้ว" : "Bought the milk",
        reply: th ? "ติ๊ก “นม” ในลิสต์ซื้อของให้แล้วครับ เหลือไข่อีกอย่างครับ" : "Checked off “Milk”. Only eggs left.",
        apply: edit("shopping", { meta: th ? "นม ✓ · ไข่" : "Milk ✓ · Eggs", badge: k.done }),
      },
      {
        user: th ? "เตือนจ่ายค่าเน็ตวันที่ 25 สองทุ่ม" : "Remind me to pay the internet bill on the 25th at 8pm",
        reply: th ? "ได้ครับ จะเตือนวันที่ 25 เวลา 20:00 และใส่ไว้ใน Google Calendar ให้ด้วยครับ" : "Sure. I'll remind you on the 25th at 8:00 PM and put it in your Google Calendar too.",
        apply: put({ ...bill, badge: k.isNew }),
      },
      {
        user: th ? "ยกเลิกนัดหมอฟัน" : "Cancel the dentist",
        reply: th ? "ยกเลิกนัด “หมอฟัน” พฤหัสนี้ 10:00 ให้แล้วครับ ถ้าเปลี่ยนใจกดยกเลิกได้ภายใน 24 ชั่วโมงครับ" : "Cancelled “Dentist” on Thursday. Changed your mind? Undo works for 24 hours.",
        apply: edit("dentist", { icon: CalendarX, tone: "#9AA4AA", badge: k.cancelled, faded: true }),
      },
      {
        user: th ? "เตือนให้ซื้อพัดลมหน่อย" : "Remind me to buy a fan",
        reply: th ? "จดไว้ให้ก่อนครับ ไม่ได้บอกเวลา เลยยังไม่ตั้งเตือน อยากให้เตือนเมื่อไหร่ครับ" : "Noted. You didn't say when, so I haven't set a reminder. When should I remind you?",
        apply: put({ id: "fan", icon: StickyNote, kind: k.note, title: th ? "ซื้อพัดลม" : "Buy a fan", meta: th ? "รอบอกเวลาเตือน" : "Waiting for a time", tone: "#66737D", badge: k.isNew }),
      },
    ],
  };
}

type Msg = { id: number; from: "user" | "jod"; text: string };
type Phase = "typing" | "thinking" | "replied";

let msgSeq = 0;
const msg = (from: Msg["from"], text: string): Msg => ({ id: ++msgSeq, from, text });

export function HeroDemo() {
  const { language } = useLanguage();
  const copy = useMemo(() => buildCopy(language), [language]);
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<"auto" | "play">("auto");
  const [autoIndex, setAutoIndex] = useState(0);
  // current = ฉากที่กำลังเล่นในโหมดลองเอง (null = รอผู้ใช้กดปุ่ม)
  const [current, setCurrent] = useState<number | null>(null);
  const [used, setUsed] = useState<number[]>([]);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  // เปลี่ยนภาษา = เริ่มเดโมใหม่ในภาษานั้น (ปรับ state ระหว่าง render ตามแนวทางของ React แทน effect)
  const [shownLang, setShownLang] = useState(language);
  if (shownLang !== language) {
    setShownLang(language);
    setMode("auto");
    setAutoIndex(0);
    setCurrent(null);
    setUsed([]);
    setTyped("");
    setPhase("typing");
    setMsgs([]);
    setCards([]);
  }

  const scene = mode === "auto" ? copy.autoScenes[autoIndex] : current !== null ? copy.playScenes[current] : null;

  useEffect(() => {
    if (!scene || (reduce && mode === "auto")) return;
    let timer: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (!reduce && typed.length < scene.user.length) {
        timer = setTimeout(() => setTyped(scene.user.slice(0, typed.length + 1)), 45);
      } else {
        timer = setTimeout(
          () => {
            setMsgs((m) => [...m.slice(-3), msg("user", scene.user)]);
            setTyped("");
            setPhase("thinking");
          },
          reduce ? 0 : 400,
        );
      }
    } else if (phase === "thinking") {
      timer = setTimeout(
        () => {
          setMsgs((m) => [...m.slice(-3), msg("jod", scene.reply)]);
          setCards((c) => scene.apply(c));
          setPhase("replied");
          if (mode === "play") setCurrent(null); // จบฉาก รอผู้ใช้กดปุ่มถัดไป
        },
        reduce ? 0 : 1000,
      );
    } else if (mode === "auto") {
      timer = setTimeout(() => {
        const next = (autoIndex + 1) % copy.autoScenes.length;
        if (next === 0) {
          setMsgs([]);
          setCards([]);
        }
        setAutoIndex(next);
        setPhase("typing");
      }, 2600);
    }
    return () => clearTimeout(timer);
  }, [scene, phase, typed, reduce, mode, autoIndex, copy]);

  const startPlay = () => {
    setMode("play");
    setCurrent(null);
    setUsed([]);
    setTyped("");
    setCards(copy.startBoard);
    setMsgs([msg("jod", copy.greeting)]);
  };

  const choose = (i: number) => {
    if (current !== null || used.includes(i)) return;
    if (mode !== "play") startPlay();
    setUsed((u) => [...u, i]);
    setCurrent(i);
    setPhase("typing");
  };

  const busy = mode === "play" && current !== null;
  const remaining = copy.playScenes.map((s, i) => ({ s, i })).filter(({ i }) => !used.includes(i));
  const finished = mode === "play" && remaining.length === 0 && !busy;

  // ผู้ใช้ที่ตั้งค่าลดการเคลื่อนไหว: โหมดเล่นเองแสดงเป็นภาพนิ่ง
  const staticCards = useMemo(() => copy.autoScenes.reduce<Card[]>((all, s) => s.apply(all), []), [copy]);
  const shownMsgs: Msg[] =
    reduce && mode === "auto"
      ? [
          { id: -1, from: "user", text: copy.autoScenes[0].user },
          { id: -2, from: "jod", text: copy.autoScenes[0].reply },
        ]
      : msgs;
  const shownCards = reduce && mode === "auto" ? staticCards : cards;
  const thinking = phase === "thinking" && (mode === "play" ? busy : !reduce);

  return (
    <div className="w-full max-w-md">
      {/* แชท */}
      <div className="overflow-hidden rounded-3xl border border-[#D1CEC5] bg-[#FAF9F6] shadow-[0_12px_40px_-12px_rgba(38,52,63,0.25)]">
        <div className="flex items-center gap-2.5 border-b border-[#E6E3DC] px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3D5A73] text-sm font-bold text-white">จ</span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[#26343F]">{copy.name}</p>
            <p className="flex items-center gap-1 text-[11px] text-[#2E7D32]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32]" /> {copy.status}
            </p>
          </div>
        </div>

        <div className="flex h-60 flex-col justify-end gap-2 overflow-hidden px-4 py-3" aria-live="polite">
          <AnimatePresence initial={false}>
            {shownMsgs.map((m) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={m.from === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <p
                  className={
                    m.from === "user"
                      ? "max-w-[80%] rounded-3xl rounded-br-md bg-[#E9E6DF] px-3.5 py-2 text-sm text-[#26343F]"
                      : "max-w-[85%] rounded-3xl rounded-bl-md bg-white px-3.5 py-2 text-sm text-[#26343F] ring-1 ring-[#E6E3DC]"
                  }
                >
                  {m.text}
                </p>
              </motion.div>
            ))}
            {thinking && (
              <motion.div key="dots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-1 px-2 py-2">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-[#9AA4AA]"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 border-t border-[#E6E3DC] px-3 py-2.5">
          <div className="min-w-0 flex-1 truncate rounded-full bg-white px-4 py-2 text-sm ring-1 ring-[#E6E3DC]">
            {typed ? (
              <span className="text-[#26343F]">
                {typed}
                <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-[#26343F]" />
              </span>
            ) : (
              <span className="text-[#9AA4AA]">{mode === "play" ? copy.placeholderPlay : copy.placeholderAuto}</span>
            )}
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#26343F] text-white">
            <Send className="h-4 w-4" />
          </span>
        </div>
      </div>

      {/* ปุ่มคำสั่ง: กดแล้วหายไป */}
      <div className="mt-3">
        {!finished ? (
          <>
            <p className="mb-1.5 flex items-center gap-1 px-1 text-[11px] font-semibold text-[#66737D]">
              <MousePointerClick className="h-3.5 w-3.5" /> {copy.tryLabel}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <AnimatePresence initial={false}>
                {remaining.map(({ s, i }) => (
                  <motion.button
                    key={s.user}
                    layout
                    type="button"
                    onClick={() => choose(i)}
                    disabled={busy}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-full border border-[#D1CEC5] bg-white px-3 py-1.5 text-xs text-[#26343F] shadow-2xs transition-colors hover:border-[#3D5A73]/50 hover:bg-[#FAF9F6] disabled:opacity-50 cursor-pointer disabled:cursor-default"
                  >
                    {s.user}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-2xl bg-[#3D5A73] px-4 py-3 text-white"
          >
            <p className="flex-1 text-sm">{copy.finished}</p>
            <button
              type="button"
              onClick={startPlay}
              aria-label={copy.replay}
              title={copy.replay}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <Link href="/login" className="shrink-0 rounded-full bg-[#E59AA5] px-3.5 py-1.5 text-xs font-bold text-[#26343F] hover:bg-[#F0B3BC]">
              {copy.signup}
            </Link>
          </motion.div>
        )}
      </div>

      {/* ตารางที่เปลี่ยนตามคำสั่ง */}
      <div className="mt-4 rounded-2xl border border-dashed border-[#D1CEC5] bg-white/60 p-3">
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-[#66737D]">{copy.board}</p>
        <div className="flex min-h-[132px] flex-col gap-2">
          <AnimatePresence initial={false}>
            {shownCards.map((c) => {
              const Icon = c.icon;
              return (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: c.faded ? 0.55 : 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 rounded-xl bg-[#FAF9F6] px-3 py-2 ring-1 ring-[#E6E3DC]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: c.tone }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold text-[#26343F] ${c.faded ? "line-through" : ""}`}>{c.title}</p>
                    <p className="truncate text-xs text-[#66737D]">
                      {c.kind} · {c.meta}
                    </p>
                  </div>
                  {c.badge && (
                    <span className="shrink-0 rounded-full bg-[#E59AA5]/20 px-2 py-0.5 text-[10px] font-bold text-[#A34F5C]">{c.badge}</span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
