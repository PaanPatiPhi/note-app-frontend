"use client";

import React from "react";
import { useLanguage } from "@/lib/language-context";
import { Globe } from "lucide-react";

interface LanguageToggleProps {
  className?: string;
  variant?: "pill" | "compact";
}

export function LanguageToggle({ className = "", variant = "pill" }: LanguageToggleProps) {
  const { language, setLanguage, toggleLanguage } = useLanguage();

  if (variant === "compact") {
    return (
      <button
        onClick={toggleLanguage}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#D1CEC5] bg-[#FAF9F6] text-xs font-semibold text-[#26343F] hover:bg-[#E6E3DC]/60 active:scale-95 transition-all cursor-pointer shadow-2xs ${className}`}
        title={language === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
        aria-label="Switch Language"
      >
        <Globe className="h-3.5 w-3.5 text-[#3D5A73]" />
        <span className="uppercase font-mono">{language === "th" ? "EN" : "TH"}</span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-[#D1CEC5] bg-[#FAF9F6] p-0.5 shadow-2xs select-none ${className}`}
      role="group"
      aria-label="Language Selector"
    >
      <button
        type="button"
        onClick={() => setLanguage("th")}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          language === "th"
            ? "bg-[#3D5A73] text-white shadow-xs"
            : "text-[#66737D] hover:text-[#26343F] hover:bg-[#E6E3DC]/40"
        }`}
        title="ภาษาไทย"
      >
        <span>TH</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          language === "en"
            ? "bg-[#3D5A73] text-white shadow-xs"
            : "text-[#66737D] hover:text-[#26343F] hover:bg-[#E6E3DC]/40"
        }`}
        title="English"
      >
        <span>EN</span>
      </button>
    </div>
  );
}
