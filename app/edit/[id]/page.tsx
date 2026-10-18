"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import Loading from "@/components/Loading";
import { useLanguage } from "@/lib/language-context";
import { getNoteById, updateNote } from "@/lib/api";

type Props = {
  params: Promise<{ id: string }>;
};

export default function EditPage({ params }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
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
        toast.add({ type: "error", description: t("edit_failed"), priority: "high" });
      } finally {
        setIsLoading(false);
      }
    };
    loadNote();
  }, [params, t]);

  const handleSave = () => {
    if (!content.trim()) {
      toast.add({ type: "error", description: t("noteform_empty_error"), priority: "high" });
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const confirmSave = async () => {
    if (!noteId) return;

    try {
      await updateNote(noteId, { content });
      toast.add({
        type: "success",
        title: t("edit_success"),
        description: t("edit_success"),
      });
      router.push("/notes");
    } catch (error: any) {
      console.error("Failed to update note:", error);
      toast.add({
        type: "error",
        title: t("edit_failed"),
        description: error?.message || t("edit_failed"),
      });
    }
  };

  if (isLoading) {
    return <Loading fullScreen text={t("edit_loading")} />;
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{t("edit_page_title")}</h1>
      <div className="space-y-4">
        <div>
          <Label htmlFor="content">{t("edit_content_label")}</Label>
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
            onClick={() => router.push("/notes")}
            className="flex-1"
          >
            {t("common_cancel")}
          </Button>
          <Button onClick={handleSave} className="flex-1">
            {t("common_save")}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmSave}
        title={t("edit_confirm_title")}
        description={`${t("edit_confirm_desc")} "${content}"?`}
        confirmText={t("common_save")}
        cancelText={t("common_cancel")}
        variant="default"
      />
    </div>
  );
}