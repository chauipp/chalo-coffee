"use client";

import { Input } from "@/components/shared/ui/Input";
import { Select } from "@/components/shared/ui/Select";
import { useIngredients, useProductRecipe, useUpdateProductRecipe } from "@/services/inventory";
import { parseInventoryQuantity } from "@/services/inventory/inventory.utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type RecipeDraftLine = { ingredientId: string; quantity: string };

export function ProductRecipeEditor({ productId }: { productId: string }) {
  const { data: ingredients = [] } = useIngredients();
  const { data: recipe = [], isLoading } = useProductRecipe(productId);
  const save = useUpdateProductRecipe();
  const [lines, setLines] = useState<RecipeDraftLine[]>([]);

  useEffect(() => {
    setLines(recipe.map((line) => ({ ingredientId: line.ingredientId, quantity: String(line.quantity) })));
  }, [recipe]);

  const updateLine = (index: number, patch: Partial<RecipeDraftLine>) => setLines((current) => current.map((line, i) => i === index ? { ...line, ...patch } : line));
  const available = ingredients.filter((ingredient) => ingredient.isActive);
  const addLine = () => {
    const candidate = available.find((ingredient) => !lines.some((line) => line.ingredientId === ingredient.id));
    if (!candidate) { toast.error("Không còn nguyên liệu khả dụng để thêm."); return; }
    setLines((current) => [...current, { ingredientId: candidate.id, quantity: "" }]);
  };
  const submit = () => {
    const payload = lines.map((line) => ({ ingredientId: line.ingredientId, quantity: parseInventoryQuantity(line.quantity) }));
    if (payload.some((line) => !line.ingredientId || line.quantity === null || line.quantity <= 0)) {
      toast.error("Mỗi nguyên liệu cần có định lượng lớn hơn 0, tối đa 3 chữ số thập phân.");
      return;
    }
    if (new Set(payload.map((line) => line.ingredientId)).size !== payload.length) { toast.error("Một nguyên liệu chỉ được dùng một lần trong công thức."); return; }
    save.mutate({ productId, lines: payload as Array<{ ingredientId: string; quantity: number }> });
  };

  return <section data-testid="product-recipe-editor" className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-950/40 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2"><div><div className="flex items-center gap-2"><span aria-hidden="true" className="size-2 rounded-full bg-brand-400" /><h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Công thức tồn kho</h3></div><p className="mt-1 text-xs text-gray-500">Mỗi đơn bán sẽ tự trừ định lượng này. Thiếu nguyên liệu thì món tự chuyển hết hàng.</p></div><button type="button" onClick={addLine} className="min-h-10 rounded-lg px-3 text-xs font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20">+ Thêm nguyên liệu</button></div>
    {isLoading ? <p className="py-3 text-sm text-gray-400">Đang tải công thức...</p> : lines.length === 0 ? <p className="rounded-xl border border-dashed border-gray-200 p-3 text-sm text-gray-500 dark:border-gray-700">Chưa có công thức. Món này sẽ chưa bị trừ kho.</p> : <div className="space-y-2">{lines.map((line, index) => <div key={`${line.ingredientId}-${index}`} className="grid grid-cols-[minmax(0,1fr)_7rem_auto] items-end gap-2"><Select aria-label={`Nguyên liệu ${index + 1}`} value={line.ingredientId} onChange={(e) => updateLine(index, { ingredientId: e.target.value })} options={available.map((ingredient) => ({ value: ingredient.id, label: `${ingredient.name} (${ingredient.unit})` }))} /><Input aria-label={`Định lượng ${index + 1}`} inputMode="decimal" value={line.quantity} onChange={(e) => updateLine(index, { quantity: e.target.value })} placeholder="Số lượng" /><button type="button" aria-label={`Xóa nguyên liệu ${index + 1}`} onClick={() => setLines((current) => current.filter((_, i) => i !== index))} className="min-h-11 rounded-lg px-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">Xóa</button></div>)}</div>}
    <button type="button" disabled={save.isPending} onClick={submit} className="mt-3 min-h-11 rounded-xl border border-brand-300 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/20">{save.isPending ? "Đang lưu..." : "Lưu công thức"}</button>
  </section>;
}
