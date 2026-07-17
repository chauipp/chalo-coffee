// src/lib/vietqr.ts
// Sinh chuỗi VietQR (EMVCo / Napas 247) để render thành QR chuyển khoản.
// Mọi app ngân hàng VN (MB, VCB, TCB...) quét được — encode BIN + số TK +
// số tiền + nội dung. Không cần dịch vụ ngoài.

const tlv = (id: string, value: string) =>
  id + String(value.length).padStart(2, "0") + value;

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — checksum bắt buộc của EMVCo. */
function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Nội dung CK an toàn cho mọi ngân hàng: bỏ dấu, A-Z 0-9 và khoảng trắng, tối đa 50 ký tự. */
export function sanitizeAddInfo(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);
}

export interface VietQRParams {
  /** Mã BIN ngân hàng nhận tiền, 6 số (MB = 970422) */
  bankBin: string;
  /** Số tài khoản nhận tiền */
  accountNo: string;
  /** Số tiền VND (số nguyên). Bỏ qua = QR không khoá số tiền. */
  amount?: number;
  /** Nội dung chuyển khoản (sẽ được sanitize) */
  addInfo?: string;
}

/** Trả về chuỗi payload EMV hoàn chỉnh (đưa thẳng vào <QRCodeSVG value={...} />). */
export function buildVietQR({
  bankBin,
  accountNo,
  amount,
  addInfo,
}: VietQRParams): string {
  const merchantInfo =
    tlv("00", "A000000727") + // GUID Napas
    tlv("01", tlv("00", bankBin) + tlv("01", accountNo)) +
    tlv("02", "QRIBFTTA"); // chuyển nhanh tới tài khoản

  let payload =
    tlv("00", "01") + // payload format
    tlv("01", amount ? "12" : "11") + // 12 = QR động (có số tiền), 11 = tĩnh
    tlv("38", merchantInfo) +
    tlv("53", "704"); // VND

  if (amount && amount > 0) payload += tlv("54", String(Math.round(amount)));
  payload += tlv("58", "VN");

  const info = addInfo ? sanitizeAddInfo(addInfo) : "";
  if (info) payload += tlv("62", tlv("08", info));

  payload += "6304"; // CRC đặt cuối, tính trên toàn bộ chuỗi kể cả "6304"
  return payload + crc16(payload);
}
