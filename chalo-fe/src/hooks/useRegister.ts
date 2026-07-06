// src/hooks/useRegister.ts
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/auth.store";
import { userRegister } from "@/services/auth/auth.api";
import { useRouter } from "next/navigation";
import { getSafeRedirectUrl } from "@/utils/navigation";
import { type RegisterFormType, RegisterSchema } from "@/schemas/auth.schema";

interface UseRegisterReturn {
  form: UseFormReturn<RegisterFormType>;
  handleRegister: (data: RegisterFormType) => Promise<void>;
  isLoading: boolean;
}

export const useRegister = (): UseRegisterReturn => {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();

  const form = useForm<RegisterFormType>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      fullName: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleRegister = async (data: RegisterFormType) => {
    try {
      const res = await userRegister({
        fullName: data.fullName,
        username: data.username,
        password: data.password,
      });
      setTokens(res.accessToken, res.refreshToken);
      setUser(res.user);
      router.push(getSafeRedirectUrl(null, res.user.role));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Đăng ký thất bại, vui lòng thử lại";
      form.setError("root", { message });
    }
  };

  return { form, handleRegister, isLoading: form.formState.isSubmitting };
};
