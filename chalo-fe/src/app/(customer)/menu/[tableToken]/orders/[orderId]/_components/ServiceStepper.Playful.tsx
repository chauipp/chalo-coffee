"use client";
// src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/ServiceStepper.Playful.tsx
import { ConfettiBurst } from "@/components/shared/ConfettiBurst";
import { OrderStatus } from "@/services/order/order.types";
import { useState } from "react";

interface ServiceStepperProps {
  steps: { statuses: OrderStatus[]; label: string; emoji: string }[];
  currentStepIndex: number;
  isServed: boolean;
}

export const ServiceStepperPlayful = ({
  steps,
  currentStepIndex,
  isServed,
}: ServiceStepperProps) => {
  const [burstKey, setBurstKey] = useState<number>(0);
  const [prevStepIndex, setPrevStepIndex] = useState<number>(currentStepIndex);

  // Adjust state during render (React's recommended pattern for reacting to
  // prop changes) instead of useEffect, to avoid firing the burst on every
  // render and to keep it a single synchronous state transition.
  if (currentStepIndex !== prevStepIndex) {
    if (currentStepIndex > prevStepIndex && currentStepIndex === steps.length - 1) {
      setBurstKey((k) => k + 1);
    }
    setPrevStepIndex(currentStepIndex);
  }

  return (
    <div className="relative rounded-3xl border-2 border-stone-900 bg-white p-5 shadow-[4px_4px_0_var(--color-stone-900)] dark:border-brand-50 dark:bg-carnival-raised dark:shadow-[4px_4px_0_var(--color-pop-600)]">
      <h2 className="mb-5 text-sm font-black text-stone-900 dark:text-brand-50">
        Tiến trình phục vụ
      </h2>
      <div className="flex items-start justify-between gap-1">
        {steps.map((step, stepIdx) => {
          const isDone = currentStepIndex > stepIdx;
          const isCurrent = currentStepIndex === stepIdx;
          return (
            <div key={step.statuses.join("-")} className="flex flex-1 flex-col items-center gap-2 text-center">
              <div
                className={`flex size-10 items-center justify-center rounded-full border-2 border-stone-900 text-base transition-transform dark:border-brand-50 ${
                  isDone
                    ? "bg-pop-500 text-white"
                    : isCurrent
                      ? "motion-safe:animate-bounce bg-pop-500 text-white"
                      : "bg-stone-100 text-stone-400 dark:bg-carnival dark:text-stone-500"
                }`}
              >
                {isDone ? "✓" : step.emoji}
              </div>
              <p
                className={`text-xs font-bold ${
                  isCurrent
                    ? "text-pop-600 dark:text-pop-400"
                    : isDone
                      ? "text-stone-900 dark:text-brand-50"
                      : "text-stone-400 dark:text-stone-600"
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
      {isServed && <ConfettiBurst triggerKey={burstKey} />}
    </div>
  );
};
