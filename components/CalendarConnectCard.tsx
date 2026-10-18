"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Circle, Link as LinkIcon, Unlink } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/components/ui/toast";
import Loading from "@/components/Loading";
import { disconnectGoogleCalendar, getIntegrations, startGoogleCalendarConnect } from "@/lib/api";
import type { IntegrationsStatus } from "@/lib/types";

type Calendar = IntegrationsStatus["google_calendar"];

// การ์ดเชื่อม Google Calendar ในหน้า /account
// กดเชื่อม → ไปหน้าขออนุญาตของ Google → backend พากลับมาที่ /account?google_calendar=connected|denied|error
export function CalendarConnectCard() {
  const { t } = useLanguage();
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // แสดงผลลัพธ์ที่ Google พากลับมา แล้วลบออกจาก URL ไม่ให้ขึ้นซ้ำตอน refresh
    const url = new URL(window.location.href);
    const result = url.searchParams.get("google_calendar");
    if (result) {
      if (result === "connected") toast.add({ type: "success", description: t("account_cal_toast_connected") });
      else if (result === "denied") toast.add({ type: "error", description: t("account_cal_toast_denied") });
      else toast.add({ type: "error", description: t("account_cal_toast_error") });
      url.searchParams.delete("google_calendar");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }

    getIntegrations()
      .then((s) => setCalendar(s.google_calendar))
      .catch(() => setCalendar({ available: false, connected: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = async () => {
    setBusy(true);
    try {
      window.location.href = await startGoogleCalendarConnect();
    } catch (err: unknown) {
      toast.add({ type: "error", description: (err as Error)?.message || t("account_cal_toast_error") });
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!confirm(t("account_cal_confirm_disconnect"))) return;
    setBusy(true);
    try {
      await disconnectGoogleCalendar();
      setCalendar((c) => (c ? { ...c, connected: false, email: undefined } : c));
      toast.add({ type: "success", description: t("account_cal_toast_disconnected") });
    } catch (err: unknown) {
      toast.add({ type: "error", description: (err as Error)?.message || t("account_cal_toast_error") });
    } finally {
      setBusy(false);
    }
  };

  const connected = !!calendar?.connected;
  const description = !calendar
    ? ""
    : connected
      ? `${t("account_cal_connected_as")}${calendar.email || "Google"}`
      : calendar.available
        ? t("account_cal_unlinked_desc")
        : t("account_cal_unavailable");

  return (
    <section className="rounded-2xl border border-[#D1CEC5] bg-[#FAF9F6] p-6 shadow-xs mb-6">
      <div className="mb-5">
        <h3 className="text-base font-bold text-[#26343F]">{t("account_cal_title")}</h3>
        <p className="text-xs text-[#66737D] mt-0.5">{t("account_cal_desc")}</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#D1CEC5]/70 bg-[#F0EFEB]/50 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-[#D1CEC5]/60 shadow-2xs text-[#4285F4]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#26343F]">{t("account_cal_google")}</span>
              {calendar &&
                (connected ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2E7D32]">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {t("account_connected")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-[#66737D]">
                    <Circle className="h-3.5 w-3.5" /> {t("account_not_connected")}
                  </span>
                ))}
            </div>
            <p className="text-xs text-[#66737D] mt-0.5 truncate">{description}</p>
          </div>
        </div>

        <div>
          {!calendar ? (
            <Loading size="xs" />
          ) : connected ? (
            <button
              onClick={disconnect}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1CEC5] bg-white px-3 py-1.5 text-xs font-medium text-[#A34F45] hover:bg-[#A34F45]/10 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {busy ? <Loading size="xs" /> : <Unlink className="h-3.5 w-3.5" />}
              <span>{busy ? t("account_btn_unlinking") : t("account_btn_unlink")}</span>
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={busy || !calendar.available}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#3D5A73] px-4 py-2 text-xs font-semibold text-white hover:bg-[#30475C] shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              {busy ? <Loading size="xs" /> : <LinkIcon className="h-3.5 w-3.5" />}
              <span>{busy ? t("account_cal_btn_connecting") : t("account_cal_btn_connect")}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
