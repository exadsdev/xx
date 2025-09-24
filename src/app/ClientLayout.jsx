"use client";

import Providers from "./components/Providers";
import NavBar from "./components/NavBar";

export default function ClientLayout({ children }) {
  return (
    <Providers>
      <NavBar />
      <main>{children}</main>
    </Providers>
  );
}
