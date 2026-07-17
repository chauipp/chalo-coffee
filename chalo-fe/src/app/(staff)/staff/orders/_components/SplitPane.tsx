"use client";
// src/app/(staff)/staff/orders/_components/SplitPane.tsx
// Chia đôi màn hình với thanh kéo (Split Resizer): pointer drag + bàn phím
// (←/→ ±2%, Home/End = min/max), double-click reset. Tỷ lệ lưu localStorage.
import { ReactNode, useEffect, useRef, useState } from "react";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export const SplitPane = ({
  left,
  right,
  storageKey,
  defaultRatio = 9 / 13, // "3-3-3-4": 3 cột trái mỗi cột 3 phần, khu pha chế 4 phần
  minRatio = 0.25,
  maxRatio = 0.78,
}: {
  left: ReactNode;
  right: ReactNode;
  storageKey: string;
  defaultRatio?: number;
  minRatio?: number;
  maxRatio?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(defaultRatio);
  const [dragging, setDragging] = useState(false);
  const ratioRef = useRef(ratio);
  ratioRef.current = ratio;

  useEffect(() => {
    const saved = Number(localStorage.getItem(storageKey));
    if (Number.isFinite(saved) && saved > 0)
      setRatio(clamp(saved, minRatio, maxRatio));
  }, [storageKey, minRatio, maxRatio]);

  const save = (v: number) => localStorage.setItem(storageKey, String(v));

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
    <div ref={containerRef} className="flex h-full min-h-0 min-w-0">
      <div style={{ width: `${ratio * 100}%` }} className="h-full min-w-0 shrink-0">
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Kéo để chỉnh tỷ lệ hai vùng (phím ← →, Home/End, double-click để đặt lại)"
        title="Kéo để chỉnh tỷ lệ · double-click đặt lại"
        tabIndex={0}
        data-testid="split-resizer"
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
        className={`relative z-10 mx-1 w-1.5 shrink-0 cursor-col-resize rounded-full transition-colors
          after:absolute after:inset-y-0 after:-inset-x-2 after:content-['']
          ${
            dragging
              ? "bg-brand-400"
              : "bg-gray-200 dark:bg-gray-800 hover:bg-brand-300 dark:hover:bg-brand-500/60"
          }
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400`}
      />

      <div className="h-full min-w-0 flex-1">{right}</div>
    </div>
  );
};
