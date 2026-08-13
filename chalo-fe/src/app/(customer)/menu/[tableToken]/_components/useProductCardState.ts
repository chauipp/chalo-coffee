// src/app/(customer)/menu/[tableToken]/_components/useProductCardState.ts
import { useState } from "react";
import { ProductDto } from "@/services/menu";
import { MAX_ITEM_QUANTITY } from "@/stores/cart.store";
import {
  isModifierSelectionValid,
  modifierPrice,
} from "@/components/menu/ProductModifierPicker";
import { canonicalModifierKey } from "@/utils/cart-modifiers";

export type AddToCartHandler = (
  quantity: number,
  note?: string,
  modifierOptionIds?: string[],
  price?: number,
  cartKey?: string,
) => void;

export function useProductCardState(
  product: ProductDto,
  onAddToCart: AddToCartHandler,
) {
  const [quantity, setQuantity] = useState<number>(1);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [detailQuantity, setDetailQuantity] = useState<number>(1);
  const [detailNote, setDetailNote] = useState<string>("");
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [imgError, setImgError] = useState<boolean>(false);

  const isUnavailable = product.status !== "AVAILABLE" || !product.isActive;
  const showImage = !!product.imageUrl && !imgError;
  const hasModifiers = (product.modifierGroups?.length ?? 0) > 0;

  const openDetail = () => {
    setDetailQuantity(1);
    setDetailNote("");
    setSelectedOptionIds([]);
    setDetailOpen(true);
  };

  const quickAdd = () => {
    onAddToCart(quantity, undefined, [], product.price, `${product.id}::`);
    setQuantity(1);
  };

  const handleDetailAdd = () => {
    if (!isModifierSelectionValid(product.modifierGroups, selectedOptionIds))
      return;
    const adjustment = modifierPrice(product.modifierGroups, selectedOptionIds);
    onAddToCart(
      detailQuantity,
      detailNote.trim() || undefined,
      selectedOptionIds,
      product.price + adjustment,
      `${product.id}:${canonicalModifierKey(selectedOptionIds)}:${detailNote.trim()}`,
    );
    setDetailQuantity(1);
    setDetailNote("");
    setDetailOpen(false);
  };

  const canAddDetail = isModifierSelectionValid(
    product.modifierGroups,
    selectedOptionIds,
  );
  const detailTotal =
    product.price + modifierPrice(product.modifierGroups, selectedOptionIds);

  return {
    quantity,
    setQuantity,
    detailOpen,
    setDetailOpen,
    detailQuantity,
    setDetailQuantity,
    detailNote,
    setDetailNote,
    selectedOptionIds,
    setSelectedOptionIds,
    imgError,
    setImgError,
    isUnavailable,
    showImage,
    hasModifiers,
    openDetail,
    quickAdd,
    handleDetailAdd,
    canAddDetail,
    detailTotal,
    MAX_ITEM_QUANTITY,
  };
}
