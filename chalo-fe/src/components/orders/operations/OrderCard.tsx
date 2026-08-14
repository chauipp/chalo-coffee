"use client";
import { SpinnerIcon } from "@/components/shared/icons/SpinnerIcon";
import { OrderDto, OrderStatus } from "@/services/order/order.types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { NEXT_STATUS, NEXT_STATUS_LABEL, orderDragType } from "./orders.config";

const formatAge = (ms: number) => { const min = Math.floor(ms / 60000); if (min < 1) return "vừa xong"; if (min < 60) return `${min} phút trước`; const hours = Math.floor(min / 60); if (hours < 24) return `${hours} giờ trước`; return `${Math.floor(hours / 24)} ngày trước`; };

export function OrderCard({ order, onStatusChange, isUpdating, detailHref }: { order: OrderDto; onStatusChange: (orderId: string, status: OrderStatus) => void; isUpdating: boolean; detailHref: (orderId: string) => string }) {
  const nextStatus = NEXT_STATUS[order.status];
  const [now] = useState(() => Date.now());
  const router = useRouter();
  const openDetail = () => { router.push(detailHref(order.id)); };
  return <div role="button" tabIndex={0} draggable={!!nextStatus} onDragStart={(e) => { if (!nextStatus) return; e.dataTransfer.setData("text/plain", order.id); e.dataTransfer.setData(orderDragType(nextStatus), order.id); e.dataTransfer.effectAllowed = "move"; }} onClick={openDetail} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(); } }} className={`cursor-pointer rounded-xl border-2 bg-white dark:bg-stone-800 shadow-sm p-3.5 space-y-3 hover:shadow-md transition-shadow ${order.paidStatus ? "border-green-400 dark:border-green-600" : "border-red-400 dark:border-red-600"}`}>
    <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-sm font-bold text-stone-900 dark:text-stone-100">{order.tableName}</p><p className="text-xs text-stone-400 font-mono">#{order.id.slice(-6).toUpperCase()}</p></div><div className="text-right shrink-0"><p className="text-xs text-stone-400">{formatAge(now - new Date(order.createdAt).getTime())}</p><span className={`text-[10px] font-semibold ${order.paidStatus ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"} px-1.5 py-0.5 rounded-full`}>{order.paidStatus ? "Đã thanh toán" : "Chưa thanh toán"}</span></div></div>
    <div className="space-y-1">{order.items.map((item) => <div key={item.id} className="flex justify-between text-xs"><div className="min-w-0"><span className="text-stone-700 dark:text-stone-300 truncate pr-2">{item.productName} <span className="text-stone-400 font-semibold">×{item.quantity}</span></span>{(item.selectedModifiers?.length ?? 0) > 0 && <span className="block truncate text-[10px] text-brand-600 dark:text-brand-300">{item.selectedModifiers!.map((modifier) => `${modifier.groupName}: ${modifier.optionName}`).join(" · ")}</span>}</div>{item.note && <span className="text-brand-500 dark:text-brand-400 text-[10px] shrink-0">📝 {item.note}</span>}</div>)}</div>
    {order.note && <p className="text-xs text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-2 py-1 rounded-lg">📌 {order.note}</p>}
    <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800"><span className="text-sm font-bold text-brand-600 dark:text-brand-400">{order.totalAmount.toLocaleString("vi-VN")}đ</span>{nextStatus && <button onClick={(e) => { e.stopPropagation(); onStatusChange(order.id, nextStatus); }} disabled={isUpdating} className="flex items-center gap-1.5 rounded-lg bg-brand-400 hover:bg-brand-500 active:bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50">{isUpdating && <SpinnerIcon className="size-3 animate-spin" />}{NEXT_STATUS_LABEL[order.status]} →</button>}</div>
  </div>;
}
