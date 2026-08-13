"use client";
// src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/ServiceStepper.Cinematic.tsx
import { OrderStatus } from "@/services/order/order.types";

interface ServiceStepperProps {
  steps: {
    statuses: OrderStatus[];
    activeLabel: string;
    completedLabel: string;
    pendingLabel: string;
    emoji: string;
  }[];
  currentStepIndex: number;
}

export const ServiceStepperCinematic = ({
  steps,
  currentStepIndex,
}: ServiceStepperProps) => {
  return (
    <div className="rounded-3xl bg-white p-5 dark:bg-stone-900">
      <h2 className="mb-5 font-semibold text-base text-stone-900 dark:text-stone-50">
        Tiến trình phục vụ
      </h2>
      <div className="relative pl-2">
        <div className="absolute bottom-4 left-[1.35rem] top-4 w-px bg-brand-200 dark:bg-stone-800" />
        <div className="space-y-6">
          {steps.map((step, stepIdx) => {
            const isDone = currentStepIndex > stepIdx;
            const isCurrent = currentStepIndex === stepIdx;
            return (
              <div
                key={step.statuses.join("-")}
                data-testid={isCurrent ? "service-step-active" : undefined}
                className="relative flex items-start gap-4"
              >
                <div
                  className={`relative z-10 mt-[-2px] flex size-8 shrink-0 items-center justify-center rounded-full text-sm transition-all duration-500 ${
                    isDone
                      ? "bg-brand-700 text-brand-50 dark:bg-brand-300 dark:text-stone-900"
                      : isCurrent
                        ? "bg-brand-700 text-brand-50 ring-4 ring-brand-200 dark:bg-brand-300 dark:text-stone-900 dark:ring-brand-900/40"
                        : "bg-brand-100 text-brand-400 dark:bg-stone-900 dark:text-stone-600"
                  }`}
                >
                  {isDone ? "✓" : step.emoji}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-semibold text-sm ${
                      isCurrent
                        ? "text-brand-700 dark:text-brand-300"
                        : isDone
                          ? "text-stone-900 dark:text-brand-100"
                          : "text-brand-400 dark:text-stone-600"
                    }`}
                  >
                    {isCurrent
                      ? step.activeLabel
                      : isDone
                        ? step.completedLabel
                        : step.pendingLabel}
                  </p>
                  {isCurrent && (
                    <span
                      aria-hidden="true"
                      className="ml-1.5 inline-block size-1.5 rounded-full bg-brand-500 motion-safe:animate-pulse dark:bg-brand-300"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
