"use client";
// src/app/(customer)/menu/[tableToken]/_components/CustomerMenuClient.tsx
import { USER_ROLE } from "@/constants";
import { CategoryDto, ProductDto } from "@/services/menu";
import { useScanTable } from "@/services/customer/customer.queries";
import { useCallStaff } from "@/services/order/order.queries";
import { useAuthStore } from "@/stores/auth.store";
import { useCartStore } from "@/stores/cart.store";
import { useOrderThemeStore } from "@/stores/orderTheme.store";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { OccupiedModal } from "./OccupiedModal";
import { CustomerMenuViewCinematic } from "./CustomerMenuView.Cinematic";
import { CustomerMenuViewPlayful } from "./CustomerMenuView.Playful";

const CALL_STAFF_COOLDOWN_MS = 30_000;

interface CustomerMenuClientProps {
  tableName: string;
  categories: CategoryDto[];
  initProducts: ProductDto[];
  isOccupied: boolean;
}

export const CustomerMenuClient = ({
  categories,
  initProducts,
  tableName,
  isOccupied,
}: CustomerMenuClientProps) => {
  const { tableToken } = useParams<{ tableToken: string }>();
  const router = useRouter();
  const [activeCateId, setActiveCateId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  // Cảnh báo bàn đang có khách — mỗi phiên chỉ hiện một lần, khoá theo token
  const [showOccupiedModal, setShowOccupiedModal] = useState<boolean>(() => {
    if (typeof window === "undefined" || !isOccupied) return false;
    const storageKey = `occupied_modal_${tableToken}`;
    if (sessionStorage.getItem(storageKey)) return false;
    sessionStorage.setItem(storageKey, "true");
    return true;
  });
  const [callCooldown, setCallCooldown] = useState<boolean>(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scannedShortcutKey = useRef<string | null>(null);

  const { isHydrated, accessToken, user } = useAuthStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const addItem = useCartStore((s) => s.addItem);
  const setTable = useCartStore((s) => s.setTable);
  const callStaffMutation = useCallStaff();
  const scanTableMutation = useScanTable();

  // Giỏ hàng gắn với bàn — quét QR bàn khác thì làm mới giỏ
  useEffect(() => {
    if (tableToken) setTable(tableToken);
  }, [tableToken, setTable]);

  useEffect(() => {
    if (
      !isHydrated ||
      !accessToken ||
      user?.role !== USER_ROLE.CUSTOMER ||
      !tableToken
    ) {
      return;
    }

    const scanKey = `${user.id}:${tableToken}`;
    if (scannedShortcutKey.current === scanKey) return;
    scannedShortcutKey.current = scanKey;
    scanTableMutation.mutate({ tableToken });
  }, [accessToken, isHydrated, scanTableMutation, tableToken, user]);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);

  const handleCallStaff = () => {
    if (callCooldown || callStaffMutation.isPending) return;
    callStaffMutation.mutate(
      { tableToken },
      {
        onSuccess: () => {
          setCallCooldown(true);
          cooldownTimer.current = setTimeout(
            () => setCallCooldown(false),
            CALL_STAFF_COOLDOWN_MS,
          );
        },
      },
    );
  };

  const filterProduct = useMemo(() => {
    let list = initProducts;
    if (activeCateId) list = list.filter((p) => p.categoryId === activeCateId);
    if (search) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return list;
  }, [initProducts, activeCateId, search]);

  const grouped = useMemo(() => {
    if (activeCateId || search) return null;
    return categories
      .map((cat) => ({
        category: cat,
        products: initProducts.filter((p) => p.categoryId === cat.id),
      }))
      .filter((g) => g.products.length > 0);
  }, [search, activeCateId, initProducts, categories]);

  const handleAddToCart = (
    product: ProductDto,
    quantity: number,
    itemNote?: string,
    modifierOptionIds: string[] = [],
    price = product.price,
    cartKey = `${product.id}::`,
  ) => {
    addItem(
      {
        productId: product.id,
        cartKey, price,
        productImageUrl: product.imageUrl,
        productName: product.name,
        note: itemNote,
        modifierOptionIds,
        selectedModifiers: (product.modifierGroups ?? []).flatMap((group) => group.options.filter((option) => modifierOptionIds.includes(option.id)).map((option) => ({ groupName: group.name, optionName: option.name, priceAdjustment: option.priceAdjustment }))),
      },
      quantity,
    );
    if (
      isHydrated &&
      accessToken &&
      user?.role === USER_ROLE.CUSTOMER &&
      tableToken
    ) {
      scanTableMutation.mutate({ tableToken });
    }
  };

  const orderTheme = useOrderThemeStore((s) => s.theme);

  const viewProps = {
    tableName,
    categories,
    activeCateId,
    onSelectCategory: setActiveCateId,
    search,
    onSearchChange: setSearch,
    grouped,
    filterProduct,
    hasAnyProduct: initProducts.length > 0,
    isFiltering: !!activeCateId || !!search,
    onAddToCart: handleAddToCart,
    onCallStaff: handleCallStaff,
    callCooldown,
    callStaffPending: callStaffMutation.isPending,
    itemCount,
    onCartClick: () => router.push(`/menu/${tableToken}/cart`),
    onOrdersClick: () => router.push(`/menu/${tableToken}/orders`),
  };

  return (
    <>
      {showOccupiedModal && (
        <OccupiedModal
          onContinue={() => setShowOccupiedModal(false)}
          onGoBack={() => {
            setShowOccupiedModal(false);
            router.back();
          }}
          tableName={tableName}
        />
      )}
      {orderTheme === "cinematic" ? (
        <CustomerMenuViewCinematic {...viewProps} />
      ) : (
        <CustomerMenuViewPlayful {...viewProps} />
      )}
    </>
  );
};
