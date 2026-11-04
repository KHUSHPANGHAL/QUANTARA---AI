import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quantara Terminal — Systematic Equity Prediction",
  description: "Institutional trend forecasting, cross-model consensus, and risk attribution for Indian blue chips.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="bg-background text-text-primary min-h-screen flex flex-col font-sans selection:bg-accent/20 selection:text-accent"
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
