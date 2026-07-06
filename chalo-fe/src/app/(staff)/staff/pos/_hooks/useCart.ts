//src/app/(staff)/staff/pos/_hooks/useCart.ts

import { useMemo, useState } from "react";
import { POSCartItem } from "../page";
import { ProductDto } from "@/services/menu";

export const useCart = () => {
  const [cart, setCart] = useState<POSCartItem[]>([]);

  const addToCart = (product: ProductDto) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateItemNote = (productId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, note } : item,
      ),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity, 0),
    [cart],
  );
  const totalAmount = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity * i.price, 0),
    [cart],
  );

  return {
    cart,
    addToCart,
    updateItemNote,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalAmount,
  };
};
