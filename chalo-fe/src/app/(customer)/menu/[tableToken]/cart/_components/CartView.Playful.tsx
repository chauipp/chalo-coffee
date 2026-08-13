"use client";

import { CartViewCinematic } from "./CartView.Cinematic";

type CartViewProps = Parameters<typeof CartViewCinematic>[0];

export const CartViewPlayful = (props: CartViewProps) => <CartViewCinematic {...props} />;
