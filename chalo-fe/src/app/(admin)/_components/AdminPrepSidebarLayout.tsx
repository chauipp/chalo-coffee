"use client";

import { useCallback, useEffect, useState } from "react";
import { CoffeeIcon } from "@/components/shared/icons/CoffeeIcon";
import { PrepDock } from "../../(staff)/_components/PrepDock";
import { SplitPane } from "../../(staff)/_components/SplitPane";
import {
  ADMIN_PREP_VISIBLE_STORAGE_KEY,
  readAdminPrepVisible,
} from "./adminPrepSidebarState";

const ADMIN_PREP_DOCK_ID = "admin-prep-dock";

function writeAdminPrepVisible(visible: boolean) {
  try {
    window.localStorage.setItem(
      ADMIN_PREP_VISIBLE_STORAGE_KEY,
      String(visible),
    );
  } catch {
    // Storage can be unavailable in private browsing or during SSR.
  }
}

/** Desktop-only shell that keeps the admin prep dock beside route content. */
export function AdminPrepSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        setVisible(readAdminPrepVisible(window.localStorage));
      } catch {
        setVisible(false);
      }
    });
    return () => window.clearTimeout(timeout);
  }, []);

  const setVisibility = useCallback((next: boolean) => {
    setVisible(next);
    writeAdminPrepVisible(next);
  }, []);

  const railActions = [
    {
      id: "prep",
      label: "Khu pha chế",
      icon: CoffeeIcon,
      active: visible,
      onClick: () => setVisibility(!visible),
    },
  ];

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1">
      <div className="min-h-0 min-w-0 flex-1">
        {visible ? (
          <SplitPane
            storageKey="admin-prep-split:v1"
            className="h-full min-h-0 min-w-0"
            left={children}
            right={() => (
              <div id={ADMIN_PREP_DOCK_ID} className="h-full min-h-0">
                <PrepDock enabled={visible} />
              </div>
            )}
          />
        ) : children}
      </div>
      <aside
        aria-label="Thanh công cụ bên phải"
        className="hidden w-12 shrink-0 flex-col items-center gap-2 border-l border-gray-200 bg-white py-3 dark:border-gray-800 dark:bg-gray-900 md:flex"
      >
        {railActions.map(({ id, label, icon: Icon, active, onClick }) => (
          <button
            key={id}
            type="button"
            data-testid={`admin-${id}-rail-action`}
            className={`flex size-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${
              active
                ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                : "text-gray-500 hover:bg-brand-50 hover:text-brand-700 dark:text-gray-400 dark:hover:bg-brand-950/30 dark:hover:text-brand-300"
            }`}
            aria-label={label}
            aria-pressed={active}
            aria-controls={ADMIN_PREP_DOCK_ID}
            title={label}
            onClick={onClick}
          >
            <Icon className="size-5" aria-hidden="true" />
          </button>
        ))}
      </aside>
    </div>
  );
}
