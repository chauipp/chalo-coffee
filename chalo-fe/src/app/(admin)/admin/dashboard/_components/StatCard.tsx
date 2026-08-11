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
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-800">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      {isLoading ? (
        <div className="mt-3 h-7 w-28 animate-pulse rounded bg-stone-100 dark:bg-stone-700" />
      ) : (
        <p className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-stone-400">{hint}</p>}
    </div>
  );
}
