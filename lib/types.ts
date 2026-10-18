export type Profile = {
  name: string;
  picture?: string;
  tier: string;
};

export type NoteItemType = {
  id: string;
  text: string;
  is_done: boolean;
};

export type NoteKind = "note" | "todo" | "checklist";

// ใช้กับ toggle บนหน้าเว็บ: "all" = ไม่กรอง type เลย
export type NoteKindFilter = "all" | NoteKind;

export type Note = {
  id: string;
  content: string;
  type: NoteKind;
  is_done: boolean;
  created_at: string;
  items?: NoteItemType[];
};