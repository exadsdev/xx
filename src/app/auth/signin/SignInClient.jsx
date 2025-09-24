"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.replace("/");
    }
  }, [status, session, router]);

  const onGoogleSignIn = async () => {
    try {
      setSubmitting(true);
      await signIn("google", { callbackUrl: "/" });
    } finally {
      setSubmitting(false);
    }
  };

  const error = params.get("error");

  if (status === "loading") {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient">
        <div className="text-center text-white">
          <div className="spinner-border spinner-border-lg mb-3" role="status" />
          <div className="fw-semibold">กำลังตรวจสอบสถานะ...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient px-3">
      <div className="auth-card card shadow-lg border-0">
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <img
              src="/images/logo-512.png"
              alt="Logo"
              width={64}
              height={64}
              className="mb-2 rounded-3 shadow-sm"
            />
            <h1 className="h4 m-0 fw-semibold">เข้าสู่ระบบ</h1>
            <p className="text-muted mt-1 mb-0">ลงชื่อเข้าใช้ด้วยบัญชี Google ของคุณ</p>
          </div>

          {error ? (
            <div className="alert alert-danger py-2" role="alert">
              ไม่สามารถเข้าสู่ระบบได้ ({error}). โปรดลองอีกครั้ง
            </div>
          ) : null}

          <button
            onClick={onGoogleSignIn}
            disabled={submitting}
            className="btn btn-google w-100 btn-lg d-flex align-items-center justify-content-center gap-2"
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <>
                <img src="/images/g.svg" width="40" height="40" alt="Google" />
                <span className="fw-semibold">Sign in with Google</span>
              </>
            )}
          </button>

          <div className="divider my-4 d-flex align-items-center">
            <span className="flex-grow-1 line" />
            <span className="mx-2 text-muted small">หรือ</span>
            <span className="flex-grow-1 line" />
          </div>

          <ul className="list-unstyled small text-muted mb-0">
            <li>เราจะไม่โพสต์หรือเข้าถึงข้อมูลส่วนตัวโดยไม่ได้รับอนุญาต</li>
            <li>
              การเข้าสู่ระบบถือว่ายอมรับ{" "}
              <a href="#" className="link-light fw-semibold">
                ข้อตกลงการใช้งาน
              </a>{" "}
              และ{" "}
              <a href="#" className="link-light fw-semibold">
                นโยบายความเป็นส่วนตัว
              </a>
            </li>
          </ul>
        </div>

        <div className="card-footer text-center small text-muted bg-transparent py-3">
          มีปัญหาในการเข้าสู่ระบบ?{" "}
          <a href="#" className="link-light fw-semibold">
            ติดต่อทีมงาน
          </a>
        </div>
      </div>
    </div>
  );
}
