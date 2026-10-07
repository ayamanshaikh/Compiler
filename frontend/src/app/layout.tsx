import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/context/ThemeContext";
import { AuthProvider } from "@/lib/context/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeVista AI | Understand What Happens",
  description:
    "Java-first educational coding platform. Real-time compilation, beginner-friendly error intelligence, step-by-step execution tracing, and algorithm visualization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <AuthModal />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
