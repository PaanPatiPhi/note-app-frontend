"use client";

import { useCallback, useRef, useState } from "react";
import { ApiError, getAssistantHistory, sendAssistantMessage, undoAssistantAction } from "./api";
import type { AssistantHistoryItem } from "./types";

// ข้อความหนึ่งรอบ: ผู้ใช้พิมพ์ → AI ตอบ (แต่ละรอบทำงานแยกกัน AI ไม่จำรอบก่อน เหมือนใน LINE)
export type ChatMessage = {
  key: string;
  text: string;
  // undefined = รอ AI ตอบอยู่
  reply?: string;
  actionId?: string;
  undoable?: boolean;
  undone?: boolean;
  undoing?: boolean;
  failed?: boolean;
  channel?: "line" | "web";
  createdAt?: string;
};

type Options = {
  // เรียกเมื่อ AI สร้าง/แก้/ยกเลิกข้อมูล (เช่น ให้หน้าโน้ตโหลดรายการใหม่)
  onChanged?: () => void | Promise<void>;
  // เก็บข้อความไว้กี่รอบล่าสุด (ไม่ใส่ = ไม่จำกัด)
  keep?: number;
  unavailableText: string;
  undoFailedText: string;
};

function errorText(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.data?.reply || err.data?.message || fallback;
  }
  return fallback;
}

function fromHistory(it: AssistantHistoryItem): ChatMessage {
  return {
    key: it.id,
    text: it.text,
    reply: it.reply,
    actionId: it.id,
    undoable: it.undoable || !!it.undone_at,
    undone: !!it.undone_at,
    channel: it.channel,
    createdAt: it.created_at,
  };
}

export function useAssistantChat({ onChanged, keep, unavailableText, undoFailedText }: Options) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const nextKey = useRef(1);

  const update = useCallback(
    (key: string, patch: Partial<ChatMessage>) =>
      setMessages((prev) => prev.map((m) => (m.key === key ? { ...m, ...patch } : m))),
    []
  );

  const trim = useCallback((list: ChatMessage[]) => (keep ? list.slice(-keep) : list), [keep]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || sending) return;

      const key = `local-${nextKey.current++}`;
      setMessages((prev) => trim([...prev, { key, text, channel: "web", createdAt: new Date().toISOString() }]));
      setSending(true);
      try {
        const res = await sendAssistantMessage(text);
        update(key, { reply: res.reply, actionId: res.action_id, undoable: res.undoable });
        if (res.wrote) await onChanged?.();
      } catch (err) {
        update(key, { reply: errorText(err, unavailableText), failed: true });
      } finally {
        setSending(false);
      }
    },
    [sending, trim, update, onChanged, unavailableText]
  );

  const undo = useCallback(
    async (msg: ChatMessage) => {
      if (!msg.actionId || msg.undoing || msg.undone) return;
      update(msg.key, { undoing: true });
      try {
        const res = await undoAssistantAction(msg.actionId);
        update(msg.key, { undoing: false, undone: true, reply: `${msg.reply}\n${res.message}` });
        await onChanged?.();
      } catch (err) {
        // 404/409 = ไม่พบ / ยกเลิกไปแล้ว / เก่าเกิน: ไม่ต้องให้กดซ้ำ
        const finished = err instanceof ApiError && (err.status === 404 || err.status === 409);
        update(msg.key, {
          undoing: false,
          undone: finished,
          reply: `${msg.reply}\n${errorText(err, undoFailedText)}`,
        });
      }
    },
    [update, onChanged, undoFailedText]
  );

  // โหลดประวัติล่าสุด (แทนที่ข้อความที่มีอยู่)
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const page = await getAssistantHistory({ limit: 30 });
      setMessages(page.items.map(fromHistory));
      setOlderCursor(page.next_before);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // โหลดหน้าที่เก่ากว่าต่อด้านบน
  const loadOlder = useCallback(async () => {
    if (!olderCursor || loadingHistory) return;
    setLoadingHistory(true);
    try {
      const page = await getAssistantHistory({ limit: 30, before: olderCursor });
      setMessages((prev) => [...page.items.map(fromHistory), ...prev]);
      setOlderCursor(page.next_before);
    } finally {
      setLoadingHistory(false);
    }
  }, [olderCursor, loadingHistory]);

  return { messages, sending, send, undo, loadHistory, loadOlder, hasOlder: !!olderCursor, loadingHistory };
}
