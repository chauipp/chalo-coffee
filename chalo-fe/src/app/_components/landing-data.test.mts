import assert from "node:assert/strict";
import test from "node:test";
import { buildLandingMenu, formatVnd } from "./landing-data.ts";
import type { CategoryDto, ProductDto } from "@/services/menu/menu.types";

const categories: CategoryDto[] = [
  {
    id: "tea",
    name: "Trà",
    description: null,
    imageUrl: null,
    sortOrder: 2,
    isActive: true,
    productCount: 3,
    createdAt: "2026-08-11",
  },
  {
    id: "coffee",
    name: "Cà phê truyền thống",
    description: null,
    imageUrl: null,
    sortOrder: 1,
    isActive: true,
    productCount: 4,
    createdAt: "2026-08-11",
  },
  {
    id: "hidden",
    name: "Ẩn",
    description: null,
    imageUrl: null,
    sortOrder: 0,
    isActive: false,
    productCount: 1,
    createdAt: "2026-08-11",
  },
];

const products: ProductDto[] = [
  {
    id: "late-coffee",
    categoryId: "coffee",
    categoryName: "Cà phê truyền thống",
    name: "Cà phê nâu đá",
    description: null,
    imageUrl: null,
    price: 29000,
    status: "AVAILABLE",
    isActive: true,
    sortOrder: 2,
    prepTime: 3,
    createdAt: "2026-08-11",
  },
  {
    id: "first-coffee",
    categoryId: "coffee",
    categoryName: "Cà phê truyền thống",
    name: "Cà phê đen đá",
    description: "Đậm đà",
    imageUrl: null,
    price: 25000,
    status: "AVAILABLE",
    isActive: true,
    sortOrder: 1,
    prepTime: 3,
    createdAt: "2026-08-11",
  },
  {
    id: "unavailable",
    categoryId: "coffee",
    categoryName: "Cà phê truyền thống",
    name: "Cà phê cốt dừa",
    description: null,
    imageUrl: null,
    price: 45000,
    status: "OUT_OF_STOCK",
    isActive: true,
    sortOrder: 3,
    prepTime: 5,
    createdAt: "2026-08-11",
  },
  {
    id: "inactive",
    categoryId: "tea",
    categoryName: "Trà",
    name: "Trà đào",
    description: null,
    imageUrl: null,
    price: 40000,
    status: "AVAILABLE",
    isActive: false,
    sortOrder: 1,
    prepTime: 4,
    createdAt: "2026-08-11",
  },
  {
    id: "hidden-category",
    categoryId: "hidden",
    categoryName: "Ẩn",
    name: "Món ẩn",
    description: null,
    imageUrl: null,
    price: 30000,
    status: "AVAILABLE",
    isActive: true,
    sortOrder: 1,
    prepTime: 3,
    createdAt: "2026-08-11",
  },
];

test("buildLandingMenu chỉ nhóm món active, available theo sort order", () => {
  const result = buildLandingMenu(categories, products);

  assert.deepEqual(result.map((group) => group.name), ["Cà phê truyền thống"]);
  assert.deepEqual(
    result[0].products.map((product) => product.name),
    ["Cà phê đen đá", "Cà phê nâu đá"],
  );
  assert.equal(products[0].name, "Cà phê nâu đá");
});

test("buildLandingMenu và formatVnd xử lý dữ liệu rỗng", () => {
  assert.deepEqual(buildLandingMenu([], []), []);
  assert.equal(formatVnd(25000), "25.000đ");
});
