export const STATUS_CONFIG = {
  AVAILABLE: {
    label: "Trống",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800/50",
    textColor: "text-green-700 dark:text-green-400",
    badgeBg: "bg-green-100 dark:bg-green-900/30",
    dot: "bg-green-500",
  },
  OCCUPIED: {
    label: "Có khách",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800/50",
    textColor: "text-red-700 dark:text-red-400",
    badgeBg: "bg-red-100 dark:bg-red-900/30",
    dot: "bg-red-500",
  },
} as const;
