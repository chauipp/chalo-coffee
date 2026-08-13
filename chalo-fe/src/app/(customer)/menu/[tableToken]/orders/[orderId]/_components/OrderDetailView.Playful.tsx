"use client";

import { OrderDetailViewCinematic } from "./OrderDetailView.Cinematic";

type OrderDetailViewProps = Parameters<typeof OrderDetailViewCinematic>[0];

export const OrderDetailViewPlayful = (props: OrderDetailViewProps) => <OrderDetailViewCinematic {...props} />;
