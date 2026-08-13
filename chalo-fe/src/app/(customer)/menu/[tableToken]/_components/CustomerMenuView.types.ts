// src/app/(customer)/menu/[tableToken]/_components/CustomerMenuView.types.ts
import { CategoryDto, ProductDto } from "@/services/menu";

export interface CustomerMenuViewProps {
  tableName: string;
  categories: CategoryDto[];
  activeCateId: string | null;
  onSelectCategory: (id: string | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
  grouped: { category: CategoryDto; products: ProductDto[] }[] | null;
  filterProduct: ProductDto[];
  hasAnyProduct: boolean;
  isFiltering: boolean;
  onAddToCart: (
    product: ProductDto,
    quantity: number,
    itemNote?: string,
    modifierOptionIds?: string[],
    price?: number,
    cartKey?: string,
  ) => void;
  onCallStaff: () => void;
  callCooldown: boolean;
  callStaffPending: boolean;
  itemCount: number;
  onCartClick: () => void;
  onOrdersClick: () => void;
}
