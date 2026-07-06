// src/components/shared/ui/Toggle.tsx

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Toggle = ({ checked, onChange, disabled, label }: ToggleProps) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors
        ${checked ? "bg-brand-400" : "bg-gray-200 dark:bg-gray-700"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform
        ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </div>
    {label && (
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    )}
  </label>
);
