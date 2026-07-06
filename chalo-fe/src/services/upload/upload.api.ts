// src/services/upload/upload.api.ts

import { request } from "@/lib/api-client";

export const uploadImage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  return request.upload<{ url: string }>("/upload/image", formData);
};
