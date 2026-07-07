// src/app/(customer)/layout.tsx
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-gray-50 dark:bg-gray-950">
      {children}
    </div>
  );
}
