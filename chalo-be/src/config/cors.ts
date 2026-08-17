type OriginCallback = (error: Error | null, allow?: boolean) => void;

export const parseAllowedOrigins = (csv: string): Set<string> =>
  new Set(
    csv
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean),
  );

/**
 * Chỉ browser origins được khai báo mới được gửi credential. Request không có
 * Origin (health check, CLI, server-to-server) không phải CORS nên vẫn cho qua.
 */
export const buildCorsOriginPolicy = (csv: string) => {
  const allowedOrigins = parseAllowedOrigins(csv);

  return (origin: string | undefined, callback: OriginCallback): void => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalized = origin.replace(/\/$/, '');
    if (allowedOrigins.has(normalized)) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS origin không được phép'), false);
  };
};
