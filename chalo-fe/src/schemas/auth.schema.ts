// src/schemas/auth.schema.ts// src/schemas/auth.schema.ts
import { z } from 'zod'

export const LoginSchema = z.object({
  username: z.string().min(1, "Tên đăng nhập không được để trống"),
  password: z.string().min(1, "Mật khẩu không được để trống")
})

export type LoginFormType = z.infer<typeof LoginSchema>

export const RegisterSchema = z
  .object({
    fullName: z.string().min(1, "Họ tên không được để trống"),
    username: z
      .string()
      .min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu nhập lại không khớp",
  });

export type RegisterFormType = z.infer<typeof RegisterSchema>