"use client";

import { useEffect, useRef, useState } from "react";
import liff from "@line/liff";
import { getProfile, getFeed, deleteNote, getNoteCount, updateNote } from "@/lib/api";
import type { Profile, Note } from "@/lib/types";
import { UserCard } from "@/components/UserCard";
import NoteCard from "@/components/NoteCard";
import "./globals.css";
import { NoteForm } from "@/components/ui/noteform";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import ToggleBar from "@/components/ToggleBar";
import Loading from "@/components/Loading";
import Modal from "@/components/ui/modal";
import { BookOpen } from "lucide-react";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID ?? "";

export default function MainPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [ready, setReady] = useState(false); // liff.init() เสร็จแล้วและ login อยู่
  const [isLoadingMain, setIsLoadingMain] = useState(true); // ครั้งแรกสุดเท่านั้น
  const [isLoadingSub, setIsLoadingSub] = useState(false); // เฉพาะตอนโหลด note (toggle/search)
  const [type, setType] = useState<"note" | "checklist" | "all">("all");
  const [search, setSearch] = useState("");
  const [noteCount, setNoteCount] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editItems, setEditItems] = useState<string[]>([]);
  // true = ครั้งถัดไปที่ effect โหลด note ทำงาน ให้ข้ามไปเลย (เพราะโหลดไปแล้ว
  // พร้อม profile/count ตอน init) ใช้แค่ครั้งแรกครั้งเดียว
  const skipNextNoteFetch = useRef(false);

  // ทำครั้งเดียวตอนเปิดหน้า: init LIFF + โหลด profile, count, และ note ชุดแรก
  // พร้อมกันเลย เพื่อให้ isLoadingMain จบแล้วเห็นโน้ตทันที ไม่ต้องรอ isLoadingSub อีกรอบ
  useEffect(() => {
    async function init() {
      try {
        await liff.init({ liffId: LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const [p, count, feed] = await Promise.all([
          getProfile(),
          getNoteCount(),
          getFeed({ type, q: search }), // ใช้ค่าเริ่มต้น (type="all", search="")
        ]);
        setProfile(p);
        setNoteCount(count);
        setNotes(feed.notes);
        skipNextNoteFetch.current = true;
        setReady(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingMain(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // โหลด note ใหม่ทุกครั้งที่ type หรือ search เปลี่ยน (ยกเว้นรอบแรกหลัง ready
  // เพิ่งเป็น true เพราะข้อมูลชุดแรกโหลดไปแล้วพร้อม profile/count ด้านบน)
  useEffect(() => {
    if (!ready) return;

    if (skipNextNoteFetch.current) {
      skipNextNoteFetch.current = false;
      return;
    }

    let cancelled = false;

    async function loadNotes() {
      setIsLoadingSub(true);
      try {
        const n = await getFeed({ type, q: search });
        if (!cancelled) setNotes(n.notes);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setIsLoadingSub(false);
      }
    }
    loadNotes();

    return () => {
      cancelled = true;
    };
  }, [ready, type, search]);

  const handleEdit = (note: Note) => {
    setNoteToEdit(note);
    setEditContent(note.content);
    // Extract items from checklist
    if (note.items && note.items.length > 0) {
      setEditItems(note.items.map(item => item.text));
    } else {
      setEditItems([]);
    }
    setIsEditModalOpen(true);
  };

  const confirmEdit = async () => {
    if (!noteToEdit) return;

    try {
      // For checklists, we need to update content and items
      if (noteToEdit.type === "checklist" && editItems.length > 0) {
        // Reconstruct content from items for checklist
        const newContent = editItems.join(", ");
        await updateNote(noteToEdit.id, { content: newContent });
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteToEdit.id
              ? { ...n, content: newContent, items: editItems.map((text, index) => ({
                  id: n.items?.[index]?.id || `${n.id}-${index}`,
                  text,
                  is_done: n.items?.[index]?.is_done || false
                }))}
              : n
          )
        );
      } else {
        // For regular notes
        await updateNote(noteToEdit.id, { content: editContent });
        setNotes((prev) =>
          prev.map((n) => (n.id === noteToEdit.id ? { ...n, content: editContent } : n))
        );
      }
      toast.add({ type: "success", description: "แก้ไขสำเร็จ", priority: "high" });
    } catch (err) {
      console.error(err);
      toast.add({ type: "error", description: "แก้ไขไม่สำเร็จ", priority: "high" });
    } finally {
      setNoteToEdit(null);
      setEditContent("");
      setEditItems([]);
    }
  };

  const handleDelete = async (noteId: string) => {
    setNoteToDelete(noteId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;

    try {
      await deleteNote(noteToDelete);
      setNotes((prev) => prev.filter((n) => n.id !== noteToDelete));
      setNoteCount((prev) => Math.max(0, prev - 1));
      toast.add({ type: "success", description: "ลบแล้วจ้า", priority: "high" });
    } catch (err) {
      console.error(err);
      toast.add({ type: "error", description: "ลบไม่สำเร็จจ้า", priority: "high" });
    } finally {
      setNoteToDelete(null);
    }
  };

  const handleTypeChange = (value: "note" | "checklist" | "all") => {
    setType(value);
  };

  return (
    <>
      {isLoadingMain ? (
        <div className="w-full h-full flex items-center justify-center fixed inset-0 bg-(--bg) z-50">
          <Loading />
        </div>
      ) : (
        <main className="max-w-120 h-screen mx-auto py-6 px-3.5 flex flex-col">
          <div className="shrink-0 mb-3">
            {profile && <UserCard profile={profile} count={noteCount} />}
            <h1 className="my-3 text-(--primary)">จดอะไรไว้บ้างนะ</h1>
            <Input
              className="placeholder:text-(--primary) border-(--primary) bg-white"
              placeholder="ค้นหาที่จดจดไว้"
              onChange={(e) => setSearch(e.target.value)}
            />
            <ToggleBar activeValue={type} onChange={handleTypeChange} />
          </div>

          <section className="flex-1 overflow-y-auto relative">
        {isLoadingSub ? (
          <div className="flex justify-center py-12">
            <Loading size="sm" text="กำลังค้นหาบันทึก..." />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#D1CEC5] bg-[#FAF9F6]/70 py-12 text-center p-6 shadow-2xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3D5A73]/10 text-[#3D5A73] mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="font-bold text-sm text-[#26343F]">
              {search ? "อันนี้ยังไม่ได้จดไว้นะ" : "ยังไม่ได้จดอะไรเลย มาเริ่มจดกันเถอะ"}
            </p>
            <p className="text-xs text-[#66737D] mt-1.5 max-w-xs leading-relaxed">
              {search
                ? `ไม่พบโน้ตที่มีคำว่า "${search}" ลองค้นหาด้วยคำอื่น หรือคลิกปุ่มด้านล่างเพื่อล้างการค้นหา`
                : "เริ่มพิมพ์ข้อความหรือสร้างเช็คลิสต์ในกล่องด้านบนเพื่อเริ่มบันทึกความคิดของคุณ"}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#D1CEC5] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#3D5A73] hover:bg-[#E6E3DC]/60 shadow-2xs cursor-pointer transition-colors"
              >
                ล้างคำค้นหา
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
          </section>

          <div className="fixed bottom-8 right-8 shrink-0 z-20">
            <div className="flex flex-col gap-2">
              <NoteForm />
            </div>
          </div>

          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDelete}
            title="ลบโน้ต"
            description="แน่ใจนะว่าจะลบ?"
            confirmText="ลบเลย"
            cancelText="ยังก่อน"
            variant="danger"
          />

          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onConfirm={confirmEdit}
            title="แก้ไขโน้ต"
            description={
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm text-(--ink-muted) mb-2 block">ข้อความ</label>
                  <Input
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="แก้ไขข้อความ"
                    className="w-full"
                  />
                </div>
                {noteToEdit?.type === "checklist" && (
                  <div>
                    <label className="text-sm text-(--ink-muted) mb-2 block">รายการ (คั่นด้วยลูกน้ำ)</label>
                    <Input
                      value={editItems.join(", ")}
                      onChange={(e) => setEditItems(e.target.value.split(",").map(item => item.trim()))}
                      placeholder="รายการ1, รายการ2, รายการ3"
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            }
            confirmText="บันทึก"
            cancelText="ยกเลิก"
            variant="default"
          />
        </main>
      )}
    </>
  );
}