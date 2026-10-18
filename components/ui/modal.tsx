"use client";

import * as React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
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
}: ModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-(--bg) rounded-2xl p-6 max-w-sm w-full mx-4 shadow-lg">
        <h2 className="text-lg font-semibold text-(--ink) mb-2">{title}</h2>
        {description && (
          <div className="text-sm text-(--ink-muted) mb-6">{description}</div>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-(--ink-muted) hover:bg-(--ink-muted) hover:text-white transition-colors border border-gray-500"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-white transition-colors ${
              variant === "danger"
                ? "bg-red-500 hover:bg-red-600 border border-gray-500 shadow-lg"
                : "bg-(--primary) hover:bg-(--primary) opacity-90 shadow-lg border border-gray-500"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
