"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import liff from "@line/liff";
import { BellRing, CalendarDays, CalendarX2, CheckCircle2, Circle, Crown, ExternalLink, KeyRound, ListChecks, Mail, MessageCircle, StickyNote } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { ApiError, changePassword, createHandoff, getAgenda, getAvatarUrl, getFeed, getIntegrations, linkEmail, toggleItem } from "@/lib/api";
import type { AgendaItem, AgendaResponse, IntegrationsStatus, Note } from "@/lib/types";
import Loading from "@/components/Loading";

// แท็บของหน้า LIFF (/line): ดูสิ่งที่พี่จ๊อดจดไว้ — การสั่งงานทำในแชท LINE
export const lineCopy = {
  th: {
    tabs: { agenda: "นัดและเตือน", lists: "ลิสต์", notes: "โน้ต", account: "บัญชี" },
    loading: "กำลังโหลด...",
    loadFailed: "โหลดไม่สำเร็จ ลองใหม่อีกครั้ง",
    retry: "ลองใหม่",
    today: "วันนี้",
    tomorrow: "พรุ่งนี้",
    allDay: "ทั้งวัน",
    kind: { reminder: "เตือน", due: "กำหนดส่ง", event: "นัด" },
    agendaEmpty: "2 สัปดาห์นี้ยังไม่มีนัดหรือเตือนครับ",
    agendaEmptyHint: "พิมพ์บอกพี่จ๊อดในแชท เช่น “พรุ่งนี้บ่ายสองประชุมทีม”",
    calConnect: "เชื่อม Google Calendar ให้นัดในปฏิทินขึ้นที่นี่ด้วย",
    calConnectCta: "เชื่อม",
    calError: "อ่าน Google Calendar ไม่สำเร็จ แสดงเฉพาะที่จดไว้",
    listsEmpty: "ยังไม่มีลิสต์ครับ",
    listsEmptyHint: "ลองพิมพ์ในแชท เช่น “ซื้อนม ไข่ ขนมปัง”",
    notesEmpty: "ยังไม่มีโน้ตครับ",
    notesEmptyHint: "พิมพ์ในแชท เช่น “จดว่าไอเดียทำแอปจดโน้ตด้วยเสียง”",
    plan: "แพ็กเกจ",
    free: "ฟรี",
    premium: "Premium",
    planFreeDesc: "ใช้ได้ฟรีระหว่างช่วงทดลอง",
    planPremiumDesc: "ใช้ได้ไม่จำกัด",
    seePlans: "ดูแพ็กเกจ",
    connections: "การเชื่อมต่อ",
    calendar: "Google Calendar",
    connected: "เชื่อมแล้ว",
    notConnected: "ยังไม่ได้เชื่อม",
    openWeb: "เปิดเว็บแบบเต็ม",
    manageAccount: "จัดการบัญชี",
    signIn: "วิธีเข้าสู่ระบบ",
    signInHint: "เพิ่มหลายวิธีไว้ จะได้เข้าใช้บนเว็บหรือ widget บน iPhone ได้โดยไม่ต้องผ่าน LINE",
    line: "LINE",
    google: "Google",
    email: "อีเมลและรหัสผ่าน",
    linkCta: "เชื่อม",
    unlinkCta: "ยกเลิก",
    unlinkConfirm: "ยกเลิกการเชื่อม Google? ยังเข้าใช้ด้วย LINE ได้ตามเดิม",
    emailUnset: "ยังไม่ได้ตั้ง",
    emailSet: "ตั้งค่า",
    passwordChange: "เปลี่ยนรหัสผ่าน",
    emailLabel: "อีเมล",
    passwordLabel: "รหัสผ่าน (อย่างน้อย 6 ตัว)",
    passwordConfirm: "ยืนยันรหัสผ่าน",
    currentPassword: "รหัสผ่านเดิม",
    newPassword: "รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)",
    save: "บันทึก",
    saving: "กำลังบันทึก...",
    cancel: "ยกเลิก",
    passwordMismatch: "รหัสผ่านทั้งสองช่องไม่ตรงกัน",
    passwordShort: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    emailSaved: "ตั้งอีเมลและรหัสผ่านแล้ว ใช้เข้าสู่ระบบบนเว็บและ widget ได้เลย",
    passwordSaved: "เปลี่ยนรหัสผ่านแล้ว",
    failed: "ทำรายการไม่สำเร็จ ลองใหม่อีกครั้ง",
    googleFromEmail: "ใช้อีเมลเดียวกับ Google ที่เชื่อมไว้",
  },
  en: {
    tabs: { agenda: "Upcoming", lists: "Lists", notes: "Notes", account: "Account" },
    loading: "Loading...",
    loadFailed: "Couldn't load. Please try again.",
    retry: "Retry",
    today: "Today",
    tomorrow: "Tomorrow",
    allDay: "All day",
    kind: { reminder: "Reminder", due: "Due", event: "Event" },
    agendaEmpty: "Nothing scheduled for the next 2 weeks.",
    agendaEmptyHint: "Tell Jod in the chat, e.g. “team meeting tomorrow at 2pm”",
    calConnect: "Connect Google Calendar to see your calendar events here too",
    calConnectCta: "Connect",
    calError: "Couldn't read Google Calendar. Showing saved items only.",
    listsEmpty: "No lists yet.",
    listsEmptyHint: "Try in the chat: “buy milk, eggs, bread”",
    notesEmpty: "No notes yet.",
    notesEmptyHint: "Try in the chat: “note: voice note app idea”",
    plan: "Plan",
    free: "Free",
    premium: "Premium",
    planFreeDesc: "Free during early access",
    planPremiumDesc: "Unlimited",
    seePlans: "See plans",
    connections: "Connections",
    calendar: "Google Calendar",
    connected: "Connected",
    notConnected: "Not connected",
    openWeb: "Open full website",
    manageAccount: "Manage account",
    signIn: "Sign-in methods",
    signInHint: "Add more ways to sign in so you can use the website or the iPhone widget without LINE",
    line: "LINE",
    google: "Google",
    email: "Email and password",
    linkCta: "Connect",
    unlinkCta: "Remove",
    unlinkConfirm: "Disconnect Google? You can still sign in with LINE.",
    emailUnset: "Not set",
    emailSet: "Set up",
    passwordChange: "Change password",
    emailLabel: "Email",
    passwordLabel: "Password (at least 6 characters)",
    passwordConfirm: "Confirm password",
    currentPassword: "Current password",
    newPassword: "New password (at least 6 characters)",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    passwordMismatch: "The passwords don't match",
    passwordShort: "Use at least 6 characters",
    emailSaved: "Email and password set. You can sign in on the web and in the widget now.",
    passwordSaved: "Password changed",
    failed: "Something went wrong. Please try again.",
    googleFromEmail: "Uses the same email as your connected Google account",
  },
};
export type LineCopy = (typeof lineCopy)["th"];

// Google ไม่ให้ login ใน browser ฝังของแอป (LINE in-app) → หน้าที่ต้องเชื่อม Google ให้เปิดใน browser ภายนอก
export function openOutside(path: string) {
  const url = window.location.origin + path;
  try {
    if (liff.isInClient()) {
      liff.openWindow({ url, external: true });
      return;
    }
  } catch {
    // liff ยังไม่ได้ init (เปิดจาก browser ปกติ)
  }
  window.location.href = url;
}

// เหมือน openOutside แต่พา session ไปด้วย: browser ภายนอกไม่มี session ของหน้า LIFF
// จึงขอรหัสใช้ครั้งเดียวแล้วเปิด /handoff ให้แลกเป็น session ก่อนไปหน้าที่ต้องการ
export async function openOutsideSignedIn(path: string) {
  try {
    const { code } = await createHandoff();
    openOutside(`/handoff?code=${encodeURIComponent(code)}&next=${encodeURIComponent(path)}`);
  } catch {
    openOutside(path); // ขอรหัสไม่ได้: เปิดหน้าเดิม ผู้ใช้ login เองได้
  }
}

function useLoad<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);
  const reload = useCallback(() => {
    setFailed(false);
    load()
      .then(setData)
      .catch(() => setFailed(true));
  }, [load]);
  useEffect(() => {
    let cancelled = false;
    load()
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [load]);
  return { data, setData, failed, reload };
}

function State({ c, failed, onRetry }: { c: LineCopy; failed: boolean; onRetry: () => void }) {
  if (failed) {
    return (
      <div className="py-16 text-center text-sm text-[#66737D]">
        <p>{c.loadFailed}</p>
        <button type="button" onClick={onRetry} className="mt-3 rounded-full bg-[#26343F] px-4 py-1.5 text-xs font-semibold text-white cursor-pointer">
          {c.retry}
        </button>
      </div>
    );
  }
  return (
    <div className="py-16">
      <Loading size="sm" text={c.loading} />
    </div>
  );
}

function Empty({ icon: Icon, title, hint }: { icon: typeof StickyNote; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6E3DC] text-[#3D5A73]">
        <Icon className="h-6 w-6" />
      </span>
      <p className="font-semibold text-[#26343F]">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-[#66737D]">{hint}</p>
    </div>
  );
}

// ── นัดและเตือน ─────────────────────────────────────────────────

const kindStyle: Record<AgendaItem["kind"], { icon: typeof BellRing; tone: string }> = {
  event: { icon: CalendarDays, tone: "#3D5A73" },
  reminder: { icon: BellRing, tone: "#A34F45" },
  due: { icon: StickyNote, tone: "#8C6D1F" },
};

function dayHeading(d: Date, c: LineCopy, language: string) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const date = d.toLocaleDateString(language === "th" ? "th-TH" : "en-US", { weekday: "short", day: "numeric", month: "short" });
  if (d.toDateString() === today.toDateString()) return `${c.today} · ${date}`;
  if (d.toDateString() === tomorrow.toDateString()) return `${c.tomorrow} · ${date}`;
  return date;
}

export function AgendaTab({ c }: { c: LineCopy }) {
  const { language } = useLanguage();
  const load = useCallback(() => getAgenda(14), []);
  const { data, failed, reload } = useLoad<AgendaResponse>(load);
  if (!data) return <State c={c} failed={failed} onRetry={reload} />;

  const timeFmt = new Intl.DateTimeFormat(language === "th" ? "th-TH" : "en-US", { hour: "2-digit", minute: "2-digit", hour12: language !== "th" });
  const groups: { day: string; items: AgendaItem[] }[] = [];
  for (const it of data.items) {
    const day = dayHeading(new Date(it.start), c, language);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(it);
    else groups.push({ day, items: [it] });
  }

  return (
    <div className="space-y-5">
      {!data.calendar_connected && (
        <div className="flex items-center gap-3 rounded-2xl bg-[#3D5A73] px-4 py-3 text-white">
          <CalendarDays className="h-5 w-5 shrink-0" />
          <p className="flex-1 text-xs">{c.calConnect}</p>
          <button type="button" onClick={() => openOutside("/account")} className="shrink-0 rounded-full bg-[#E59AA5] px-3 py-1 text-xs font-bold text-[#26343F] cursor-pointer">
            {c.calConnectCta}
          </button>
        </div>
      )}
      {data.calendar_error && <p className="rounded-xl bg-[#FBF1EF] px-3 py-2 text-xs text-[#A34F45]">{c.calError}</p>}

      {groups.length === 0 ? (
        <Empty icon={CalendarDays} title={c.agendaEmpty} hint={c.agendaEmptyHint} />
      ) : (
        groups.map((g) => (
          <section key={g.day}>
            <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-[#66737D]">{g.day}</h3>
            <ul className="space-y-2">
              {g.items.map((it) => {
                const s = kindStyle[it.kind];
                const Icon = s.icon;
                const when = it.all_day
                  ? c.allDay
                  : timeFmt.format(new Date(it.start)) + (it.end ? `–${timeFmt.format(new Date(it.end))}` : "");
                const body = (
                  <>
                    <span className="w-16 shrink-0 text-xs font-semibold text-[#26343F]">{when}</span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: s.tone }}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm font-medium text-[#26343F] ${it.done ? "line-through opacity-60" : ""}`}>{it.title}</span>
                      <span className="block text-[11px] text-[#9AA4AA]">{c.kind[it.kind]}</span>
                    </span>
                    {it.link && <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#9AA4AA]" />}
                  </>
                );
                const cls = "flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-[#E6E3DC]";
                return (
                  <li key={it.kind + it.id}>
                    {it.link ? (
                      <a href={it.link} target="_blank" rel="noreferrer" className={cls}>
                        {body}
                      </a>
                    ) : (
                      <div className={cls}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

// ── ลิสต์ ───────────────────────────────────────────────────────

export function ListsTab({ c }: { c: LineCopy }) {
  const load = useCallback(() => getFeed({ type: "checklist", limit: 50 }).then((r) => r.notes), []);
  const { data, setData, failed, reload } = useLoad<Note[]>(load);
  if (!data) return <State c={c} failed={failed} onRetry={reload} />;
  if (data.length === 0) return <Empty icon={ListChecks} title={c.listsEmpty} hint={c.listsEmptyHint} />;

  const toggle = async (note: Note, itemId: string, done: boolean) => {
    const set = (value: boolean) =>
      setData((prev) =>
        prev?.map((n) => (n.id === note.id ? { ...n, items: n.items?.map((i) => (i.id === itemId ? { ...i, is_done: value } : i)) } : n)) ?? prev,
      );
    set(done);
    try {
      await toggleItem(note.id, itemId, done);
    } catch {
      set(!done);
    }
  };

  // ลิสต์ที่ยังมีของค้างขึ้นก่อน
  const sorted = [...data].sort((a, b) => Number(isComplete(a)) - Number(isComplete(b)));
  return (
    <div className="space-y-3">
      {sorted.map((n) => {
        const items = n.items ?? [];
        const doneCount = items.filter((i) => i.is_done).length;
        return (
          <section key={n.id} className={`rounded-2xl bg-white p-4 ring-1 ring-[#E6E3DC] ${isComplete(n) ? "opacity-60" : ""}`}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-[#26343F]">{n.content}</h3>
              <span className="text-xs text-[#9AA4AA]">
                {doneCount}/{items.length}
              </span>
            </div>
            <ul className="space-y-1">
              {items.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => toggle(n, i.id, !i.is_done)}
                    className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left active:bg-[#F0EFEB] cursor-pointer"
                  >
                    {i.is_done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2E7D32]" /> : <Circle className="h-5 w-5 shrink-0 text-[#9AA4AA]" />}
                    <span className={`text-[15px] ${i.is_done ? "text-[#9AA4AA] line-through" : "text-[#26343F]"}`}>{i.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function isComplete(n: Note) {
  const items = n.items ?? [];
  return items.length > 0 && items.every((i) => i.is_done);
}

// ── โน้ต ────────────────────────────────────────────────────────

export function NotesTab({ c }: { c: LineCopy }) {
  const { language } = useLanguage();
  const load = useCallback(() => getFeed({ type: "note", limit: 50 }).then((r) => r.notes), []);
  const { data, failed, reload } = useLoad<Note[]>(load);
  if (!data) return <State c={c} failed={failed} onRetry={reload} />;
  if (data.length === 0) return <Empty icon={StickyNote} title={c.notesEmpty} hint={c.notesEmptyHint} />;
  return (
    <ul className="space-y-2">
      {data.map((n) => (
        <li key={n.id} className="rounded-2xl bg-white p-4 ring-1 ring-[#E6E3DC]">
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[#26343F]">{n.content}</p>
          <p className="mt-2 text-[11px] text-[#9AA4AA]">
            {new Date(n.created_at).toLocaleDateString(language === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        </li>
      ))}
    </ul>
  );
}

// ── บัญชีและแพ็กเกจ ─────────────────────────────────────────────

export function AccountTab({ c }: { c: LineCopy }) {
  const { user, refreshUser } = useAuth();
  const load = useCallback(() => getIntegrations(), []);
  const { data, reload } = useLoad<IntegrationsStatus>(load);
  const premium = user?.tier === "premium";
  const cal = data?.google_calendar;

  // เชื่อม Google/ปฏิทินเสร็จใน browser ภายนอกแล้วกลับมา LINE → โหลดสถานะใหม่
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshUser();
        reload();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshUser, reload]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#E6E3DC]">
        {user?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getAvatarUrl(user.avatar_url)} alt="" className="h-12 w-12 rounded-full object-cover ring-1 ring-[#D1CEC5]" />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E6E3DC] font-bold text-[#3D5A73]">{user?.display_name?.charAt(0) || "J"}</span>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#26343F]">{user?.display_name}</p>
          {user?.email && <p className="truncate text-xs text-[#66737D]">{user.email}</p>}
        </div>
      </div>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-[#E6E3DC]">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#66737D]">{c.plan}</p>
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${premium ? "bg-amber-100 text-amber-700" : "bg-[#3D5A73]/10 text-[#3D5A73]"}`}>
            <Crown className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-[#26343F]">{premium ? c.premium : c.free}</p>
            <p className="text-xs text-[#66737D]">{premium ? c.planPremiumDesc : c.planFreeDesc}</p>
          </div>
          <Link href="/subscription" className="rounded-full border border-[#D1CEC5] px-3 py-1.5 text-xs font-semibold text-[#26343F]">
            {c.seePlans}
          </Link>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-[#E6E3DC]">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#66737D]">{c.connections}</p>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4285F4]/10 text-[#4285F4]">
            {cal?.connected ? <CalendarDays className="h-5 w-5" /> : <CalendarX2 className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#26343F]">{c.calendar}</p>
            <p className="truncate text-xs text-[#66737D]">{cal?.connected ? `${c.connected}${cal.email ? ` · ${cal.email}` : ""}` : c.notConnected}</p>
          </div>
          {cal && !cal.connected && cal.available && (
            <button type="button" onClick={() => openOutsideSignedIn("/account")} className="rounded-full bg-[#3D5A73] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer">
              {c.calConnectCta}
            </button>
          )}
        </div>
      </section>

      <SignInMethods c={c} />

      <div className="flex gap-2">
        <button type="button" onClick={() => openOutsideSignedIn("/chat")} className="flex-1 rounded-full border border-[#D1CEC5] bg-white py-2.5 text-sm font-semibold text-[#26343F] cursor-pointer">
          {c.openWeb}
        </button>
        <button type="button" onClick={() => openOutsideSignedIn("/account")} className="flex-1 rounded-full border border-[#D1CEC5] bg-white py-2.5 text-sm font-semibold text-[#26343F] cursor-pointer">
          {c.manageAccount}
        </button>
      </div>
    </div>
  );
}

// ── วิธีเข้าสู่ระบบ (LINE / Google / อีเมล) ─────────────────────

const inputClass =
  "w-full rounded-xl border border-[#D1CEC5] bg-[#FAF9F6] px-3 py-2.5 text-sm text-[#26343F] outline-none focus:border-[#3D5A73] read-only:text-[#66737D]";

function errorText(err: unknown, c: LineCopy) {
  return err instanceof ApiError && err.message ? err.message : c.failed;
}

function MethodRow({
  icon,
  title,
  detail,
  connected,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  connected: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 font-semibold text-[#26343F]">
          {title}
          {connected ? <CheckCircle2 className="h-3.5 w-3.5 text-[#2E7D32]" /> : <Circle className="h-3.5 w-3.5 text-[#9AA4AA]" />}
        </p>
        <p className="truncate text-xs text-[#66737D]">{detail}</p>
      </div>
      {action}
    </div>
  );
}

function SignInMethods({ c }: { c: LineCopy }) {
  const { user, identities, unlinkGoogleAccount, refreshUser } = useAuth();
  const line = identities.find((i) => i.provider === "line");
  const google = identities.find((i) => i.provider === "google");
  const email = identities.find((i) => i.provider === "email");
  const [form, setForm] = useState<"none" | "email" | "password">("none");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const onUnlinkGoogle = async () => {
    if (!confirm(c.unlinkConfirm)) return;
    setBusy(true);
    setError("");
    try {
      await unlinkGoogleAccount();
    } catch (err) {
      setError(errorText(err, c));
    } finally {
      setBusy(false);
    }
  };

  const open = (f: "email" | "password") => {
    setForm(form === f ? "none" : f);
    setError("");
    setNotice("");
  };

  const pill = "rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50";

  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-[#E6E3DC]">
      <p className="text-xs font-bold uppercase tracking-wide text-[#66737D]">{c.signIn}</p>
      <p className="mt-1 text-xs text-[#9AA4AA]">{c.signInHint}</p>

      <div className="mt-1 divide-y divide-[#F0EFEB]">
        <MethodRow
          icon={<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#06C755]/10 text-[#06C755]"><MessageCircle className="h-5 w-5" /></span>}
          title={c.line}
          detail={line ? `${c.connected}${line.display_name ? ` · ${line.display_name}` : ""}` : c.notConnected}
          connected={!!line}
        />
        <MethodRow
          icon={<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4285F4]/10 text-base font-bold text-[#4285F4]">G</span>}
          title={c.google}
          detail={google ? `${c.connected}${google.email ? ` · ${google.email}` : ""}` : c.notConnected}
          connected={!!google}
          action={
            google ? (
              <button type="button" disabled={busy} onClick={onUnlinkGoogle} className={`${pill} border border-[#D1CEC5] text-[#A34F45]`}>
                {c.unlinkCta}
              </button>
            ) : (
              <button type="button" onClick={() => openOutsideSignedIn("/account")} className={`${pill} bg-[#3D5A73] text-white`}>
                {c.linkCta}
              </button>
            )
          }
        />
        <MethodRow
          icon={<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3D5A73]/10 text-[#3D5A73]"><Mail className="h-5 w-5" /></span>}
          title={c.email}
          detail={email ? email.email || user?.email || c.connected : c.emailUnset}
          connected={!!email}
          action={
            <button
              type="button"
              onClick={() => open(email ? "password" : "email")}
              className={`${pill} ${email ? "border border-[#D1CEC5] text-[#26343F]" : "bg-[#3D5A73] text-white"}`}
            >
              {email ? <KeyRound className="h-3.5 w-3.5" aria-label={c.passwordChange} /> : c.emailSet}
            </button>
          }
        />
      </div>

      {form === "email" && (
        <EmailForm
          c={c}
          fixedEmail={user?.email || ""}
          busy={busy}
          setBusy={setBusy}
          onError={setError}
          onDone={async () => {
            await refreshUser();
            setForm("none");
            setNotice(c.emailSaved);
          }}
          onCancel={() => setForm("none")}
        />
      )}
      {form === "password" && (
        <PasswordForm
          c={c}
          busy={busy}
          setBusy={setBusy}
          onError={setError}
          onDone={() => {
            setForm("none");
            setNotice(c.passwordSaved);
          }}
          onCancel={() => setForm("none")}
        />
      )}
      {error && <p className="mt-3 text-xs font-semibold text-[#A34F45]">{error}</p>}
      {notice && <p className="mt-3 text-xs font-semibold text-[#2E7D32]">{notice}</p>}
    </section>
  );
}

type FormProps = {
  c: LineCopy;
  busy: boolean;
  setBusy: (b: boolean) => void;
  onError: (msg: string) => void;
  onDone: () => void | Promise<void>;
  onCancel: () => void;
};

function FormButtons({ c, busy, onCancel }: { c: LineCopy; busy: boolean; onCancel: () => void }) {
  return (
    <div className="flex gap-2 pt-1">
      <button type="button" onClick={onCancel} className="flex-1 rounded-full border border-[#D1CEC5] py-2.5 text-sm font-semibold text-[#26343F] cursor-pointer">
        {c.cancel}
      </button>
      <button type="submit" disabled={busy} className="flex-1 rounded-full bg-[#26343F] py-2.5 text-sm font-semibold text-white cursor-pointer disabled:opacity-50">
        {busy ? c.saving : c.save}
      </button>
    </div>
  );
}

// ตั้งอีเมล+รหัสผ่านให้บัญชี LINE — ถ้ามีอีเมลจาก Google อยู่แล้วต้องใช้อีเมลนั้น (ล็อกช่องไว้)
function EmailForm({ c, fixedEmail, busy, setBusy, onError, onDone, onCancel }: FormProps & { fixedEmail: string }) {
  const [emailValue, setEmailValue] = useState(fixedEmail);
  const [password, setPassword] = useState("");
  const [confirmValue, setConfirmValue] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return onError(c.passwordShort);
    if (password !== confirmValue) return onError(c.passwordMismatch);
    onError("");
    setBusy(true);
    try {
      await linkEmail(emailValue.trim(), password);
      await onDone();
    } catch (err) {
      onError(errorText(err, c));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-xl bg-[#F0EFEB] p-3">
      <label className="block text-xs font-semibold text-[#66737D]">
        {c.emailLabel}
        <input
          type="email"
          required
          autoComplete="email"
          value={emailValue}
          readOnly={!!fixedEmail}
          onChange={(e) => setEmailValue(e.target.value)}
          className={`mt-1 ${inputClass}`}
        />
        {fixedEmail && <span className="mt-1 block font-normal text-[#9AA4AA]">{c.googleFromEmail}</span>}
      </label>
      <label className="block text-xs font-semibold text-[#66737D]">
        {c.passwordLabel}
        <input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`mt-1 ${inputClass}`} />
      </label>
      <label className="block text-xs font-semibold text-[#66737D]">
        {c.passwordConfirm}
        <input type="password" required autoComplete="new-password" value={confirmValue} onChange={(e) => setConfirmValue(e.target.value)} className={`mt-1 ${inputClass}`} />
      </label>
      <FormButtons c={c} busy={busy} onCancel={onCancel} />
    </form>
  );
}

function PasswordForm({ c, busy, setBusy, onError, onDone, onCancel }: FormProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 6) return onError(c.passwordShort);
    onError("");
    setBusy(true);
    try {
      await changePassword(current, next);
      await onDone();
    } catch (err) {
      onError(errorText(err, c));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-xl bg-[#F0EFEB] p-3">
      <label className="block text-xs font-semibold text-[#66737D]">
        {c.currentPassword}
        <input type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={`mt-1 ${inputClass}`} />
      </label>
      <label className="block text-xs font-semibold text-[#66737D]">
        {c.newPassword}
        <input type="password" required autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={`mt-1 ${inputClass}`} />
      </label>
      <FormButtons c={c} busy={busy} onCancel={onCancel} />
    </form>
  );
}
