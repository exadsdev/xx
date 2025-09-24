// app/admin/page.jsx (Server Component)
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../lib/auth";
import AdminClient from "./AdminClient";

/**
 * ตรวจสิทธิ์แอดมินฝั่งเซิร์ฟเวอร์ (เช็คจาก session.user.email)
 * - ถ้าไม่ล็อกอิน → redirect ไป /auth/signin
 * - ถ้าไม่ใช่แอดมิน → redirect กลับหน้าแรก
 */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const email = String(session?.user?.email || "").toLowerCase();

  if (!email) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length > 0 && !adminEmails.includes(email)) {
    redirect("/?admin_forbidden=1");
  }

  return <AdminClient email={email} />;
}
