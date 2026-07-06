// src/utils/format.ts

export const formatVnd = (n: number): string =>
  `${(n ?? 0).toLocaleString("vi-VN")}đ`;

// Compact axis label, e.g. 1_200_000 -> "1,2tr", 45_000 -> "45k"
export const formatVndCompact = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")}tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n ?? 0);
};
