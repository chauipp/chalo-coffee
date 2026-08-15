"use client";

import { useCallback, useEffect, useState } from "react";
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
                <PrepDock />
              </div>
            )}
          />
        ) : children}
      </div>
      <button
        type="button"
        className="hidden min-h-10 w-10 shrink-0 items-center justify-center border-l border-gray-200 bg-white px-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-400 dark:border-gray-800 dark:bg-gray-900 dark:text-brand-400 dark:hover:bg-brand-950/30 md:flex"
        aria-expanded={visible}
        aria-controls={ADMIN_PREP_DOCK_ID}
        aria-label={visible ? "Thu gọn khu pha chế" : "Pha chế"}
        title={visible ? "Thu gọn khu pha chế" : "Mở khu pha chế"}
        onClick={() => setVisibility(!visible)}
      >
        <span style={{ writingMode: "vertical-rl" }}>Pha chế</span>
      </button>
    </div>
  );
}
