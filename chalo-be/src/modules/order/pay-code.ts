import { randomInt } from 'crypto';

/** Bảng chữ cái không nhầm lẫn khi khách gõ tay: bỏ 0/O, 1/I/L */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Sinh nội dung chuyển khoản duy nhất cho một phiên thanh toán, VD "CK7F3K2M" */
export function generatePayCode(): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `CK${s}`;
}

/**
 * Tìm payCode trong nội dung CK thực tế (ngân hàng thường chèn thêm mã GD,
 * tên người gửi...). So khớp trên chuỗi ĐÃ uppercase.
 */
export const PAY_CODE_REGEX = /CK[A-HJKMNP-Z2-9]{6}/;
