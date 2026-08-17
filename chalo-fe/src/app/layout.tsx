// src\app\layout.tsx
import QueryProvider from "@/providers/QueryProvider";
import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";
import "./globals.css";
import { MSWProvider } from "@/mocks/MSWProvider";
import { ThemeProvider, ThemeScript } from "@/providers/ThemeProvider";
import { Toaster } from "sonner";
import { Be_Vietnam_Pro } from "next/font/google";
import type { Metadata, Viewport } from "next";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Chalo Coffee",
    template: "%s | Chalo",
  },
  description: "Chalo Coffee — thực đơn cà phê, trà và những khoảng chậm dành cho bạn.",
  icons: {
    icon: "/brand/chalo-logo-round.png",
    apple: "/brand/chalo-pwa-192.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Chalo Coffee",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={beVietnam.variable}>
      <head>
        <ThemeScript />
      </head>
      <body className="m-0 min-h-screen flex flex-col bg-stone-50 font-sans antialiased dark:bg-stone-950">
        <ThemeProvider>
          <QueryProvider>
            <Toaster
              position="top-center" // Đẩy lên giữa màn hình phía trên để không bị che
              expand={true}
              richColors // Ép màu sắc nổi bật (xanh/đỏ/vàng)
              toastOptions={{
                style: { zIndex: 99999 }, // Đảm bảo luôn nằm trên cùng mọi Layer
              }}
            />
            <MSWProvider>
              <PwaInstallPrompt />
              {children}
            </MSWProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
