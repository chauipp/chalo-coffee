// src/stores/cart.store.ts
import { CartItem } from "@/services/order/order.types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const MAX_ITEM_QUANTITY = 99;

interface CartState {
  items: CartItem[];
  /** Bàn mà giỏ hàng này thuộc về — đổi bàn (quét QR khác) thì giỏ được làm mới */
  tableToken: string | null;
  setTable: (tableToken: string) => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNote: (productId: string, note: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotalAmount: () => number;
}

const clampQuantity = (q: number) => Math.min(q, MAX_ITEM_QUANTITY);

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tableToken: null,
      setTable: (tableToken) =>
        set((state) =>
          state.tableToken === tableToken
            ? state
            : { tableToken, items: [] },
        ),
      addItem: (newItem, quantity = 1) =>
        set((state) => {
          const existingItem = state.items.find(
            (c) => c.productId === newItem.productId,
          );
          const updatedCart = existingItem
            ? state.items.map((cartItem) =>
                cartItem.productId === newItem.productId
                  ? {
                      ...cartItem,
                      quantity: clampQuantity(cartItem.quantity + quantity),
                      // ghi chú mới (nếu có) thay ghi chú cũ của món
                      note: newItem.note ?? cartItem.note,
                    }
                  : cartItem,
              )
            : [...state.items, { ...newItem, quantity: clampQuantity(quantity) }];
          return { items: updatedCart };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: clampQuantity(quantity) }
              : item,
          ),
        }));
      },
      updateNote: (productId, note) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, note: note || undefined }
              : item,
          ),
        })),
      clearCart: () => set({ items: [] }),
      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getTotalAmount: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "chalo-cart",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      partialize: (state) => ({
        items: state.items,
        tableToken: state.tableToken,
      }),
    },
  ),
);
