"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { getNoteById, updateNote } from "@/lib/api";
import type { Note } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default function EditPage({ params }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNote = async () => {
      try {
        const resolvedParams = await params;
        setNoteId(resolvedParams.id);
        const noteData = await getNoteById(resolvedParams.id);
        setContent(noteData.content);
      } catch (error) {
        console.error("Failed to load note:", error);
        toast.add({ type: "error", description: "โหลดโน้ตไม่สำเร็จ", priority: "high" });
      } finally {
        setIsLoading(false);
      }
    };
    loadNote();
  }, [params]);

  const handleSave = () => {
    if (!content.trim()) {
      toast.add({ type: "error", description: "กรุณากรอกข้อความ", priority: "high" });
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const confirmSave = async () => {
    if (!noteId) return;

    try {
      await updateNote(noteId, { content });
      toast.add({ type: "success", description: "แก้ไขโน้ตสำเร็จ", priority: "high" });
      router.push("/");
    } catch (error) {
      console.error("Failed to update note:", error);
      toast.add({ type: "error", description: "แก้ไขโน้ตไม่สำเร็จ", priority: "high" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">แก้ไขโน้ต</h1>
      <div className="space-y-4">
        <div>
          <Label htmlFor="content">เนื้อหา</Label>
          <Input
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-2"
          />
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="flex-1"
          >
            ยกเลิก
          </Button>
          <Button onClick={handleSave} className="flex-1">
            บันทึก
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmSave}
        title="บันทึกการแก้ไข"
        description={`คุณต้องการบันทึกการแก้ไขโน้ต: "${content}"?`}
        confirmText="บันทึก"
        cancelText="ยกเลิก"
        variant="default"
      />
    </div>
  );
}