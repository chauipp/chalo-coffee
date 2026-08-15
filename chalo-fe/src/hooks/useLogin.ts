// src/hooks/useLogin.ts
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/auth.store";
import { userLogin } from "@/services/auth/auth.api";
import { useSearchParams } from "next/navigation";
import { getSafeRedirectUrl } from "@/utils/navigation";
import { type LoginFormType, LoginSchema } from "@/schemas/auth.schema";
interface UseLoginReturn {
  form: UseFormReturn<LoginFormType>;
  handleLogin: (data: LoginFormType) => Promise<void>;
  isLoading: boolean;
}

export const useLogin = (): UseLoginReturn => {
  const searchParams = useSearchParams();
  const { setTokens, setUser } = useAuthStore();

  const redirectUrl = searchParams.get("redirect");

  const form = useForm<LoginFormType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { username: "", password: "" },
  });

  const handleLogin = async (data: LoginFormType) => {
    try {
      const res = await userLogin(data);
      // try {
      setTokens(res.accessToken, res.refreshToken);
      setUser(res.user);
      // } catch (error) {
      //     console.error('Lỗi lưu trữ: ', error)
      //     throw new Error('Không thể lưu thông tin đăng nhập')
      // }

      const destination = getSafeRedirectUrl(redirectUrl, res.user.role);

      // Hard navigation is intentional: middleware and AppInitializer must see
      // the freshly persisted auth cookies instead of a cached /login tree.
      window.location.assign(destination);
    } catch (error: any) {

      const message = error?.message || "Đăng nhập thất bại, vui lòng thử lại";
      form.setError("root", { message });
    }
  };

  return { form, handleLogin, isLoading: form.formState.isSubmitting };
};
