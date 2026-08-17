import { QUERY_KEYS } from "@/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adjustIngredient,
  createIngredient,
  getIngredientMovements,
  getIngredients,
  getLowStockIngredients,
  getProductRecipe,
  receiveIngredient,
  updateIngredient,
  updateProductRecipe,
} from "./inventory.api";
import type { IngredientInput, IngredientUpdateInput, InventoryAdjustmentInput, InventoryReceiptInput, ProductRecipeLine } from "./inventory.types";

const useInventoryInvalidation = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVENTORY.ALL });
};

export const useIngredients = () => useQuery({ queryKey: QUERY_KEYS.INVENTORY.INGREDIENTS, queryFn: getIngredients, staleTime: 10_000 });
export const useLowStockIngredients = () => useQuery({ queryKey: QUERY_KEYS.INVENTORY.LOW_STOCK, queryFn: getLowStockIngredients, staleTime: 10_000 });
export const useIngredientMovements = (id: string | null) => useQuery({ queryKey: QUERY_KEYS.INVENTORY.MOVEMENTS(id ?? ""), queryFn: () => getIngredientMovements(id!), enabled: !!id });
export const useProductRecipe = (productId: string | null) => useQuery({ queryKey: QUERY_KEYS.INVENTORY.RECIPE(productId ?? ""), queryFn: () => getProductRecipe(productId!), enabled: !!productId });

export const useCreateIngredient = () => {
  const invalidate = useInventoryInvalidation();
  return useMutation({ mutationFn: (payload: IngredientInput) => createIngredient(payload), onSuccess: () => { invalidate(); toast.success("Đã thêm nguyên liệu"); }, onError: (error: Error) => toast.error(error.message) });
};
export const useUpdateIngredient = () => {
  const invalidate = useInventoryInvalidation();
  return useMutation({ mutationFn: ({ id, payload }: { id: string; payload: IngredientUpdateInput }) => updateIngredient(id, payload), onSuccess: () => { invalidate(); toast.success("Đã cập nhật nguyên liệu"); }, onError: (error: Error) => toast.error(error.message) });
};
export const useReceiveIngredient = () => {
  const invalidate = useInventoryInvalidation();
  return useMutation({ mutationFn: ({ id, payload }: { id: string; payload: InventoryReceiptInput }) => receiveIngredient(id, payload), onSuccess: () => { invalidate(); toast.success("Đã nhập kho"); }, onError: (error: Error) => toast.error(error.message) });
};
export const useAdjustIngredient = () => {
  const invalidate = useInventoryInvalidation();
  return useMutation({ mutationFn: ({ id, payload }: { id: string; payload: InventoryAdjustmentInput }) => adjustIngredient(id, payload), onSuccess: () => { invalidate(); toast.success("Đã điều chỉnh tồn kho"); }, onError: (error: Error) => toast.error(error.message) });
};
export const useUpdateProductRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ productId, lines }: { productId: string; lines: ProductRecipeLine[] }) => updateProductRecipe(productId, lines), onSuccess: (_, { productId }) => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVENTORY.RECIPE(productId) }); queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVENTORY.ALL }); toast.success("Đã lưu công thức món"); }, onError: (error: Error) => toast.error(error.message) });
};
