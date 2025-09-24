import "bootstrap/dist/css/bootstrap.min.css";
import Script from "next/script";
import "./globals.css";
import Footer from "./components/Footer";
import { SITE, BRAND, DEFAULT_OG } from "./seo.config";
import Providers from "./providers";
 import Head from "next/head";


export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: `${BRAND} | จำหน่ายบัญชีโฆษณา Facebook สำหรับธุรกิจ`,
    template: `%s | ${BRAND}`,
  },
  description: `${BRAND} จำหน่ายบัญชีโฆษณา Facebook พร้อมใช้งาน ตั้งค่าอย่างถูกต้อง โปร่งใส สอดคล้องนโยบาย พร้อมคู่มือและคำแนะนำ`,
  keywords: [
    "บัญชีโฆษณา Facebook",
    "ซื้อบัญชีโฆษณา",
    "Business Manager",
    "ยิงแอดเฟซบุ๊ก",
    "ลงโฆษณาออนไลน์",
    "บัญชีโฆษณาพร้อมใช้งาน",
    "บัญชีโฆษณา" , "โฆษณาเฟสบุ๊ค ","บัญชีโฆษณาเฟสบุ๊ค","บัญชีเฟสเขียว","บัญชีเฟสเขียวยืนยันตัวตน","บัญชีเฟสเขียว 3 บรรทัด","บัญชีเฟสเขียว 2 บรรทัด","บัญชีโฆษณายืนยันตัวตนแล้ว","บัญชีโฆษณาเฟสบุ๊ค",

  ],
  openGraph: {
    type: "website",
    url: SITE,
    siteName: BRAND,
    title: `${BRAND} | จำหน่ายบัญชีโฆษณา Facebook สำหรับธุรกิจ`,
    description: `${BRAND} จำหน่ายบัญชีโฆษณา Facebook พร้อมใช้งาน โปร่งใส สอดคล้องนโยบาย`,
    images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: `${BRAND} OG` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND} | จำหน่ายบัญชีโฆษณา Facebook สำหรับธุรกิจ`,
    description: `${BRAND} จำหน่ายบัญชีโฆษณา Facebook พร้อมใช้งาน โปร่งใส สอดคล้องนโยบาย`,
    images: [DEFAULT_OG],
  },
  alternates: { canonical: SITE },
  robots: { index: true, follow: true },
};

export function generateViewport() {
  return {
    viewport: {
      width: "device-width",
      initialScale: 1,
    },
    themeColor: "#ffffff",
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
 

 <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID}`}
        />

  <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID}');
          `}
        </Script>

     <head />

      <body>





        <Providers>{children}</Providers>









        <Footer />














        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />










      </body>
    </html>
  );
}






