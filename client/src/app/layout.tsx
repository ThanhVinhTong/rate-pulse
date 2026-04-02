import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import { ThemeProvider } from "@/components/common/ThemeProvider";
import { Toast } from "@/components/common/Toast";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/ui/container";
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
    <html lang="en" className="dark" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${poppins.variable} bg-surface font-sans text-text-primary antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <div className="flex min-h-screen flex-col">
            <Navbar session={session} />
            <main className="flex flex-1 flex-col">
              <Container className="flex flex-1 flex-col" verticalPadding="md">
                {children}
              </Container>
            </main>
            <Footer />
          </div>
          <Toast />
        </ThemeProvider>
      </body>
    </html>
  );
}
