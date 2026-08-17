import { API } from "@/constants";
import { request } from "@/lib/api-client";
import type {
  IngredientDto,
  IngredientInput,
  IngredientUpdateInput,
  InventoryAdjustmentInput,
  InventoryMovementDto,
  InventoryReceiptInput,
  ProductRecipeLine,
  ProductRecipeLineDto,
} from "./inventory.types";

export const getIngredients = (): Promise<IngredientDto[]> => request.get(API.INVENTORY.INGREDIENTS);
export const getLowStockIngredients = (): Promise<IngredientDto[]> => request.get(API.INVENTORY.LOW_STOCK);
export const createIngredient = (payload: IngredientInput): Promise<IngredientDto> => request.post(API.INVENTORY.INGREDIENTS, payload);
export const updateIngredient = (id: string, payload: IngredientUpdateInput): Promise<IngredientDto> => request.put(API.INVENTORY.INGREDIENT(id), payload);
export const receiveIngredient = (id: string, payload: InventoryReceiptInput): Promise<IngredientDto> => request.post(API.INVENTORY.RECEIVE(id), payload);
export const adjustIngredient = (id: string, payload: InventoryAdjustmentInput): Promise<IngredientDto> => request.post(API.INVENTORY.ADJUST(id), payload);
export const getIngredientMovements = (id: string): Promise<InventoryMovementDto[]> => request.get(API.INVENTORY.MOVEMENTS(id));
export const getProductRecipe = (productId: string): Promise<ProductRecipeLineDto[]> => request.get(API.INVENTORY.RECIPE(productId));
export const updateProductRecipe = (productId: string, lines: ProductRecipeLine[]): Promise<ProductRecipeLineDto[]> => request.put(API.INVENTORY.RECIPE(productId), { lines });
