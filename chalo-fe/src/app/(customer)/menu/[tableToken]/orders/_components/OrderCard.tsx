// src/app/(customer)/menu/[tableToken]/orders/_components/OrderCard.tsx — chọn biến thể theo orderTheme
"use client";
import { OrderDto } from "@/services/order/order.types";
import { useOrderThemeStore } from "@/stores/orderTheme.store";
import { OrderCardCinematic } from "./OrderCard.Cinematic";
import { OrderCardPlayful } from "./OrderCard.Playful";

export const OrderCard = ({
  order,
  onClick,
}: {
  order: OrderDto;
  onClick: () => void;
}) => {
  const theme = useOrderThemeStore((s) => s.theme);
  return theme === "cinematic" ? (
    <OrderCardCinematic order={order} onClick={onClick} />
  ) : (
    <OrderCardPlayful order={order} onClick={onClick} />
  );
};
