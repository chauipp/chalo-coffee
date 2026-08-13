"use client";

import { OrderCardCinematic } from "./OrderCard.Cinematic";

type OrderCardProps = Parameters<typeof OrderCardCinematic>[0];

export const OrderCardPlayful = (props: OrderCardProps) => <OrderCardCinematic {...props} />;
