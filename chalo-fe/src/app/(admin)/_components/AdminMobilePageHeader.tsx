interface AdminMobilePageHeaderProps {
  title: string;
  description: string;
  summary?: string;
  action?: React.ReactNode;
}

export function AdminMobilePageHeader({
  title,
  description,
  summary,
  action,
}: AdminMobilePageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-xl">
          {title}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        {summary ? (
          <p className="mt-1 text-xs font-medium text-gray-400 md:hidden">
            {summary}
          </p>
        ) : null}
      </div>
      {action ? <div className="w-full sm:w-auto">{action}</div> : null}
    </header>
  );
}
