"use client";

import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  HelpCircle,
  ListChecks,
  Lock,
  MessageCircle,
  Monitor,
  Search,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { Navbar } from "@/components/Navbar";
import { HeroDemo } from "@/components/home/HeroDemo";
import { JodMascot } from "@/components/home/JodMascot";

// หน้าแรก: จดจด = เลขาส่วนตัว "พี่จ๊อด" ในแชท (LINE / เว็บ / Google Calendar)
// ข้อความอยู่ในไฟล์นี้ทั้งสองภาษา เพราะใช้เฉพาะหน้านี้
const copy = {
  th: {
    hello: "สวัสดีครับ ผมจ๊อด เลขาส่วนตัวของคุณ",
    title1: "มีพี่จ๊อด",
    title2: "ไม่ต้องจำเอง",
    sub: "พิมพ์บอกเหมือนคุยกับเพื่อน ใน LINE หรือบนเว็บ แล้วพี่จ๊อดจะจด ทำลิสต์ ตั้งเตือน และลงนัดใน Google Calendar ให้ครับ",
    ctaStart: "เริ่มคุยกับพี่จ๊อด",
    ctaOpen: "ไปคุยกับพี่จ๊อด",
    ctaLine: "ใช้ผ่าน LINE",
    fine: "ฟรีระหว่างช่วงทดลอง · ไม่ต้องใช้บัตรเครดิต",
    exEyebrow: "พิมพ์ภาษาคน",
    exTitle: "บอกแบบนี้ได้เลย",
    exSub: "ไม่ต้องจำคำสั่ง พี่จ๊อดเข้าใจวันและเวลาแบบไทย ทั้ง “บ่ายสอง” “สองทุ่ม” และ “มะรืน”",
    examples: [
      { says: "ซื้อนม ไข่ ขนมปัง", result: "ทำลิสต์ให้", detail: "ลิสต์ “ซื้อของ” 3 รายการ" },
      { says: "เตือนจ่ายค่าเน็ตวันที่ 25 สองทุ่ม", result: "ตั้งเตือนให้", detail: "25 ต.ค. 20:00" },
      { says: "พรุ่งนี้บ่ายสองประชุมทีม", result: "ลงนัดให้", detail: "Google Calendar 14:00–15:00" },
      { says: "เลื่อนประชุมเป็นบ่ายสาม", result: "เลื่อนนัดเดิมให้", detail: "ไม่สร้างนัดซ้ำ" },
      { says: "ซื้อนมแล้ว", result: "ติ๊กให้", detail: "นม ✓ ในลิสต์ซื้อของ" },
      { says: "อาทิตย์นี้มีนัดอะไรบ้าง", result: "สรุปให้", detail: "รวมนัดจากปฏิทินและโน้ต" },
    ],
    whereEyebrow: "ใช้ได้ทุกที่",
    whereTitle: "อยู่ในที่ที่คุณใช้อยู่แล้ว",
    where: [
      { name: "LINE", desc: "แชทหาพี่จ๊อดเหมือนเพื่อน" },
      { name: "เว็บ", desc: "ดูโน้ตและลิสต์ทั้งหมดในที่เดียว" },
      { name: "Google Calendar", desc: "นัดและเตือนขึ้นในมือถือคุณ" },
    ],
    whereSoon: "ปฏิทินอื่น ๆ เร็ว ๆ นี้",
    trustEyebrow: "ไว้ใจได้",
    trustTitle: "เลขาที่ดี ไม่ทำอะไรเกินคำสั่ง",
    trust: [
      { title: "ไม่เดาเวลาเอง", desc: "ถ้าไม่ได้บอกวันหรือเวลา พี่จ๊อดจะจดไว้ก่อน แล้วถามว่าให้เตือนเมื่อไหร่" },
      { title: "ไม่แน่ใจ ถามก่อน", desc: "มีนัดชื่อคล้ายกันหลายอัน จะถามว่าหมายถึงอันไหน ไม่เลือกมั่ว" },
      { title: "ยกเลิกได้ใน 24 ชั่วโมง", desc: "กดยกเลิกแล้วทุกอย่างกลับเหมือนเดิม รวมถึงนัดในปฏิทิน" },
      { title: "ข้อมูลเป็นของคุณ", desc: "สิทธิ์เข้าปฏิทินถูกเข้ารหัสเก็บไว้ ยกเลิกการเชื่อมได้ทุกเมื่อ" },
    ],
    stepsEyebrow: "เริ่มง่าย",
    stepsTitle: "เริ่มได้ใน 3 ขั้น",
    steps: [
      { title: "เข้าสู่ระบบ", desc: "ด้วย Google, LINE หรืออีเมล ใช้เวลาไม่ถึงนาที" },
      { title: "เพิ่มพี่จ๊อดใน LINE", desc: "ไม่บังคับ แต่สะดวกสุด พิมพ์ในแชทที่ใช้อยู่ทุกวันได้เลย" },
      { title: "เชื่อม Google Calendar", desc: "ไม่บังคับ ให้พี่จ๊อดลงนัดและเตือนผ่านมือถือคุณ" },
    ],
    faqEyebrow: "คำถาม",
    faqTitle: "ถามพี่จ๊อดก่อนเริ่ม",
    faqs: [
      { q: "ใช้ฟรีไหม", a: "ตอนนี้ใช้ฟรีทั้งหมดระหว่างช่วงทดลอง" },
      { q: "ข้อมูลของฉันเป็นส่วนตัวไหม", a: "เห็นได้เฉพาะคุณ พี่จ๊อดเข้าถึงปฏิทินเฉพาะตอนคุณสั่ง และคุณยกเลิกการเชื่อมได้ทุกเมื่อจากหน้าบัญชี" },
      { q: "ต้องพิมพ์คำสั่งแบบไหน", a: "พิมพ์ภาษาปกติเหมือนบอกเพื่อน เช่น “พรุ่งนี้ 9 โมงเตือนโทรหาหมอ” ไม่ต้องจำรูปแบบคำสั่ง" },
      { q: "ถ้าพี่จ๊อดเข้าใจผิดล่ะ", a: "กดยกเลิกที่ข้อความนั้นได้ภายใน 24 ชั่วโมง ทุกอย่างที่ทำไปจะถูกย้อนกลับ" },
    ],
    endTitle: "ปล่อยให้พี่จ๊อดจำแทน แล้วไปพักเถอะครับ",
    endSub: "เริ่มจากโน้ตแรก หรือนัดแรกของพรุ่งนี้ก็ได้",
    endCta: "เริ่มเลย",
    footer: "พี่จ๊อด เลขาส่วนตัวในแชท",
  },
  en: {
    hello: "Hi, I'm Jod, your personal assistant",
    title1: "Let Jod remember",
    title2: "so you don't have to",
    sub: "Just type like you're texting a friend, on LINE or the web. Jod takes notes, makes lists, sets reminders and books events in your Google Calendar.",
    ctaStart: "Start chatting with Jod",
    ctaOpen: "Chat with Jod",
    ctaLine: "Use on LINE",
    fine: "Free during early access · No credit card needed",
    exEyebrow: "Plain language",
    exTitle: "Just say it like this",
    exSub: "No commands to learn. Jod understands Thai-style dates and times like “บ่ายสอง”, “สองทุ่ม” and “มะรืน”.",
    examples: [
      { says: "Buy milk, eggs, bread", result: "Makes a list", detail: "“Groceries” · 3 items" },
      { says: "Remind me to pay the internet bill on the 25th at 8pm", result: "Sets a reminder", detail: "Oct 25 · 8:00 PM" },
      { says: "Team meeting tomorrow at 2pm", result: "Books it", detail: "Google Calendar 2:00–3:00 PM" },
      { says: "Move the meeting to 3pm", result: "Moves the same event", detail: "No duplicates" },
      { says: "Bought the milk", result: "Checks it off", detail: "Milk ✓ in Groceries" },
      { says: "What's on this week?", result: "Sums it up", detail: "Calendar events and notes together" },
    ],
    whereEyebrow: "Works everywhere",
    whereTitle: "Right where you already are",
    where: [
      { name: "LINE", desc: "Chat with Jod like a friend" },
      { name: "Web", desc: "See all your notes and lists in one place" },
      { name: "Google Calendar", desc: "Events and reminders on your phone" },
    ],
    whereSoon: "More calendars coming soon",
    trustEyebrow: "Trustworthy",
    trustTitle: "A good assistant does only what you ask",
    trust: [
      { title: "Never guesses times", desc: "No date or time given? Jod saves a note and asks when to remind you." },
      { title: "Asks when unsure", desc: "Two events with similar names? Jod asks which one instead of guessing." },
      { title: "Undo for 24 hours", desc: "One tap puts everything back, including calendar events." },
      { title: "Your data stays yours", desc: "Calendar access is stored encrypted, and you can disconnect anytime." },
    ],
    stepsEyebrow: "Easy start",
    stepsTitle: "Get started in 3 steps",
    steps: [
      { title: "Sign in", desc: "With Google, LINE or email. Takes less than a minute." },
      { title: "Add Jod on LINE", desc: "Optional but handy: type in the chat app you already use." },
      { title: "Connect Google Calendar", desc: "Optional: let Jod book events and remind you on your phone." },
    ],
    faqEyebrow: "Questions",
    faqTitle: "Ask Jod before you start",
    faqs: [
      { q: "Is it free?", a: "Everything is free during early access." },
      { q: "Is my data private?", a: "Only you can see it. Jod touches your calendar only when you ask, and you can disconnect anytime from your account page." },
      { q: "What do I need to type?", a: "Plain language, like telling a friend: “remind me to call the doctor tomorrow at 9”. No command syntax." },
      { q: "What if Jod gets it wrong?", a: "Tap undo on that message within 24 hours and everything it did is reversed." },
    ],
    endTitle: "Let Jod remember. Go take a break.",
    endSub: "Start with your first note, or tomorrow's first meeting.",
    endCta: "Get started",
    footer: "Jod, your personal assistant in chat",
  },
};

const exampleIcons: LucideIcon[] = [ListChecks, BellRing, CalendarDays, CalendarClock, CheckCircle2, Search];
const whereStyle: { dot: string; icon: LucideIcon }[] = [
  { dot: "#06C755", icon: MessageCircle },
  { dot: "#3D5A73", icon: Monitor },
  { dot: "#4285F4", icon: CalendarDays },
];
const trustIcons: LucideIcon[] = [HelpCircle, MessageCircle, Undo2, Lock];

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#C27A86]">{eyebrow}</p>
      <h2 className="text-2xl font-bold text-[#26343F] sm:text-3xl">{title}</h2>
      {sub && <p className="mt-3 text-sm text-[#66737D] sm:text-base">{sub}</p>}
    </div>
  );
}

export function AiLanding() {
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const c = copy[language];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* 1. Hero */}
      <section className="px-4 pb-16 pt-10 sm:px-6 md:pb-24 md:pt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <div className="mb-6 flex items-center gap-4">
              <JodMascot pose="wave" size={88} />
              <p className="rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-sm text-[#26343F] shadow-sm ring-1 ring-[#E6E3DC]">{c.hello}</p>
            </div>
            <h1 className="font-display text-4xl leading-tight text-[#26343F] sm:text-5xl">
              {c.title1}
              <br />
              <span className="text-[#3D5A73]">{c.title2}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#66737D] sm:text-lg">{c.sub}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#26343F] px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#3D5A73]"
              >
                {isAuthenticated ? c.ctaOpen : c.ctaStart} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/account"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D1CEC5] bg-white px-6 py-3 text-sm font-semibold text-[#26343F] transition-colors hover:bg-[#F0EFEB]"
              >
                <span className="h-2 w-2 rounded-full bg-[#06C755]" /> {c.ctaLine}
              </Link>
            </div>
            <p className="mt-4 text-xs text-[#9AA4AA]">{c.fine}</p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* 2. พิมพ์แบบนี้ได้เลย */}
      <section id="features" className="scroll-mt-20 border-y border-[#E6E3DC] bg-[#FAF9F6]/80 px-4 py-16 sm:px-6 md:py-24">
        <SectionTitle eyebrow={c.exEyebrow} title={c.exTitle} sub={c.exSub} />
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.examples.map((e, i) => {
            const Icon = exampleIcons[i];
            return (
              <div key={e.says} className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#E6E3DC]">
                <p className="self-end rounded-3xl rounded-br-md bg-[#E9E6DF] px-3.5 py-2 text-sm text-[#26343F]">{e.says}</p>
                <div className="flex items-center gap-3 rounded-xl bg-[#F0EFEB]/70 px-3 py-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3D5A73] text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#26343F]">{e.result}</p>
                    <p className="truncate text-xs text-[#66737D]">{e.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. อยู่ในที่ที่ใช้อยู่แล้ว */}
      <section id="line-bot" className="scroll-mt-20 px-4 py-16 sm:px-6 md:py-24">
        <SectionTitle eyebrow={c.whereEyebrow} title={c.whereTitle} />
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
          {c.where.map((p, i) => {
            const { dot, icon: Icon } = whereStyle[i];
            return (
              <div key={p.name} className="rounded-2xl bg-white p-5 text-center ring-1 ring-[#E6E3DC]">
                <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ background: dot }}>
                  <Icon className="h-6 w-6" />
                </span>
                <p className="font-semibold text-[#26343F]">{p.name}</p>
                <p className="mt-1 text-sm text-[#66737D]">{p.desc}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-center text-sm text-[#9AA4AA]">{c.whereSoon}</p>
      </section>

      {/* 4. ไว้ใจได้ */}
      <section className="bg-[#26343F] px-4 py-16 text-white sm:px-6 md:py-24">
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[auto_1fr]">
          <div className="flex justify-center">
            <div className="rounded-full bg-[#F0EFEB] p-6">
              <JodMascot pose="ask" size={130} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#E59AA5]">{c.trustEyebrow}</p>
            <h2 className="text-2xl font-bold sm:text-3xl">{c.trustTitle}</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {c.trust.map((t, i) => {
                const Icon = trustIcons[i];
                return (
                  <div key={t.title} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <Icon className="h-4 w-4 text-[#E59AA5]" />
                    </span>
                    <div>
                      <p className="font-semibold">{t.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-white/70">{t.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 5. เริ่มใช้ 3 ขั้น */}
      <section id="how-it-works" className="scroll-mt-20 px-4 py-16 sm:px-6 md:py-24">
        <SectionTitle eyebrow={c.stepsEyebrow} title={c.stepsTitle} />
        <ol className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {c.steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl bg-white p-5 ring-1 ring-[#E6E3DC]">
              <span className="font-display text-3xl text-[#E59AA5]">{i + 1}</span>
              <p className="mt-2 font-semibold text-[#26343F]">{s.title}</p>
              <p className="mt-1 text-sm text-[#66737D]">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 6. คำถามที่พบบ่อย */}
      <section className="px-4 pb-16 sm:px-6 md:pb-24">
        <SectionTitle eyebrow={c.faqEyebrow} title={c.faqTitle} />
        <div className="mx-auto max-w-2xl divide-y divide-[#E6E3DC] rounded-2xl bg-white ring-1 ring-[#E6E3DC]">
          {c.faqs.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[#26343F]">
                {f.q}
                <span className="text-[#9AA4AA] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-[#66737D]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 7. CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-3xl bg-[#3D5A73] px-6 py-12 text-center text-white sm:flex-row sm:text-left">
          <div className="shrink-0 rounded-full bg-[#F0EFEB] p-4">
            <JodMascot pose="rest" size={96} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{c.endTitle}</h2>
            <p className="mt-2 text-sm text-white/75">{c.endSub}</p>
          </div>
          <Link
            href="/chat"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#E59AA5] px-6 py-3 text-sm font-bold text-[#26343F] transition-colors hover:bg-[#F0B3BC]"
          >
            {c.endCta} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#D1CEC5] bg-[#FAF9F6] px-4 py-6 text-xs text-[#66737D] sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 sm:flex-row">
          <p>
            <span className="font-display text-sm text-[#3D5A73]">{language === "th" ? "จดจด" : "JodJod"}</span> · {c.footer}
          </p>
          <p>© {new Date().getFullYear()} JodJod</p>
        </div>
      </footer>
    </div>
  );
}
