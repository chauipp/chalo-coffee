"use client";
import { ProductModifierGroupDto } from "@/services/menu/menu.types";
import { modifierPrice } from "@/utils/cart-modifiers";

export function isModifierSelectionValid(groups: ProductModifierGroupDto[] | undefined, selectedIds: string[]) {
  const selected = new Set(selectedIds);
  return (groups ?? []).every((group) => !group.isRequired || group.options.some((option) => selected.has(option.id)));
}

export function ProductModifierPicker({ groups, selectedIds, onChange }: { groups: ProductModifierGroupDto[] | undefined; selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const selected = new Set(selectedIds);
  const toggle = (group: ProductModifierGroupDto, id: string) => {
    const next = new Set(selected);
    if (group.selectionType === "SINGLE") group.options.forEach((option) => next.delete(option.id));
    if (selected.has(id) && group.selectionType !== "SINGLE") next.delete(id); else next.add(id);
    onChange([...next]);
  };
  if (!groups?.length) return null;
  return <div className="mt-4 space-y-4">{groups.map((group) => <fieldset key={group.id} className="rounded-xl border border-stone-200 p-3 dark:border-stone-700"><legend className="px-1 text-sm font-semibold text-stone-800 dark:text-stone-100">{group.name}{group.isRequired ? <span className="ml-1 text-red-500">*</span> : null}<span className="ml-2 text-xs font-normal text-stone-400">{group.selectionType === "SINGLE" ? "Chọn một" : "Chọn nhiều"}</span></legend><div className="mt-2 space-y-2">{group.options.map((option) => <label key={option.id} className="flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg px-2 hover:bg-brand-50 dark:hover:bg-brand-900/20"><span className="flex items-center gap-2 text-sm"><input type={group.selectionType === "SINGLE" ? "radio" : "checkbox"} checked={selected.has(option.id)} onChange={() => toggle(group, option.id)} name={`modifier-${group.id}`} />{option.name}</span><span className="text-xs font-semibold text-brand-700 dark:text-brand-300">{option.priceAdjustment ? `+${option.priceAdjustment.toLocaleString("vi-VN")}đ` : "0đ"}</span></label>)}</div></fieldset>)}</div>;
}

export { modifierPrice };
