"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { Navbar } from "@/components/Navbar";
import Loading from "@/components/Loading";
import { toast } from "@/components/ui/toast";
import { getAvatarUrl } from "@/lib/api";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  RefreshCw,
  Link as LinkIcon,
  Unlink,
  ShieldCheck,
  Mail,
  Calendar,
  Camera,
  Upload,
  Edit2,
  Check,
  X,
  ImageIcon,
  MessageSquareHeart,
  ChevronRight,
  Crown,
} from "lucide-react";
import liff from "@line/liff";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID ?? "";

export default function AccountPage() {
  const router = useRouter();
  const {
    user,
    identities,
    isLoading,
    isAuthenticated,
    linkGoogleAccount,
    unlinkGoogleAccount,
    linkLineAccount,
    unlinkLineAccount,
    uploadAvatar,
    updateProfile,
    refreshUser,
  } = useAuth();
  const { t, language } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState("");
  const [isSavingUrl, setIsSavingUrl] = useState(false);

  const [isLinkingLine, setIsLinkingLine] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleConnect = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setErrorMessage(null);
      try {
        const res = await linkGoogleAccount(tokenResponse.access_token);
        toast.add({
          type: "success",
          description: res.message || "Google Account connected!",
        });
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message || "Failed to connect Google";
        setErrorMessage(msg);
        toast.add({ type: "error", description: msg });
      }
    },
    onError: () => {
      toast.add({ type: "error", description: "Google connection failed" });
    },
  });

  if (isLoading) {
    return <Loading fullScreen text={t("common_loading")} />;
  }

  if (!isAuthenticated || !user) {
    router.push("/login");
    return null;
  }

  const googleIdentity = identities.find((i) => i.provider === "google");
  const lineIdentity = identities.find((i) => i.provider === "line");
  const emailIdentity = identities.find((i) => i.provider === "email");

  const effectiveAvatar = user.avatar_url || lineIdentity?.avatar_url;
  const isLineAvatar = !!lineIdentity?.avatar_url && (user.avatar_url === lineIdentity.avatar_url || !user.avatar_url);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.add({ type: "error", description: "Only image files (.jpg, .png, .webp, .gif) are supported" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.add({ type: "error", description: "Image file size must be less than 5 MB" });
      return;
    }

    setIsUploadingAvatar(true);
    setErrorMessage(null);
    try {
      await uploadAvatar(file);
      toast.add({ type: "success", description: t("account_toast_avatar_success") });
    } catch (err: any) {
      const msg = err.message || "Failed to upload avatar";
      setErrorMessage(msg);
      toast.add({ type: "error", description: msg });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUseLineAvatar = async () => {
    if (!lineIdentity?.avatar_url) {
      toast.add({ type: "error", description: "LINE avatar not found" });
      return;
    }

    setIsUploadingAvatar(true);
    setErrorMessage(null);
    try {
      await updateProfile({ avatar_url: lineIdentity.avatar_url });
      toast.add({ type: "success", description: t("account_toast_line_avatar_success") });
    } catch (err: any) {
      const msg = err.message || "Failed to switch avatar";
      setErrorMessage(msg);
      toast.add({ type: "error", description: msg });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveAvatarUrl = async () => {
    const trimmed = urlInputValue.trim();
    if (!trimmed) return;

    setIsSavingUrl(true);
    setErrorMessage(null);
    try {
      await updateProfile({ avatar_url: trimmed });
      toast.add({ type: "success", description: t("account_toast_avatar_success") });
      setShowUrlInput(false);
      setUrlInputValue("");
    } catch (err: any) {
      const msg = err.message || "Failed to update avatar";
      setErrorMessage(msg);
      toast.add({ type: "error", description: msg });
    } finally {
      setIsSavingUrl(false);
    }
  };

  const handleSaveDisplayName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === user.display_name) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      await updateProfile({ display_name: trimmed });
      toast.add({ type: "success", description: t("account_toast_name_success") });
      setIsEditingName(false);
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to update name" });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!confirm(t("account_confirm_unlink_google"))) {
      return;
    }

    setIsUnlinking(true);
    setErrorMessage(null);
    try {
      await unlinkGoogleAccount();
      toast.add({
        type: "success",
        description: "Google disconnected successfully",
      });
    } catch (err: any) {
      const msg = err.message || "Failed to disconnect Google";
      setErrorMessage(msg);
      toast.add({ type: "error", description: msg });
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleConnectLine = async () => {
    setErrorMessage(null);
    if (!LIFF_ID) {
      setErrorMessage("NEXT_PUBLIC_LIFF_ID missing");
      return;
    }

    setIsLinkingLine(true);
    try {
      await liff.init({ liffId: LIFF_ID });
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.origin + "/account" });
        return;
      }

      const idToken = liff.getIDToken();
      if (!idToken) {
        setErrorMessage("Failed to retrieve LINE token");
        return;
      }

      const res = await linkLineAccount(idToken);
      toast.add({
        type: "success",
        description: res.message || "LINE Account connected! Notes will sync with LINE Bot.",
      });
    } catch (err: any) {
      const msg = err.message || "Failed to connect LINE";
      setErrorMessage(msg);
      toast.add({
        type: "error",
        description: msg,
      });
    } finally {
      setIsLinkingLine(false);
    }
  };

  const handleUnlinkLine = async () => {
    if (!confirm(t("account_confirm_unlink_line"))) {
      return;
    }

    setIsUnlinking(true);
    setErrorMessage(null);
    try {
      await unlinkLineAccount();
      toast.add({
        type: "success",
        description: "LINE disconnected successfully",
      });
    } catch (err: any) {
      const msg = err.message || "Failed to disconnect LINE";
      setErrorMessage(msg);
      toast.add({ type: "error", description: msg });
    } finally {
      setIsUnlinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0EFEB]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="font-['Chonburi'] text-2xl font-bold tracking-tight text-[#3D5A73]">
            {t("account_page_title")}
          </h1>
          <p className="text-xs sm:text-sm text-[#66737D] mt-1">
            {t("account_page_subtitle")}
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#A34F45]/30 bg-[#A34F45]/10 p-4 text-sm text-[#A34F45]">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="mt-0.5 text-xs opacity-90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Hidden File Input for Avatar */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Section 1: JodJod Primary Account Info */}
        <section className="mb-6 rounded-2xl border border-[#D1CEC5] bg-[#FAF9F6] p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar with Camera Overlay */}
            <div className="relative group shrink-0">
              <div
                onClick={() => fileInputRef.current?.click()}
                title={t("account_avatar_change")}
                className="relative h-20 w-20 rounded-full border-2 border-[#D1CEC5] overflow-hidden cursor-pointer shadow-xs transition-transform hover:scale-102"
              >
                {effectiveAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getAvatarUrl(effectiveAvatar)}
                    alt={user.display_name || "Avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#E6E3DC] text-2xl font-bold text-[#3D5A73]">
                    {user.display_name?.charAt(0) || "U"}
                  </div>
                )}

                {/* Hover overlay with Camera */}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5" />
                  <span className="text-[10px] mt-0.5 font-medium">{t("account_avatar_change")}</span>
                </div>

                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                    <Loading size="sm" />
                  </div>
                )}
              </div>

              {/* Floating Camera Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#3D5A73] text-white shadow-md hover:bg-[#30475C] transition-colors cursor-pointer"
                title={t("account_upload_avatar")}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Profile Info & Actions */}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex flex-wrap items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder={t("account_name_placeholder")}
                      className="rounded-lg border border-[#3D5A73] bg-white px-2.5 py-1 text-sm font-semibold text-[#26343F] focus:outline-hidden"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveDisplayName}
                      disabled={isSavingName}
                      className="rounded-lg bg-[#3D5A73] p-1.5 text-white hover:bg-[#30475C] disabled:opacity-50 transition-colors cursor-pointer"
                      title={t("common_save")}
                    >
                      {isSavingName ? <Loading size="xs" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="rounded-lg border border-[#D1CEC5] bg-white p-1.5 text-[#66737D] hover:bg-[#E6E3DC]/60 transition-colors cursor-pointer"
                      title={t("common_cancel")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-[#26343F] truncate">
                      {user.display_name || `${t("common_user")} JodJod`}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setNameInput(user.display_name || "");
                        setIsEditingName(true);
                      }}
                      className="rounded p-1 text-[#66737D] hover:bg-[#E6E3DC]/60 hover:text-[#3D5A73] transition-colors cursor-pointer"
                      title={t("account_name_edit_btn")}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {user.tier === "premium" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-900 shadow-2xs">
                        <Crown className="h-3 w-3 text-amber-600 fill-amber-500" /> {t("account_badge_premium")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#E6E3DC] px-2.5 py-0.5 text-xs font-medium text-[#66737D]">
                        {t("account_badge_free")}
                      </span>
                    )}

                    {user.role === "admin" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                        <ShieldCheck className="h-3 w-3 text-emerald-700" /> {t("account_badge_admin")}
                      </span>
                    )}
                  </>
                )}
              </div>

              {user.email && (
                <p className="flex items-center gap-1.5 text-xs text-[#66737D] mt-1 truncate">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </p>
              )}
              <p className="flex items-center gap-1.5 text-[11px] text-[#66737D] mt-1">
                <Calendar className="h-3.5 w-3.5" /> {t("account_member_since")} {new Date(user.created_at).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
              </p>

              {/* Avatar Options & Source Indicator */}
              <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-[#D1CEC5]/50">
                {/* Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1CEC5] bg-white px-2.5 py-1 text-xs font-medium text-[#26343F] hover:bg-[#E6E3DC]/60 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5 text-[#3D5A73]" />
                  <span>{t("account_avatar_upload_new")}</span>
                </button>

                {/* If LINE is connected and has picture, allow using or showing it */}
                {lineIdentity?.avatar_url && (
                  <button
                    type="button"
                    onClick={handleUseLineAvatar}
                    disabled={isUploadingAvatar || isLineAvatar}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      isLineAvatar
                        ? "bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/30 cursor-default"
                        : "border border-[#D1CEC5] bg-white text-[#26343F] hover:bg-[#06C755]/10 hover:text-[#06C755]"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-[#06C755]" />
                    <span>{isLineAvatar ? t("account_avatar_line_using") : t("account_avatar_line_use")}</span>
                  </button>
                )}

                {/* Custom URL Option */}
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[#66737D] hover:bg-[#E6E3DC]/60 hover:text-[#26343F] transition-colors cursor-pointer"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>{showUrlInput ? t("account_avatar_url_close") : t("account_avatar_url_btn")}</span>
                </button>
              </div>

              {/* URL Input Form if toggled */}
              {showUrlInput && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#D1CEC5] bg-white p-1.5">
                  <input
                    type="url"
                    placeholder={t("account_avatar_url_placeholder")}
                    value={urlInputValue}
                    onChange={(e) => setUrlInputValue(e.target.value)}
                    className="flex-1 bg-transparent px-2 text-xs text-[#26343F] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleSaveAvatarUrl}
                    disabled={isSavingUrl || !urlInputValue.trim()}
                    className="rounded bg-[#3D5A73] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#30475C] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isSavingUrl ? t("account_avatar_url_saving") : t("account_avatar_url_save")}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#D1CEC5]/60 flex items-center justify-between text-xs text-[#66737D]">
            <span>{t("account_id_label")} <code className="font-mono text-[#26343F] bg-[#E6E3DC]/60 px-1.5 py-0.5 rounded">{user.id}</code></span>
            <button
              onClick={() => refreshUser()}
              className="flex items-center gap-1 hover:text-[#3D5A73] transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> {t("account_refresh")}
            </button>
          </div>
        </section>

        {/* Section 2: Connected Accounts (Identities) */}
        <section className="rounded-2xl border border-[#D1CEC5] bg-[#FAF9F6] p-6 shadow-xs mb-6">
          <div className="mb-5">
            <h3 className="text-base font-bold text-[#26343F]">
              {t("account_connected_title")}
            </h3>
            <p className="text-xs text-[#66737D] mt-0.5">
              {t("account_connected_desc")}
            </p>
          </div>

          <div className="space-y-4">
            {/* 1. Email & Password Identity Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#D1CEC5]/70 bg-[#F0EFEB]/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#D1CEC5]/60 shadow-2xs text-[#3D5A73]">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#26343F]">{t("account_provider_email")}</span>
                    {user.email || emailIdentity ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2E7D32]">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {t("account_provider_status_active")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-[#66737D]">
                        <Circle className="h-3.5 w-3.5" /> {t("account_provider_status_unset")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#66737D] mt-0.5">
                    {user.email || emailIdentity?.email || t("account_provider_email_unset")}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Google Identity Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#D1CEC5]/70 bg-[#F0EFEB]/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#D1CEC5]/60 shadow-2xs">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#26343F]">{t("account_provider_google")}</span>
                    {googleIdentity ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2E7D32]">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {t("account_connected")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-[#66737D]">
                        <Circle className="h-3.5 w-3.5" /> {t("account_not_connected")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#66737D] mt-0.5">
                    {googleIdentity?.email || (googleIdentity ? t("account_google_linked_desc") : t("account_google_unlinked_desc"))}
                  </p>
                </div>
              </div>

              {/* Action Button for Google */}
              <div>
                {googleIdentity ? (
                  <button
                    onClick={handleUnlinkGoogle}
                    disabled={isUnlinking || identities.length <= 1}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1CEC5] bg-white px-3 py-1.5 text-xs font-medium text-[#A34F45] hover:bg-[#A34F45]/10 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isUnlinking ? <Loading size="xs" /> : <Unlink className="h-3.5 w-3.5" />}
                    <span>{isUnlinking ? t("account_btn_unlinking") : t("account_btn_unlink")}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleGoogleConnect()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1CEC5] bg-white px-3 py-1.5 text-xs font-semibold text-[#26343F] hover:bg-[#E6E3DC]/60 shadow-2xs transition-colors cursor-pointer"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>{t("account_btn_connect_google")}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3. LINE Identity Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#D1CEC5]/70 bg-[#F0EFEB]/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#06C755] text-white shadow-2xs">
                  <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.494.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .625.285.625.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#26343F]">{t("account_provider_line")}</span>
                    {lineIdentity ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2E7D32]">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {t("account_connected")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-[#66737D]">
                        <Circle className="h-3.5 w-3.5" /> {t("account_not_connected")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#66737D] mt-0.5">
                    {lineIdentity
                      ? `${t("account_line_linked_desc")}${lineIdentity.display_name || lineIdentity.provider_user_id}`
                      : t("account_line_unlinked_desc")}
                  </p>
                </div>
              </div>

              {/* Action Button for LINE */}
              <div>
                {lineIdentity ? (
                  <button
                    onClick={handleUnlinkLine}
                    disabled={isUnlinking || identities.length <= 1}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1CEC5] bg-white px-3 py-1.5 text-xs font-medium text-[#A34F45] hover:bg-[#A34F45]/10 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isUnlinking ? <Loading size="xs" /> : <Unlink className="h-3.5 w-3.5" />}
                    <span>{isUnlinking ? t("account_btn_unlinking") : t("account_btn_unlink")}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleConnectLine}
                    disabled={isLinkingLine}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#06C755] px-4 py-2 text-xs font-semibold text-white hover:bg-[#05b34c] shadow-xs disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {isLinkingLine ? <Loading size="xs" /> : <LinkIcon className="h-3.5 w-3.5" />}
                    <span>{isLinkingLine ? t("account_btn_connecting_line") : t("account_btn_connect_line")}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Subscription & Plans Section */}
        <section className="rounded-2xl border border-[#D1CEC5] bg-white p-5 sm:p-6 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                user.tier === "premium" ? "bg-amber-100 text-amber-800" : "bg-[#3D5A73]/10 text-[#3D5A73]"
              }`}>
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-[#26343F]">
                    {t("account_sec_sub_title")}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    user.tier === "premium" ? "bg-amber-100 text-amber-900 border-amber-300" : "bg-[#E6E3DC] text-[#3D5A73] border-[#D1CEC5]"
                  }`}>
                    {user.tier === "premium" ? "Premium" : "Free"}
                  </span>
                </div>
                <p className="text-xs text-[#66737D] mt-0.5 leading-relaxed">
                  {user.tier === "premium"
                    ? t("account_sec_sub_premium_desc")
                    : t("account_sec_sub_free_desc")}
                </p>
              </div>
            </div>
            <Link
              href="/subscription"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FAF9F6] border border-[#D1CEC5] px-4 py-2.5 text-xs font-semibold text-[#26343F] hover:bg-[#E6E3DC]/60 hover:border-[#3D5A73]/40 transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <span>{user.tier === "premium" ? t("account_sec_sub_view") : t("account_sec_sub_upgrade")}</span>
              <ChevronRight className="h-4 w-4 text-[#66737D]" />
            </Link>
          </div>
        </section>

        {/* Feedback & Support Section */}
        <section className="rounded-2xl border border-[#D1CEC5] bg-white p-5 sm:p-6 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3D5A73]/10 text-[#3D5A73]">
                <MessageSquareHeart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#26343F]">
                  {t("account_sec_feedback_title")}
                </h2>
                <p className="text-xs text-[#66737D] mt-0.5 leading-relaxed">
                  {t("account_sec_feedback_desc")}
                </p>
              </div>
            </div>
            <Link
              href="/feedback"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FAF9F6] border border-[#D1CEC5] px-4 py-2.5 text-xs font-semibold text-[#26343F] hover:bg-[#E6E3DC]/60 hover:border-[#3D5A73]/40 transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <span>{t("account_sec_feedback_btn")}</span>
              <ChevronRight className="h-4 w-4 text-[#66737D]" />
            </Link>
          </div>
        </section>

        {/* Admin Section (Only shown if user is admin) */}
        {user.role === "admin" && (
          <section className="rounded-2xl border border-emerald-300 bg-emerald-50/50 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-emerald-950">
                    {t("account_sec_admin_title")}
                  </h2>
                  <p className="text-xs text-emerald-800/80 mt-0.5 leading-relaxed">
                    {t("account_sec_admin_desc")}
                  </p>
                </div>
              </div>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold hover:bg-emerald-800 transition-all shadow-xs cursor-pointer shrink-0"
              >
                <span>{t("account_sec_admin_btn")}</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
