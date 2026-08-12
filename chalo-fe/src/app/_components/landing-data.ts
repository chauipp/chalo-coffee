import type { CategoryDto, ProductDto } from "@/services/menu/menu.types";

export type LandingProduct = Pick<
  ProductDto,
  "id" | "name" | "description" | "imageUrl" | "price" | "sortOrder"
>;

export type LandingCategory = Pick<
  CategoryDto,
  "id" | "name" | "description" | "sortOrder"
> & {
  products: LandingProduct[];
};

export function findLandingCategoryByKeywords(
  menu: LandingCategory[],
  keywords: readonly string[],
): string | "all" {
  const category = menu.find((item) => {
    const normalizedName = item.name.toLocaleLowerCase("vi-VN");
    return keywords.some((keyword) => normalizedName.includes(keyword));
  });

  return category?.id ?? "all";
}

export function buildLandingMenu(
  categories: CategoryDto[],
  products: ProductDto[],
): LandingCategory[] {
  const availableProductsByCategory = new Map<string, LandingProduct[]>();

  for (const product of products) {
    if (!product.isActive || product.status !== "AVAILABLE") continue;

    const productsInCategory = availableProductsByCategory.get(product.categoryId) ?? [];
    productsInCategory.push({
      id: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.price,
      sortOrder: product.sortOrder,
    });
    availableProductsByCategory.set(product.categoryId, productsInCategory);
  }

  return categories
    .filter((category) => category.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((category) => {
      const categoryProducts = availableProductsByCategory
        .get(category.id)
        ?.sort((a, b) => a.sortOrder - b.sortOrder);

      if (!categoryProducts?.length) return [];

      return [
        {
          id: category.id,
          name: category.name,
          description: category.description,
          sortOrder: category.sortOrder,
          products: categoryProducts,
        },
      ];
    });
}

export function formatVnd(price: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(price)}đ`;
}
