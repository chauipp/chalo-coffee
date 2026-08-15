"use client";

import { useParams, useRouter } from "next/navigation";
import OrderDetailModalContent from "@/components/orders/OrderDetailModalContent";

export default function OrderDetailModal() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const closeHref = "/staff/orders";
  return (
    <OrderDetailModalContent
      orderId={orderId}
      closeHref={closeHref}
      onClose={() => router.back()}
      onSuccess={() => router.back()}
    />
  );
}
