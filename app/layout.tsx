import type { Metadata } from "next";
import "./globals.css";
import { BRANDING } from "@/lib/branding";

export const metadata: Metadata = {
  title: `${BRANDING.name} — ${BRANDING.subtitle}`,
  description: BRANDING.description,
};

import { ToastProvider } from "@/components/ui/Toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        suppressHydrationWarning
        className="min-h-screen font-sans antialiased"
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
