import { Suspense } from "react";
import SignInClient from "./SignInClient";

export const metadata = {
  title: "เข้าสู่ระบบ | Sign in",
  description: "ลงชื่อเข้าใช้ด้วยบัญชี Google เพื่อดำเนินการต่อ",
};

// ป้องกันการ prerender แบบ static สำหรับหน้าที่พึ่งพา session/query
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-vh-100 d-flex align-items-center justify-content-center">
          <div className="text-center">
            <div className="spinner-border mb-3" role="status" aria-hidden="true" />
            <p className="mb-0">กำลังโหลดหน้าเข้าสู่ระบบ...</p>
          </div>
        </div>
      }
    >
      <SignInClient />
    </Suspense>
  );
}
