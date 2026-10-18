import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react";
import { createNote } from "@/lib/api";
import Modal from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";

export function NoteForm() {
    const [content, setContent] = useState<string>("");
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const handleAddNote = async () => {
        if (!content.trim()) {
            toast.add({ type: "error", description: "กรุณากรอกข้อความ", priority: "high" });
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const confirmAddNote = async () => {
        try {
            await createNote(content);
            toast.add({ type: "success", description: "สร้างโน้ตสำเร็จ", priority: "high" });
            setContent("");
        } catch (error) {
            console.error("Failed to add note:", error);
            toast.add({ type: "error", description: "สร้างโน้ตไม่สำเร็จ", priority: "high" });
        }
    };
  return (
    <>
      <Popover>
        <PopoverTrigger render={<Button className="rounded-full w-12 h-12 bg-(--primary) cursor-pointer"><p className="text-2xl text-white">+</p></Button>} />
        <PopoverContent className="w-96 bg-(--bg)">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="leading-none font-medium">จดโน้ตหรือเช็คลิสได้เลยจ้า</h4>
              <p className="text-gray-400 text-xs">ถ้าจดเช็คลิสต์ให้จด "หัวข้อ รายการ1, รายการ2, รายการ3" ได้เลยจ้า</p>
            </div>
            <div className="grid gap-2">
              <div className="flex flex-col items-center gap-4">
                <Input
                  id="note"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="col-span-2 h-8 bg-white"
                  placeholder="จดตรงนี้เลย"
                />
              </div>
              <Button onClick={handleAddNote}
              className="rounded-full cursor-pointer border border-(--primary) bg-white">บันทึก</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmAddNote}
        title="สร้างโน้ต"
        description={`คุณต้องการสร้างโน้ต: "${content}"?`}
        confirmText="สร้าง"
        cancelText="ยกเลิก"
        variant="default"
      />
    </>
  )
}
