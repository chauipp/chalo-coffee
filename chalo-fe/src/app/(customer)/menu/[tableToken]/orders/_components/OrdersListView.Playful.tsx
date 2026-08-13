"use client";

import { OrdersListViewCinematic } from "./OrdersListView.Cinematic";

type OrdersListViewProps = Parameters<typeof OrdersListViewCinematic>[0];

export const OrdersListViewPlayful = (props: OrdersListViewProps) => <OrdersListViewCinematic {...props} />;
