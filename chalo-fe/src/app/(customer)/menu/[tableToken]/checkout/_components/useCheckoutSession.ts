// src/app/(customer)/menu/[tableToken]/checkout/_components/useCheckoutSession.ts
// Shared VietQR + countdown logic for both theme variants' SessionPanel
// (mirrors the useProductCardState.ts pattern: business logic lives in one
// hook, JSX/styling stays per-theme).
import { useEffect, useState } from "react";
import { buildVietQR } from "@/lib/vietqr";
import { useGetSettings } from "@/services/settings";
import { CheckoutSessionResult } from "@/services/order/order.types";

export function useCheckoutSession(
  session: CheckoutSessionResult | null,
  tableName?: string | null,
) {
  const { data: settings } = useGetSettings();
  const [remainingMs, setRemainingMs] = useState<number>(() =>
    session ? new Date(session.expiresAt).getTime() - Date.now() : 0,
  );
  const [prevSession, setPrevSession] = useState(session);

  // Adjust state during render (same pattern as ServiceStepper.Playful.tsx /
  // ConfettiBurst.tsx) instead of a synchronous setState-in-effect, so a new
  // session recomputes remainingMs immediately without tripping
  // react-hooks/set-state-in-effect. The effect below only owns the
  // recurring tick (an async setInterval callback), which is fine.
  if (session !== prevSession) {
    setPrevSession(session);
    setRemainingMs(session ? new Date(session.expiresAt).getTime() - Date.now() : 0);
  }

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      setRemainingMs(new Date(session.expiresAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [session]);

  const expired = remainingMs <= 0;
  const mm = Math.max(0, Math.floor(remainingMs / 60000));
  const ss = Math.max(0, Math.floor((remainingMs % 60000) / 1000));
  const bankConfigured =
    !!settings?.bankBin && !!settings?.bankAccountNo && !!settings?.bankAccountName;
  const qrPayload =
    session && bankConfigured
      ? buildVietQR({
          bankBin: settings!.bankBin!,
          accountNo: settings!.bankAccountNo!,
          amount: session.totalAmount,
          addInfo: `CHALO ${tableName ?? ""} ${session.sessionId.slice(-6)}`,
        })
      : null;

  return { settings, expired, mm, ss, qrPayload };
}
