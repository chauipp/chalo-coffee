export interface VirtualRangeInput {
  scrollTop: number;
  viewportHeight: number;
  rowHeight: number;
  columns: number;
  count: number;
  overscanRows: number;
}

export const getVirtualRange = ({ scrollTop, viewportHeight, rowHeight, columns, count, overscanRows }: VirtualRangeInput) => {
  if (count === 0) return { start: 0, end: -1 };
  const firstVisibleRow = Math.floor(scrollTop / rowHeight);
  const lastVisibleRow = Math.ceil((scrollTop + viewportHeight) / rowHeight) - 1;
  const start = Math.max(0, (firstVisibleRow - Math.ceil(overscanRows / 2)) * columns);
  const end = Math.min(count - 1, (lastVisibleRow + 1) * columns - 1);
  return { start, end };
};

export const buildQuantitiesByProductId = (cart: ReadonlyArray<{ productId: string; quantity: number }>): ReadonlyMap<string, number> => {
  const quantities = new Map<string, number>();
  for (const item of cart) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  return quantities;
};
