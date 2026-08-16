/**
 * Upload filenames are generated UUIDs and are never overwritten. Browsers can
 * therefore cache the exact image URL without revalidating it on each POS visit.
 */
export const UPLOAD_STATIC_ASSET_OPTIONS = {
  prefix: '/uploads',
  maxAge: 365 * 24 * 60 * 60 * 1000,
  immutable: true,
} as const;
