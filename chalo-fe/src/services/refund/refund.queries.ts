import { QUERY_KEYS } from "@/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createRefund, getRefundsForOrder } from "./refund.api";
import type { CreateRefundInput } from "./refund.types";

export const useOrderRefunds = (orderId: string | null, enabled = true) => useQuery({ queryKey: QUERY_KEYS.PAYMENT.REFUNDS_BY_ORDER(orderId ?? ""), queryFn: () => getRefundsForOrder(orderId!), enabled: !!orderId && enabled, staleTime: 10_000 });

export const useCreateRefund = (orderId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentTransactionId, input }: { paymentTransactionId: string; input: CreateRefundInput }) => createRefund(paymentTransactionId, input),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAYMENT.REFUNDS_BY_ORDER(orderId) }); queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SHIFT.REPORT() }); toast.success("Đã ghi nhận hoàn tiền"); },
    onError: (error: Error) => toast.error(error.message),
  });
};
