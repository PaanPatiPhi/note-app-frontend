import type {
  Profile,
  Note,
  NoteKindFilter,
  User,
  UserIdentity,
  AuthResponse,
  Feedback,
  CreateFeedbackInput,
  Subscription,
  AdminStats,
  UserTier,
  UserRole,
  AssistantReply,
  AssistantUndoResult,
  AssistantHistoryPage,
  IntegrationsStatus,
  AgendaResponse,
} from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

export function getAvatarUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${API_BASE}${url}`;
  }
  return `${API_BASE}/${url}`;
}

// จัดการ Token fallback ในกรณีที่ browser ไม่เซฟ cookie ข้าม origin (dev mode)
let memoryToken: string | null = null;

export function setAuthToken(token: string | null) {
  memoryToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      sessionStorage.setItem("jodjod_token", token);
    } else {
      sessionStorage.removeItem("jodjod_token");
    }
  }
}

export function getAuthToken(): string | null {
  if (memoryToken) return memoryToken;
  if (typeof window !== "undefined") {
    memoryToken = sessionStorage.getItem("jodjod_token");
  }
  return memoryToken;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };

  if (init?.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include", // ส่ง HttpOnly cookie ด้วยเสมอ
  });

  if (res.status === 204) {
    return undefined as T;
  }

  let data: any = null;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.details || `${path} -> HTTP ${res.status}`;
    throw new ApiError(errorMsg, res.status, data);
  }

  return data as T;
}

// ──────────────────────────────────────────────
// Auth APIs
// ──────────────────────────────────────────────

export async function registerWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResponse> {
  const data = await request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, display_name: displayName }),
  });
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<AuthResponse> {
  const data = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function loginWithGoogle(credential: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function loginWithLine(idToken: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>("/api/auth/line", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  });
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function getMe(): Promise<{ user: User; identities: UserIdentity[] }> {
  return await request<{ user: User; identities: UserIdentity[] }>("/api/auth/me");
}

export async function linkGoogle(credential: string): Promise<{ success: boolean; message: string; identities: UserIdentity[] }> {
  return await request<{ success: boolean; message: string; identities: UserIdentity[] }>("/api/auth/link/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

export async function unlinkGoogle(): Promise<{ success: boolean; message: string; identities: UserIdentity[] }> {
  return await request<{ success: boolean; message: string; identities: UserIdentity[] }>("/api/auth/unlink/google", {
    method: "POST",
  });
}

export async function linkLine(idToken: string): Promise<{ success: boolean; message: string; identities: UserIdentity[] }> {
  return await request<{ success: boolean; message: string; identities: UserIdentity[] }>("/api/auth/link/line", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  });
}

export async function unlinkLine(): Promise<{ success: boolean; message: string; identities: UserIdentity[] }> {
  return await request<{ success: boolean; message: string; identities: UserIdentity[] }>("/api/auth/unlink/line", {
    method: "POST",
  });
}

// เพิ่ม login ด้วยอีเมล+รหัสผ่านให้บัญชีที่ใช้ LINE/Google อยู่ (บัญชีที่มีอีเมลจาก Google ต้องใช้อีเมลนั้น)
export async function linkEmail(email: string, password: string): Promise<{ success: boolean; message: string; user: User; identities: UserIdentity[] }> {
  return await request<{ success: boolean; message: string; user: User; identities: UserIdentity[] }>("/api/auth/link/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return await request<{ success: boolean; message: string }>("/api/auth/password", {
    method: "POST",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}

// รหัสใช้ครั้งเดียว (อายุ 2 นาที) ไว้เปิดเว็บใน browser ภายนอกจากหน้า LIFF โดยยัง login อยู่
export async function createHandoff(): Promise<{ code: string; expires_in: number }> {
  return await request<{ code: string; expires_in: number }>("/api/auth/handoff", { method: "POST" });
}

export async function exchangeHandoff(code: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>("/api/auth/handoff/exchange", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function logout(): Promise<void> {
  try {
    await request<void>("/api/auth/logout", { method: "POST" });
  } finally {
    setAuthToken(null);
  }
}

export async function uploadAvatar(file: File): Promise<{ success: boolean; avatar_url: string; user: User }> {
  const formData = new FormData();
  formData.append("avatar", file);

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api/auth/avatar`, {
    method: "POST",
    body: formData,
    headers,
    credentials: "include",
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new ApiError(data?.error || "อัปโหลดรูปโปรไฟล์ล้มเหลว", res.status, data);
  }

  return data;
}

export async function updateProfile(data: {
  display_name?: string;
  avatar_url?: string;
}): Promise<{ success: boolean; user: User }> {
  return await request<{ success: boolean; user: User }>("/api/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ──────────────────────────────────────────────
// Notes & Profile APIs
// ──────────────────────────────────────────────

export async function getProfile(): Promise<Profile> {
  const data = await request<{ profile: Profile }>("/api/profile");
  return data.profile;
}

export async function getNoteCount(): Promise<number> {
  const data = await request<{ count: number }>("/api/notes/count");
  return data.count;
}

type FeedResponse = { notes: Note[]; next_cursor: string | null };
export type FeedResult = { notes: Note[]; nextCursor: string | null };

export async function getFeed(options?: {
  type?: NoteKindFilter;
  q?: string;
  sort?: "asc" | "desc";
  after?: string | null;
  limit?: number;
}): Promise<FeedResult> {
  const params = new URLSearchParams();
  if (options?.type && options.type !== "all") params.set("type", options.type);
  if (options?.q) params.set("q", options.q);
  if (options?.sort) params.set("sort", options.sort);
  if (options?.after) params.set("after", options.after);
  if (options?.limit) params.set("limit", String(options.limit));

  const qs = params.toString();
  const data = await request<FeedResponse>(`/api/notes${qs ? `?${qs}` : ""}`);
  return { notes: data.notes ?? [], nextCursor: data.next_cursor ?? null };
}

export async function createNote(content: string, items?: string[]): Promise<Note> {
  const data = await request<{ note: Note }>("/api/notes", {
    method: "POST",
    body: JSON.stringify({ content, items }),
  });
  return data.note;
}

export async function getNoteById(id: string): Promise<Note> {
  const data = await request<{ note: Note }>(`/api/notes/${id}`);
  return data.note;
}

export async function updateNote(
  id: string,
  fields: { content?: string; is_done?: boolean; pinned?: boolean }
): Promise<void> {
  await request<void>(`/api/notes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

export async function deleteNote(id: string): Promise<void> {
  await request<void>(`/api/notes/${id}`, { method: "DELETE" });
}

export async function toggleItem(
  noteId: string,
  itemId: string,
  isDone: boolean
): Promise<void> {
  await request<void>(`/api/notes/${noteId}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ is_done: isDone }),
  });
}

// ──────────────────────────────────────────────
// AI Assistant APIs (ใช้ AI ตัวเดียวกับ LINE bot ผ่านเว็บ/แอป)
// ──────────────────────────────────────────────

// ส่งข้อความภาษาธรรมชาติ เช่น "ซื้อนม ไข่ ขนมปัง" หรือ "พรุ่งนี้ 9 โมงเตือนโทรหาหมอ"
// ถ้า AI ใช้ไม่ได้ (503) จะ throw ApiError ที่ data.reply มีข้อความสุภาพไว้แสดง
export async function sendAssistantMessage(text: string): Promise<AssistantReply> {
  return await request<AssistantReply>("/api/assistant/messages", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

// ย้อนสิ่งที่ AI ทำใน action นั้น (ภายใน 24 ชม., ครั้งเดียว)
// 404 = ไม่พบ, 409 = ยกเลิกไปแล้วหรือเก่าเกิน — ทั้งสองกรณี data.message มีข้อความให้แสดง
export async function undoAssistantAction(actionId: string): Promise<AssistantUndoResult> {
  return await request<AssistantUndoResult>(`/api/assistant/actions/${encodeURIComponent(actionId)}/undo`, {
    method: "POST",
  });
}

// ประวัติที่สั่ง AI ทั้งจาก LINE และเว็บ (เรียงเก่า→ใหม่) — ส่ง before เพื่อโหลดหน้าที่เก่ากว่า
export async function getAssistantHistory(options?: { limit?: number; before?: string | null }): Promise<AssistantHistoryPage> {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.before) params.set("before", options.before);
  const qs = params.toString();
  const data = await request<AssistantHistoryPage>(`/api/assistant/history${qs ? `?${qs}` : ""}`);
  return { items: data.items ?? [], next_before: data.next_before ?? null };
}

// ──────────────────────────────────────────────
// Agenda (นัด/เตือนที่กำลังจะมาถึง)
// ──────────────────────────────────────────────

export async function getAgenda(days = 14): Promise<AgendaResponse> {
  const data = await request<AgendaResponse>(`/api/agenda?days=${days}`);
  return { ...data, items: data.items ?? [] };
}

// ──────────────────────────────────────────────
// Integrations (Google Calendar ฯลฯ)
// ──────────────────────────────────────────────

export async function getIntegrations(): Promise<IntegrationsStatus> {
  return await request<IntegrationsStatus>("/api/integrations");
}

// คืน URL หน้าขออนุญาตของ Google — ให้ไปหน้านั้นต่อ แล้ว Google จะพากลับมาที่ /account?google_calendar=...
export async function startGoogleCalendarConnect(): Promise<string> {
  const data = await request<{ url: string }>("/api/integrations/google/connect", { method: "POST" });
  return data.url;
}

export async function disconnectGoogleCalendar(): Promise<void> {
  await request<void>("/api/integrations/google", { method: "DELETE" });
}

// ──────────────────────────────────────────────
// Feedback APIs
// ──────────────────────────────────────────────

export async function submitFeedback(input: CreateFeedbackInput): Promise<{ success: boolean; feedback: Feedback; message: string }> {
  return await request<{ success: boolean; feedback: Feedback; message: string }>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getFeedbacks(): Promise<Feedback[]> {
  const data = await request<{ feedbacks: Feedback[] }>("/api/feedback");
  return data.feedbacks ?? [];
}

// ──────────────────────────────────────────────
// Subscription APIs
// ──────────────────────────────────────────────

export async function subscribePlan(data: {
  tier: UserTier;
  billing_cycle?: "monthly" | "yearly";
  payment_method?: string;
}): Promise<{ success: boolean; subscription: Subscription; tier: UserTier; message: string }> {
  return await request<{ success: boolean; subscription: Subscription; tier: UserTier; message: string }>(
    "/api/subscription/subscribe",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function getCurrentSubscription(): Promise<{ tier: UserTier; subscription: Subscription | null }> {
  return await request<{ tier: UserTier; subscription: Subscription | null }>("/api/subscription/current");
}

export async function getSubscriptionHistory(): Promise<Subscription[]> {
  const data = await request<{ subscriptions: Subscription[] }>("/api/subscription/history");
  return data.subscriptions ?? [];
}

export async function cancelSubscription(): Promise<{ success: boolean; tier: UserTier; message: string }> {
  return await request<{ success: boolean; tier: UserTier; message: string }>("/api/subscription/cancel", {
    method: "POST",
  });
}

// ──────────────────────────────────────────────
// Admin APIs
// ──────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  return await request<AdminStats>("/api/admin/stats");
}

export async function getAdminFeedbacks(params?: {
  type?: string;
  status?: string;
}): Promise<Feedback[]> {
  const q = new URLSearchParams();
  if (params?.type && params.type !== "all") q.set("type", params.type);
  if (params?.status && params.status !== "all") q.set("status", params.status);
  const qs = q.toString();

  const data = await request<{ feedbacks: Feedback[] }>(`/api/admin/feedbacks${qs ? `?${qs}` : ""}`);
  return data.feedbacks ?? [];
}

export async function updateAdminFeedbackStatus(
  id: string,
  status: string
): Promise<{ success: boolean; status: string; message: string }> {
  return await request<{ success: boolean; status: string; message: string }>(
    `/api/admin/feedbacks/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}

export async function getAdminSubscriptions(): Promise<Subscription[]> {
  const data = await request<{ subscriptions: Subscription[] }>("/api/admin/subscriptions");
  return data.subscriptions ?? [];
}

export async function getAdminUsers(): Promise<User[]> {
  const data = await request<{ users: User[] }>("/api/admin/users");
  return data.users ?? [];
}

export async function updateAdminUserTier(
  userId: string,
  tier: UserTier
): Promise<{ success: boolean; tier: string; message: string }> {
  return await request<{ success: boolean; tier: string; message: string }>(
    `/api/admin/users/${userId}/tier`,
    {
      method: "PATCH",
      body: JSON.stringify({ tier }),
    }
  );
}

export async function updateAdminUserRole(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; role: string; message: string }> {
  return await request<{ success: boolean; role: string; message: string }>(
    `/api/admin/users/${userId}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }
  );
}