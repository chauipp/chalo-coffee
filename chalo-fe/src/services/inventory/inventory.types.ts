export type InventoryMovementType =
  | "OPENING"
  | "RECEIPT"
  | "ADJUSTMENT"
  | "SALE"
  | "CANCELLATION";

export interface IngredientDto {
  id: string;
  name: string;
  unit: string;
  onHand: number;
  reorderLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovementDto {
  id: string;
  ingredientId: string;
  type: InventoryMovementType;
  delta: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string | null;
  orderId: string | null;
  createdAt: string;
}

export interface IngredientInput {
  name: string;
  unit: string;
  openingQuantity: number;
  reorderLevel: number;
}

export interface IngredientUpdateInput {
  name?: string;
  unit?: string;
  reorderLevel?: number;
  isActive?: boolean;
}

export interface InventoryAdjustmentInput {
  delta: number;
  reason: string;
}

export interface InventoryReceiptInput {
  quantity: number;
  reason: string;
}

export interface ProductRecipeLine {
  ingredientId: string;
  quantity: number;
}

export interface ProductRecipeLineDto extends ProductRecipeLine {
  ingredientName: string | null;
  unit: string | null;
}
