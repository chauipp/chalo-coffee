// src/app/(customer)/menu/[tableToken]/orders/[orderId]/_components/ServiceStepper.Cinematic.tsx
import { OrderStatus } from "@/services/order/order.types";

interface ServiceStepperProps {
  steps: { statuses: OrderStatus[]; label: string; emoji: string }[];
  currentStepIndex: number;
  isServed: boolean;
}

export const ServiceStepperCinematic = ({
  steps,
  currentStepIndex,
  isServed,
}: ServiceStepperProps) => {
  return (
    <div className="rounded-3xl bg-white/70 p-5 dark:bg-stone-900/60">
      <h2 className="mb-5 font-serif text-base text-brand-950 dark:text-brand-50">
        Tiến trình phục vụ
      </h2>
      <div className="relative pl-2">
        <div className="absolute bottom-4 left-[1.35rem] top-4 w-px bg-brand-200 dark:bg-stone-800" />
        <div className="space-y-6">
          {steps.map((step, stepIdx) => {
            const isDone = currentStepIndex > stepIdx;
            const isCurrent = currentStepIndex === stepIdx;
            return (
              <div key={step.statuses.join("-")} className="relative flex items-start gap-4">
                <div
                  className={`relative z-10 mt-[-2px] flex size-8 shrink-0 items-center justify-center rounded-full text-sm transition-all duration-500 ${
                    isDone
                      ? "bg-brand-700 text-brand-50 dark:bg-brand-300 dark:text-brand-950"
                      : isCurrent
                        ? "bg-brand-700 text-brand-50 ring-4 ring-brand-200 dark:bg-brand-300 dark:text-brand-950 dark:ring-brand-900/40"
                        : "bg-brand-100 text-brand-400 dark:bg-stone-900 dark:text-stone-600"
                  }`}
                >
                  {isDone ? "✓" : step.emoji}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-serif text-sm ${
                      isCurrent
                        ? "text-brand-700 dark:text-brand-300"
                        : isDone
                          ? "text-brand-950 dark:text-brand-100"
                          : "text-brand-400 dark:text-stone-600"
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && !isServed && (
                    <p className="motion-safe:animate-pulse mt-1 text-xs text-brand-500/80 dark:text-brand-300/70">
                      Đang tiến hành...
                    </p>
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
