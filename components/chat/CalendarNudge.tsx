"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, X } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { getIntegrations } from "@/lib/api";

const DISMISS_KEY = "jodjod_calendar_nudge_dismissed";

// การ์ดชวนเชื่อม Google Calendar ในแผงข้างหน้าแชท: แสดงเมื่อ server พร้อมแต่ผู้ใช้ยังไม่ได้เชื่อม
export function CalendarNudge() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // localStorage ใช้ไม่ได้ (private mode ฯลฯ) ก็แสดงตามปกติ
    }
    if (dismissed) return;
    let cancelled = false;
    getIntegrations()
      .then((s) => {
        if (!cancelled) setShow(s.google_calendar.available && !s.google_calendar.connected);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ไม่เป็นไร แค่จะเห็นการ์ดอีกครั้งตอนเปิดหน้าใหม่
    }
  };

  return (
    <div className="mx-4 mt-4 flex items-start gap-3 rounded-2xl bg-[#3D5A73] p-3.5 text-white">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
        <CalendarDays className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{t("chat_cal_nudge_title")}</p>
        <p className="mt-0.5 text-xs text-white/75">{t("chat_cal_nudge_desc")}</p>
        <Link
          href="/account"
          className="mt-2 inline-block rounded-full bg-[#E59AA5] px-3 py-1 text-xs font-bold text-[#26343F] hover:bg-[#F0B3BC]"
        >
          {t("chat_cal_nudge_cta")}
        </Link>
      </div>
      <button type="button" onClick={dismiss} aria-label={t("common_close")} className="rounded-full p-1 text-white/70 hover:bg-white/10 cursor-pointer">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
