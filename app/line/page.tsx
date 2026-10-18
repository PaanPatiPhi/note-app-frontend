"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import liff from "@line/liff";
import { CalendarDays, ListChecks, MessageCircle, StickyNote, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { loginWithLine } from "@/lib/api";
import Loading from "@/components/Loading";
import { AccountTab, AgendaTab, ListsTab, NotesTab, lineCopy } from "@/components/line/LineTabs";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID ?? "";

type Tab = "agenda" | "lists" | "notes" | "account";
const TABS: { id: Tab; icon: typeof ListChecks }[] = [
  { id: "agenda", icon: CalendarDays },
  { id: "lists", icon: ListChecks },
  { id: "notes", icon: StickyNote },
  { id: "account", icon: UserRound },
];

const authCopy = {
  th: {
    signingIn: "กำลังเข้าสู่ระบบด้วย LINE...",
    failed: "เข้าสู่ระบบด้วย LINE ไม่สำเร็จ",
    useWeb: "เข้าสู่ระบบบนเว็บ",
    ask: "บอกพี่จ๊อด",
    hello: "สวัสดีครับ",
  },
  en: {
    signingIn: "Signing in with LINE...",
    failed: "Couldn't sign in with LINE",
    useWeb: "Sign in on the web",
    ask: "Tell Jod",
    hello: "Hi",
  },
};

function tabFromUrl(): Tab {
  if (typeof window === "undefined") return "agenda";
  // LIFF ส่ง query ของ deep link มาใน liff.state ตอนเปิดครั้งแรก เช่น ?liff.state=%3Ftab%3Dlists
  const params = new URLSearchParams(window.location.search);
  let tab = params.get("tab");
  const state = params.get("liff.state");
  if (!tab && state) tab = new URLSearchParams(state.replace(/^[^?]*\?/, "")).get("tab");
  return TABS.some((t) => t.id === tab) ? (tab as Tab) : "agenda";
}

// หน้า LIFF: เปิดจาก rich menu ใน LINE → login อัตโนมัติด้วย LINE แล้วดูนัด/เตือน ลิสต์ โน้ต และแพ็กเกจ
// การสั่งงานพี่จ๊อดทำในแชท LINE (ปุ่ม "บอกพี่จ๊อด" ปิดหน้านี้กลับไปที่แชท)
export default function LinePage() {
  const { isLoading, isAuthenticated, user, refreshUser } = useAuth();
  const { language } = useLanguage();
  const c = lineCopy[language];
  const a = authCopy[language];
  const [tab, setTab] = useState<Tab>(tabFromUrl);
  const [authError, setAuthError] = useState(false);
  const [inClient, setInClient] = useState(false);

  // ยังไม่ได้ login: ใช้ LIFF ขอ ID token แล้วแลกเป็น session ของเรา
  useEffect(() => {
    if (isLoading || isAuthenticated || !LIFF_ID) return;
    let cancelled = false;
    (async () => {
      try {
        await liff.init({ liffId: LIFF_ID });
        if (cancelled) return;
        setInClient(liff.isInClient());
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }
        const idToken = liff.getIDToken();
        if (!idToken) throw new Error("no LINE ID token");
        await loginWithLine(idToken);
        await refreshUser();
      } catch (err) {
        console.error("LIFF sign-in failed:", err);
        if (!cancelled) setAuthError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated, refreshUser]);

  // login อยู่แล้ว (เช่นเปิดจาก browser): init LIFF เงียบๆ เพื่อรู้ว่าอยู่ในแอป LINE ไหม
  useEffect(() => {
    if (!isAuthenticated || !LIFF_ID) return;
    liff
      .init({ liffId: LIFF_ID })
      .then(() => setInClient(liff.isInClient()))
      .catch(() => {});
  }, [isAuthenticated]);

  const selectTab = (t: Tab) => {
    setTab(t);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", t);
    url.searchParams.delete("liff.state");
    window.history.replaceState(null, "", url.pathname + url.search);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        {authError || !LIFF_ID ? (
          <>
            <p className="font-semibold text-[#26343F]">{a.failed}</p>
            <Link href="/login" className="rounded-full bg-[#26343F] px-5 py-2 text-sm font-semibold text-white">
              {a.useWeb}
            </Link>
          </>
        ) : (
          <Loading size="sm" text={a.signingIn} />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex shrink-0 items-center justify-between px-4 pt-4 pb-3">
        <div>
          <p className="font-display text-lg leading-none text-[#3D5A73]">จดจด</p>
          <p className="mt-1 text-xs text-[#66737D]">
            {a.hello} {user?.display_name?.split(" ")[0]}
          </p>
        </div>
        {inClient ? (
          <button
            type="button"
            onClick={() => liff.closeWindow()}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#06C755] px-3.5 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" /> {a.ask}
          </button>
        ) : (
          <Link href="/chat" className="inline-flex items-center gap-1.5 rounded-full bg-[#26343F] px-3.5 py-2 text-xs font-bold text-white">
            <MessageCircle className="h-4 w-4" /> {a.ask}
          </Link>
        )}
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <h1 className="mb-3 text-xl font-bold text-[#26343F]">{c.tabs[tab]}</h1>
        {tab === "agenda" && <AgendaTab c={c} />}
        {tab === "lists" && <ListsTab c={c} />}
        {tab === "notes" && <NotesTab c={c} />}
        {tab === "account" && <AccountTab c={c} />}
      </main>

      {/* แท็บล่างแบบแอปมือถือ (เว้นที่ให้แถบล่างของ iPhone) */}
      <nav className="grid shrink-0 grid-cols-4 border-t border-[#E6E3DC] bg-[#FAF9F6] pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium cursor-pointer ${tab === id ? "text-[#3D5A73]" : "text-[#9AA4AA]"}`}
          >
            <Icon className="h-5 w-5" />
            {c.tabs[id]}
          </button>
        ))}
      </nav>
    </div>
  );
}
