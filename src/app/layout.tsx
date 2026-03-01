import type { Metadata } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ModalProvider } from "@/components/ModalProvider";

const inter = Inter({ subsets: ["latin"] });
const noto = Noto_Sans_KR({ subsets: ["latin"], weight: ['400', '500', '700', '900'] });

export const metadata: Metadata = {
  title: "Duditer AI",
  description: "AI Content Studio for Couples",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} ${noto.className}`} suppressHydrationWarning>
        <ModalProvider>
          <Navigation />
          {children}
        </ModalProvider>
      </body>
    </html>
  );
}
