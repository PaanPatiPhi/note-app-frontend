"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getAvatarUrl } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { LogOut, BookOpen, LogIn, Edit3, MessageSquareHeart, MessagesSquare, Crown, ShieldCheck } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, identities, isAuthenticated, isLoading, logout } = useAuth();
  const { t } = useLanguage();

  const isLineConnected = identities.some((i) => i.provider === "line");
  const lineAvatar = identities.find((i) => i.provider === "line")?.avatar_url;
  const displayAvatar = user?.avatar_url || lineAvatar;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#D1CEC5] bg-[#FAF9F6]/95 backdrop-blur-md shadow-2xs">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3D5A73] text-[#FAF9F6] shadow-xs group-hover:bg-[#30475C] transition-all group-hover:scale-105">
            <Edit3 className="h-4.5 w-4.5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-['Chonburi'] text-2xl font-bold tracking-wide text-[#3D5A73]">
              จดจด
            </span>
          </div>
        </Link>

        {/* Nav Links & Actions */}
        <nav className="flex items-center gap-1.5 sm:gap-2.5">
          {!isLoading && isAuthenticated ? (
            <>
              {/* Authenticated Links */}
              <Link
                href="/chat"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname === "/chat"
                    ? "bg-[#3D5A73] text-white shadow-xs"
                    : "text-[#66737D] hover:bg-[#E6E3DC]/60 hover:text-[#26343F]"
                }`}
              >
                <MessagesSquare className="h-4 w-4" />
                <span>{t("nav_chat")}</span>
              </Link>

              <Link
                href="/notes"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname === "/notes"
                    ? "bg-[#3D5A73] text-white shadow-xs"
                    : "text-[#66737D] hover:bg-[#E6E3DC]/60 hover:text-[#26343F]"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav_notes")}</span>
              </Link>

              <Link
                href="/subscription"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname === "/subscription"
                    ? "bg-[#3D5A73] text-white shadow-xs"
                    : "text-[#66737D] hover:bg-[#E6E3DC]/60 hover:text-[#26343F]"
                }`}
              >
                <Crown className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="hidden sm:inline">{t("nav_subscription")}</span>
              </Link>

              <Link
                href="/feedback"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname === "/feedback"
                    ? "bg-[#3D5A73] text-white shadow-xs"
                    : "text-[#66737D] hover:bg-[#E6E3DC]/60 hover:text-[#26343F]"
                }`}
              >
                <MessageSquareHeart className="h-4 w-4" />
                <span className="hidden md:inline">{t("nav_feedback")}</span>
              </Link>

              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    pathname.startsWith("/admin")
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-emerald-800 bg-emerald-100/60 hover:bg-emerald-100 hover:text-emerald-950 border border-emerald-300/60"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>{t("nav_admin")}</span>
                </Link>
              )}

              {/* Language Switcher */}
              <LanguageToggle />

              {/* User Profile & Logout */}
              <div className="flex items-center pl-1 sm:pl-2 ml-0.5 sm:ml-1 border-l border-[#D1CEC5] gap-1.5 sm:gap-2">
                <Link
                  href="/account"
                  title={t("nav_account")}
                  aria-label={t("nav_account")}
                  className={`relative rounded-full transition-all focus:outline-none ${
                    pathname === "/account"
                      ? "ring-2 ring-[#3D5A73] ring-offset-2 ring-offset-[#FAF9F6]"
                      : "ring-1 ring-[#D1CEC5] hover:ring-[#3D5A73]/40 active:scale-95"
                  }`}
                >
                  {displayAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getAvatarUrl(displayAvatar)}
                      alt={user?.display_name || "User"}
                      className="h-8 w-8 rounded-full border border-[#D1CEC5] object-cover hover:opacity-85 transition-opacity"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E6E3DC] text-xs font-bold text-[#3D5A73] border border-[#D1CEC5] hover:bg-[#d8d4cb] transition-colors">
                      {user?.display_name?.charAt(0) || "U"}
                    </div>
                  )}
                  {user?.tier === "premium" && (
                    <span
                      className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-amber-950 ring-2 ring-[#FAF9F6] shadow-2xs"
                      title="Premium Member"
                    >
                      <Crown className="h-2.5 w-2.5 fill-amber-900" />
                    </span>
                  )}
                  {isLineConnected && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 inline-flex h-2.5 w-2.5 rounded-full bg-[#06C755] ring-2 ring-[#FAF9F6]"
                      title="เชื่อมต่อ LINE แล้ว"
                    />
                  )}
                </Link>

                <button
                  onClick={async () => {
                    await logout();
                    toast.add({
                      type: "info",
                      title: t("nav_logout"),
                      description: "คุณได้ออกจากระบบเรียบร้อยแล้ว",
                    });
                  }}
                  title={t("nav_logout")}
                  className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-[#66737D] hover:bg-[#A34F45]/10 hover:text-[#A34F45] transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">{t("nav_logout")}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Guest Links */}
              <div className="hidden md:flex items-center gap-1">
                <Link
                  href="/#features"
                  className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-[#66737D] hover:bg-[#E6E3DC]/60 hover:text-[#26343F] transition-colors"
                >
                  {t("nav_features")}
                </Link>
                <Link
                  href="/#line-bot"
                  className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-[#66737D] hover:bg-[#E6E3DC]/60 hover:text-[#26343F] transition-colors"
                >
                  {t("nav_line_bot")}
                </Link>
                <Link
                  href="/#how-it-works"
                  className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-[#66737D] hover:bg-[#E6E3DC]/60 hover:text-[#26343F] transition-colors"
                >
                  {t("nav_how_it_works")}
                </Link>
                <Link
                  href="/subscription"
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    pathname === "/subscription"
                      ? "text-[#3D5A73] font-semibold bg-[#E6E3DC]/80"
                      : "text-[#66737D] hover:bg-[#E6E3DC]/60 hover:text-[#26343F]"
                  }`}
                >
                  {t("nav_subscription")}
                </Link>
              </div>

              {/* Language Switcher for Guests */}
              <LanguageToggle />

              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-xl bg-[#3D5A73] px-4 py-2 text-xs sm:text-sm font-semibold text-[#FAF9F6] shadow-xs hover:bg-[#30475C] active:scale-98 transition-all cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>{t("nav_login")}</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
