"use client";

import Link from "next/link";
import type { Profile } from "@/lib/types";
import { getAvatarUrl } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { BookOpen, Sparkles, UserCheck } from "lucide-react";

export function UserCard({ profile, count }: { profile: Profile; count: number }) {
  const { t } = useLanguage();

  return (
    <div className="relative border-t border-[#3D5A73]/20 rounded-t-2xl bg-[#FAF9F6] p-4 sm:p-5 shadow-xs">
      {/* Top Notebook Accent Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E6E3DC] text-[#3D5A73] font-bold text-lg border border-[#D1CEC5] overflow-hidden shadow-2xs">
            {profile.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getAvatarUrl(profile.picture)}
                alt={profile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{profile.name?.charAt(0) || "U"}</span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#26343F] truncate">
                {profile.name}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#3D5A73]/10 px-2 py-0.5 text-[11px] font-semibold text-[#3D5A73] border border-[#3D5A73]/20">
                <Sparkles className="h-3 w-3" />
                {profile.tier === "premium" ? t("usercard_premium") : t("usercard_free")}
              </span>
            </div>
            <p className="text-xs text-[#66737D] mt-0.5 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-[#2E7D32]" />
              <span>{t("usercard_ready")}</span>
            </p>
          </div>
        </div>

        {/* Stats Pill & Quick Link */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#D1CEC5]/50">
          <div className="flex items-center gap-2 rounded-xl bg-white border border-[#D1CEC5] px-3 py-1.5 shadow-2xs">
            <BookOpen className="h-4 w-4 text-[#3D5A73]" />
            <div className="text-center flex justify-between items-center gap-2">
              <span className="block text-[10px] text-[#66737D] leading-none">{t("usercard_total")}</span>
              <span className="text-xs font-bold text-[#26343F]">{count} {t("common_times")}</span>
            </div>
          </div>

          <Link
            href="/account"
            className="text-xs font-semibold text-[#3D5A73] hover:underline"
          >
            {t("usercard_manage")}
          </Link>
        </div>
      </div>
      <div
        className="
          absolute
          left-0
          -bottom-2
          w-full
          h-4
          bg-[#FAF9F6]
          mask-[url('/wave.svg')]
          mask-repeat-x
          mask-size-[32px_16px]
          transform-[scaleY(-1)]
        "
      />
    </div>
  );
}