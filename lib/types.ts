export type UserTier = "free" | "premium";
export type UserRole = "user" | "admin";

export type User = {
  id: string;
  email?: string;
  display_name: string;
  avatar_url?: string;
  tier?: UserTier;
  role?: UserRole;
  created_at: string;
  updated_at?: string;
};

export type UserIdentity = {
  id: string;
  user_id: string;
  provider: "google" | "line" | string;
  provider_user_id: string;
  email?: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
};

export type AuthResponse = {
  user: User;
  token: string;
  identities: UserIdentity[];
};

export type Profile = {
  id?: string;
  name: string;
  email?: string;
  picture?: string;
  tier: UserTier;
  role?: UserRole;
};

export type NoteItemType = {
  id: string;
  text: string;
  is_done: boolean;
};

export type NoteKind = "note" | "todo" | "checklist" | "reminder";

// ใช้กับ toggle บนหน้าเว็บ: "all" = ไม่กรอง type เลย
export type NoteKindFilter = "all" | NoteKind;

export type Note = {
  id: string;
  content: string;
  type: NoteKind;
  is_done: boolean;
  created_at: string;
  items?: NoteItemType[];
  due_date?: string | null;
  // เวลาที่จะเตือน (เฉพาะ type "reminder")
  remind_at?: string | null;
  // ช่องทางที่สร้าง: "line" | "web" | "ai"
  source?: string;
};

// ผลจาก AI assistant (POST /api/assistant/messages)
export type AssistantReply = {
  reply: string;
  action_id?: string;
  // กดยกเลิกได้ (AI สร้าง/แก้ข้อมูล)
  undoable: boolean;
  // มีข้อมูลเปลี่ยน ให้โหลดรายการโน้ตใหม่
  wrote: boolean;
};

export type AssistantUndoResult = {
  message: string;
  deleted_notes: number;
  removed_items: number;
  restored_items: number;
};

export type FeedbackType = "complaint" | "suggestion" | "bug" | "other";

export type FeedbackStatus = "pending" | "investigating" | "resolved" | "dismissed";

export type Feedback = {
  id: string;
  user_id?: string | null;
  type: FeedbackType;
  title: string;
  message: string;
  contact_email?: string | null;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
};

export type CreateFeedbackInput = {
  type: FeedbackType;
  title: string;
  message: string;
  contact_email?: string;
};

export type BillingCycle = "monthly" | "yearly" | "lifetime";

export type Subscription = {
  id: string;
  user_id: string;
  tier: UserTier;
  billing_cycle: BillingCycle;
  amount: number;
  currency: string;
  status: "active" | "cancelled" | "expired";
  starts_at: string;
  expires_at?: string | null;
  payment_method: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
};

export type AdminStats = {
  total_users: number;
  premium_users: number;
  free_users: number;
  total_feedbacks: number;
  pending_feedbacks: number;
  active_subs: number;
  total_revenue: number;
  total_notes: number;
};