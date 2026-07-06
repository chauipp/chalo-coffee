// src/schemas/user.schema.ts
import z from "zod";

export const StaffRoleEnum = z.enum(["ADMIN", "MODERATOR"]);

// Used for create (password required).
export const StaffCreateSchema = z.object({
  username: z.string().min(3, "Tối thiểu 3 ký tự").max(50),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  fullName: z.string().min(1, "Không được để trống").max(100),
  role: StaffRoleEnum,
  isActive: z.boolean(),
});
export type StaffCreateType = z.infer<typeof StaffCreateSchema>;

// Used for edit (username/password hidden).
export const StaffUpdateSchema = z.object({
  fullName: z.string().min(1, "Không được để trống").max(100),
  role: StaffRoleEnum,
  isActive: z.boolean(),
});
export type StaffUpdateType = z.infer<typeof StaffUpdateSchema>;

export const ChangePasswordSchema = z.object({
  newPassword: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});
export type ChangePasswordType = z.infer<typeof ChangePasswordSchema>;
