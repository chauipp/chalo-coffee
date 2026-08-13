// src/app/(customer)/menu/[tableToken]/orders/_components/OrderCard.tsx
"use client";
import { OrderDto } from "@/services/order/order.types";
import { OrderCardCinematic } from "./OrderCard.Cinematic";

export const OrderCard = ({
  order,
  onClick,
}: {
  order: OrderDto;
  onClick: () => void;
}) => <OrderCardCinematic order={order} onClick={onClick} />;
