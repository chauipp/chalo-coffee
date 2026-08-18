const SENSITIVE_PARAM = /(?:token|secret|password|authorization|signature|api[-_]?key|key)$/i;

/** Removes credentials from a URL before it is written to application logs. */
export const redactRequestUrl = (url: string): string => {
  const parsed = new URL(url, 'http://chalo.internal');

  for (const key of [...parsed.searchParams.keys()]) {
    if (SENSITIVE_PARAM.test(key)) parsed.searchParams.set(key, '[REDACTED]');
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
};
