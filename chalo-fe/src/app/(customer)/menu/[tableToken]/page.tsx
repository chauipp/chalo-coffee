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
    title: `Thực đơn · ${table.name} | Chalo Coffee`,
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

  return (
    <CustomerMenuClient
      categories={categories}
      initProducts={products}
      tableName={table.name}
      isOccupied={isOccupied}
    />
  );
}
