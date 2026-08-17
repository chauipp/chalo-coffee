import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chalo Coffee",
    short_name: "Chalo",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#d4a15a",
    icons: [
      {
        src: "/brand/chalo-pwa-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/chalo-pwa-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
