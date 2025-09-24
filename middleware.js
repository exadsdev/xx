// middleware.js (ที่รากโปรเจกต์)
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * ให้ middleware ทำแค่ "บังคับให้ล็อกอินก่อน" สำหรับ /checkout, /waiting, /admin
 * ส่วนตรวจว่าเป็นแอดมินหรือไม่ → ไปทำใน Server Component (/admin/page.jsx)
 *
 * ข้อดี: ไม่พึ่งพา ENV ใน Edge มากเกินไป, ลดจุดพัง
 */
export async function middleware(req) {
  const url = new URL(req.url);
  const protectedPaths = ["/checkout", "/waiting", "/admin"];
  const isProtected = protectedPaths.some((p) => url.pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const signin = new URL("/auth/signin", url.origin);
    signin.searchParams.set("callbackUrl", url.pathname + url.search);
    return NextResponse.redirect(signin);
  }

  // แค่ล็อกอินผ่านก็พอ ส่วน "เป็นแอดมินไหม" ไปเช็คฝั่ง server
  return NextResponse.next();
}

export const config = {
  matcher: ["/checkout/:path*", "/waiting/:path*", "/admin/:path*"],
};
