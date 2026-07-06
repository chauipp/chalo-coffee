import { StaffHeader } from "./staff/_components/StaffHeader";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <StaffHeader />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
