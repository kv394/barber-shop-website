import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const inter = Inter({ subsets: ["latin"], variable: '--font-sans', weight: ['300', '400', '500', '600', '700', '800'] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: '--font-serif', weight: ['400', '500', '600', '700'], style: ['normal', 'italic'] });

export const metadata: Metadata = {
 title: "KutzApp — The All-in-One Barbershop Platform",
 description: "Run your shop with KutzApp. Bookings, payments, team management, and client engagement — all in one place.",
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
        <meta name="theme-color" content="#f59e0b" />
      </head>
      <body className={`${inter.variable} ${cormorant.variable} antialiased text-crm-text bg-modern-gradient`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
