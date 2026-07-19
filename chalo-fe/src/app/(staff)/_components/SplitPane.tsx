"use client";
// src/app/(staff)/_components/SplitPane.tsx
// Chia đôi màn hình với thanh kéo (Split Resizer): pointer drag + bàn phím
// (←/→ ±2%, Home/End = min/max), double-click reset. Tỷ lệ lưu localStorage.
// Vùng phải có thể phóng to chiếm hết phần bên phải menu (expanded) — Esc,
// bấm nút, hoặc chuyển sang menu khác đều đưa về lại chế độ chia đôi.
import { usePathname } from "next/navigation";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Vùng phải tự render nút phóng to/thu nhỏ ở góc trên trái của nó */
export interface SplitPaneControls {
  expanded: boolean;
  toggleExpand: () => void;
}

export const SplitPane = ({
  left,
  right,
  storageKey,
  className = "",
  defaultRatio = 9 / 13, // "3-3-3-4": 3 cột trái mỗi cột 3 phần, khu pha chế 4 phần
  minRatio = 0.25,
  maxRatio = 0.78,
}: {
  left: ReactNode;
  right: (controls: SplitPaneControls) => ReactNode;
  storageKey: string;
  className?: string;
  defaultRatio?: number;
  minRatio?: number;
  maxRatio?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(defaultRatio);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // Trên mobile (<md) không chia đôi được → chuyển tab giữa màn chính và khu pha chế.
  const [mobileTab, setMobileTab] = useState<"main" | "prep">("main");
  const ratioRef = useRef(ratio);
  ratioRef.current = ratio;
  const pathname = usePathname();

  useEffect(() => {
    const saved = Number(localStorage.getItem(storageKey));
    if (Number.isFinite(saved) && saved > 0)
      setRatio(clamp(saved, minRatio, maxRatio));
  }, [storageKey, minRatio, maxRatio]);

  const save = (v: number) => localStorage.setItem(storageKey, String(v));

  const toggleExpand = useCallback(() => setExpanded((prev) => !prev), []);

  // Chuyển sang menu khác → trả vùng phải về tỷ lệ chia đôi ban đầu
  useEffect(() => setExpanded(false), [pathname]);

  // Esc để thoát chế độ phóng to
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const moveTo = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setRatio(clamp((clientX - rect.left) / rect.width, minRatio, maxRatio));
  };

  const jumpTo = (v: number) => {
    const next = clamp(v, minRatio, maxRatio);
    setRatio(next);
    save(next);
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col md:flex-row h-full min-h-0 min-w-0 ${className}`}
    >
      {/* Bộ chuyển tab (chỉ mobile) — desktop dùng chế độ chia đôi bên dưới */}
      <div className="flex shrink-0 gap-1 border-b border-gray-200 p-1.5 md:hidden dark:border-gray-800">
        {(
          [
            ["main", "Màn chính"],
            ["prep", "☕ Khu pha chế"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setMobileTab(value)}
            aria-pressed={mobileTab === value}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              mobileTab === value
                ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Vùng trái vẫn mounted khi phóng to → thu lại không mất state của trang */}
      <div
        style={{ width: `${ratio * 100}%` }}
        className={`h-full min-w-0 shrink-0 max-md:h-auto max-md:min-h-0 max-md:w-full! max-md:flex-1 ${
          expanded ? "md:hidden" : ""
        } ${mobileTab === "main" ? "" : "max-md:hidden"}`}
      >
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Kéo để chỉnh tỷ lệ hai vùng (phím ← →, Home/End, double-click để đặt lại)"
        title="Kéo để chỉnh tỷ lệ · double-click đặt lại"
        tabIndex={expanded ? -1 : 0}
        data-testid="split-resizer"
        hidden={expanded}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
        }}
        onPointerMove={(e) => dragging && moveTo(e.clientX)}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          setDragging(false);
          save(ratioRef.current);
        }}
        onDoubleClick={() => jumpTo(defaultRatio)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            jumpTo(ratioRef.current - 0.02);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            jumpTo(ratioRef.current + 0.02);
          } else if (e.key === "Home") {
            e.preventDefault();
            jumpTo(minRatio);
          } else if (e.key === "End") {
            e.preventDefault();
            jumpTo(maxRatio);
          }
        }}
        className={`relative z-10 mx-1 w-1.5 shrink-0 cursor-col-resize rounded-full transition-colors max-md:hidden
          after:absolute after:inset-y-0 after:-inset-x-2 after:content-['']
          ${
            dragging
              ? "bg-brand-400"
              : "bg-gray-200 dark:bg-gray-800 hover:bg-brand-300 dark:hover:bg-brand-500/60"
          }
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400`}
      />

      {/* Phóng to = vùng trái ẩn đi, vùng này flex-1 nên tự chiếm hết chỗ
          còn lại bên phải menu (sidebar vẫn hiển thị) */}
      <div
        className={`h-full min-w-0 flex-1 py-3 pr-3 max-md:min-h-0 max-md:px-2 max-md:pt-2 ${
          expanded ? "pl-3" : ""
        } ${mobileTab === "prep" ? "" : "max-md:hidden"}`}
      >
        {right({ expanded, toggleExpand })}
      </div>
    </div>
  );
};
