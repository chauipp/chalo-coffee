// src/app/(customer)/menu/[tableToken]/page.tsx
import { getTableByTokenServer } from "@/services/table/table.server";
import { Metadata } from "next";
import { CustomerMenuClient } from "./_components/CustomerMenuClient";
import {
  getMenuCategoriesServer,
  getMenuProductsServer,
} from "@/services/menu/menu.server";
import { notFound } from "next/navigation";

interface CustomerMenuPageProps {
  params: Promise<{ tableToken: string }>;
}

// SEO Metadata
export async function generateMetadata({
  params,
}: CustomerMenuPageProps): Promise<Metadata> {
  const { tableToken } = await params;
  const table = await getTableByTokenServer(tableToken);
  if (!table) return { title: "Chalo Coffee" };

  return {
    title: `Thực đơn — ${table.name} | Chalo Coffee`,
    description: "Gọi món trực tiếp từ bàn của bạn tại Chalo Coffee",
    openGraph: {
      title: `Chalo Coffee - ${table.name}`,
      description: "Xem thực đơn và gọi món ngay tại bàn",
      type: "website",
    },
  };
}

export default async function CustomerMenuPage({
  params,
}: CustomerMenuPageProps) {
  const { tableToken } = await params;

  const table = await getTableByTokenServer(tableToken);
  if (!table) notFound();

  const [categories, products] = await Promise.all([
    getMenuCategoriesServer(),
    getMenuProductsServer(),
  ]);

  const isOccupied = table.status === "OCCUPIED";

  // 2. MOCK DỮ LIỆU CỨNG ĐỂ TEST GIAO DIỆN ======================
  // TODO: Move to real data
  // const table = { id: "tbl_01", name: "Bàn 01", area: "Tầng 1" };
  // const categories = [
  //   {
  //     id: "cat_01",
  //     name: "Cà phê",
  //     description: null,
  //     imageUrl: null,
  //     sortOrder: 1,
  //     isActive: true,
  //     productCount: 2,
  //     createdAt: "",
  //   },
  //   {
  //     id: "cat_02",
  //     name: "Trà sữa",
  //     description: null,
  //     imageUrl: null,
  //     sortOrder: 2,
  //     isActive: true,
  //     productCount: 1,
  //     createdAt: "",
  //   },
  // ];
  // const products = [
  //   {
  //     id: "p1",
  //     categoryId: "cat_01",
  //     categoryName: "Cà phê",
  //     name: "Bạc Xỉu",
  //     description: "Đậm đà",
  //     imageUrl: null,
  //     price: 29000,
  //     status: "AVAILABLE" as const,
  //     isActive: true,
  //     sortOrder: 1,
  //     prepTime: 5,
  //     createdAt: "",
  //   },
  //   {
  //     id: "p2",
  //     categoryId: "cat_01",
  //     categoryName: "Cà phê",
  //     name: "Đen đá",
  //     description: "Không đường",
  //     imageUrl: null,
  //     price: 25000,
  //     status: "AVAILABLE" as const,
  //     isActive: true,
  //     sortOrder: 2,
  //     prepTime: 5,
  //     createdAt: "",
  //   },
  //   {
  //     id: "p3",
  //     categoryId: "cat_02",
  //     categoryName: "Trà sữa",
  //     name: "Trà Đào Cam Sả",
  //     description: "Tạm hết nguyên liệu",
  //     imageUrl: null,
  //     price: 45000,
  //     status: "OUT_OF_STOCK" as const,
  //     isActive: true,
  //     sortOrder: 1,
  //     prepTime: 5,
  //     createdAt: "",
  //   },
  // ];
  //=========================================================================================

  return (
    <CustomerMenuClient
      categories={categories}
      initProducts={products}
      tableName={table.name}
      isOccupied={isOccupied}
    />
  );
}
