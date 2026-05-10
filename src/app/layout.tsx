import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { CountryCodeProvider } from "@/contexts/country-context";
import { parseCountryCode } from "@/lib/types";

export const metadata: Metadata = {
  title: "Picnic Web",
  description: "Search products from the Picnic online supermarket on your desktop.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const country = parseCountryCode(cookieStore.get("picnic_country")?.value);

  return (
    <html lang={country.toLowerCase()} className="h-full antialiased">
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <CountryCodeProvider initialCountry={country}>{children}</CountryCodeProvider>
      </body>
    </html>
  );
}
