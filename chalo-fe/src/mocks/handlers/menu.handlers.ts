// src/mocks/handlers/menu.handlers.ts — Bản Mock nâng cấp (String ID & Big Data)
import { http, HttpResponse, delay } from "msw";
import type {
  CategoryDto,
  ProductDto,
  ProductStatus,
} from "@/services/menu/menu.types";

// Hàm tạo ID ngẫu nhiên cho tính năng Create
const generateId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

// ----- SEED DATA -----
let categories: CategoryDto[] = [
  {
    id: "cat_01",
    name: "Cà phê truyền thống",
    description: "Cà phê pha phin đậm đà bản sắc Việt",
    imageUrl: null,
    sortOrder: 1,
    isActive: true,
    productCount: 4,
    createdAt: "2025-01-10",
  },
  {
    id: "cat_02",
    name: "Cà phê pha máy",
    description: "Espresso, Latte, Cappuccino chuẩn vị Ý",
    imageUrl: null,
    sortOrder: 2,
    isActive: true,
    productCount: 3,
    createdAt: "2025-01-10",
  },
  {
    id: "cat_03",
    name: "Trà trái cây",
    description: "Thanh mát, giải nhiệt mùa hè",
    imageUrl: null,
    sortOrder: 3,
    isActive: true,
    productCount: 5,
    createdAt: "2025-01-12",
  },
  {
    id: "cat_04",
    name: "Trà sữa",
    description: "Béo ngậy, topping trân châu dẻo dai",
    imageUrl: null,
    sortOrder: 4,
    isActive: true,
    productCount: 4,
    createdAt: "2025-01-12",
  },
  {
    id: "cat_05",
    name: "Sinh tố & Nước ép",
    description: "Vitamin tươi nguyên chất mỗi ngày",
    imageUrl: null,
    sortOrder: 5,
    isActive: true,
    productCount: 4,
    createdAt: "2025-02-01",
  },
  {
    id: "cat_06",
    name: "Bánh ngọt",
    description: "Ăn kèm nhâm nhi cùng trà và cà phê",
    imageUrl: null,
    sortOrder: 6,
    isActive: false,
    productCount: 4,
    createdAt: "2025-03-15",
  }, // Thử 1 danh mục bị ẩn
];

let products: ProductDto[] = [
  // Cà phê truyền thống (cat_01)
  {
    id: "prod_01",
    categoryId: "cat_01",
    categoryName: "Cà phê truyền thống",
    name: "Cà phê đen đá",
    description: "Cà phê nguyên chất, đậm đà",
    imageUrl: null,
    price: 25000,
    status: "AVAILABLE",
    isActive: true,
    sortOrder: 1,
    prepTime: 3,
    createdAt: "2025-01-10",
  },
  {
    id: "prod_02",
    categoryId: "cat_01",
    categoryName: "Cà phê truyền thống",
    name: "Cà phê nâu đá",
    description: "Cà phê đen pha chút sữa đặc",
    imageUrl: null,
    price: 29000,
    status: "AVAILABLE",
    isActive: true,
    sortOrder: 2,
    prepTime: 3,
    createdAt: "2025-01-10",
  },
  {
    id: "prod_03",
    categoryId: "cat_01",
    categoryName: "Cà phê truyền thống",
    name: "Bạc xỉu",
    description: "Nhiều sữa ít cà phê",
    imageUrl: null,
    price: 35000,
    status: "AVAILABLE",
    isActive: true,
    sortOrder: 3,
    prepTime: 4,
    createdAt: "2025-01-10",
  },
  {
    id: "prod_04",
    categoryId: "cat_01",
    categoryName: "Cà phê truyền thống",
    name: "Cà phê cốt dừa",
    description: "Đặc sản Hải Phòng béo ngậy dừa tươi",
    imageUrl: null,
    price: 45000,
    status: "OUT_OF_STOCK",
    isActive: true,
    sortOrder: 4,
    prepTime: 5,
    createdAt: "2025-01-15",
  }, // Tạm hết nguyên liệu dừa

  // Cà phê pha máy (cat_02)
  {
    id: "prod_05",
    categoryId: "cat_02",
    categoryName: "Cà phê pha máy",
    name: "Espresso",
    description: "Cà phê Ý nguyên chất",
    imageUrl: null,
    price: 35000,
    status: "AVAILABLE",
    isActive: true,
    sortOrder: 1,
    prepTime: 2,
    createdAt: "2025-01-10",
  },
  {
    id: "prod_06",
    categoryId: "cat_02",
    categoryName: "Cà phê pha máy",
    name: "Americano",
    description: "Espresso pha loãng",
    imageUrl: null,
    price: 35000,
    status: "AVAILABLE",
    isActive: true,
    sortOrder: 2,
    prepTime: 2,
    createdAt: "2025-01-10",
  },
  {
    id: "prod_07",
    categoryId: "cat_02",
    categoryName: "Cà phê pha máy",
    name: "Latte Art",
    description: "Cà phê sữa nghệ thuật",
    imageUrl: null,
    price: 50000,
    status: "UNAVAILABLE",
    isActive: true,
    sortOrder: 3,
    prepTime: 6,
    createdAt: "2025-01-10",
  }, // Máy pha hỏng vòi đánh sữa

  // Trà trái cây (cat_03)
  {
    id: "prod_08",
    categoryId: "cat_03",
    categoryName: "Trà trái cây",
    name: "Trà đào cam sả",
    description: "Best seller mùa hè",
    imageUrl: null,
    price: 45000,
    status: "AVAILABLE",
    isActive: true,
    sortOrder: 1,
    prepTime: 5,
    createdAt: "2025-01-12",
  },
  {
    id: "prod_09",
    categoryId: "cat_03",
    categoryName: "Trà trái cây",
    name: "Trà vải nhiệt đới",
    description: "Trà lài kết hợp vải thiều",
    imageUrl: null,
    price: 45000,
    status: "AVAILABLE",
    isActive: true,
    sortOrder: 2,
    prepTime: 5,
    createdAt: "2025-01-12",
  },
  {
    id: "prod_10",
    categoryId: "cat_03",
    categoryName: "Trà trái cây",
    name: "Trà dâu tằm",
    description: "Chua chua ngọt ngọt",
    imageUrl: null,
    price: 49000,
    status: "OUT_OF_STOCK",
    isActive: true,
    sortOrder: 3,
    prepTime: 5,
    createdAt: "2025-02-20",
  },
  {
    id: "prod_11",
    categoryId: "cat_03",
    categoryName: "Trà trái cây",
    name: "Hồng trà chanh",
    description: "Hồng trà vị chanh tươi",
    imageUrl: null,
    price: 30000,
    status: "AVAILABLE",
    isActive: true,
    sortOrder: 4,
    prepTime: 3,
    createdAt: "2025-01-12",
  },
  {
    id: "prod_12",
    categoryId: "cat_03",
    categoryName: "Trà trái cây",
    name: "Trà sen vàng",
    description: "Trà ô long nhãn nhục hạt sen",
    imageUrl: null,
    price: 55000,
    status: "AVAILABLE",
    isActive: true,
    sortOrder: 5,
    prepTime: 6,
    createdAt: "2025-04-01",
  },

  // Trà sữa (cat_04)
  {
    id: "prod_13",
    categoryId: "cat_04",
    categoryName: "Trà sữa",
    name: "Trà sữa truyền thống",
    description: "Bao gồm trân châu đen",
    imageUrl: null,
    price: 35000,
    status: "AVAILABLE",
    isActive: true,
    sortOrder: 1,
    prepTime: 4,
    createdAt: "2025-01-12",
  },
  {
    id: "prod_14",
    categoryId: "cat_04",
    categoryName: "Trà sữa",
    name: "Trà sữa nướng",
    description: "Vị kem nướng caramel",
    imageUrl: null,
    price: 45000,
    status: "AVAILABLE",
    isActive: true,
    sortOrder: 2,
    prepTime: 4,
    createdAt: "2025-02-15",
  },
  {
    id: "prod_15",
    categoryId: "cat_04",
    categoryName: "Trà sữa",
    name: "Trà sữa Oolong nướng",
    description: "Trà ô long đậm vị",
    imageUrl: null,
    price: 45000,
    status: "OUT_OF_STOCK",
    isActive: true,
    sortOrder: 3,
    prepTime: 5,
    createdAt: "2025-03-10",
  },
  {
    id: "prod_16",
    categoryId: "cat_04",
    categoryName: "Trà sữa",
    name: "Sữa tươi trân châu đường đen",
    description: "Sữa tươi Đà Lạt milk",
    imageUrl: null,
    price: 40000,
    status: "AVAILABLE",
    isActive: false,
    sortOrder: 4,
    prepTime: 4,
    createdAt: "2025-01-12",
  }, // Đang ẩn món này

  // Sinh tố & Nước ép (cat_05)
  {
    id: "prod_17",
    categoryId: "cat_05",
    categoryName: "Sinh tố & Nước ép",
    name: "Nước ép dưa hấu",
    description: "Giải nhiệt mùa hè",
    imageUrl: null,
    price: 35000,
    status: "AVAILABLE",
    isActive: true,
    sortOrder: 1,
    prepTime: 5,
    createdAt: "2025-02-01",
  },
  {
    id: "prod_18",
    categoryId: "cat_05",
    categoryName: "Sinh tố & Nước ép",
    name: "Nước ép cam vắt",
    description: "Nhiều vitamin C",
    imageUrl: null,
    price: 40000,
    status: "AVAILABLE",
    isActive: true,
    sortOrder: 2,
    prepTime: 5,
    createdAt: "2025-02-01",
  },
  {
    id: "prod_19",
    categoryId: "cat_05",
    categoryName: "Sinh tố & Nước ép",
    name: "Sinh tố bơ",
    description: "Bơ sáp béo ngậy",
    imageUrl: null,
    price: 55000,
    status: "OUT_OF_STOCK",
    isActive: true,
    sortOrder: 3,
    prepTime: 7,
    createdAt: "2025-02-01",
  }, // Trái mùa
  {
    id: "prod_20",
    categoryId: "cat_05",
    categoryName: "Sinh tố & Nước ép",
    name: "Sinh tố xoài",
    description: "Xoài cát chua ngọt",
    imageUrl: null,
    price: 45000,
    status: "AVAILABLE",
    isActive: true,
    sortOrder: 4,
    prepTime: 6,
    createdAt: "2025-02-01",
  },

  // Bánh ngọt (cat_06) - Demo danh mục này đang ẩn luôn
  {
    id: "prod_21",
    categoryId: "cat_06",
    categoryName: "Bánh ngọt",
    name: "Bánh sừng bò (Croissant)",
    description: "Bơ Pháp thơm lừng",
    imageUrl: null,
    price: 25000,
    status: "AVAILABLE",
    isActive: false,
    sortOrder: 1,
    prepTime: 2,
    createdAt: "2025-03-15",
  },
  {
    id: "prod_22",
    categoryId: "cat_06",
    categoryName: "Bánh ngọt",
    name: "Bánh Tiramisu",
    description: "Bánh lạnh vị cà phê",
    imageUrl: null,
    price: 45000,
    status: "AVAILABLE",
    isActive: false,
    sortOrder: 2,
    prepTime: 1,
    createdAt: "2025-03-15",
  },
  {
    id: "prod_23",
    categoryId: "cat_06",
    categoryName: "Bánh ngọt",
    name: "Mousse chanh dây",
    description: "Chua chua thanh mát",
    imageUrl: null,
    price: 40000,
    status: "AVAILABLE",
    isActive: false,
    sortOrder: 3,
    prepTime: 1,
    createdAt: "2025-03-15",
  },
  {
    id: "prod_24",
    categoryId: "cat_06",
    categoryName: "Bánh ngọt",
    name: "Bánh mì cuộn chà bông",
    description: "Ăn sáng tiện lợi",
    imageUrl: null,
    price: 30000,
    status: "OUT_OF_STOCK",
    isActive: false,
    sortOrder: 4,
    prepTime: 2,
    createdAt: "2025-03-15",
  },
];

// Hàm Helper trả về
const ok = (data: unknown) =>
  HttpResponse.json({ code: 200, message: "success", data });
const notFound = (msg = "Không tìm thấy") =>
  HttpResponse.json({ code: 404, message: msg, data: null }, { status: 404 });

export const menuHandlers = [
  // ===== CATEGORY =====
  http.get("*/api/menu/category/list", async () => {
    await delay(300);
    return ok(categories);
  }),

  http.get("*/api/menu/category/simple-list", async () => {
    await delay(200);
    // Lọc lấy danh mục có isActive = true (Hoặc không tùy logic bạn muốn)
    return ok(categories.map((c) => ({ id: c.id, name: c.name })));
  }),

  http.get("*/api/menu/category/detail", async ({ request }) => {
    await delay(200);
    const id = new URL(request.url).searchParams.get("id"); // Đã xóa Number()
    const cat = categories.find((c) => c.id === id);
    return cat ? ok(cat) : notFound();
  }),

  http.post("*/api/menu/category/create", async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Record<string, unknown>;
    const newCat: CategoryDto = {
      id: generateId("cat"), // Sinh ID chuỗi
      name: body.name as string,
      description: (body.description as string) ?? null,
      imageUrl: (body.imageUrl as string) ?? null,
      sortOrder: (body.sortOrder as number) ?? categories.length + 1,
      isActive: (body.isActive as boolean) ?? true,
      productCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    categories.unshift(newCat); // Đẩy lên đầu cho dễ thấy
    return ok(newCat);
  }),

  http.put("*/api/menu/category/update", async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Record<string, unknown>;
    const idx = categories.findIndex((c) => c.id === body.id); // Đã xóa Number()
    if (idx === -1) return notFound();
    categories[idx] = {
      ...categories[idx],
      ...body,
      id: categories[idx].id,
    } as CategoryDto;
    return ok(categories[idx]);
  }),

  http.delete("*/api/menu/category/delete", async ({ request }) => {
    await delay(300);
    const id = new URL(request.url).searchParams.get("id"); // Đã xóa Number()
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return notFound();
    categories.splice(idx, 1);
    return ok(null);
  }),

  // ===== PRODUCT =====
  http.get("*/api/menu/product/list", async () => {
    await delay(300);
    // Chỉ trả món đang active — đúng với góc nhìn customer
    const visible = products.filter((p) => p.isActive);
    return ok(visible);
  }),

  http.get("*/api/menu/product/page", async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const pageNo = Number(url.searchParams.get("pageNo") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);

    // Các field tìm kiếm (Không cast sang Number nữa)
    const name = url.searchParams.get("name") ?? "";
    const catId = url.searchParams.get("categoryId");
    const status = url.searchParams.get("status");

    // Lọc theo boolean nếu client có gửi lên
    const isActiveParam = url.searchParams.get("isActive");

    let filtered = [...products];
    if (name)
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(name.toLowerCase()),
      );
    if (catId) filtered = filtered.filter((p) => p.categoryId === catId);
    if (status) filtered = filtered.filter((p) => p.status === status);
    if (isActiveParam !== null)
      filtered = filtered.filter(
        (p) => p.isActive === (isActiveParam === "true"),
      );

    // Sort theo ID hoặc thời gian tạo giảm dần
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const start = (pageNo - 1) * pageSize;
    return ok({
      list: filtered.slice(start, start + pageSize),
      total: filtered.length,
    });
  }),

  http.get("*/api/menu/product/detail", async ({ request }) => {
    await delay(200);
    const id = new URL(request.url).searchParams.get("id"); // Đã xóa Number()
    const product = products.find((p) => p.id === id);
    return product ? ok(product) : notFound();
  }),

  http.get("*/api/menu/product/simple-list", async ({ request }) => {
    await delay(200);
    const catId = new URL(request.url).searchParams.get("categoryId");
    const list = catId
      ? products.filter((p) => p.categoryId === catId)
      : products;
    return ok(list.map((p) => ({ id: p.id, name: p.name, price: p.price })));
  }),

  http.post("*/api/menu/product/create", async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Record<string, unknown>;
    const cat = categories.find((c) => c.id === body.categoryId); // Đã xóa Number()

    const newProd: ProductDto = {
      id: generateId("prod"), // Sinh ID chuỗi
      categoryId: body.categoryId as string,
      categoryName: cat?.name ?? "",
      name: body.name as string,
      description: (body.description as string) ?? null,
      imageUrl: (body.imageUrl as string) ?? null,
      price: body.price as number,
      status: (body.status as ProductStatus) ?? "AVAILABLE",
      isActive: (body.isActive as boolean) ?? true,
      sortOrder: (body.sortOrder as number) ?? products.length + 1,
      prepTime: body.prepTime as number,
      createdAt: new Date().toISOString().split("T")[0],
    };
    products.unshift(newProd); // Đẩy lên đầu cho dễ thấy ở trang 1

    // Cập nhật số lượng món của danh mục
    if (cat) cat.productCount += 1;

    return ok(newProd);
  }),

  http.put("*/api/menu/product/update", async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Record<string, unknown>;
    const idx = products.findIndex((p) => p.id === body.id); // Đã xóa Number()
    if (idx === -1) return notFound();

    const cat = categories.find((c) => c.id === body.categoryId); // Đã xóa Number()

    // Kiểm tra xem có đổi danh mục không để update count
    const oldCatId = products[idx].categoryId;
    if (oldCatId !== body.categoryId) {
      const oldCat = categories.find((c) => c.id === oldCatId);
      if (oldCat) oldCat.productCount -= 1;
      if (cat) cat.productCount += 1;
    }

    products[idx] = {
      ...products[idx],
      ...body,
      id: products[idx].id, // Giữ nguyên ID
      categoryName: cat?.name ?? products[idx].categoryName,
    } as ProductDto;
    return ok(products[idx]);
  }),

  http.put("*/api/menu/product/status", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as {
      id: string;
      status: ProductStatus;
    };
    const idx = products.findIndex((p) => p.id === body.id); // Đã xóa Number()
    if (idx === -1) return notFound();
    products[idx].status = body.status;
    return ok(products[idx]);
  }),

  http.delete("*/api/menu/product/delete", async ({ request }) => {
    await delay(300);
    const id = new URL(request.url).searchParams.get("id"); // Đã xóa Number()
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return notFound();

    // Trừ số lượng ở category
    const cat = categories.find((c) => c.id === products[idx].categoryId);
    if (cat) cat.productCount -= 1;

    products.splice(idx, 1);
    return ok(null);
  }),

  // ===== IMAGE UPLOAD (mock) =====
  http.post("*/api/upload/image", async () => {
    await delay(800);
    // Tự tạo ảnh placeholder đẹp đẹp chút
    const randomImgId = Math.floor(Math.random() * 1000);
    const mockUrl = `https://picsum.photos/id/${randomImgId}/400/300`;
    return ok({ url: mockUrl });
  }),
];
