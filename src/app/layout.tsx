import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Golden Pearl Chinese Restaurant · Order Online",
  description:
    "Order Golden Pearl Chinese Restaurant online — browse menu, add to cart, and checkout.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full overflow-x-hidden`}>
      <body className="min-h-full overflow-x-hidden font-sans antialiased">
        <CartProvider>
          <div className="w-full min-w-0 max-w-full overflow-x-hidden">
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
