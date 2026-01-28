import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LMU Lap Analyzer",
  description: "AI-powered lap analysis for Le Mans Ultimate",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container flex h-14 items-center justify-between px-4">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                <span className="text-primary">LMU</span> Analyzer
              </Link>
              <nav className="flex items-center gap-4">
                <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
                  Home
                </Link>
                <Link href="/upload" className="text-sm font-medium transition-colors hover:text-primary">
                  Upload
                </Link>
                <Link href="/analysis" className="text-sm font-medium transition-colors hover:text-primary">
                  Analysis
                </Link>
                <Button size="sm" variant="outline">Sign In</Button>
              </nav>
            </div>
          </header>
          <main className="flex-1 container py-6 px-4">
            {children}
          </main>
          <footer className="border-t py-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} LMU Lap Analyzer. Built for sim racers.
          </footer>
        </div>
      </body>
    </html>
  );
}
