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
    bg-white dark:bg-gray-800
    text-gray-900 dark:text-gray-100
    placeholder:text-gray-400 dark:placeholder:text-gray-500
    outline-none transition-colors
    focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20
    disabled:cursor-not-allowed disabled:opacity-50
    ${
      error
        ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
        : "border-gray-200 dark:border-gray-700"
    } ${className}`}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input'