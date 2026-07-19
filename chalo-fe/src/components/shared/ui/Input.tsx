import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm 
    bg-white dark:bg-stone-800
    text-stone-900 dark:text-stone-100
    placeholder:text-stone-400 dark:placeholder:text-stone-500
    outline-none transition-colors
    focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20
    disabled:cursor-not-allowed disabled:opacity-50
    ${
      error
        ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
        : "border-stone-200 dark:border-stone-700"
    } ${className}`}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input'