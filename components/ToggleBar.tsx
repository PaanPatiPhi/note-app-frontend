"use client";

import { FileText, CheckSquare, Layers } from "lucide-react";

export type ToggleValue = "note" | "checklist" | "all";

interface ToggleBarProps {
  activeValue: ToggleValue;
  onChange: (value: ToggleValue) => void;
  className?: string;
}

const toggleOptions: {
  value: ToggleValue;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "all", label: "ทั้งหมด", icon: Layers },
  { value: "note", label: "โน้ต", icon: FileText },
  { value: "checklist", label: "เช็คลิสต์", icon: CheckSquare },
];

export default function ToggleBar({
  activeValue,
  onChange,
  className = "",
}: ToggleBarProps) {
  return (
    <div
      className={`mt-2 inline-flex items-center p-1 rounded-xl bg-[#E6E3DC]/70 border border-[#D1CEC5] gap-1 ${className}`}
    >
      {toggleOptions.map((item) => {
        const Icon = item.icon;
        const isActive = activeValue === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
              isActive
                ? "bg-[#3D5A73] text-white shadow-xs"
                : "text-[#66737D] hover:text-[#26343F] hover:bg-white/60"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
