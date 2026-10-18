"use client";

import * as React from "react";
import { MoreVertical, Trash2, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DropdownButton({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#66737D] hover:bg-[#E6E3DC]/70 hover:text-[#26343F] transition-colors cursor-pointer outline-hidden"
        aria-label="ตัวเลือกเพิ่มเติม"
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36 rounded-xl border border-[#D1CEC5] bg-[#FAF9F6] p-1.5 shadow-md"
      >
        <DropdownMenuGroup className="space-y-0.5">
          <DropdownMenuItem
            onClick={onEdit}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#26343F] hover:bg-[#E6E3DC]/70 cursor-pointer transition-colors"
          >
            <Pencil className="h-3.5 w-3.5 text-[#3D5A73]" />
            <span>แก้ไขโน้ต</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDelete}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#A34F45] hover:bg-[#A34F45]/10 cursor-pointer transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5 text-[#A34F45]" />
            <span>ลบโน้ต</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
