// src/stores/prep.store.ts
// State pha chế phía client (BE không có per-item status): tick từng ly,
// nhóm gộp đơn, gợi ý đã bỏ qua. Persist localStorage để reload không mất.
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Key ticklist: `${orderId}:${itemId}` → mảng boolean dài bằng quantity */
export const tickKey = (orderId: string, itemId: string) =>
  `${orderId}:${itemId}`;

const MAX_DISMISSED = 20;

interface PrepState {
  ticks: Record<string, boolean[]>;
  /** batchId → orderIds đang pha chung */
  batches: Record<string, string[]>;
  /** signature các gợi ý gộp đơn staff đã bỏ qua */
  dismissed: string[];
  toggleTick: (
    orderId: string,
    itemId: string,
    unitIndex: number,
    quantity: number,
  ) => void;
  createBatch: (orderIds: string[]) => void;
  dissolveBatch: (batchId: string) => void;
  dismiss: (signature: string) => void;
  /** Dọn state của các order không còn active (đã READY/COMPLETED/CANCELLED) */
  prune: (activeOrderIds: string[]) => void;
}

export const usePrepStore = create<PrepState>()(
  persist(
    (set) => ({
      ticks: {},
      batches: {},
      dismissed: [],

      toggleTick: (orderId, itemId, unitIndex, quantity) =>
        set((s) => {
          const key = tickKey(orderId, itemId);
          const current = s.ticks[key] ?? Array(quantity).fill(false);
          const next = [...current];
          // quantity có thể đổi khi đơn được sửa — resize mảng cho khớp
          next.length = quantity;
          for (let i = 0; i < quantity; i++) next[i] = !!next[i];
          next[unitIndex] = !next[unitIndex];
          return { ticks: { ...s.ticks, [key]: next } };
        }),

      createBatch: (orderIds) =>
        set((s) => {
          if (orderIds.length < 2) return s;
          const batchId = crypto.randomUUID();
          // 1 order chỉ thuộc 1 batch — gỡ khỏi batch cũ nếu có
          const batches: Record<string, string[]> = {};
          for (const [id, members] of Object.entries(s.batches)) {
            const kept = members.filter((m) => !orderIds.includes(m));
            if (kept.length >= 2) batches[id] = kept;
          }
          batches[batchId] = [...orderIds];
          return { batches };
        }),

      dissolveBatch: (batchId) =>
        set((s) => {
          const batches = { ...s.batches };
          delete batches[batchId];
          return { batches };
        }),

      dismiss: (signature) =>
        set((s) => ({
          dismissed: [...s.dismissed, signature].slice(-MAX_DISMISSED),
        })),

      prune: (activeOrderIds) =>
        set((s) => {
          const active = new Set(activeOrderIds);
          const ticks: Record<string, boolean[]> = {};
          for (const [key, val] of Object.entries(s.ticks)) {
            if (active.has(key.split(":")[0])) ticks[key] = val;
          }
          const batches: Record<string, string[]> = {};
          for (const [id, members] of Object.entries(s.batches)) {
            const kept = members.filter((m) => active.has(m));
            // còn <2 đơn thì batch không còn ý nghĩa gộp
            if (kept.length >= 2) batches[id] = kept;
          }
          return { ticks, batches };
        }),
    }),
    { name: "chalo-prep-store" },
  ),
);
