"use client";
// src/components/shared/Receipt.tsx
import { OrderDto } from "@/services/order/order.types";

export type ReceiptVariant = "draft" | "final";

interface ReceiptProps {
  order: OrderDto;
  variant: ReceiptVariant;
  /** Physical pager/thẻ bàn number, if any. Falls back to order.pagerNumber. */
  pagerNumber?: number | null;
  shopName?: string;
  shopAddress?: string;
}

const SHOP_NAME = "Chalo Coffee";

export const Receipt = ({
  order,
  variant,
  pagerNumber,
  shopName = SHOP_NAME,
  shopAddress = "",
}: ReceiptProps) => {
  const isDraft = variant === "draft";
  const title = isDraft ? "PHIẾU TẠM TÍNH" : "HOÁ ĐƠN THANH TOÁN";
  const pager = pagerNumber ?? order.pagerNumber ?? null;
  const printedAt = new Date().toLocaleString("vi-VN");

  return (
    // .receipt-print-root keeps this out of the on-screen flow; #receipt-print
    // is the only node made visible by the @media print rules in globals.css.
    <div className="receipt-print-root" aria-hidden data-testid="receipt-root">
      <div id="receipt-print">
        {/* header */}
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>{shopName}</div>
          {shopAddress && <div>{shopAddress}</div>}
          <div style={{ marginTop: "4px", fontWeight: 700 }}>{title}</div>
        </div>

        {/* meta */}
        <div style={{ borderTop: "1px dashed #000", paddingTop: "4px" }}>
          <div>Bàn: {order.tableName}</div>
          <div>Đơn: #{order.id.slice(-6).toUpperCase()}</div>
          {pager != null && <div>Thẻ bàn: {pager}</div>}
          <div>Thời gian: {printedAt}</div>
        </div>

        {/* items */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "6px",
          }}
        >
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

        {/* total */}
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
          <span>{order.totalAmount.toLocaleString("vi-VN")}đ</span>
        </div>

        {/* footer */}
        <div style={{ textAlign: "center", marginTop: "8px" }}>
          {isDraft ? (
            <div>* Phiếu tạm tính — chưa phải hoá đơn thanh toán *</div>
          ) : (
            <div>
              {order.paidStatus ? "Đã thanh toán" : "Chưa thanh toán"}
              <div style={{ marginTop: "4px" }}>Cảm ơn quý khách!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
