// src\app\layout.tsx
import QueryProvider from "@/providers/QueryProvider";
import "./globals.css";
import { MSWProvider } from "@/mocks/MSWProvider";
import { ThemeProvider, ThemeScript } from "@/providers/ThemeProvider";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
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
            <MSWProvider>{children}</MSWProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
