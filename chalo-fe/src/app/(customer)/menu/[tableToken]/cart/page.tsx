// src/app/(customer)/menu/[tableToken]/cart/page.tsx
"use client";
import {
  useCreateOrder,
  useGetEstimatedWait,
} from "@/services/order/order.queries";
import { useCartStore } from "@/stores/cart.store";
import { useOrderThemeStore } from "@/stores/orderTheme.store";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CartViewCinematic } from "./_components/CartView.Cinematic";
import { CartViewPlayful } from "./_components/CartView.Playful";

export default function CartPage() {
  const { tableToken } = useParams<{ tableToken: string }>();
  const router = useRouter();
  const [note, setNote] = useState<string>("");

  const items = useCartStore((s) => s.items);
  const totalAmount = useCartStore((s) => s.getTotalAmount)();
  const clearCart = useCartStore((s) => s.clearCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const updateNote = useCartStore((s) => s.updateNote);
  const removeItem = useCartStore((s) => s.removeItem);
  const orderTheme = useOrderThemeStore((s) => s.theme);

  const createOrderMutation = useCreateOrder();
  const { data: waitData } = useGetEstimatedWait();

  const handleSubmitOrder = async () => {
    if (items.length === 0) return;
    const order = await createOrderMutation.mutateAsync({
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        note: item.note,
        modifierOptionIds: item.modifierOptionIds,
      })),
      note: note,
      tableToken: tableToken,
    });
    clearCart();
    router.push(`/menu/${tableToken}/orders/${order.id}`);
  };

  const viewProps = {
    items,
    totalAmount,
    note,
    onNoteChange: setNote,
    onUpdateQuantity: updateQuantity,
    onUpdateNote: updateNote,
    onRemoveItem: removeItem,
    onSubmit: handleSubmitOrder,
    isSubmitting: createOrderMutation.isPending,
    estimatedMinutes: waitData?.estimatedMinutes,
    onBack: () => router.back(),
  };

  return orderTheme === "cinematic" ? (
    <CartViewCinematic {...viewProps} />
  ) : (
    <CartViewPlayful {...viewProps} />
  );
}
