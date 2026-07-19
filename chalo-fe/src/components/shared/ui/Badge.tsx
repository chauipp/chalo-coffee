export type BadgeVariant = "green" | "red" | "yellow" | "gray" | "blue";

const variantClass: Record<BadgeVariant, string> = {
  green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  yellow:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  gray: "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-400",
  blue: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
};

export const Badge = ({
  label,
  variant = "gray",
}: {
  label: string;
  variant: BadgeVariant;
}) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClass[variant]}`}
  >
    {label}
  </span>
);
