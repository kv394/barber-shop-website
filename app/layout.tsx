import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"], variable: '--', weight: ['300', '400', '500', '600', '700', '800'] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: '--font-serif', weight: ['400', '500', '600', '700'], style: ['normal', 'italic'] });

export const metadata: Metadata = {
 title: "KutzApp — The All-in-One Barbershop Platform",
 description: "Run your shop with KutzApp. Bookings, payments, team management, and client engagement — all in one place.",
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en">
 <body className={`${inter.variable} ${cormorant.variable} antialiased text-crm-text bg-modern-gradient`}>
 {children}
 <Analytics />
 </body>
 </html>
 );
}
