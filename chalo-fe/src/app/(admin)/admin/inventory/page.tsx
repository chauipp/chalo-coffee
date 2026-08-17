"use client";

import { AdminMobilePageHeader } from "../../_components/AdminMobilePageHeader";
import { FormField } from "@/components/shared/ui/FormField";
import { Input } from "@/components/shared/ui/Input";
import { Modal } from "@/components/shared/ui/Modal";
import {
  IngredientDto,
  InventoryMovementDto,
  useAdjustIngredient,
  useCreateIngredient,
  useIngredientMovements,
  useIngredients,
  useLowStockIngredients,
  useReceiveIngredient,
} from "@/services/inventory";
import { inventoryState, parseInventoryQuantity } from "@/services/inventory/inventory.utils";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

const number = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 });
const movementLabel: Record<string, string> = {
  OPENING: "Tồn đầu kỳ",
  RECEIPT: "Nhập kho",
  ADJUSTMENT: "Điều chỉnh",
  SALE: "Bán món",
  CANCELLATION: "Hoàn tồn do hủy đơn",
};

type StockAction = { ingredient: IngredientDto; type: "receive" | "adjust" } | null;

function quantityOrError(raw: string, label: string) {
  const value = parseInventoryQuantity(raw);
  if (value === null) {
    toast.error(`${label} phải là số không âm, tối đa 3 chữ số thập phân.`);
    return null;
  }
  return value;
}

function signedQuantityOrError(raw: string, label: string) {
  const negative = raw.trim().startsWith("-");
  const parsed = parseInventoryQuantity(negative ? raw.trim().slice(1) : raw);
  if (parsed === null || parsed === 0) {
    toast.error(`${label} phải khác 0 và tối đa 3 chữ số thập phân.`);
    return null;
  }
  return negative ? -parsed : parsed;
}

function IngredientForm({ onSaved }: { onSaved: () => void }) {
  const create = useCreateIngredient();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("g");
  const [openingQuantity, setOpeningQuantity] = useState("0");
  const [reorderLevel, setReorderLevel] = useState("0");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const opening = quantityOrError(openingQuantity, "Tồn đầu kỳ");
    const reorder = quantityOrError(reorderLevel, "Mức cần nhập");
    if (opening === null || reorder === null || !name.trim() || !unit.trim()) {
      if (!name.trim() || !unit.trim()) toast.error("Vui lòng nhập tên và đơn vị tính.");
      return;
    }
    create.mutate({ name: name.trim(), unit: unit.trim(), openingQuantity: opening, reorderLevel: reorder }, { onSuccess: onSaved });
  };
  return <form onSubmit={submit} className="space-y-4">
    <FormField label="Tên nguyên liệu" required><Input aria-label="Tên nguyên liệu" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Hạt Arabica" maxLength={100} /></FormField>
    <div className="grid grid-cols-2 gap-3">
      <FormField label="Đơn vị" required><Input aria-label="Đơn vị" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="g, ml, cái" maxLength={16} /></FormField>
      <FormField label="Mức cần nhập" required><Input aria-label="Mức cần nhập" inputMode="decimal" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} /></FormField>
    </div>
    <FormField label="Tồn đầu kỳ" required hint="Được ghi thành một dòng lịch sử, không thể sửa trực tiếp."><Input aria-label="Tồn đầu kỳ" inputMode="decimal" value={openingQuantity} onChange={(e) => setOpeningQuantity(e.target.value)} /></FormField>
    <button disabled={create.isPending} className="w-full rounded-xl bg-brand-400 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{create.isPending ? "Đang lưu..." : "Thêm nguyên liệu"}</button>
  </form>;
}

function StockActionForm({ action, onSaved }: { action: Exclude<StockAction, null>; onSaved: () => void }) {
  const receive = useReceiveIngredient();
  const adjust = useAdjustIngredient();
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const isReceive = action.type === "receive";
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = isReceive
      ? quantityOrError(quantity, "Số lượng nhập")
      : signedQuantityOrError(quantity, "Số lượng điều chỉnh");
    if (value === null || !reason.trim()) { if (!reason.trim()) toast.error("Cần ghi rõ lý do để lưu vào lịch sử kho."); return; }
    if (isReceive) receive.mutate({ id: action.ingredient.id, payload: { quantity: value, reason: reason.trim() } }, { onSuccess: onSaved });
    else adjust.mutate({ id: action.ingredient.id, payload: { delta: value, reason: reason.trim() } }, { onSuccess: onSaved });
  };
  const pending = receive.isPending || adjust.isPending;
  return <form onSubmit={submit} className="space-y-4">
    <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300"><strong>{action.ingredient.name}</strong> hiện còn {number.format(action.ingredient.onHand)} {action.ingredient.unit}.</p>
    <FormField label={isReceive ? `Số lượng nhập (${action.ingredient.unit})` : `Chênh lệch (${action.ingredient.unit})`} required hint={isReceive ? "Chỉ nhập số dương." : "Dùng số âm cho hao hụt, số dương cho điều chỉnh tăng."}>
      <Input inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={isReceive ? "500" : "-50 hoặc 50"} />
    </FormField>
    <FormField label="Lý do" required><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="VD: Nhập từ nhà cung cấp" maxLength={300} /></FormField>
    <button disabled={pending} className="w-full rounded-xl bg-brand-400 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Đang lưu..." : isReceive ? "Xác nhận nhập kho" : "Xác nhận điều chỉnh"}</button>
  </form>;
}

function MovementHistory({ ingredient }: { ingredient: IngredientDto }) {
  const { data = [], isLoading } = useIngredientMovements(ingredient.id);
  return <div className="space-y-3" data-testid="inventory-history">
    <p className="text-sm text-gray-500">{ingredient.name} · hiện còn {number.format(ingredient.onHand)} {ingredient.unit}</p>
    {isLoading ? <p className="py-6 text-center text-sm text-gray-400">Đang tải lịch sử...</p> : data.length === 0 ? <p className="py-6 text-center text-sm text-gray-400">Chưa có biến động nào.</p> : <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {data.map((movement: InventoryMovementDto) => <li key={movement.id} className="py-3 text-sm">
        <div className="flex justify-between gap-3"><span className="font-medium text-gray-900 dark:text-gray-100">{movementLabel[movement.type] ?? movement.type}</span><span className={movement.delta >= 0 ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>{movement.delta >= 0 ? "+" : ""}{number.format(movement.delta)} {ingredient.unit}</span></div>
        <p className="mt-1 text-xs text-gray-500">{movement.reason || "Tự động từ đơn hàng"} · {new Date(movement.createdAt).toLocaleString("vi-VN")}</p>
      </li>)}
    </ul>}
  </div>;
}

export default function InventoryPage() {
  const { data: ingredients = [], isLoading, isError } = useIngredients();
  const { data: lowStock = [] } = useLowStockIngredients();
  const [addOpen, setAddOpen] = useState(false);
  const [stockAction, setStockAction] = useState<StockAction>(null);
  const [historyTarget, setHistoryTarget] = useState<IngredientDto | null>(null);
  const lowIds = new Set(lowStock.map((item) => item.id));
  const emptyCount = ingredients.filter((item) => inventoryState(item.onHand, item.reorderLevel) === "empty").length;

  return <div className="space-y-6 p-4 pb-28 sm:p-6" data-testid="inventory-page">
    <AdminMobilePageHeader title="Tồn kho" description="Theo dõi nguyên liệu, nhập kho và ngăn món bán vượt tồn." summary={`${lowStock.length} nguyên liệu cần chú ý`} action={<button onClick={() => setAddOpen(true)} className="w-full rounded-xl bg-brand-400 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-500 sm:w-auto">+ Thêm nguyên liệu</button>} />
    <section className="grid grid-cols-3 gap-2 sm:gap-4" aria-label="Tóm tắt tồn kho">
      {[{ label: "Nguyên liệu", value: ingredients.length, color: "text-gray-900 dark:text-gray-100" }, { label: "Cần nhập", value: lowStock.length, color: "text-amber-600" }, { label: "Đã hết", value: emptyCount, color: "text-red-600" }].map((stat) => <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 sm:p-4"><p className="text-xs text-gray-500">{stat.label}</p><p className={`mt-1 text-xl font-bold sm:text-2xl ${stat.color}`}>{stat.value}</p></div>)}
    </section>
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {isLoading ? <p className="p-8 text-center text-sm text-gray-400">Đang tải tồn kho...</p> : isError ? <div className="p-8 text-center"><p className="font-medium text-gray-900 dark:text-gray-100">Không tải được tồn kho</p><p className="mt-1 text-sm text-gray-500">Kiểm tra kết nối rồi tải lại trang để xem dữ liệu mới nhất.</p></div> : ingredients.length === 0 ? <div className="p-8 text-center"><p className="font-medium text-gray-900 dark:text-gray-100">Chưa có nguyên liệu</p><p className="mt-1 text-sm text-gray-500">Thêm nguyên liệu và mức cần nhập để hệ thống cảnh báo đúng lúc.</p></div> : <ul className="divide-y divide-gray-100 dark:divide-gray-800">{ingredients.map((ingredient) => {
        const state = inventoryState(ingredient.onHand, ingredient.reorderLevel);
        const alert = state === "empty" ? "Đã hết" : lowIds.has(ingredient.id) || state === "low" ? "Cần nhập" : "Đủ dùng";
        const alertClass = state === "empty" ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300" : alert === "Cần nhập" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300";
        return <li key={ingredient.id} className="p-4" data-testid={`inventory-ingredient-${ingredient.id}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-semibold text-gray-900 dark:text-gray-100">{ingredient.name}</h2><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${alertClass}`}>{alert}</span></div><p className="mt-1 text-sm text-gray-500">Còn <strong className="text-gray-900 dark:text-gray-100">{number.format(ingredient.onHand)} {ingredient.unit}</strong> · cần nhập khi ≤ {number.format(ingredient.reorderLevel)} {ingredient.unit}</p></div><div className="flex gap-1"><button onClick={() => setStockAction({ ingredient, type: "receive" })} className="min-h-11 rounded-lg px-3 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400">Nhập</button><button onClick={() => setStockAction({ ingredient, type: "adjust" })} className="min-h-11 rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">Điều chỉnh</button><button onClick={() => setHistoryTarget(ingredient)} className="min-h-11 rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">Lịch sử</button></div></div></li>;
      })}</ul>}
    </section>
    <Modal title="Thêm nguyên liệu" open={addOpen} onClose={() => setAddOpen(false)} presentation="bottom-sheet" panelTestId="inventory-add-modal"><IngredientForm onSaved={() => setAddOpen(false)} /></Modal>
    <Modal title={stockAction?.type === "receive" ? "Nhập kho" : "Điều chỉnh tồn kho"} open={!!stockAction} onClose={() => setStockAction(null)} presentation="bottom-sheet" panelTestId="inventory-action-modal">{stockAction && <StockActionForm action={stockAction} onSaved={() => setStockAction(null)} />}</Modal>
    <Modal title="Lịch sử tồn kho" open={!!historyTarget} onClose={() => setHistoryTarget(null)} presentation="bottom-sheet" panelTestId="inventory-history-modal">{historyTarget && <MovementHistory ingredient={historyTarget} />}</Modal>
  </div>;
}
