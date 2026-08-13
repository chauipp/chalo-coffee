"use client";

import { CheckoutViewCinematic } from "./CheckoutView.Cinematic";

type CheckoutViewProps = Parameters<typeof CheckoutViewCinematic>[0];

export const CheckoutViewPlayful = (props: CheckoutViewProps) => <CheckoutViewCinematic {...props} />;
