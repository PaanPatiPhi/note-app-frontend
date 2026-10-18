"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { Navbar } from "@/components/Navbar";
import Loading from "@/components/Loading";
import { toast } from "@/components/ui/toast";
import Modal from "@/components/ui/modal";
import {
  getAdminStats,
  getAdminFeedbacks,
  updateAdminFeedbackStatus,
  getAdminSubscriptions,
  getAdminUsers,
  updateAdminUserTier,
  updateAdminUserRole,
} from "@/lib/api";
import type {
  AdminStats,
  Feedback,
  Subscription,
  User,
  FeedbackType,
  FeedbackStatus,
  UserTier,
  UserRole,
} from "@/lib/types";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Crown,
  MessageSquare,
  BookOpen,
  DollarSign,
  Clock,
  CheckCircle2,
  Search,
  XCircle,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Edit3,
  Check,
  AlertTriangle,
  Lightbulb,
  Bug,
  HelpCircle,
  ArrowLeft,
  Mail,
  Calendar,
  Sparkles,
} from "lucide-react";

const STATUS_CONFIG: Record<
  FeedbackStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; badge: string }
> = {
  pending: {
    label: "รอดำเนินการ",
    icon: Clock,
    badge: "bg-amber-100 text-amber-900 border-amber-300",
  },
  investigating: {
    label: "กำลังตรวจสอบ",
    icon: Search,
    badge: "bg-blue-100 text-blue-900 border-blue-300",
  },
  resolved: {
    label: "ดำเนินการแล้ว",
    icon: CheckCircle2,
    badge: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  dismissed: {
    label: "ปิดข้อเสนอแนะ",
    icon: XCircle,
    badge: "bg-stone-100 text-stone-700 border-stone-300",
  },
};

const CATEGORY_CONFIG: Record<
  FeedbackType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  suggestion: { label: "ข้อเสนอแนะ", icon: Lightbulb, color: "text-amber-600" },
  complaint: { label: "ข้อร้องเรียน", icon: AlertTriangle, color: "text-[#A34F45]" },
  bug: { label: "แจ้งบั๊ก", icon: Bug, color: "text-rose-600" },
  other: { label: "เรื่องอื่นๆ", icon: HelpCircle, color: "text-[#3D5A73]" },
};

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading, refreshUser } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<"feedbacks" | "users" | "subscriptions">("feedbacks");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Feedbacks state
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState<string>("all");
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<string>("all");
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  // Users state
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userTierFilter, setUserTierFilter] = useState<string>("all");

  // Subscriptions state
  const [subscriptionsList, setSubscriptionsList] = useState<Subscription[]>([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);

  const isAdmin = user?.role === "admin";

  const loadStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch {
      // ignore
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const loadFeedbacks = useCallback(async () => {
    setIsLoadingFeedbacks(true);
    try {
      const data = await getAdminFeedbacks({
        type: feedbackTypeFilter,
        status: feedbackStatusFilter,
      });
      setFeedbacks(data);
    } catch {
      toast.add({ type: "error", description: "Failed to load feedbacks" });
    } finally {
      setIsLoadingFeedbacks(false);
    }
  }, [feedbackTypeFilter, feedbackStatusFilter]);

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const data = await getAdminUsers();
      setUsersList(data);
    } catch {
      // ignore
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const loadSubscriptions = useCallback(async () => {
    setIsLoadingSubs(true);
    try {
      const data = await getAdminSubscriptions();
      setSubscriptionsList(data);
    } catch {
      // ignore
    } finally {
      setIsLoadingSubs(false);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    loadStats();
    loadFeedbacks();
    loadUsers();
    loadSubscriptions();
  }, [loadStats, loadFeedbacks, loadUsers, loadSubscriptions]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadAllData();
    }
  }, [isAuthenticated, isAdmin, loadAllData]);

  const handleUpdateStatus = async (feedbackId: string, newStatus: FeedbackStatus) => {
    try {
      await updateAdminFeedbackStatus(feedbackId, newStatus);
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === feedbackId ? { ...f, status: newStatus } : f))
      );
      if (selectedFeedback && selectedFeedback.id === feedbackId) {
        setSelectedFeedback((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      toast.add({
        type: "success",
        title: "อัปเดตสถานะสำเร็จ",
        description: `เปลี่ยนสถานะเป็น ${STATUS_CONFIG[newStatus].label} เรียบร้อยแล้ว`,
      });
      loadStats();
    } catch (err: any) {
      toast.add({
        type: "error",
        title: "อัปเดตไม่สำเร็จ",
        description: err?.message || "กรุณาลองใหม่อีกครั้ง",
      });
    }
  };

  const handleUpdateUserTier = async (targetUserId: string, newTier: UserTier) => {
    try {
      await updateAdminUserTier(targetUserId, newTier);
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, tier: newTier } : u))
      );
      toast.add({
        type: "success",
        title: "อัปเดตแพ็กเกจสำเร็จ",
        description: `ปรับสถานะเป็น ${newTier === "premium" ? "Premium" : "Free"} เรียบร้อยแล้ว`,
      });
      loadStats();
      if (user?.id === targetUserId) {
        refreshUser();
      }
    } catch (err: any) {
      toast.add({ type: "error", description: err?.message || "อัปเดตแพ็กเกจไม่สำเร็จ" });
    }
  };

  const handleUpdateUserRole = async (targetUserId: string, newRole: UserRole) => {
    try {
      await updateAdminUserRole(targetUserId, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
      );
      toast.add({
        type: "success",
        title: "อัปเดตสิทธิ์สำเร็จ",
        description: `ปรับบทบาทเป็น ${newRole === "admin" ? "Admin" : "User"} เรียบร้อยแล้ว`,
      });
      if (user?.id === targetUserId) {
        refreshUser();
      }
    } catch (err: any) {
      toast.add({ type: "error", description: err?.message || "อัปเดตสิทธิ์ไม่สำเร็จ" });
    }
  };

  // Filtered feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      const matchType = feedbackTypeFilter === "all" || f.type === feedbackTypeFilter;
      const matchStatus = feedbackStatusFilter === "all" || f.status === feedbackStatusFilter;
      const matchSearch =
        !feedbackSearch.trim() ||
        f.title.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
        f.message.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
        (f.contact_email && f.contact_email.toLowerCase().includes(feedbackSearch.toLowerCase())) ||
        (f.user_name && f.user_name.toLowerCase().includes(feedbackSearch.toLowerCase()));
      return matchType && matchStatus && matchSearch;
    });
  }, [feedbacks, feedbackTypeFilter, feedbackStatusFilter, feedbackSearch]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchTier = userTierFilter === "all" || (u.tier || "free") === userTierFilter;
      const matchSearch =
        !userSearch.trim() ||
        u.display_name.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()));
      return matchTier && matchSearch;
    });
  }, [usersList, userTierFilter, userSearch]);

  // Formatting helpers
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(language === "th" ? "th-TH" : "en-US", {
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

  if (isAuthLoading) {
    return <Loading fullScreen text="กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ..." />;
  }

  // If user is not admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#26343F] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl border border-[#D1CEC5] bg-white p-8 text-center shadow-md">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-4">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-[#26343F] font-['Chonburi']">
              เฉพาะผู้ดูแลระบบ (Admin Only)
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#66737D] leading-relaxed">
              หน้านี้สงวนไว้สำหรับบัญชีผู้ดูแลระบบ (Role: Admin) เท่านั้น หากคุณเป็นผู้ดูแลระบบ กรุณาเข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                href="/notes"
                className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-[#3D5A73] text-white text-xs font-semibold hover:bg-[#30475C] transition-colors shadow-xs"
              >
                กลับสู่หน้าสมุดโน้ต
              </Link>
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-[#FAF9F6] border border-[#D1CEC5] text-xs font-semibold text-[#26343F] hover:bg-[#E6E3DC]/60 transition-colors"
              >
                เข้าสู่ระบบด้วยบัญชีอื่น
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#26343F] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Admin Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                <span>Admin Dashboard</span>
              </span>
              <span className="text-xs text-[#66737D]">
                เข้าสู่ระบบโดย: <strong>{user?.display_name}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#26343F] font-['Chonburi']">
              {t("admin_title")}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllData}
              disabled={isLoadingStats || isLoadingFeedbacks}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D1CEC5] bg-white px-3.5 py-2 text-xs font-semibold text-[#26343F] hover:bg-[#FAF9F6] shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#3D5A73] ${isLoadingStats ? "animate-spin" : ""}`} />
              <span>{t("common_refresh")}</span>
            </button>
            <Link
              href="/notes"
              className="inline-flex items-center gap-1 rounded-xl bg-[#FAF9F6] border border-[#D1CEC5] px-3.5 py-2 text-xs font-semibold text-[#66737D] hover:text-[#26343F] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t("nav_notes")}</span>
            </Link>
          </div>
        </div>

        {/* Overview Stats Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Total Users */}
          <div className="rounded-2xl border border-[#D1CEC5] bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#66737D]">ผู้ใช้ทั้งหมด</span>
              <div className="h-8 w-8 rounded-xl bg-[#3D5A73]/10 text-[#3D5A73] flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#26343F]">
                {stats?.total_users ?? "..."}
              </span>
              <span className="text-[11px] text-[#66737D]">
                (Free: {stats?.free_users ?? 0})
              </span>
            </div>
          </div>

          {/* Card 2: Premium Members */}
          <div className="rounded-2xl border border-amber-300 bg-amber-50/50 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">สมาชิก Premium</span>
              <div className="h-8 w-8 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center">
                <Crown className="h-4 w-4 fill-amber-700 text-amber-700" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-950">
                {stats?.premium_users ?? "..."}
              </span>
              <span className="text-[11px] text-amber-800 font-medium">
                รายได้: ฿{(stats?.total_revenue ?? 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Card 3: Pending Feedbacks */}
          <div className="rounded-2xl border border-[#D1CEC5] bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#66737D]">ข้อเสนอแนะค้างตรวจ</span>
              <div className="h-8 w-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-700">
                {stats?.pending_feedbacks ?? "..."}
              </span>
              <span className="text-[11px] text-[#66737D]">
                / ทั้งหมด {stats?.total_feedbacks ?? 0} เรื่อง
              </span>
            </div>
          </div>

          {/* Card 4: Total Notes */}
          <div className="rounded-2xl border border-[#D1CEC5] bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#66737D]">
                {language === "th" ? "โน้ตในระบบทั้งหมด" : "Total JodJods in System"}
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#26343F]">
                {stats?.total_notes ?? "..."}
              </span>
              <span className="text-[11px] text-[#66737D]">{t("common_items")}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#D1CEC5] mb-6">
          <button
            onClick={() => setActiveTab("feedbacks")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "feedbacks"
                ? "border-[#3D5A73] text-[#3D5A73]"
                : "border-transparent text-[#66737D] hover:text-[#26343F]"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>จัดการข้อเสนอแนะ & แจ้งปัญหา ({feedbacks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "users"
                ? "border-[#3D5A73] text-[#3D5A73]"
                : "border-transparent text-[#66737D] hover:text-[#26343F]"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>จัดการผู้ใช้ & สิทธิ์ ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "subscriptions"
                ? "border-[#3D5A73] text-[#3D5A73]"
                : "border-transparent text-[#66737D] hover:text-[#26343F]"
            }`}
          >
            <Crown className="h-4 w-4" />
            <span>ประวัติการสมัคร Subscription ({subscriptionsList.length})</span>
          </button>
        </div>

        {/* Tab 1 Content: Feedbacks Management */}
        {activeTab === "feedbacks" && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="rounded-2xl border border-[#D1CEC5] bg-white p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#66737D]" />
                  <input
                    type="text"
                    placeholder="ค้นหาหัวข้อ, เนื้อหา, อีเมล..."
                    value={feedbackSearch}
                    onChange={(e) => setFeedbackSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#D1CEC5] bg-[#FAF9F6] text-xs text-[#26343F] focus:bg-white focus:outline-none focus:border-[#3D5A73]"
                  />
                </div>

                {/* Type Filter */}
                <select
                  value={feedbackTypeFilter}
                  onChange={(e) => setFeedbackTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-[#D1CEC5] bg-[#FAF9F6] text-xs text-[#26343F] cursor-pointer"
                >
                  <option value="all">ทุกประเภท</option>
                  <option value="suggestion">ข้อเสนอแนะ (Suggestion)</option>
                  <option value="complaint">ข้อร้องเรียน (Complaint)</option>
                  <option value="bug">แจ้งบั๊ก (Bug)</option>
                  <option value="other">เรื่องอื่นๆ (Other)</option>
                </select>

                {/* Status Filter */}
                <select
                  value={feedbackStatusFilter}
                  onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-[#D1CEC5] bg-[#FAF9F6] text-xs text-[#26343F] cursor-pointer"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="pending">รอดำเนินการ (Pending)</option>
                  <option value="investigating">กำลังตรวจสอบ (Investigating)</option>
                  <option value="resolved">ดำเนินการแล้ว (Resolved)</option>
                  <option value="dismissed">ปิดข้อเสนอแนะ (Dismissed)</option>
                </select>
              </div>

              <div className="text-xs text-[#66737D]">
                พบทั้งหมด <strong>{filteredFeedbacks.length}</strong> รายการ
              </div>
            </div>

            {/* Feedbacks List */}
            {isLoadingFeedbacks ? (
              <div className="py-12 text-center">
                <Loading size="md" text="กำลังโหลดรายการข้อเสนอแนะ..." />
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="rounded-2xl border border-[#D1CEC5] bg-white p-12 text-center">
                <MessageSquare className="h-10 w-10 text-[#D1CEC5] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#66737D]">ไม่พบรายการข้อเสนอแนะ</p>
                <p className="text-xs text-[#66737D]/80 mt-1">
                  ลองเปลี่ยนคำค้นหาหรือตัวกรองหมวดหมู่
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFeedbacks.map((item) => {
                  const cat = CATEGORY_CONFIG[item.type] || CATEGORY_CONFIG.other;
                  const stat = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                  const CatIcon = cat.icon;
                  const StatIcon = stat.icon;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[#D1CEC5] bg-white p-4 sm:p-5 shadow-2xs hover:border-[#3D5A73]/40 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-xl bg-[#FAF9F6] border border-[#D1CEC5] shrink-0 mt-0.5">
                            <CatIcon className={`h-4 w-4 ${cat.color}`} />
                          </div>

                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-sm text-[#26343F]">
                                {item.title}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${stat.badge}`}
                              >
                                <StatIcon className="h-2.5 w-2.5" />
                                <span>{stat.label}</span>
                              </span>
                            </div>

                            <p className="text-xs text-[#66737D] leading-relaxed line-clamp-3">
                              {item.message}
                            </p>

                            {/* Submitter Info */}
                            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-[#66737D]">
                              <span>ผู้ส่ง: <strong>{item.user_name || "Guest (ผู้เยี่ยมชม)"}</strong></span>
                              {item.contact_email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <span>{item.contact_email}</span>
                                </span>
                              )}
                              <span>วันที่: {formatDate(item.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Change Dropdown */}
                        <div className="flex items-center gap-2 sm:self-start shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#D1CEC5]/50">
                          <span className="text-[11px] text-[#66737D] sm:hidden">เปลี่ยนสถานะ:</span>
                          <select
                            value={item.status}
                            onChange={(e) =>
                              handleUpdateStatus(item.id, e.target.value as FeedbackStatus)
                            }
                            className="px-2.5 py-1.5 rounded-xl border border-[#D1CEC5] bg-[#FAF9F6] text-xs font-semibold text-[#26343F] hover:bg-white focus:outline-none focus:border-[#3D5A73] cursor-pointer"
                          >
                            <option value="pending">⏳ รอดำเนินการ</option>
                            <option value="investigating">🔍 กำลังตรวจสอบ</option>
                            <option value="resolved">✅ ดำเนินการแล้ว</option>
                            <option value="dismissed">✕ ปิดข้อเสนอแนะ</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2 Content: Users Management */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="rounded-2xl border border-[#D1CEC5] bg-white p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="relative min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#66737D]" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อผู้ใช้, อีเมล..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#D1CEC5] bg-[#FAF9F6] text-xs text-[#26343F] focus:bg-white focus:outline-none focus:border-[#3D5A73]"
                  />
                </div>

                <select
                  value={userTierFilter}
                  onChange={(e) => setUserTierFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-[#D1CEC5] bg-[#FAF9F6] text-xs text-[#26343F] cursor-pointer"
                >
                  <option value="all">ทุกแพ็กเกจ (All Tiers)</option>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <span className="text-xs text-[#66737D]">
                สมาชิก {filteredUsers.length} คน
              </span>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl border border-[#D1CEC5] bg-white shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F6] border-b border-[#D1CEC5] text-[#66737D]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">ผู้ใช้งาน</th>
                      <th className="py-3 px-4 font-semibold">อีเมล</th>
                      <th className="py-3 px-4 font-semibold text-center">แพ็กเกจ (Tier)</th>
                      <th className="py-3 px-4 font-semibold text-center">บทบาท (Role)</th>
                      <th className="py-3 px-4 font-semibold">สมัครเมื่อ</th>
                      <th className="py-3 px-4 font-semibold text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D1CEC5]/50 text-[#26343F]">
                    {filteredUsers.map((u) => {
                      const isUserPremium = u.tier === "premium";
                      const isUserAdmin = u.role === "admin";

                      return (
                        <tr key={u.id} className="hover:bg-[#FAF9F6]/50 transition-colors">
                          <td className="py-3.5 px-4 font-semibold flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-[#E6E3DC] text-[#3D5A73] flex items-center justify-center font-bold text-xs">
                              {u.display_name?.charAt(0) || "U"}
                            </div>
                            <span>{u.display_name}</span>
                          </td>
                          <td className="py-3.5 px-4 text-[#66737D]">{u.email || "—"}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isUserPremium
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : "bg-[#E6E3DC] text-[#3D5A73] border-[#D1CEC5]"
                              }`}
                            >
                              {isUserPremium && <Crown className="h-3 w-3 text-amber-600 fill-amber-500" />}
                              <span>{isUserPremium ? "Premium" : "Free"}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                isUserAdmin
                                  ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {u.role || "user"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#66737D]">{formatDate(u.created_at)}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Toggle Tier */}
                              <button
                                onClick={() =>
                                  handleUpdateUserTier(u.id, isUserPremium ? "free" : "premium")
                                }
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                  isUserPremium
                                    ? "border-[#D1CEC5] text-[#A34F45] hover:bg-[#A34F45]/10"
                                    : "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                                }`}
                              >
                                {isUserPremium ? "ลดเป็น Free" : "ปรับเป็น Premium"}
                              </button>

                              {/* Toggle Role */}
                              <button
                                onClick={() =>
                                  handleUpdateUserRole(u.id, isUserAdmin ? "user" : "admin")
                                }
                                className="px-2 py-1 rounded-lg border border-[#D1CEC5] text-[10px] font-medium text-[#66737D] hover:bg-[#E6E3DC]/60 transition-colors cursor-pointer"
                              >
                                {isUserAdmin ? "ลดเป็น User" : "ตั้งเป็น Admin"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3 Content: Subscriptions Transactions */}
        {activeTab === "subscriptions" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#D1CEC5] bg-white shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F6] border-b border-[#D1CEC5] text-[#66737D]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">ผู้ใช้งาน</th>
                      <th className="py-3 px-4 font-semibold">แพ็กเกจ</th>
                      <th className="py-3 px-4 font-semibold">รอบบิล</th>
                      <th className="py-3 px-4 font-semibold">ยอดชำระ</th>
                      <th className="py-3 px-4 font-semibold">ช่องทาง</th>
                      <th className="py-3 px-4 font-semibold text-center">สถานะ</th>
                      <th className="py-3 px-4 font-semibold">วันเริ่มต้น</th>
                      <th className="py-3 px-4 font-semibold">วันหมดอายุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D1CEC5]/50 text-[#26343F]">
                    {subscriptionsList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#66737D]">
                          ยังไม่มีประวัติการสมัครสมาชิกในระบบ
                        </td>
                      </tr>
                    ) : (
                      subscriptionsList.map((sub) => {
                        const isSubActive = sub.status === "active";
                        return (
                          <tr key={sub.id} className="hover:bg-[#FAF9F6]/50 transition-colors">
                            <td className="py-3.5 px-4 font-medium">
                              <div>{sub.user_name || "—"}</div>
                              <div className="text-[11px] text-[#66737D]">{sub.user_email}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                                  sub.tier === "premium" ? "text-amber-800" : "text-[#66737D]"
                                }`}
                              >
                                {sub.tier === "premium" && <Crown className="h-3 w-3 text-amber-600 fill-amber-500" />}
                                <span className="uppercase">{sub.tier}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#66737D] capitalize">
                              {sub.billing_cycle === "yearly"
                                ? "รายปี"
                                : sub.billing_cycle === "monthly"
                                ? "รายเดือน"
                                : sub.billing_cycle}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#26343F]">
                              ฿{sub.amount.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-[#66737D] uppercase text-[10px]">
                              {sub.payment_method}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isSubActive
                                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                    : "bg-stone-100 text-stone-700 border-stone-300"
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#66737D]">{formatDate(sub.starts_at)}</td>
                            <td className="py-3.5 px-4 text-[#66737D]">
                              {sub.expires_at ? formatDate(sub.expires_at) : "ตลอดการใช้งาน"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
