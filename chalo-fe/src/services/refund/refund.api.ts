import { API } from "@/constants";
import { request } from "@/lib/api-client";
import type { CreateRefundInput, OrderRefundSummary, RefundDto } from "./refund.types";

export const getRefundsForOrder = (orderId: string): Promise<OrderRefundSummary | null> => request.get(API.PAYMENT.REFUNDS_BY_ORDER(orderId));
export const createRefund = (paymentTransactionId: string, input: CreateRefundInput): Promise<{ refund: RefundDto; refundedAmount: number; refundableAmount: number }> => request.post(API.PAYMENT.REFUNDS(paymentTransactionId), input);
