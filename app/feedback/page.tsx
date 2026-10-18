"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { Navbar } from "@/components/Navbar";
import Loading from "@/components/Loading";
import { toast } from "@/components/ui/toast";
import { submitFeedback, getFeedbacks } from "@/lib/api";
import type { Feedback, FeedbackType, FeedbackStatus } from "@/lib/types";
import {
  MessageSquareHeart,
  Send,
  Lightbulb,
  AlertTriangle,
  Bug,
  HelpCircle,
  Clock,
  CheckCircle2,
  Search,
  XCircle,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  User,
  History,
} from "lucide-react";

interface CategoryOption {
  type: FeedbackType;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  activeBg: string;
  placeholderTitle: string;
  placeholderMessage: string;
}

export default function FeedbackPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { t, language } = useLanguage();

  const [selectedType, setSelectedType] = useState<FeedbackType>("suggestion");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History state for authenticated users
  const [myFeedbacks, setMyFeedbacks] = useState<Feedback[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const categories: CategoryOption[] = [
    {
      type: "suggestion",
      label: t("feedback_cat_suggestion"),
      shortLabel: t("feedback_cat_suggestion_short"),
      description: t("feedback_cat_suggestion_desc"),
      icon: Lightbulb,
      color: "text-amber-600",
      activeBg: "bg-amber-50 border-amber-300 text-amber-900 shadow-xs",
      placeholderTitle: t("feedback_placeholder_suggestion_title"),
      placeholderMessage: t("feedback_placeholder_suggestion_msg"),
    },
    {
      type: "complaint",
      label: t("feedback_cat_complaint"),
      shortLabel: t("feedback_cat_complaint_short"),
      description: t("feedback_cat_complaint_desc"),
      icon: AlertTriangle,
      color: "text-[#A34F45]",
      activeBg: "bg-red-50 border-red-300 text-red-900 shadow-xs",
      placeholderTitle: t("feedback_placeholder_complaint_title"),
      placeholderMessage: t("feedback_placeholder_complaint_msg"),
    },
    {
      type: "bug",
      label: t("feedback_cat_bug"),
      shortLabel: t("feedback_cat_bug_short"),
      description: t("feedback_cat_bug_desc"),
      icon: Bug,
      color: "text-rose-600",
      activeBg: "bg-rose-50 border-rose-300 text-rose-900 shadow-xs",
      placeholderTitle: t("feedback_placeholder_bug_title"),
      placeholderMessage: t("feedback_placeholder_bug_msg"),
    },
    {
      type: "other",
      label: t("feedback_cat_other"),
      shortLabel: t("feedback_cat_other_short"),
      description: t("feedback_cat_other_desc"),
      icon: HelpCircle,
      color: "text-[#3D5A73]",
      activeBg: "bg-sky-50 border-sky-300 text-sky-900 shadow-xs",
      placeholderTitle: t("feedback_placeholder_other_title"),
      placeholderMessage: t("feedback_placeholder_other_msg"),
    },
  ];

  const statusConfig: Record<
    FeedbackStatus,
    { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
  > = {
    pending: {
      label: t("feedback_status_pending"),
      icon: Clock,
      className: "bg-amber-100/80 text-amber-800 border-amber-200",
    },
    investigating: {
      label: t("feedback_status_investigating"),
      icon: Search,
      className: "bg-blue-100/80 text-blue-800 border-blue-200",
    },
    resolved: {
      label: t("feedback_status_resolved"),
      icon: CheckCircle2,
      className: "bg-emerald-100/80 text-emerald-800 border-emerald-200",
    },
    dismissed: {
      label: t("feedback_status_dismissed"),
      icon: XCircle,
      className: "bg-stone-100 text-stone-700 border-stone-200",
    },
  };

  // Authentication check: redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login?redirect=/feedback");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const items = await getFeedbacks();
      setMyFeedbacks(items);
    } catch {
      // Ignore silently if failed to fetch past feedbacks
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Load user's previous feedbacks if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    }
  }, [isAuthenticated, loadHistory]);

  const selectedCategory = categories.find((c) => c.type === selectedType) || categories[0];

  if (isAuthLoading) {
    return <Loading fullScreen text={t("common_loading")} />;
  }

  if (!isAuthenticated || !user) {
    return <Loading fullScreen text={t("feedback_login_required")} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();
    const trimmedEmail = contactEmail.trim() || user?.email || "";

    if (!trimmedTitle) {
      toast.add({
        type: "error",
        title: t("feedback_toast_title_req"),
        description: t("feedback_toast_title_desc"),
      });
      return;
    }

    if (!trimmedMessage) {
      toast.add({
        type: "error",
        title: t("feedback_toast_msg_req"),
        description: t("feedback_toast_msg_desc"),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitFeedback({
        type: selectedType,
        title: trimmedTitle,
        message: trimmedMessage,
        contact_email: trimmedEmail || undefined,
      });

      toast.add({
        type: "success",
        title: t("feedback_toast_success"),
        description: t("feedback_toast_success_desc"),
      });

      // Clear form
      setTitle("");
      setMessage("");

      // Refresh feedback list
      if (res.feedback) {
        setMyFeedbacks((prev) => [res.feedback, ...prev]);
      } else {
        loadHistory();
      }
    } catch (err: unknown) {
      const errorMsg = (err as { data?: { error?: string }; message?: string })?.data?.error || (err as { message?: string })?.message || "Error submitting feedback";
      toast.add({
        type: "error",
        title: "Error",
        description: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(language === "th" ? "th-TH" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#26343F] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/notes"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#66737D] hover:text-[#3D5A73] transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>{t("feedback_breadcrumb_back")}</span>
          </Link>

          <span className="text-xs text-[#66737D] flex items-center gap-1.5 bg-[#E6E3DC]/40 px-2.5 py-1 rounded-full border border-[#D1CEC5]/50">
            <User className="h-3.5 w-3.5 text-[#3D5A73]" />
            <span className="font-medium text-[#26343F]">{user.display_name || t("common_user")}</span>
          </span>
        </div>

        {/* Page Header */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3D5A73]/10 text-[#3D5A73] text-xs font-semibold mb-3 border border-[#3D5A73]/20">
            <MessageSquareHeart className="h-3.5 w-3.5" />
            <span>{t("feedback_badge")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#26343F] font-['Chonburi']">
            {t("feedback_title")}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#66737D] max-w-2xl leading-relaxed">
            {t("feedback_desc")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form Card (7 cols on large screens) */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-[#D1CEC5] bg-white p-5 sm:p-7 shadow-xs relative overflow-hidden">
              {/* Paper Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3D5A73] via-[#708B9B] to-[#C9A66B]" />

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Category Selector */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#26343F] mb-2.5">
                    {t("feedback_cat_label")} <span className="text-[#A34F45]">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = selectedType === cat.type;
                      return (
                        <button
                          key={cat.type}
                          type="button"
                          onClick={() => setSelectedType(cat.type)}
                          className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? `${cat.activeBg} ring-2 ring-[#3D5A73]/20`
                              : "border-[#D1CEC5]/80 bg-[#FAF9F6] hover:bg-[#F0EFEB] text-[#66737D]"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`h-4 w-4 ${cat.color}`} />
                            <span
                              className={`text-xs font-bold ${
                                isSelected ? "text-[#26343F]" : "text-[#3D5A73]"
                              }`}
                            >
                              {cat.shortLabel}
                            </span>
                          </div>
                          <p className="text-[11px] leading-tight text-[#66737D] line-clamp-2">
                            {cat.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Topic / Title */}
                <div>
                  <label htmlFor="feedback-title" className="block text-xs sm:text-sm font-semibold text-[#26343F] mb-1.5">
                    {t("feedback_title_label")} <span className="text-[#A34F45]">*</span>
                  </label>
                  <input
                    id="feedback-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={selectedCategory.placeholderTitle}
                    maxLength={150}
                    className="w-full rounded-xl border border-[#D1CEC5] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#26343F] placeholder:text-[#66737D]/60 focus:bg-white focus:border-[#3D5A73] focus:outline-none focus:ring-2 focus:ring-[#3D5A73]/20 transition-all"
                  />
                  <div className="mt-1 flex justify-end">
                    <span className="text-[10px] text-[#66737D]">{title.length}/150</span>
                  </div>
                </div>

                {/* 3. Detailed Message */}
                <div>
                  <label htmlFor="feedback-message" className="block text-xs sm:text-sm font-semibold text-[#26343F] mb-1.5">
                    {t("feedback_message_label")} <span className="text-[#A34F45]">*</span>
                  </label>
                  <textarea
                    id="feedback-message"
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={selectedCategory.placeholderMessage}
                    maxLength={2000}
                    className="w-full rounded-xl border border-[#D1CEC5] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#26343F] placeholder:text-[#66737D]/60 focus:bg-white focus:border-[#3D5A73] focus:outline-none focus:ring-2 focus:ring-[#3D5A73]/20 transition-all resize-y leading-relaxed"
                  />
                  <div className="mt-1 flex justify-between items-center text-[10px] text-[#66737D]">
                    <span>{t("feedback_hint_detail")}</span>
                    <span>{message.length}/2000</span>
                  </div>
                </div>

                {/* 4. Contact Email */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="feedback-email" className="block text-xs sm:text-sm font-semibold text-[#26343F]">
                      {t("feedback_email_label")} <span className="text-[#66737D] font-normal text-xs">{t("feedback_email_optional")}</span>
                    </label>
                    {user.email && contactEmail === user.email && (
                      <span className="text-[11px] text-[#2E7D32] font-medium flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> {t("feedback_email_user_badge")} ({user.email})
                      </span>
                    )}
                  </div>
                  <input
                    id="feedback-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder={user.email || "your-email@example.com"}
                    className="w-full rounded-xl border border-[#D1CEC5] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#26343F] placeholder:text-[#66737D]/60 focus:bg-white focus:border-[#3D5A73] focus:outline-none focus:ring-2 focus:ring-[#3D5A73]/20 transition-all"
                  />
                  <p className="mt-1 text-[11px] text-[#66737D]">
                    {t("feedback_hint_email")}
                  </p>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !title.trim() || !message.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#3D5A73] px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#30475C] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loading size="xs" />
                        <span>{t("feedback_submitting")}</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>{t("feedback_submit")}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar & User History (5 cols on large screens) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Contact & Info Card */}
            <div className="rounded-2xl border border-[#D1CEC5] bg-[#F0EFEB]/50 p-5 shadow-2xs">
              <h2 className="text-sm font-bold text-[#26343F] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#C9A66B]" />
                <span>{t("feedback_quick_contact")}</span>
              </h2>
              <p className="mt-1.5 text-xs text-[#66737D] leading-relaxed">
                {t("feedback_line_desc")}
              </p>
              <div className="mt-3.5 flex items-center gap-2">
                <a
                  href="https://line.me/R/ti/p/@yourlinebot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#06C755] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#05b34c] transition-colors"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.494.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .625.285.625.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  <span>{t("feedback_line_chat")}</span>
                </a>
              </div>
            </div>

            {/* Authenticated User Feedback History */}
            <div className="rounded-2xl border border-[#D1CEC5] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 border-b border-[#D1CEC5]/60 pb-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-[#3D5A73]" />
                  <h2 className="text-sm font-bold text-[#26343F]">
                    {t("feedback_history_title")} ({myFeedbacks.length})
                  </h2>
                </div>
                <button
                  onClick={loadHistory}
                  disabled={isLoadingHistory}
                  title={t("feedback_refresh")}
                  className="text-xs text-[#66737D] hover:text-[#3D5A73] transition-colors p-1 rounded-md cursor-pointer"
                >
                  {isLoadingHistory ? <Loading size="xs" /> : t("feedback_refresh")}
                </button>
              </div>

              {isLoadingHistory && myFeedbacks.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#66737D]">
                  <Loading size="sm" text={t("feedback_loading_history")} />
                </div>
              ) : myFeedbacks.length === 0 ? (
                <div className="py-8 text-center">
                  <MessageSquare className="h-8 w-8 text-[#D1CEC5] mx-auto mb-2" />
                  <p className="text-xs font-semibold text-[#66737D]">
                    {t("feedback_history_empty")}
                  </p>
                  <p className="text-[11px] text-[#66737D]/80 mt-0.5">
                    {t("feedback_history_follow")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {myFeedbacks.map((item) => {
                    const catInfo = categories.find((c) => c.type === item.type) || categories[0];
                    const statusInfo =
                      statusConfig[item.status] || statusConfig.pending;
                    const StatusIcon = statusInfo.icon;
                    const CatIcon = catInfo.icon;

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-[#D1CEC5]/70 bg-[#FAF9F6] p-3.5 hover:border-[#3D5A73]/40 transition-all text-xs"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`p-1 rounded-md bg-white border border-[#D1CEC5]/60`}>
                              <CatIcon className={`h-3 w-3 ${catInfo.color}`} />
                            </span>
                            <span className="font-semibold text-[#26343F] line-clamp-1">
                              {item.title}
                            </span>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${statusInfo.className} shrink-0`}
                          >
                            <StatusIcon className="h-2.5 w-2.5" />
                            <span>{statusInfo.label}</span>
                          </span>
                        </div>

                        <p className="text-[11px] text-[#66737D] line-clamp-2 leading-relaxed mb-2">
                          {item.message}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-[#66737D]/70 pt-1 border-t border-[#D1CEC5]/40">
                          <span>{catInfo.shortLabel}</span>
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
