"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGoogleLogin, useGoogleOneTapLogin } from "@react-oauth/google";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { LanguageToggle } from "@/components/LanguageToggle";
import { toast } from "@/components/ui/toast";
import { BookOpen, Sparkles, Mail, Lock, User as UserIcon, ArrowRight, ArrowLeft } from "lucide-react";
import Loading from "@/components/Loading";
import liff from "@line/liff";
import Link from "next/link";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID ?? "";

interface LoginPageProps {
  defaultTab?: "login" | "register";
}

export default function LoginPage({ defaultTab = "login" }: LoginPageProps = {}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, loginWithGoogle, loginWithLine, loginWithEmail, registerWithEmail } = useAuth();
  const { t } = useLanguage();

  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lineLoading, setLineLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/notes");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.add({ type: "error", description: "Please fill in email and password" });
      return;
    }

    if (tab === "register" && password.length < 6) {
      toast.add({ type: "error", description: "Password must be at least 6 characters" });
      return;
    }

    setSubmitting(true);
    try {
      if (tab === "login") {
        await loginWithEmail(email, password);
        toast.add({
          type: "success",
          title: t("auth_submit_login"),
          description: "Welcome back to JodJod",
        });
      } else {
        await registerWithEmail(email, password, displayName);
        toast.add({
          type: "success",
          title: t("auth_submit_register"),
          description: "Welcome to JodJod! Start JodJod-ing today.",
        });
      }
    } catch (err: any) {
      toast.add({
        type: "error",
        title: tab === "login" ? t("auth_submit_login") : t("auth_submit_register"),
        description: err.message || "Action failed, please try again",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        await loginWithGoogle(tokenResponse.access_token);
        toast.add({
          type: "success",
          title: t("auth_submit_login"),
          description: "Logged in with Google successfully",
        });
      } catch (err: any) {
        toast.add({
          type: "error",
          title: "Google login failed",
          description: err.message || "Failed to log in with Google",
        });
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setGoogleLoading(false);
      toast.add({
        type: "error",
        title: "Google login failed",
        description: "Google sign-in was cancelled or failed",
      });
    },
  });

  useGoogleOneTapLogin({
    onSuccess: async (credentialResponse) => {
      if (credentialResponse.credential) {
        setGoogleLoading(true);
        try {
          await loginWithGoogle(credentialResponse.credential);
          toast.add({
            type: "success",
            title: t("auth_submit_login"),
            description: "Logged in with Google successfully",
          });
        } catch (err: any) {
          toast.add({
            type: "error",
            title: "Google login failed",
            description: err.message || "Failed to log in with Google",
          });
        } finally {
          setGoogleLoading(false);
        }
      }
    },
    onError: () => {},
  });

  const handleLineLogin = async () => {
    if (!LIFF_ID) {
      toast.add({
        type: "error",
        title: "LINE configuration missing",
        description: "NEXT_PUBLIC_LIFF_ID is not configured",
      });
      return;
    }

    setLineLoading(true);
    try {
      await liff.init({ liffId: LIFF_ID });
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.origin + "/login" });
        return;
      }
      const idToken = liff.getIDToken();
      if (!idToken) {
        toast.add({
          type: "error",
          title: "LINE login failed",
          description: "Unable to get token from LINE",
        });
        return;
      }
      await loginWithLine(idToken);
      toast.add({
        type: "success",
        title: t("auth_submit_login"),
        description: "Logged in with LINE successfully",
      });
    } catch (err: any) {
      toast.add({
        type: "error",
        title: "LINE login failed",
        description: err.message || "Error logging in with LINE",
      });
    } finally {
      setLineLoading(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen text={t("common_loading")} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-[#F0EFEB] relative">
      {/* Top Language Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <LanguageToggle />
      </div>

      {/* Notebook Paper Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-[#D1CEC5] bg-[#FAF9F6] p-6 sm:p-8 shadow-md">
        {/* Notebook top accent line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#3D5A73] rounded-t-2xl" />

        {/* Header / Brand */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3D5A73] text-[#FAF9F6] shadow-sm">
            <BookOpen className="h-7 w-7" />
          </div>
          
          <h1 className="font-['Chonburi'] text-3xl font-bold tracking-tight text-[#3D5A73]">
            JodJod
          </h1>

          <p className="mt-1 text-xs sm:text-sm text-[#66737D]">
            {t("auth_brand_desc")}
          </p>
        </div>

        {/* Tab Switcher: Login / Register */}
        <div className="mb-5 flex rounded-xl bg-[#E6E3DC]/60 p-1 border border-[#D1CEC5]">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              tab === "login"
                ? "bg-white text-[#3D5A73] shadow-xs"
                : "text-[#66737D] hover:text-[#26343F]"
            }`}
          >
            {t("auth_tab_login")}
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              tab === "register"
                ? "bg-white text-[#3D5A73] shadow-xs"
                : "text-[#66737D] hover:text-[#26343F]"
            }`}
          >
            {t("auth_tab_register")}
          </button>
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {tab === "register" && (
            <div>
              <label className="block text-xs font-medium text-[#26343F] mb-1">
                {t("auth_label_name")}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#66737D]" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("auth_name_placeholder")}
                  className="w-full rounded-xl border border-[#D1CEC5] bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-[#26343F] focus:outline-hidden focus:ring-2 focus:ring-[#3D5A73]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#26343F] mb-1">
              {t("auth_label_email")}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#66737D]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth_email_placeholder")}
                className="w-full rounded-xl border border-[#D1CEC5] bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-[#26343F] focus:outline-hidden focus:ring-2 focus:ring-[#3D5A73]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#26343F] mb-1">
              {t("auth_label_password")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#66737D]" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === "register" ? t("auth_password_placeholder") : "••••••••"}
                className="w-full rounded-xl border border-[#D1CEC5] bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-[#26343F] focus:outline-hidden focus:ring-2 focus:ring-[#3D5A73]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3D5A73] py-2.5 px-4 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#30475C] active:scale-98 transition-all disabled:opacity-60 cursor-pointer"
          >
            {submitting && <Loading size="xs" />}
            <span>{submitting ? t("common_loading") : tab === "login" ? t("auth_btn_login_email") : t("auth_btn_register_submit")}</span>
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#D1CEC5]" />
          </div>
          <span className="relative bg-[#FAF9F6] px-3 text-[11px] text-[#66737D]">
            {t("auth_or_continue")}
          </span>
        </div>

        {/* Google & LINE Login */}
        <div className="space-y-3">
          {/* Google Login */}
          <button
            type="button"
            onClick={() => {
              setGoogleLoading(true);
              handleGoogleLogin();
            }}
            disabled={googleLoading || lineLoading}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#D1CEC5] bg-white py-2.5 px-4 text-xs sm:text-sm font-semibold text-[#26343F] shadow-2xs hover:bg-[#F0EFEB]/80 active:scale-98 transition-all disabled:opacity-60 cursor-pointer"
          >
            {googleLoading ? (
              <Loading size="xs" />
            ) : (
              <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>{googleLoading ? t("common_loading") : t("auth_btn_google")}</span>
          </button>

          {/* LINE Login */}
          <button
            type="button"
            onClick={handleLineLogin}
            disabled={lineLoading || googleLoading}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#06C755] py-2.5 px-4 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-[#05b34c] active:scale-98 transition-all disabled:opacity-60 cursor-pointer"
          >
            {lineLoading ? (
              <Loading size="xs" />
            ) : (
              <svg className="h-4.5 w-4.5 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.494.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .625.285.625.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
            )}
            <span>{lineLoading ? t("common_loading") : t("auth_btn_line")}</span>
          </button>
        </div>

        {/* Tip Box */}
        <div className="mt-5 rounded-xl bg-[#F0EFEB]/80 border border-[#D1CEC5]/60 p-3 text-[11px] text-[#66737D] space-y-1">
          <p className="flex items-center gap-1.5 text-[#26343F] font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-[#3D5A73]" />
            {t("auth_tip_title")}
          </p>
          <p>
            {t("auth_tip_desc")}
          </p>
        </div>

        {/* Back to Home Link at Bottom */}
        <div className="mt-4 pt-3 border-t border-[#D1CEC5]/50 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-[#66737D] hover:text-[#3D5A73] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t("auth_back_home")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
