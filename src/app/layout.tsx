import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell/AppShell";

export const metadata: Metadata = {
  title: "MINDROP — Personal Intelligence Layer",
  description: "Capture anything, understand everything, remember when useful.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
