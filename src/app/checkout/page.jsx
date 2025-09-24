import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export const metadata = {
  title: "ชำระเงิน | Checkout",
  description: "ตรวจสอบคำสั่งซื้อและดำเนินการชำระเงิน",
};

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-5">
          <div className="text-center py-5">
            <div className="spinner-border" role="status" aria-hidden="true" />
            <p className="mt-3 mb-0">กำลังโหลดหน้าชำระเงิน...</p>
          </div>
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
