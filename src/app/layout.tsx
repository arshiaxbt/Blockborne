import type { Metadata } from "next";
import { PrivyProviderWrapper } from "@/components/PrivyProviderWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "FastEVM Fighters",
  description: "Educational auto-fighting game comparing EVM chain tradeoffs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <PrivyProviderWrapper>{children}</PrivyProviderWrapper>
      </body>
    </html>
  );
}
