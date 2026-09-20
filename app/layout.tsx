import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: { default: "Fit30", template: "%s · Fit30" },
  description: "30-дневный трекер питания, тренировок и прогресса",
  applicationName: "Fit30",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Fit30" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d10",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
