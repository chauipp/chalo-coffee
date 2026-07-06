import { forwardRef, SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, options, placeholder, className = "", ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm
        bg-white dark:bg-gray-800
        text-gray-900 dark:text-gray-100
        outline-none transition-colors
        focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20
        disabled:cursor-not-allowed disabled:opacity-50
        ${
          error
            ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
            : "border-gray-200 dark:border-gray-700"
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  },
);
Select.displayName = 'Select'