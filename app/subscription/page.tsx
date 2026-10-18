"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { Navbar } from "@/components/Navbar";
import Loading from "@/components/Loading";
import { toast } from "@/components/ui/toast";
import Modal from "@/components/ui/modal";
import {
  subscribePlan,
  getCurrentSubscription,
  cancelSubscription,
} from "@/lib/api";
import type { Subscription, UserTier } from "@/lib/types";
import {
  Crown,
  Check,
  X,
  Sparkles,
  Zap,
  CreditCard,
  QrCode,
  ArrowLeft,
  HelpCircle,
  Star,
  CheckCircle2,
} from "lucide-react";

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { t, language } = useLanguage();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [activeTier, setActiveTier] = useState<UserTier>("free");
  const [, setIsLoadingSub] = useState(false);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlanCycle, setSelectedPlanCycle] = useState<"monthly" | "yearly">("monthly");
  const [paymentMethod, setPaymentMethod] = useState<"promptpay" | "credit_card">("promptpay");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Downgrade / Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadSubscription = useCallback(async () => {
    setIsLoadingSub(true);
    try {
      const res = await getCurrentSubscription();
      setActiveTier(res.tier || (user?.tier as UserTier) || "free");
      setCurrentSub(res.subscription);
    } catch {
      setActiveTier((user?.tier as UserTier) || "free");
    } finally {
      setIsLoadingSub(false);
    }
  }, [user?.tier]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSubscription();
    }
  }, [isAuthenticated, loadSubscription]);

  const handleOpenUpgrade = (cycle: "monthly" | "yearly") => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/subscription");
      return;
    }
    setSelectedPlanCycle(cycle);
    setIsCheckoutOpen(true);
  };

  const handleConfirmSubscribe = async () => {
    setIsProcessingPayment(true);
    try {
      const res = await subscribePlan({
        tier: "premium",
        billing_cycle: selectedPlanCycle,
        payment_method: paymentMethod,
      });

      toast.add({
        type: "success",
        title: t("sub_toast_upgrade_success"),
        description: res.message || t("sub_toast_upgrade_desc"),
      });

      setIsCheckoutOpen(false);
      await refreshUser();
      await loadSubscription();
    } catch (err: unknown) {
      const errorMsg = (err as { data?: { error?: string }; message?: string })?.data?.error || (err as { message?: string })?.message || "Please try again";
      toast.add({
        type: "error",
        title: "Error",
        description: errorMsg,
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      const res = await cancelSubscription();
      toast.add({
        type: "info",
        title: t("sub_toast_cancel_success"),
        description: res.message || t("sub_toast_cancel_desc"),
      });
      setIsCancelModalOpen(false);
      await refreshUser();
      await loadSubscription();
    } catch (err: unknown) {
      const errorMsg = (err as { data?: { error?: string }; message?: string })?.data?.error || (err as { message?: string })?.message || "Please try again";
      toast.add({
        type: "error",
        title: "Error",
        description: errorMsg,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const isPremium = (user?.tier || activeTier) === "premium";

  const formatSubDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString(language === "th" ? "th-TH" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#26343F] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={isAuthenticated ? "/notes" : "/"}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#66737D] hover:text-[#3D5A73] transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>{isAuthenticated ? t("sub_breadcrumb_notes") : t("sub_breadcrumb_home")}</span>
          </Link>

          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#66737D]">{t("sub_current_status")}</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isPremium
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-[#E6E3DC] text-[#3D5A73] border-[#D1CEC5]"
                }`}
              >
                {isPremium ? (
                  <>
                    <Crown className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
                    <span>Premium Member</span>
                  </>
                ) : (
                  <>
                    <span>{t("sub_free_title")}</span>
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-3 border border-amber-300 shadow-2xs">
            <Crown className="h-3.5 w-3.5 text-amber-600" />
            <span>{t("sub_badge_pricing")}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#26343F] font-['Chonburi']">
            {t("sub_header_title")}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#66737D] leading-relaxed">
            {t("sub_header_desc")}
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center p-1 rounded-2xl bg-[#E6E3DC]/70 border border-[#D1CEC5] shadow-inner">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-white text-[#26343F] shadow-xs"
                  : "text-[#66737D] hover:text-[#26343F]"
              }`}
            >
              {t("sub_cycle_monthly")}
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                billingCycle === "yearly"
                  ? "bg-white text-[#26343F] shadow-xs"
                  : "text-[#66737D] hover:text-[#26343F]"
              }`}
            >
              <span>{t("sub_cycle_yearly")}</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-300">
                {t("sub_cycle_save")}
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* 1. Free Tier Card */}
          <div
            className={`rounded-3xl border bg-white p-7 sm:p-8 flex flex-col justify-between transition-all ${
              !isPremium
                ? "border-[#3D5A73] ring-2 ring-[#3D5A73]/20 shadow-md relative"
                : "border-[#D1CEC5] shadow-xs"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#66737D] bg-[#FAF9F6] px-3 py-1 rounded-full border border-[#D1CEC5]">
                  {t("sub_free_tier")}
                </span>
                {!isPremium && isAuthenticated && (
                  <span className="text-xs font-bold text-[#2E7D32] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {t("sub_current_badge")}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold text-[#26343F]">{t("sub_free_name")}</h2>
              <p className="text-xs sm:text-sm text-[#66737D] mt-1">
                {t("sub_free_desc")}
              </p>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-bold text-[#26343F]">฿0</span>
                  <span className="text-xs text-[#66737D]">{t("sub_free_price_sub")}</span>
                </div>
              </div>

              <div className="border-t border-[#D1CEC5]/70 pt-6">
                <span className="text-xs font-semibold text-[#26343F] uppercase tracking-wide">
                  {t("sub_free_feature_title")}
                </span>
                <ul className="mt-3.5 space-y-3 text-xs sm:text-sm text-[#26343F]">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#2E7D32] shrink-0 mt-0.5" />
                    <span>{t("sub_free_f1")}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#2E7D32] shrink-0 mt-0.5" />
                    <span>{t("sub_free_f2")}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#2E7D32] shrink-0 mt-0.5" />
                    <span>{t("sub_free_f3")}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#2E7D32] shrink-0 mt-0.5" />
                    <span>{t("sub_free_f4")}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-[#66737D]/60">
                    <X className="h-4 w-4 text-[#66737D]/40 shrink-0 mt-0.5" />
                    <span>{t("sub_free_f5_no")}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-[#66737D]/60">
                    <X className="h-4 w-4 text-[#66737D]/40 shrink-0 mt-0.5" />
                    <span>{t("sub_free_f6_no")}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4">
              {!isPremium && isAuthenticated ? (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-xl bg-[#FAF9F6] border border-[#D1CEC5] text-xs sm:text-sm font-semibold text-[#66737D] cursor-default"
                >
                  {t("sub_btn_current")}
                </button>
              ) : isPremium ? (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="w-full py-3 px-4 rounded-xl bg-white border border-[#D1CEC5] hover:bg-[#A34F45]/10 hover:border-[#A34F45]/30 text-xs sm:text-sm font-semibold text-[#A34F45] transition-colors cursor-pointer"
                >
                  {t("sub_btn_switch_free")}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl bg-white border border-[#D1CEC5] hover:bg-[#E6E3DC]/60 text-xs sm:text-sm font-semibold text-[#26343F] transition-colors"
                >
                  {t("sub_btn_start_free")}
                </Link>
              )}
            </div>
          </div>

          {/* 2. Premium Tier Card (Hero) */}
          <div
            className={`rounded-3xl border bg-gradient-to-b from-white via-white to-amber-50/40 p-7 sm:p-8 flex flex-col justify-between relative transition-all ${
              isPremium
                ? "border-amber-400 ring-2 ring-amber-300 shadow-md"
                : "border-amber-300 hover:border-amber-400 shadow-md hover:shadow-lg"
            }`}
          >
            {/* Best Value Badge */}
            <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" />
              <span>{t("sub_badge_popular")}</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
                  <span>{t("sub_premium_title")}</span>
                </span>
                {isPremium && (
                  <span className="text-xs font-bold text-amber-900 bg-amber-200/70 px-2.5 py-0.5 rounded-full border border-amber-300">
                    {t("sub_current_badge")}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold text-[#26343F]">{t("sub_premium_name")}</h2>
              <p className="text-xs sm:text-sm text-[#66737D] mt-1">
                {t("sub_premium_desc")}
              </p>

              <div className="my-6">
                {billingCycle === "monthly" ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-bold text-[#26343F]">฿99</span>
                    <span className="text-xs text-[#66737D]">{t("sub_per_month")}</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-bold text-[#26343F]">฿990</span>
                      <span className="text-xs text-[#66737D]">{t("sub_per_year")}</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 inline-block">
                      {t("sub_yearly_savings_hint")}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-amber-200/80 pt-6">
                <span className="text-xs font-semibold text-[#26343F] uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>{t("sub_premium_benefits_title")}</span>
                </span>
                <ul className="mt-3.5 space-y-3 text-xs sm:text-sm text-[#26343F]">
                  <li className="flex items-start gap-2.5 font-medium">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{t("sub_prem_f1")}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{t("sub_prem_f2")}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{t("sub_prem_f3")}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{t("sub_prem_f4")}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{t("sub_prem_f5")}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{t("sub_prem_f6")}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4">
              {isPremium ? (
                <div className="space-y-2">
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-xl bg-amber-100/70 border border-amber-300 text-xs sm:text-sm font-bold text-amber-900 flex items-center justify-center gap-2 cursor-default"
                  >
                    <Crown className="h-4 w-4 text-amber-600 fill-amber-500" />
                    <span>{t("sub_already_premium")}</span>
                  </button>
                  {currentSub?.expires_at && (
                    <p className="text-center text-[11px] text-[#66737D]">
                      {t("sub_expires_at")} {formatSubDate(currentSub.expires_at)}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleOpenUpgrade(billingCycle)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Crown className="h-4 w-4 fill-white" />
                  <span>
                    {t("sub_upgrade_now")} ({billingCycle === "monthly" ? "฿99/" + (language === "th" ? "ด." : "mo") : "฿990/" + (language === "th" ? "ปี" : "yr")})
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-16 rounded-3xl border border-[#D1CEC5] bg-white p-6 sm:p-8 shadow-xs max-w-4xl mx-auto">
          <h2 className="text-lg sm:text-xl font-bold text-[#26343F] mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#3D5A73]" />
            <span>{t("sub_table_title")}</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#D1CEC5] text-[#66737D]">
                  <th className="py-3 px-4 font-semibold">{t("sub_col_feature")}</th>
                  <th className="py-3 px-4 font-semibold text-center w-28 sm:w-36">Free</th>
                  <th className="py-3 px-4 font-semibold text-center w-28 sm:w-36 text-amber-900 bg-amber-50/50 rounded-t-xl">
                    Premium ⭐
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1CEC5]/50 text-[#26343F]">
                <tr>
                  <td className="py-3.5 px-4 font-medium">{t("sub_row_note_limit")}</td>
                  <td className="py-3.5 px-4 text-center text-[#66737D]">{t("sub_val_50")}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-amber-900 bg-amber-50/30">
                    {t("sub_val_unlimited")}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">{t("sub_row_line")}</td>
                  <td className="py-3.5 px-4 text-center text-[#2E7D32]">✓</td>
                  <td className="py-3.5 px-4 text-center text-[#2E7D32] bg-amber-50/30 font-bold">✓</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">{t("sub_row_search")}</td>
                  <td className="py-3.5 px-4 text-center text-[#2E7D32]">✓</td>
                  <td className="py-3.5 px-4 text-center text-[#2E7D32] bg-amber-50/30 font-bold">✓</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">{t("sub_row_speed")}</td>
                  <td className="py-3.5 px-4 text-center text-[#66737D]">{t("sub_val_speed_standard")}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-amber-900 bg-amber-50/30">
                    {t("sub_val_speed_high")}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">{t("sub_row_vip")}</td>
                  <td className="py-3.5 px-4 text-center text-[#66737D]/50">—</td>
                  <td className="py-3.5 px-4 text-center text-amber-600 bg-amber-50/30 font-bold">✓</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">{t("sub_row_backup")}</td>
                  <td className="py-3.5 px-4 text-center text-[#66737D]/50">—</td>
                  <td className="py-3.5 px-4 text-center text-[#2E7D32] bg-amber-50/30 font-bold">✓</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">{t("sub_row_priority")}</td>
                  <td className="py-3.5 px-4 text-center text-[#66737D]/50">—</td>
                  <td className="py-3.5 px-4 text-center text-[#2E7D32] bg-amber-50/30 font-bold">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-[#26343F] font-['Chonburi']">
              {t("sub_faq_title")}
            </h2>
            <p className="text-xs sm:text-sm text-[#66737D] mt-1">
              {t("sub_faq_subtitle")}
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#D1CEC5] bg-white p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-[#26343F] flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#3D5A73]" />
                <span>{t("sub_faq_q1")}</span>
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#66737D] leading-relaxed">
                {t("sub_faq_a1")}
              </p>
            </div>

            <div className="rounded-2xl border border-[#D1CEC5] bg-white p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-[#26343F] flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#3D5A73]" />
                <span>{t("sub_faq_q2")}</span>
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#66737D] leading-relaxed">
                {t("sub_faq_a2")}
              </p>
            </div>

            <div className="rounded-2xl border border-[#D1CEC5] bg-white p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-[#26343F] flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#3D5A73]" />
                <span>{t("sub_faq_q3")}</span>
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#66737D] leading-relaxed">
                {t("sub_faq_a3")}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Checkout / Upgrade Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title={t("sub_modal_upgrade_title")}
        hideFooter={true}
      >
        <div className="space-y-5 text-xs sm:text-sm">
          {/* Order Summary */}
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
                  <Crown className="h-4 w-4 text-amber-600 fill-amber-500" />
                  <span>{t("sub_modal_plan_premium")}</span>
                </span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  {t("sub_modal_cycle_label")} {selectedPlanCycle === "yearly" ? t("sub_cycle_yearly") : t("sub_cycle_monthly")}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-amber-950">
                  {selectedPlanCycle === "yearly" ? "฿990" : "฿99"}
                </span>
                <span className="text-[10px] text-amber-800 block">
                  {selectedPlanCycle === "yearly" ? t("sub_per_year") : t("sub_per_month")}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#26343F] mb-2">
              {t("sub_modal_payment_label")}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod("promptpay")}
                className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition-all cursor-pointer ${
                  paymentMethod === "promptpay"
                    ? "bg-[#3D5A73]/10 border-[#3D5A73] ring-1 ring-[#3D5A73]"
                    : "bg-[#FAF9F6] border-[#D1CEC5] text-[#66737D]"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#26343F]">
                  <QrCode className="h-4 w-4 text-[#003D6B]" />
                  <span>{t("sub_modal_promptpay")}</span>
                </div>
                <span className="text-[10px] text-[#66737D]">{t("sub_modal_promptpay_sub")}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("credit_card")}
                className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition-all cursor-pointer ${
                  paymentMethod === "credit_card"
                    ? "bg-[#3D5A73]/10 border-[#3D5A73] ring-1 ring-[#3D5A73]"
                    : "bg-[#FAF9F6] border-[#D1CEC5] text-[#66737D]"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#26343F]">
                  <CreditCard className="h-4 w-4 text-[#3D5A73]" />
                  <span>{t("sub_modal_card")}</span>
                </div>
                <span className="text-[10px] text-[#66737D]">{t("sub_modal_card_sub")}</span>
              </button>
            </div>
          </div>

          {/* Payment Details Preview */}
          {paymentMethod === "promptpay" ? (
            <div className="rounded-2xl border border-[#D1CEC5] bg-[#FAF9F6] p-4 text-center">
              <div className="mx-auto w-32 h-32 bg-white rounded-xl border border-[#D1CEC5] p-2 shadow-2xs flex flex-col items-center justify-center">
                <QrCode className="h-24 w-24 text-[#003D6B]" />
              </div>
              <p className="mt-2.5 text-xs font-semibold text-[#26343F]">
                {t("sub_modal_promptpay_amount")} {selectedPlanCycle === "yearly" ? "฿990.00" : "฿99.00"}
              </p>
              <p className="text-[10px] text-[#66737D] mt-0.5">
                {t("sub_modal_promptpay_hint")}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#D1CEC5] bg-[#FAF9F6] p-4 space-y-2.5">
              <div>
                <label className="block text-[11px] text-[#66737D] mb-1">{t("sub_modal_card_number")}</label>
                <input
                  type="text"
                  readOnly
                  value="•••• •••• •••• 4242"
                  className="w-full rounded-lg border border-[#D1CEC5] bg-white px-3 py-1.5 text-xs text-[#26343F]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-[#66737D] mb-1">{t("sub_modal_card_exp")}</label>
                  <input
                    type="text"
                    readOnly
                    value="12/28"
                    className="w-full rounded-lg border border-[#D1CEC5] bg-white px-3 py-1.5 text-xs text-[#26343F]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#66737D] mb-1">{t("sub_modal_card_cvc")}</label>
                  <input
                    type="text"
                    readOnly
                    value="•••"
                    className="w-full rounded-lg border border-[#D1CEC5] bg-white px-3 py-1.5 text-xs text-[#26343F]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              disabled={isProcessingPayment}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#66737D] hover:bg-[#E6E3DC]/60 transition-colors cursor-pointer"
            >
              {t("common_cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirmSubscribe}
              disabled={isProcessingPayment}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-xs active:scale-98 transition-all cursor-pointer"
            >
              {isProcessingPayment ? (
                <>
                  <Loading size="xs" />
                  <span>{t("sub_modal_processing")}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t("sub_modal_confirm_pay")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Downgrade / Cancel Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={t("sub_modal_cancel_title")}
        hideFooter={true}
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-[#66737D] leading-relaxed">
            {t("sub_modal_cancel_desc")}
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={isCancelling}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#66737D] hover:bg-[#E6E3DC]/60 transition-colors cursor-pointer"
            >
              {t("sub_modal_keep_prem")}
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A34F45] text-white text-xs font-bold hover:bg-[#8e3f36] transition-colors cursor-pointer"
            >
              {isCancelling ? <Loading size="xs" /> : null}
              <span>{t("sub_modal_confirm_free")}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
