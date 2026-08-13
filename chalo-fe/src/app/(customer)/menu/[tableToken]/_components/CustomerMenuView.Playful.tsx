"use client";

import { CustomerMenuViewCinematic } from "./CustomerMenuView.Cinematic";
import type { CustomerMenuViewProps } from "./CustomerMenuView.types";

// Hai giá trị store cũ cùng dùng một giao diện tối giản để lựa chọn đã lưu
// vẫn hợp lệ mà không buộc khách đổi sang một "gu" màu khác.
export const CustomerMenuViewPlayful = (props: CustomerMenuViewProps) => (
  <CustomerMenuViewCinematic {...props} />
);
