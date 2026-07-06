// src/schemas/menu.schema.ts
import { PRODUCT_STATUS } from "@/services/menu/menu.types";
import z from "zod";

export const CategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống').max(50, 'Tối đa 50 ký tự'),
  description: z.string().max(200, 'Tối đa 200 ký tự').optional(),
  imageUrl: z.url('URL không hợp lệ').optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean(),
})

export type CategoryFormType = z.infer<typeof CategorySchema>

export const ProductSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm không được để trống").max(100, 'Tối đa 100 ký tự'),
  categoryId: z.string().min(1, 'Chưa chọn danh mục'),
  description: z.string().max(500, 'Tối đa 500 ký tự').optional(),
  imageUrl: z.url('URL không hợp lệ').optional().or(z.literal('')),
  price: z.coerce.number().min(1000, "Giá tối thiểu 1,000đ"),
  prepTime: z.coerce.number().int(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  status: z.enum(PRODUCT_STATUS),
  isActive: z.boolean().default(true)
})

export type ProductFormType = z.infer<typeof ProductSchema>