import type { Metadata, Viewport } from "next";

import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';


// const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: '--font-serif', weight: ['400', '500', '600', '700'], style: ['normal', 'italic'] }); // Font disabled for Vercel

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f59e0b',
};

export const metadata: Metadata = {
 title: "KutzApp — The All-in-One Barbershop Platform",
 description: "Run your shop with KutzApp. Bookings, payments, team management, and client engagement — all in one place.",
 icons: {
   apple: '/icons/apple-touch-icon.png',
 },
};

export default async function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased text-crm-text bg-modern-gradient">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
