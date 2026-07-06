// src/mocks/handlers/index.ts — gộp tất cả handlers
import { authHandlers } from "./auth.handlers";
import { menuHandlers } from "./menu.handlers";
import { tableHandlers } from "./tables.handlers";
import { orderHandlers } from "./order.handlers";

export const handlers = [
  ...authHandlers,
  ...menuHandlers,
  ...tableHandlers,
  ...orderHandlers,
];
