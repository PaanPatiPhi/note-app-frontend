"use client";

import * as React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  children?: React.ReactNode;
  hideFooter?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  variant = "default",
  children,
  hideFooter = false,
}: ModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-[#FAF9F6] border border-[#D1CEC5] rounded-2xl p-6 max-w-md w-full shadow-xl">
        <h2 className="text-lg font-bold text-[#26343F] mb-2">{title}</h2>
        {description && (
          <div className="text-sm text-[#66737D] mb-4">{description}</div>
        )}
        {children && <div className="mb-4">{children}</div>}
        {!hideFooter && (
          <div className="flex gap-2.5 justify-end pt-2 border-t border-[#D1CEC5]/60">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#66737D] hover:bg-[#E6E3DC]/60 transition-colors border border-[#D1CEC5] cursor-pointer"
            >
              {cancelText}
            </button>
            {onConfirm && (
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer ${
                  variant === "danger"
                    ? "bg-[#A34F45] hover:bg-[#8A3F36] shadow-xs"
                    : "bg-[#3D5A73] hover:bg-[#30475C] shadow-xs"
                }`}
              >
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
