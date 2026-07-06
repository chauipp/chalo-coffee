// src/schemas/table.schema.ts

import z from "zod";

export const TableSchema = z.object({
  name: z.string().min(1, "Tên bàn không được để trống").max(50),
  area: z.string().optional(),
});

export type TableFormType = z.infer<typeof TableSchema>;
