import type { Metadata } from "next";
import "./globals.css";
import AppShell from "./components/AppShell";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Second Brain AI",
  description: "Chat with your PDFs using AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>

      <body className="overflow-x-hidden">
        <AppShell>{children}</AppShell>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
