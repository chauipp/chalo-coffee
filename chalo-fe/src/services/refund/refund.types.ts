export type RefundMethod = "CASH" | "BANK_TRANSFER";

export interface RefundDto {
  id: string;
  paymentTransactionId: string;
  amount: number;
  method: RefundMethod;
  reason: string;
  processedByUserId: number;
  createdAt: string;
}

export interface OrderRefundSummary {
  paymentTransactionId: string;
  totalAmount: number;
  refundedAmount: number;
  refundableAmount: number;
  refunds: RefundDto[];
}

export interface CreateRefundInput {
  amount: number;
  method: RefundMethod;
  reason: string;
}
