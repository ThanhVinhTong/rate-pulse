import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import { ThemeProvider } from "@/components/common/ThemeProvider";
import { Toast } from "@/components/common/Toast";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getUserFromCookie } from "@/lib/auth";

import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Rate-pulse Trading Platform",
    template: "%s | Rate-pulse",
  },
  description:
    "Professional fintech trading platform with exchange rates, analytics, profile controls, and admin monitoring.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getUserFromCookie();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${poppins.variable} bg-surface font-sans text-text-primary antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <div className="min-h-screen bg-hero-grid">
            <Navbar session={session} />
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
            <Footer />
          </div>
          <Toast />
        </ThemeProvider>
      </body>
    </html>
  );
}
