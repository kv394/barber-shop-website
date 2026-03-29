import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: '--font-playfair-display' });

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
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} ${playfairDisplay.variable}`}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
