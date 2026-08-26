import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Tru Realty — Real Estate. Built Around You.",
    template: "%s · Tru Realty",
  },
  description:
    "Tru Realty is a modern New York brokerage and the operating system its agents run on — listings, transactions, commissions, recruiting and training in one platform.",
  metadataBase: new URL("https://trurealty.example.com"),
  openGraph: {
    title: "Tru Realty",
    description: "A modern brokerage helping agents and clients move with confidence.",
    images: [`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/brand/og.svg`],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
