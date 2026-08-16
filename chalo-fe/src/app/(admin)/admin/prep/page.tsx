import { PrepWorkspace } from "../../../(staff)/_components/PrepWorkspace";

export default function AdminPrepPage() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4 md:p-6">
      <h1 className="shrink-0 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Pha chế
      </h1>
      <div className="min-h-0 flex-1">
        <PrepWorkspace enabled />
      </div>
    </div>
  );
}
