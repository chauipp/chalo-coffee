// src/mocks/handlers/table.handlers.ts
import { http, HttpResponse, delay } from "msw";
import type { TableDto, TableStatus } from "@/services/table/table.types";

const generateId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).substring(2, 9)}`;

const makeQrUrl = (token: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    `http://localhost:3000/menu/${token}`,
  )}`;

let tables: TableDto[] = [
  {
    id: "tbl_01",
    name: "Bàn 01",
    area: "Tầng 1",
    status: "OCCUPIED",
    qrToken: "qr-token-tbl_01",
    qrCodeUrl: makeQrUrl("qr-token-tbl_01"),
    createdAt: "2025-01-01",
    // 2 đơn: 1 đang pha chế chưa trả tiền, 1 đã xong nhưng chưa trả tiền
    activeOrders: [
      {
        id: "ord_001",
        status: "PREPARING",
        paidStatus: false,
        totalAmount: 85000,
        createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
      },
      {
        id: "ord_003",
        status: "CONFIRMED",
        paidStatus: false,
        totalAmount: 35000,
        createdAt: new Date(Date.now() - 3 * 60_000).toISOString(),
      },
    ],
  },
  {
    id: "tbl_02",
    name: "Bàn 02",
    area: "Tầng 1",
    status: "OCCUPIED",
    qrToken: "qr-token-tbl_02",
    qrCodeUrl: makeQrUrl("qr-token-tbl_02"),
    createdAt: "2025-01-01",
    // Đơn READY chờ phục vụ
    activeOrders: [
      {
        id: "ord_004",
        status: "READY",
        paidStatus: false,
        totalAmount: 135000,
        createdAt: new Date(Date.now() - 12 * 60_000).toISOString(),
      },
    ],
  },
  {
    id: "tbl_03",
    name: "Bàn 03",
    area: "Tầng 1",
    status: "AVAILABLE",
    qrToken: "qr-token-tbl_03",
    qrCodeUrl: makeQrUrl("qr-token-tbl_03"),
    createdAt: "2025-01-01",
    activeOrders: [],
  },
  {
    id: "tbl_04",
    name: "Bàn 04",
    area: "Sân vườn",
    status: "AVAILABLE",
    qrToken: "qr-token-tbl_04",
    qrCodeUrl: makeQrUrl("qr-token-tbl_04"),
    createdAt: "2025-01-01",
    activeOrders: [],
  },
  {
    id: "tbl_05",
    name: "Bàn 05",
    area: "Tầng 2",
    status: "AVAILABLE",
    qrToken: "qr-token-tbl_05",
    qrCodeUrl: makeQrUrl("qr-token-tbl_05"),
    createdAt: "2025-01-01",
    activeOrders: [],
  },
  {
    id: "tbl_08",
    name: "Bàn 08",
    area: "Tầng 1",
    status: "OCCUPIED",
    qrToken: "qr-token-tbl_08",
    qrCodeUrl: makeQrUrl("qr-token-tbl_08"),
    createdAt: "2025-01-01",
    // Đơn PENDING mới nhất
    activeOrders: [
      {
        id: "ord_002",
        status: "PENDING",
        paidStatus: false,
        totalAmount: 90000,
        createdAt: new Date(Date.now() - 1 * 60_000).toISOString(),
      },
    ],
  },
];

const ok = (data: unknown) =>
  HttpResponse.json({ code: 200, message: "success", data });
const notFound = (msg = "Không tìm thấy") =>
  HttpResponse.json({ code: 404, message: msg, data: null }, { status: 404 });

export const tableHandlers = [
  http.get("*/api/table/page", async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const pageNo = Number(url.searchParams.get("pageNo") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    const area = url.searchParams.get("area");
    const status = url.searchParams.get("status") as TableStatus | null;

    let filtered = [...tables];
    if (area) filtered = filtered.filter((t) => t.area === area);
    if (status) filtered = filtered.filter((t) => t.status === status);

    const start = (pageNo - 1) * pageSize;
    return ok({
      list: filtered.slice(start, start + pageSize),
      total: filtered.length,
    });
  }),

  http.get("*/api/table/list", async () => {
    await delay(200);
    return ok(tables);
  }),

  http.get("*/api/table/areas", async () => {
    await delay(150);
    const areas = [...new Set(tables.map((t) => t.area).filter(Boolean))];
    return ok(areas.map((a) => ({ id: a, name: a })));
  }),

  http.get("*/api/table/by-token/:token", async ({ params }) => {
    await delay(200);
    const table = tables.find((t) => t.qrToken === params.token);
    if (!table) return notFound("Mã QR không hợp lệ hoặc đã hết hạn");
    return ok({
      id: table.id,
      name: table.name,
      area: table.area,
      status: table.status,
    });
  }),

  http.post("*/api/table/create", async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Record<string, unknown>;
    const id = generateId("tbl");
    const token = `qr-token-${id}`;
    const newTable: TableDto = {
      id,
      name: body.name as string,
      area: body.area as string,
      status: "AVAILABLE",
      qrToken: token,
      qrCodeUrl: makeQrUrl(token),
      createdAt: new Date().toISOString().split("T")[0],
      activeOrders: [], // Bàn mới không có đơn nào
    };
    tables.unshift(newTable);
    return ok(newTable);
  }),

  http.put("*/api/table/update", async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Record<string, unknown>;
    const idx = tables.findIndex((t) => t.id === body.id);
    if (idx === -1) return notFound();
    tables[idx] = {
      ...tables[idx],
      name: body.name as string,
      area: body.area as string | undefined,
    };
    return ok(tables[idx]);
  }),

  http.put("*/api/table/regenerate-qr", async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as { id: string };
    const idx = tables.findIndex((t) => t.id === body.id);
    if (idx === -1) return notFound();
    const newToken = `qr-token-${tables[idx].id}-${Date.now()}`;
    tables[idx].qrToken = newToken;
    tables[idx].qrCodeUrl = makeQrUrl(newToken);
    return ok(tables[idx]);
  }),

  http.delete("*/api/table/delete", async ({ request }) => {
    await delay(300);
    const id = new URL(request.url).searchParams.get("id");
    const idx = tables.findIndex((t) => t.id === id);
    if (idx === -1) return notFound();
    if (tables[idx].status === "OCCUPIED") {
      return HttpResponse.json(
        { code: 400, message: "Bàn đang có khách, không thể xóa", data: null },
        { status: 400 },
      );
    }
    tables.splice(idx, 1);
    return ok(null);
  }),
];