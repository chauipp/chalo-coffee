"use client";
// src/app/(admin)/admin/dashboard/_components/StatCard.tsx

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export function StatCard({ label, value, hint, icon, isLoading }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      {isLoading ? (
        <div className="mt-3 h-7 w-28 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
      ) : (
        <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
