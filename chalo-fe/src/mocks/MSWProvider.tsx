// src/mocks/MSWProvider.tsx — khởi động MSW trước khi app render
"use client";

import { useEffect, useState, type ReactNode } from "react";

export const MSWProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isDev = process.env.NODE_ENV === "development";
    const enableMSW = process.env.NEXT_PUBLIC_ENABLE_MSW === "true";

    // Chỉ bật MSW khi dev + có cờ env rõ ràng
    if (isDev && enableMSW) {
      import("./browser")
        .then(({ worker }) =>
          worker.start({
            onUnhandledRequest: "bypass", // request không có handler → cho qua
          }),
        )
        .then(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  // Chờ MSW khởi động xong mới render app
  // Tránh race condition: component fetch trước khi mock worker sẵn sàng
  if (!ready) return null;

  return <>{children}</>;
};
