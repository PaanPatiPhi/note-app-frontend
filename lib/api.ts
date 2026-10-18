import liff from "@line/liff";
import type { Profile, Note, NoteKindFilter } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

// LINE's ID token หมดอายุ 1 ชั่วโมงหลังออก และ liff.getIDToken() ไม่ refresh ให้เอง
const TOKEN_REFRESH_BUFFER_MS = 60_000;

// กันเรียก liff.login() ซ้อนกันหลายครั้งพร้อมกัน (เช่นตอน Promise.all ยิงหลาย
// endpoint พร้อมกันแล้วทุกตัวเจอ token หมดอายุพร้อมกัน) — ถ้าปล่อยให้เรียกซ้อนกัน
// จะทำให้ OAuth state ข้างใน LIFF SDK ชนกันเอง กลับมาได้ token ที่ยังใช้ไม่ได้
// แล้ว login วนซ้ำไม่จบ
let redirectingToLogin = false;

function forceRelogin(reason: string): never {
  if (!redirectingToLogin) {
    redirectingToLogin = true;
    liff.login();
  }
  throw new Error(reason);
}

function decodeJwtExpMillis(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

function getFreshIDToken(): string {
  const idToken = liff.getIDToken();
  if (!idToken) {
    forceRelogin("no id token, redirecting to LINE login");
  }
  const expMillis = decodeJwtExpMillis(idToken);
  const isExpiringSoon = expMillis !== null && expMillis < Date.now() + TOKEN_REFRESH_BUFFER_MS;
  if (isExpiringSoon) {
    forceRelogin("id token expired, redirecting to LINE login");
  }
  return idToken;
}

async function authedFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!liff.isLoggedIn()) {
    forceRelogin("redirecting to LINE login");
  }

  const idToken = getFreshIDToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${idToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    forceRelogin("unauthorized, redirecting to LINE login");
  }
  if (!res.ok) {
    throw new Error(`${path} -> ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

export async function getProfile(): Promise<Profile> {
  const data = await authedFetch<{ profile: Profile }>("/api/profile");
  return data.profile;
}

// getNoteCount ดึงสถิติ "จดไปแล้วกี่ครั้ง" ทั้งหมด (ไม่กรอง type) แยกจาก feed โดยสิ้นเชิง
export async function getNoteCount(): Promise<number> {
  const data = await authedFetch<{ count: number }>("/api/notes/count");
  return data.count;
}

type FeedResponse = { notes: Note[]; next_cursor: string | null };
type FeedResult = { notes: Note[]; nextCursor: string | null };

// getFeed รวม list ปกติ + search + toggle type + infinite scroll (cursor) ไว้ที่เดียว
// เรียกครั้งแรกไม่ต้องส่ง after, ครั้งถัดไปส่ง after = nextCursor จากรอบก่อน
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
  const data = await authedFetch<FeedResponse>(`/api/notes${qs ? `?${qs}` : ""}`);
  return { notes: data.notes, nextCursor: data.next_cursor };
}

export async function createNote(content: string, items?: string[]): Promise<Note> {
  const data = await authedFetch<{ note: Note }>("/api/notes", {
    method: "POST",
    body: JSON.stringify({ content, items }),
  });
  return data.note;
}

export async function getNoteById(id: string): Promise<Note> {
  const data = await authedFetch<{ note: Note }>(`/api/notes/${id}`);
  return data.note;
}

export async function updateNote(
  id: string,
  fields: { content?: string; is_done?: boolean }
): Promise<void> {
  await authedFetch<void>(`/api/notes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

export async function deleteNote(id: string): Promise<void> {
  await authedFetch<void>(`/api/notes/${id}`, { method: "DELETE" });
}

export async function toggleItem(
  noteId: string,
  itemId: string,
  isDone: boolean
): Promise<void> {
  await authedFetch<void>(`/api/notes/${noteId}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ is_done: isDone }),
  });
}