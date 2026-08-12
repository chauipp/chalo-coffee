const TABLE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,255}$/;

export const parseCustomerTableToken = (
  rawValue: string,
  currentOrigin: string,
): string => {
  const value = rawValue.trim();
  if (!value) throw new Error("Vui lòng nhập mã bàn hoặc liên kết QR.");

  if (!value.includes("://")) {
    if (!TABLE_TOKEN_PATTERN.test(value)) {
      throw new Error("Mã bàn không hợp lệ.");
    }
    return value;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Liên kết QR không hợp lệ.");
  }

  if (url.origin !== currentOrigin) {
    throw new Error("Liên kết QR không thuộc Chalo Coffee.");
  }

  const match = url.pathname.match(/^\/menu\/([^/]+)\/?$/);
  const token = match ? decodeURIComponent(match[1]) : "";
  if (!TABLE_TOKEN_PATTERN.test(token)) {
    throw new Error("Liên kết QR không hợp lệ.");
  }
  return token;
};
