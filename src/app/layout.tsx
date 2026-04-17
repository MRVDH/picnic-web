import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Picnic Web",
  description:
    "Search products from the Picnic online supermarket on your desktop.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
