//src/app/(staff)/staff/pos/_hooks/useCart.ts

import { useMemo, useState } from "react";
import { POSCartItem } from "../page";
import { ProductDto } from "@/services/menu";
import { buildSelectedModifiers, canonicalModifierKey, modifierPrice } from "@/utils/cart-modifiers";

export const useCart = () => {
  const [cart, setCart] = useState<POSCartItem[]>([]);

  const addToCart = (product: ProductDto, modifierOptionIds: string[] = []) => {
    const cartKey = `${product.id}:${canonicalModifierKey(modifierOptionIds)}`;
    setCart((prev) => {
      const existing = prev.find((i) => i.cartKey === cartKey);
      if (existing) {
        return prev.map((i) =>
          i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          cartKey,
          productName: product.name,
          price: product.price + modifierPrice(product.modifierGroups, modifierOptionIds),
          quantity: 1,
          modifierOptionIds,
          selectedModifiers: buildSelectedModifiers(product.modifierGroups, modifierOptionIds),
        },
      ];
    });
  };

  const updateItemNote = (cartKey: string, note: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.cartKey === cartKey ? { ...item, note } : item,
      ),
    );
  };

  const removeFromCart = (cartKey: string) => {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  const updateQuantity = (cartKey: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartKey === cartKey
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
