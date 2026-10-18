"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { Navbar } from "@/components/Navbar";
import { getProfile, getFeed, deleteNote, getNoteCount, updateNote, createNote } from "@/lib/api";
import type { Profile, Note } from "@/lib/types";
import { UserCard } from "@/components/UserCard";
import NoteCard from "@/components/NoteCard";
import { NoteForm } from "@/components/ui/noteform";
import { toast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import ToggleBar from "@/components/ToggleBar";
import Loading from "@/components/Loading";
import Modal from "@/components/ui/modal";
import { Search, Plus, BookOpen, AlertTriangle, X, Sparkles, PenLine } from "lucide-react";

export default function NotesPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingMain, setIsLoadingMain] = useState(true);
  const [isLoadingSub, setIsLoadingSub] = useState(false);
  const [type, setType] = useState<"note" | "checklist" | "all">("all");
  const [search, setSearch] = useState("");
  const [noteCount, setNoteCount] = useState(0);

  // Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editItems, setEditItems] = useState<string[]>([]);

  const skipNextNoteFetch = useRef(false);

  // Authentication check
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Initial data load after user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    async function init() {
      try {
        const [p, count, feed] = await Promise.all([
          getProfile().catch(() => ({
            name: user?.display_name || "ผู้ใช้งาน",
            picture: user?.avatar_url || "",
            tier: (user?.tier || "free") as "free" | "premium",
          })),
          getNoteCount().catch(() => 0),
          getFeed({ type, q: search }),
        ]);

        setProfile(p);
        setNoteCount(count);
        setNotes(feed.notes);
        skipNextNoteFetch.current = true;
      } catch (err) {
        console.error("Init feed error:", err);
      } finally {
        setIsLoadingMain(false);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  // Refetch notes on search or type change
  useEffect(() => {
    if (!isAuthenticated || isLoadingMain) return;

    if (skipNextNoteFetch.current) {
      skipNextNoteFetch.current = false;
      return;
    }

    let cancelled = false;

    async function loadNotes() {
      setIsLoadingSub(true);
      try {
        const feed = await getFeed({ type, q: search });
        if (!cancelled) setNotes(feed.notes);
      } catch (err) {
        console.error("Load notes error:", err);
      } finally {
        if (!cancelled) setIsLoadingSub(false);
      }
    }

    const timer = setTimeout(() => {
      loadNotes();
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [type, search, isAuthenticated, isLoadingMain]);

  const handleCreateNote = async (content: string, items?: string[]) => {
    try {
      const newNote = await createNote(content, items);
      const noteToInsert: Note = {
        ...newNote,
        items:
          newNote.items && newNote.items.length > 0
            ? newNote.items
            : items && items.length > 0
            ? items.map((text, idx) => ({
                id: `item-${Date.now()}-${idx}`,
                text,
                is_done: false,
              }))
            : [],
      };
      setNotes((prev) => [noteToInsert, ...prev]);
      setNoteCount((prev) => prev + 1);
      toast.add({
        type: "success",
        title: "สร้างโน้ตสำเร็จ",
        description: items && items.length > 0 ? "เพิ่มเช็คลิสต์ใหม่เรียบร้อยแล้ว" : "บันทึกโน้ตใหม่เรียบร้อยแล้ว",
      });
    } catch (err: any) {
      toast.add({
        type: "error",
        title: "บันทึกไม่สำเร็จ",
        description: err.message || "เกิดข้อผิดพลาดในการสร้างโน้ต",
      });
    }
  };

  const handleEdit = (note: Note) => {
    setNoteToEdit(note);
    setEditContent(note.content);
    if (note.items && note.items.length > 0) {
      setEditItems(note.items.map((item) => item.text));
    } else {
      setEditItems([]);
    }
    setIsEditModalOpen(true);
  };

  const confirmEdit = async () => {
    if (!noteToEdit) return;

    try {
      if (noteToEdit.type === "checklist" && editItems.length > 0) {
        const newContent = editItems.join(", ");
        await updateNote(noteToEdit.id, { content: newContent });
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteToEdit.id
              ? {
                  ...n,
                  content: newContent,
                  items: editItems.map((text, index) => ({
                    id: n.items?.[index]?.id || `${n.id}-${index}`,
                    text,
                    is_done: n.items?.[index]?.is_done || false,
                  })),
                }
              : n
          )
        );
      } else {
        await updateNote(noteToEdit.id, { content: editContent });
        setNotes((prev) =>
          prev.map((n) => (n.id === noteToEdit.id ? { ...n, content: editContent } : n))
        );
      }
      toast.add({
        type: "success",
        title: "แก้ไขโน้ตสำเร็จ",
        description: "บันทึกการเปลี่ยนแปลงโน้ตเรียบร้อยแล้ว",
      });
    } catch (err: any) {
      console.error(err);
      toast.add({
        type: "error",
        title: "แก้ไขไม่สำเร็จ",
        description: err.message || "เกิดข้อผิดพลาดในการแก้ไขโน้ต",
      });
    } finally {
      setIsEditModalOpen(false);
      setNoteToEdit(null);
      setEditContent("");
      setEditItems([]);
    }
  };

  const handleDelete = (noteId: string) => {
    setNoteToDelete(noteId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;

    try {
      await deleteNote(noteToDelete);
      setNotes((prev) => prev.filter((n) => n.id !== noteToDelete));
      setNoteCount((prev) => Math.max(0, prev - 1));
      toast.add({
        type: "success",
        title: "ลบโน้ตสำเร็จ",
        description: "นำโน้ตออกจากสมุดบันทึกเรียบร้อยแล้ว",
      });
    } catch (err: any) {
      console.error(err);
      toast.add({
        type: "error",
        title: "ลบไม่สำเร็จ",
        description: err.message || "ไม่สามารถลบโน้ตได้",
      });
    } finally {
      setIsDeleteModalOpen(false);
      setNoteToDelete(null);
    }
  };

  if (isAuthLoading || (isAuthenticated && isLoadingMain)) {
    return <Loading fullScreen text="กำลังเปิดสมุดบันทึก..." />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen pb-16">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* User Stats Card */}
        {profile && (
          <div className="mb-6">
            <UserCard profile={profile} count={noteCount} />
          </div>
        )}

        {/* Note Creation Form */}
        <section className="mb-6 rounded-2xl border border-[#D1CEC5] bg-[#FAF9F6] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#D1CEC5]/50">
            <h2 className="text-sm font-bold text-[#3D5A73] flex items-center gap-1.5">
              <PenLine className="h-4 w-4" /> {t("notes_new_title")}
            </h2>
            <span className="text-[11px] text-[#66737D] flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#D8B968]" /> {t("notes_sync_line")}
            </span>
          </div>
          <NoteForm onSubmit={handleCreateNote} />
        </section>

        {/* Search & Type Filters */}
        <div className="mb-5 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#66737D]" />
            <input
              type="text"
              placeholder={t("notes_search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#D1CEC5] bg-white py-2.5 pl-10 pr-9 text-xs sm:text-sm text-[#26343F] placeholder-[#9AA4AA] shadow-2xs focus:border-[#3D5A73] focus:outline-hidden focus:ring-2 focus:ring-[#3D5A73]/20 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA4AA] hover:text-[#26343F] p-0.5 rounded-full cursor-pointer"
                title={t("common_clear_search")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-between items-center gap-2">
            <ToggleBar activeValue={type} onChange={setType} />
            <span className="text-xs font-medium text-[#66737D] bg-white border border-[#D1CEC5] px-2.5 py-1 rounded-lg shadow-2xs">
              {notes.length} {t("common_items")}
            </span>
          </div>
        </div>

        {/* Notes Feed */}
        {isLoadingSub ? (
          <div className="flex justify-center py-12">
            <Loading size="sm" text={t("notes_searching")} />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#D1CEC5] bg-[#FAF9F6]/70 py-12 text-center p-6 shadow-2xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3D5A73]/10 text-[#3D5A73] mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="font-bold text-sm text-[#26343F]">
              {search ? t("notes_empty_search_title") : t("notes_empty_title")}
            </p>
            <p className="text-xs text-[#66737D] mt-1.5 max-w-xs leading-relaxed">
              {search
                ? `${t("notes_empty_search_desc_pre")} "${search}" ${t("notes_empty_search_desc_post")}`
                : t("notes_empty_desc")}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#D1CEC5] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#3D5A73] hover:bg-[#E6E3DC]/60 shadow-2xs cursor-pointer transition-colors"
              >
                {t("common_clear_search")}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t("notes_edit_title")}
        hideFooter={true}
      >
        <div className="space-y-4">
          {noteToEdit?.type === "checklist" ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#66737D]">
                {t("notes_edit_checklist_label")}
              </label>
              {editItems.map((item, index) => (
                <Input
                  key={index}
                  value={item}
                  onChange={(e) => {
                    const newItems = [...editItems];
                    newItems[index] = e.target.value;
                    setEditItems(newItems);
                  }}
                  className="bg-white border-[#D1CEC5]"
                />
              ))}
            </div>
          ) : (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-[#D1CEC5] bg-white p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3D5A73]"
              placeholder={t("notes_edit_note_placeholder")}
            />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-lg border border-[#D1CEC5] px-3.5 py-1.5 text-xs font-medium text-[#66737D] hover:bg-[#E6E3DC]/60 cursor-pointer"
            >
              {t("common_cancel")}
            </button>
            <button
              onClick={confirmEdit}
              className="rounded-lg bg-[#3D5A73] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#30475C] cursor-pointer"
            >
              {t("notes_edit_save")}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t("notes_delete_title")}
        hideFooter={true}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-sm text-[#A34F45]">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{t("notes_delete_desc")}</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-lg border border-[#D1CEC5] px-3.5 py-1.5 text-xs font-medium text-[#66737D] hover:bg-[#E6E3DC]/60 cursor-pointer"
            >
              {t("common_cancel")}
            </button>
            <button
              onClick={confirmDelete}
              className="rounded-lg bg-[#A34F45] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#8A3F36] cursor-pointer"
            >
              {t("notes_delete_confirm")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
