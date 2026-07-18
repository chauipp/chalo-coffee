import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Xuất bản dạng standalone để đóng gói Docker gọn nhẹ (chỉ copy .next/standalone + static)
  output: "standalone",
  allowedDevOrigins: ["172.30.253.61"],
  /* config options here */
};

export default nextConfig;
