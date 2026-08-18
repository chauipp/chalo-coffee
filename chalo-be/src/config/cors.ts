type OriginCallback = (error: Error | null, allow?: boolean) => void;

export const parseAllowedOrigins = (csv: string): Set<string> =>
  new Set(
    csv
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean),
  );

/** Allows browser credentials only from configured origins. */
export const buildCorsOriginPolicy = (csv: string) => {
  const allowedOrigins = parseAllowedOrigins(csv);

  return (origin: string | undefined, callback: OriginCallback): void => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.has(origin.replace(/\/$/, ''))) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS origin không được phép'), false);
  };
};
