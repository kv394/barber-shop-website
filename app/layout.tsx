import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: '--font-sans', weight: ['300', '400', '500', '600', '700', '800'] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: '--font-serif', weight: ['400', '500', '600', '700'], style: ['normal', 'italic'] });

export const metadata: Metadata = {
  title: "Barber Shop SaaS",
  description: "The all-in-one platform for your barber shop.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} ${cormorant.variable} font-sans antialiased text-crm-text bg-crm-bg`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
