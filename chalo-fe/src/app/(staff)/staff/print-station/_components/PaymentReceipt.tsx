"use client";
// src/app/(staff)/staff/print-station/_components/PaymentReceipt.tsx
import { OrderDto } from "@/services/order/order.types";

/**
 * Hoá đơn gộp cho MỘT lần thanh toán (có thể gồm nhiều đơn của cùng bàn).
 * Render vào #receipt-print — dùng chung CSS @media print trong globals.css
 * với Receipt.tsx. Mỗi trang chỉ được có một #receipt-print.
 */
export const PaymentReceipt = ({
  orders,
  totalAmount,
  shopName = "Chalo Coffee",
}: {
  orders: OrderDto[];
  totalAmount: number;
  shopName?: string;
}) => {
  const printedAt = new Date().toLocaleString("vi-VN");
  const tableName = orders[0]?.tableName ?? "";

  return (
    <div
      className="receipt-print-root"
      aria-hidden
      data-testid="payment-receipt-root"
    >
      <div id="receipt-print">
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>{shopName}</div>
          <div style={{ marginTop: "4px", fontWeight: 700 }}>
            HOÁ ĐƠN THANH TOÁN
          </div>
        </div>

        <div style={{ borderTop: "1px dashed #000", paddingTop: "4px" }}>
          <div>Bàn: {tableName}</div>
          <div>Thời gian: {printedAt}</div>
          {orders.length > 1 && <div>Gộp {orders.length} đơn</div>}
        </div>

        {orders.map((order) => (
          <div key={order.id}>
            <div style={{ marginTop: "6px", fontWeight: 700 }}>
              Đơn #{order.id.slice(-6).toUpperCase()}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderTop: "1px dashed #000",
                    borderBottom: "1px dashed #000",
                  }}
                >
                  <th style={{ textAlign: "left", padding: "2px 0" }}>Món</th>
                  <th style={{ textAlign: "center" }}>SL</th>
                  <th style={{ textAlign: "right" }}>T.Tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: "2px 0" }}>
                      {item.productName}
                      {item.note ? ` (${item.note})` : ""}
                    </td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>
                      {item.subtotal.toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div
          style={{
            borderTop: "1px dashed #000",
            marginTop: "6px",
            paddingTop: "4px",
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 700,
            fontSize: "14px",
          }}
        >
          <span>TỔNG CỘNG</span>
          <span>{totalAmount.toLocaleString("vi-VN")}đ</span>
        </div>

        <div style={{ textAlign: "center", marginTop: "8px" }}>
          Đã thanh toán
          <div style={{ marginTop: "4px" }}>Cảm ơn quý khách!</div>
        </div>
      </div>
    </div>
  );
};
