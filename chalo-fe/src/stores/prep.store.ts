// src/stores/prep.store.ts
// State pha chế phía client (BE không có per-item status): tick từng ly.
// Persist localStorage để reload không mất.
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Key ticklist: `${orderId}:${itemId}` → mảng boolean dài bằng quantity */
export const tickKey = (orderId: string, itemId: string) =>
  `${orderId}:${itemId}`;

interface PrepState {
  ticks: Record<string, boolean[]>;
  toggleTick: (
    orderId: string,
    itemId: string,
    unitIndex: number,
    quantity: number,
  ) => void;
  /** Dọn state của các order không còn active (đã READY/COMPLETED/CANCELLED) */
  prune: (activeOrderIds: string[]) => void;
}

export const usePrepStore = create<PrepState>()(
  persist(
    (set) => ({
      ticks: {},

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

      prune: (activeOrderIds) =>
        set((s) => {
          const active = new Set(activeOrderIds);
          const ticks: Record<string, boolean[]> = {};
          for (const [key, val] of Object.entries(s.ticks)) {
            if (active.has(key.split(":")[0])) ticks[key] = val;
          }
          return { ticks };
        }),
    }),
    { name: "chalo-prep-store" },
  ),
);
