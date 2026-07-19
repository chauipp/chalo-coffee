"use client";
// src/app/(staff)/staff/print-station/page.tsx
// Trạm in ở quầy: mở bằng Chrome --kiosk-printing trên PC nối máy in nhiệt.
// Nghe SSE payment_completed → fetch chi tiết đơn → render hoá đơn gộp →
// window.print(). Thanh toán KHÔNG phụ thuộc trạm in — tắt trạm vẫn xác nhận
// bình thường, mở lại thì "in bù" từ danh sách đơn đã trả tiền hôm nay.
import { API } from "@/constants";
import { SSEPayload, useSSE } from "@/hooks/useSSE";
import { getOrderById, getOrderPage } from "@/services/order/order.api";
import { OrderDto } from "@/services/order/order.types";
import { useAuthStore } from "@/stores/auth.store";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PaymentReceipt } from "./_components/PaymentReceipt";
import { isPrinted, markPrinted } from "./_lib/print-log";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

interface PrintJob {
  jobId: string;
  orderIds: string[];
  totalAmount: number;
  source: "sepay" | "staff";
  /** In lại: bỏ qua kiểm tra đã-in */
  force?: boolean;
}

export default function PrintStationPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [connected, setConnected] = useState(false);
  const [queue, setQueue] = useState<PrintJob[]>([]);
  const [current, setCurrent] = useState<{
    job: PrintJob;
    orders: OrderDto[];
  } | null>(null);
  const [history, setHistory] = useState<PrintJob[]>([]);
  const [catchUp, setCatchUp] = useState<PrintJob[]>([]);
  const busyRef = useRef(false);

  const enqueue = useCallback((job: PrintJob) => {
    if (!job.force && isPrinted(job.orderIds)) return;
    setQueue((q) => [...q, job]);
  }, []);

  // Thanh toán hoàn tất ở bất kỳ đâu (webhook SePay / nhân viên xác nhận) → in
  useSSE({
    url: `${API_BASE}${API.SSE.ORDER_EVENTS}`,
    token: accessToken,
    enabled: !!accessToken,
    onConnectionChange: setConnected,
    onEvent: (type, data) => {
      if (type !== "payment_completed") return;
      const p = data as SSEPayload["payment_completed"];
      enqueue({
        jobId: p.sessionId ?? p.orderIds.join("+"),
        orderIds: p.orderIds,
        totalAmount: p.totalAmount,
        source: p.source ?? "staff",
      });
    },
  });

  // In bù: đơn hôm nay đã thanh toán nhưng chưa có trong nhật ký in
  // (trạm bị tắt/rớt mạng đúng lúc tiền về). Hiện danh sách, nhân viên bấm in tay.
  const refreshCatchUp = useCallback(() => {
    if (!accessToken) return;
    // Ngày tính lại mỗi lần gọi → tự đổi khoá localStorage/danh sách khi qua nửa đêm
    const today = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD
    getOrderPage({ pageNo: 1, pageSize: 100, date: today })
      .then((res) => {
        const unprinted = res.list.filter(
          (o) => o.paidStatus && !isPrinted([o.id]),
        );
        setCatchUp(
          unprinted.map((o) => ({
            jobId: `catchup-${o.id}`,
            orderIds: [o.id],
            totalAmount: o.totalAmount,
            source: "staff" as const,
          })),
        );
      })
      .catch(() => {});
  }, [accessToken]);

  // Nạp lần đầu + quét lại định kỳ. SSE là Subject không replay/Last-Event-ID nên
  // sự kiện payment_completed phát ra lúc tab đang rớt mạng sẽ mất; quét lại danh
  // sách đơn đã thanh toán là lưới an toàn để không sót hoá đơn cần in.
  useEffect(() => {
    refreshCatchUp();
    const id = setInterval(refreshCatchUp, 60_000);
    return () => clearInterval(id);
  }, [refreshCatchUp]);

  // Vừa nghe SSE KẾT NỐI LẠI (mất→có) → đồng bộ ngay, không đợi hết chu kỳ 60s
  const wasConnectedRef = useRef(false);
  useEffect(() => {
    if (connected && !wasConnectedRef.current) refreshCatchUp();
    wasConnectedRef.current = connected;
  }, [connected, refreshCatchUp]);

  // Xử lý hàng đợi TUẦN TỰ: fetch chi tiết → render → in → ghi nhật ký
  useEffect(() => {
    if (busyRef.current || queue.length === 0) return;
    busyRef.current = true;
    const job = queue[0];
    (async () => {
      try {
        const orders = await Promise.all(
          job.orderIds.map((id) => getOrderById(id)),
        );
        setCurrent({ job, orders });
        // đợi 2 frame cho #receipt-print render xong rồi mới gọi in
        await new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        );
        window.print();
        markPrinted(job.orderIds);
        setHistory((h) => [job, ...h.filter((x) => x.jobId !== job.jobId)]);
        setCatchUp((l) =>
          l.filter((x) => !x.orderIds.some((id) => job.orderIds.includes(id))),
        );
      } catch {
        toast.error("In hoá đơn thất bại — thử lại từ danh sách bên dưới");
        // Job lỗi không được biến mất — đưa vào danh sách "Chưa in" để bấm in lại
        setCatchUp((l) =>
          l.some((x) => x.jobId === job.jobId) ? l : [job, ...l],
        );
      } finally {
        setQueue((q) => q.slice(1));
        busyRef.current = false;
      }
    })();
  }, [queue]);

  const money = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Trạm in hoá đơn
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tự in khi thanh toán hoàn tất · để tab này luôn mở trên máy quầy
          </p>
        </div>
        <div
          className={`flex items-center gap-1.5 text-sm font-semibold ${
            connected
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          <span
            className={`size-3 rounded-full ${
              connected ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          />
          {connected ? "Đang nghe thanh toán" : "Mất kết nối!"}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {catchUp.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-2">
              ⚠️ Chưa in ({catchUp.length}) — đơn đã thanh toán nhưng chưa in
            </h2>
            <ul className="space-y-2">
              {catchUp.map((job) => (
                <li
                  key={job.jobId}
                  className="flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 px-4 py-2.5 text-sm"
                >
                  <span>
                    {job.orderIds.length > 1
                      ? `Gộp ${job.orderIds.length} đơn`
                      : `Đơn #${job.orderIds[0].slice(-6).toUpperCase()}`}{" "}
                    · {money(job.totalAmount)}
                  </span>
                  <button
                    onClick={() => enqueue({ ...job, force: true })}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
                  >
                    In bù
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
            Đã in phiên này ({history.length})
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400">
              Chưa có hoá đơn nào — khi khách thanh toán xong sẽ tự in.
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map((job) => (
                <li
                  key={job.jobId}
                  className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm"
                >
                  <span>
                    {job.orderIds.length > 1
                      ? `Gộp ${job.orderIds.length} đơn`
                      : `Đơn #${job.orderIds[0].slice(-6).toUpperCase()}`}{" "}
                    · {money(job.totalAmount)} ·{" "}
                    {job.source === "sepay" ? "CK tự động" : "Nhân viên xác nhận"}
                  </span>
                  <button
                    onClick={() => enqueue({ ...job, force: true })}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    In lại
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Ẩn trên màn hình, chỉ hiện khi in (CSS @media print có sẵn) */}
      {current && (
        <PaymentReceipt
          orders={current.orders}
          totalAmount={current.job.totalAmount}
        />
      )}
    </div>
  );
}
