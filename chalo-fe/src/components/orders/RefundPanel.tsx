"use client";

import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { FormField } from "@/components/shared/ui/FormField";
import { Input } from "@/components/shared/ui/Input";
import { Modal } from "@/components/shared/ui/Modal";
import { Select } from "@/components/shared/ui/Select";
import { useCreateRefund, useOrderRefunds } from "@/services/refund";
import { useAuditLogs } from "@/services/audit";
import { parseRefundVnd } from "@/services/refund/refund.utils";
import { useState } from "react";
import { toast } from "sonner";

const formatVnd = (amount: number) => `${amount.toLocaleString("vi-VN")}đ`;

export function RefundPanel({ orderId }: { orderId: string }) {
  const { data, isLoading, isError } = useOrderRefunds(orderId);
  const audit = useAuditLogs({ entityType: "payment_transaction", entityId: data?.paymentTransactionId, limit: 10 }, !!data);
  const create = useCreateRefund(orderId);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "BANK_TRANSFER">("CASH");
  const [reason, setReason] = useState("");
  if (isLoading || (!data && !isError)) return null;
  if (isError || !data) return <p className="text-xs text-gray-400">Không tải được lịch sử hoàn tiền.</p>;
  const parsedAmount = parseRefundVnd(amount, data.refundableAmount);
  const submit = () => {
    if (parsedAmount === null) {
      toast.error(`Số tiền phải là VND nguyên, từ 1 đến ${formatVnd(data.refundableAmount)}.`);
      return;
    }
    if (reason.trim().length < 3) { toast.error("Lý do hoàn tiền cần ít nhất 3 ký tự."); return; }
    setConfirmOpen(true);
  };
  const confirm = () => {
    if (parsedAmount === null) return;
    create.mutate({ paymentTransactionId: data.paymentTransactionId, input: { amount: parsedAmount, method, reason: reason.trim() } }, { onSuccess: () => { setConfirmOpen(false); setOpen(false); setAmount(""); setReason(""); } });
  };

  return <section data-testid="refund-panel" className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Hoàn tiền</p><p className="mt-0.5 text-xs text-amber-800 dark:text-amber-200">Đã hoàn {formatVnd(data.refundedAmount)} · còn có thể hoàn {formatVnd(data.refundableAmount)}</p></div>{data.refundableAmount > 0 ? <button type="button" onClick={() => setOpen(true)} className="min-h-10 rounded-lg border border-amber-300 px-3 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200">Ghi nhận hoàn tiền</button> : null}</div>
    {data.refunds.length ? <ul className="mt-2 space-y-1 border-t border-amber-200 pt-2 text-xs text-amber-900 dark:border-amber-900/60 dark:text-amber-100">{data.refunds.map((refund) => <li key={refund.id}>{formatVnd(refund.amount)} · {refund.method === "CASH" ? "tiền mặt" : "chuyển khoản"} · {refund.reason}</li>)}</ul> : null}
    {audit.data?.length ? <details className="mt-2 border-t border-amber-200 pt-2 text-xs text-amber-900 dark:border-amber-900/60 dark:text-amber-100"><summary className="cursor-pointer font-semibold">Nhật ký thao tác</summary><ul className="mt-1 space-y-1">{audit.data.map((entry) => <li key={entry.id}>{entry.action === "REFUND_CREATED" ? "Đã ghi nhận hoàn tiền" : entry.action} · {new Date(entry.createdAt).toLocaleString("vi-VN")}</li>)}</ul></details> : null}
    <Modal open={open} onClose={() => setOpen(false)} title="Ghi nhận hoàn tiền" presentation="bottom-sheet" panelTestId="refund-form-modal"><div className="space-y-4"><p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Hệ thống chỉ ghi nhận bút toán. Admin cần hoàn tiền thực tế cho khách qua phương thức đã chọn.</p><FormField label="Số tiền hoàn (VND)" required><Input aria-label="Số tiền hoàn" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} placeholder={`Tối đa ${data.refundableAmount}`} /></FormField><FormField label="Phương thức hoàn" required><Select aria-label="Phương thức hoàn" value={method} onChange={(event) => setMethod(event.target.value as "CASH" | "BANK_TRANSFER")} options={[{ value: "CASH", label: "Tiền mặt" }, { value: "BANK_TRANSFER", label: "Chuyển khoản" }]} /></FormField><FormField label="Lý do" required><Input aria-label="Lý do hoàn tiền" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} placeholder="VD: Khách hủy món do hết nguyên liệu" /></FormField><button type="button" onClick={submit} className="w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-700">Tiếp tục xác nhận</button></div></Modal>
    <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirm} isLoading={create.isPending} title="Xác nhận hoàn tiền" message={`Bạn sắp ghi nhận hoàn ${formatVnd(parsedAmount ?? 0)}. Thao tác này không thể sửa hoặc xóa.`} confirmLabel="Xác nhận hoàn tiền" variant="warning" />
  </section>;
}
