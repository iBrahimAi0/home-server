<<<<<<< HEAD
import type { Metadata } from "next";
import "./globals.css";
import { BRANDING } from "@/lib/branding";
=======
import type { Metadata } from 'next';
import './globals.css';
import { BRANDING } from '@/lib/branding';
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067

export const metadata: Metadata = {
  title: `${BRANDING.name} — ${BRANDING.subtitle}`,
  description: BRANDING.description,
  icons: {
<<<<<<< HEAD
    icon: "/favicon.ico",
  },
};

import { ToastProvider } from "@/components/ui/Toast";

=======
    icon: '/favicon.ico',
  },
};

>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        suppressHydrationWarning
        className="bg-[#0B0D13] text-slate-100 min-h-screen font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200"
      >
<<<<<<< HEAD
        <ToastProvider>{children}</ToastProvider>
=======
        {children}
>>>>>>> 5408b5e3bac214450a17bade44f05c25a074c067
      </body>
    </html>
  );
}
