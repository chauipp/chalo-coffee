import type { ProductModifierGroupDto } from "@/services/menu/menu.types";

export type SelectedModifier = { groupName: string; optionName: string; priceAdjustment: number };

export function canonicalModifierKey(optionIds: string[] = []): string {
  return [...optionIds].sort().join(",");
}

export function buildSelectedModifiers(groups: ProductModifierGroupDto[] | undefined, optionIds: string[]): SelectedModifier[] {
  const selected = new Set(optionIds);
  return (groups ?? []).flatMap((group) => group.options.filter((option) => selected.has(option.id)).map((option) => ({ groupName: group.name, optionName: option.name, priceAdjustment: option.priceAdjustment })));
}

export function modifierPrice(groups: ProductModifierGroupDto[] | undefined, optionIds: string[]): number {
  return buildSelectedModifiers(groups, optionIds).reduce((sum, item) => sum + item.priceAdjustment, 0);
}

export function modifierLabel(modifiers: SelectedModifier[] = []): string {
  return modifiers.map((modifier) => `${modifier.groupName}: ${modifier.optionName}`).join(" · ");
}
