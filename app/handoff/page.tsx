"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { exchangeHandoff } from "@/lib/api";
import Loading from "@/components/Loading";

const copy = {
  th: { working: "กำลังเปิดบัญชีของคุณ...", failed: "ลิงก์หมดอายุหรือถูกใช้ไปแล้ว", hint: "กลับไปกดใหม่จากใน LINE หรือเข้าสู่ระบบบนเว็บ", login: "เข้าสู่ระบบ" },
  en: { working: "Opening your account...", failed: "This link has expired or was already used", hint: "Tap the button in LINE again, or sign in on the web", login: "Sign in" },
};

// ไปได้เฉพาะหน้าในเว็บเราเอง (กันลิงก์พาออกไปเว็บอื่น)
function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account";
}

// /handoff?code=...&next=/account — เปิดจากหน้า LIFF ใน browser ภายนอก (เช่นตอนเชื่อม Google)
// แลกรหัสใช้ครั้งเดียวเป็น session แล้วไปหน้าที่ต้องการ โดยไม่ต้อง login ใหม่
export default function HandoffPage() {
  const router = useRouter();
  const { isLoading, refreshUser } = useAuth();
  const { language } = useLanguage();
  const c = copy[language];
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    // รอให้ AuthProvider เช็ค session เดิมเสร็จก่อน ไม่งั้นผล 401 ที่มาทีหลังจะลบ token ใหม่ทิ้ง
    // และกันแลกซ้ำ (รหัสใช้ได้ครั้งเดียว, React dev รัน effect สองรอบ)
    if (isLoading || started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const next = safeNext(params.get("next"));
    // ลบรหัสออกจาก URL/ประวัติ ทันที
    window.history.replaceState(null, "", "/handoff");
    (code ? exchangeHandoff(code) : Promise.reject(new Error("no handoff code")))
      .then(() => refreshUser())
      .then(() => router.replace(next))
      .catch(() => setFailed(true));
  }, [isLoading, refreshUser, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      {failed ? (
        <>
          <p className="font-semibold text-[#26343F]">{c.failed}</p>
          <p className="text-sm text-[#66737D]">{c.hint}</p>
          <Link href="/login" className="mt-2 rounded-full bg-[#26343F] px-5 py-2 text-sm font-semibold text-white">
            {c.login}
          </Link>
        </>
      ) : (
        <Loading size="sm" text={c.working} />
      )}
    </div>
  );
}
