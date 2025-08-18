import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lucasamaral.tech"),
  title: "Lucas Amaral — .NET & AWS",
  description: "Backend .NET 8 em AWS: APIs rápidas, estáveis e baratas.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://lucasamaral.tech",
    title: "Lucas Amaral — .NET & AWS",
    description: "APIs .NET 8, Lambda, DynamoDB e CI/CD.",
    images: ["/og-image.png"], // 1200x630 em /public
  },
  twitter: { card: "summary_large_image" }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
