import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "JASPER Client Portal",
  description: "Access your financial modelling projects, documents, and communications",
  icons: {
    icon: "/images/jasper-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Skip to main content link for keyboard/screen reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-jasper-emerald focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-jasper-emerald focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <ErrorBoundary>
          <AuthProvider>
            <main id="main-content">
              {children}
            </main>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
