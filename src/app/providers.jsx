// app/providers.jsx
"use client";

import { SessionProvider } from "next-auth/react";
import NavBar from "./components/Navbar";

export default function Providers({ children }) {
  // ไฟล์นี้เป็น Client Component เพื่อให้ใช้ Context/Providers ได้
  return (
    <SessionProvider>
      <NavBar />
      {children}
    </SessionProvider>
  );
}
