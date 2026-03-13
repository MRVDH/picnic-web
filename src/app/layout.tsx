import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Picnic Online Supermarkt",
  description: "Picnic – De online supermarkt",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
