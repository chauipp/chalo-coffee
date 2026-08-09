"use client";

import {
  clearProductDraft,
  readProductDraft,
  saveProductDraft,
} from "../utils/admin-persistence.ts";
import { useCallback, useEffect, useRef, useState } from "react";

const DRAFT_WRITE_DELAY_MS = 300;

export function mergeProductDraft<T extends object>(
  defaults: T,
  draft: Partial<T> | null,
): T {
  return draft ? { ...defaults, ...draft } : defaults;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function useProductDraft<T extends object>(
  userId: string | null,
  productId: string | null,
  defaults: T,
) {
  const [defaultValues] = useState(() => {
    const storage = getStorage();
    const draft =
      storage && userId && productId
        ? readProductDraft<Partial<T>>(storage, userId, productId)
        : null;
    return mergeProductDraft(defaults, draft);
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDraft = useCallback(
    (values: T) => {
      if (!userId || !productId) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        const storage = getStorage();
        if (storage) saveProductDraft(storage, userId, productId, values);
      }, DRAFT_WRITE_DELAY_MS);
    },
    [productId, userId],
  );

  const clearDraft = useCallback(() => {
    if (!userId || !productId) return;
    const storage = getStorage();
    if (storage) clearProductDraft(storage, userId, productId);
  }, [productId, userId]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return { defaultValues, saveDraft, clearDraft };
}
