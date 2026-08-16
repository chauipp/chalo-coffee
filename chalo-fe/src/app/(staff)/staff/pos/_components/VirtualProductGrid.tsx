"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { type RefObject, useEffect, useRef, useState } from "react";
import { ProductDto } from "@/services/menu";
import { ProductCard } from "./ProductCard";

const CARD_MIN_WIDTH = 184;
const GRID_GAP = 8;
const ROW_HEIGHT = 152;

interface VirtualProductGridProps {
  products: ProductDto[];
  quantitiesByProductId: ReadonlyMap<string, number>;
  onSelectProduct: (product: ProductDto) => void;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export const VirtualProductGrid = ({ products, quantitiesByProductId, onSelectProduct, loadMoreRef, hasNextPage, isFetchingNextPage }: VirtualProductGridProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [columnCount, setColumnCount] = useState(1);
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const updateColumnCount = () => setColumnCount(Math.max(1, Math.floor((element.clientWidth + GRID_GAP) / (CARD_MIN_WIDTH + GRID_GAP))));
    updateColumnCount();
    const observer = new ResizeObserver(updateColumnCount);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const virtualizer = useVirtualizer({ count: products.length, getScrollElement: () => scrollRef.current, estimateSize: () => ROW_HEIGHT, overscan: 3, lanes: columnCount });
  const horizontalGap = (columnCount - 1) * GRID_GAP;
  return <div ref={scrollRef} data-testid="pos-product-scroll" className="flex-1 min-h-0 overflow-y-auto p-3">
    <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((virtualItem) => {
        const product = products[virtualItem.index];
        return <div key={product.id} className="absolute" style={{ height: ROW_HEIGHT - GRID_GAP, left: `calc(${virtualItem.lane} * ((100% - ${horizontalGap}px) / ${columnCount} + ${GRID_GAP}px))`, top: 0, transform: `translateY(${virtualItem.start}px)`, width: `calc((100% - ${horizontalGap}px) / ${columnCount})` }}>
          <ProductCard product={product} quantity={quantitiesByProductId.get(product.id)} onAddToCart={onSelectProduct} />
        </div>;
      })}
    </div>
    <div ref={loadMoreRef} className="flex justify-center py-4">
      {isFetchingNextPage ? <span className="text-sm text-gray-400">Đang tải thêm...</span> : hasNextPage ? <span className="text-xs text-gray-400">Cuộn để tải thêm</span> : products.length > 0 ? <span className="text-xs text-gray-400">Đã hiển thị tất cả</span> : null}
    </div>
  </div>;
};
