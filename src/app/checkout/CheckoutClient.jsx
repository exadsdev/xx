"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "react-qr-code";
import PRODUCTS from "../data/products";
import { OrdersAPI } from "../lib/externalApi";
import { saveOrder, loadOrder, clearOrder } from "../lib/orderStorage";
import "./checkout.css";

/** ===== PromptPay helpers (EMVCo) ===== */
function crc16CCITT(hexString) {
  let crc = 0xffff;
  const polynomial = 0x1021;
  const bytes = [];
  for (let i = 0; i < hexString.length; i++) bytes.push(hexString.charCodeAt(i));
  for (let b of bytes) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ polynomial : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
function tlv(id, value) {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}
function normalizeThaiMobile(msisdn) {
  const digits = (msisdn || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("66")) return `00${digits}`;
  if (digits.startsWith("0") && digits.length >= 10) return `0066${digits.slice(1)}`;
  if (!digits.startsWith("00")) return `00${digits}`;
  return digits;
}
function buildPromptPayPayload({
  mobile,
  nationalId,
  ewalletId,
  amount,
  merchantName = "Merchant",
  city = "Bangkok",
  dynamic = false,
}) {
  const id00 = tlv("00", "01");
  const id01 = tlv("01", dynamic ? "12" : "11");
  const aid = tlv("00", "A000000677010111");
  let accField = "";
  if (mobile) accField = tlv("01", normalizeThaiMobile(mobile));
  else if (nationalId) accField = tlv("02", (nationalId || "").replace(/\D/g, ""));
  else if (ewalletId) accField = tlv("03", (ewalletId || "").replace(/\D/g, ""));
  else throw new Error("PromptPay target is missing.");
  const id29 = tlv("29", `${aid}${accField}`);
  const id52 = tlv("52", "0000");
  const id53 = tlv("53", "764");
  const id54 = typeof amount === "number" && amount > 0 ? tlv("54", amount.toFixed(2)) : "";
  const id58 = tlv("58", "TH");
  const id59 = tlv("59", (merchantName || "Merchant").slice(0, 25));
  const id60 = tlv("60", (city || "Bangkok").slice(0, 15));
  const noCrc = `${id00}${id01}${id29}${id52}${id53}${id54}${id58}${id59}${id60}63${"04"}`;
  const crc = crc16CCITT(noCrc);
  return `${noCrc}${crc}`;
}

/** ===== Configs ===== */
const PROMPTPAY_TARGET = {
  mobile: "1969800077553",
  merchantName: "Penapa Chongngam",
  city: "Bangkok",
};

export default function CheckoutClient() {
  /** ========= AUTH GUARD ========= */
  const { status, data: session } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "unauthenticated") {
      const q = new URLSearchParams({ from: "/checkout" }).toString();
      router.replace(`/auth/signin?${q}`);
    }
  }, [status, router]);

  /** ========= Hooks ========= */
  const params = useSearchParams();
  const sku = params.get("sku") || "";
  const product = useMemo(() => PRODUCTS.find((p) => p.slug === sku) || null, [sku]);

  const [qty, setQty] = useState(1);
  const [stage, setStage] = useState("form"); // form | receipt
  const [order, setOrder] = useState(null);

  const [slipPreview, setSlipPreview] = useState(null);
  const [slipFile, setSlipFile] = useState(null);

  const [slipUploaded, setSlipUploaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = loadOrder();
    if (saved?.order_no) {
      setOrder(saved);
      setStage("receipt");
      setSlipUploaded(!!saved.slip_url);
    }
  }, []);

  const total = useMemo(() => {
    if (!product) return 0;
    const q = Number.isFinite(+qty) && +qty > 0 ? +qty : 1;
    return product.price * q;
  }, [product, qty]);

  const payableAmount = useMemo(() => {
    if (stage === "receipt" && order) return Number(order.total_price || 0);
    return total;
  }, [stage, order, total]);

  const ppPayload = useMemo(() => {
    try {
      return buildPromptPayPayload({
        mobile: PROMPTPAY_TARGET.mobile,
        amount: payableAmount,
        merchantName: PROMPTPAY_TARGET.merchantName,
        city: PROMPTPAY_TARGET.city,
        dynamic: true,
      });
    } catch {
      return "";
    }
  }, [payableAmount]);

  /** ========= Handlers ========= */
  const handlePlaceOrder = async () => {
    if (!product || loading) return;
    setLoading(true);
    try {
      const orderNo = `ORD-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;
      const payload = {
        order_no: orderNo,
        product_slug: product.slug,
        product_name: product.name,
        unit_price: product.price,
        qty: Math.max(1, parseInt(qty || "1", 10)),
        total_price: product.price * Math.max(1, parseInt(qty || "1", 10)),
        status: "PENDING_PAYMENT",
        slip_url: null,
        customname: null,
        buyer_email: (session?.user?.email || "").toLowerCase(),
        created_at: new Date(),
        updated_at: new Date(),
      };
      saveOrder(payload);
      setOrder(payload);
      setStage("receipt");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      alert(`เกิดข้อผิดพลาด: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSlipAndSave = async () => {
    if (!order) return alert("ไม่มีข้อมูลคำสั่งซื้อ");
    if (!slipFile) return alert("กรุณาเลือกไฟล์สลิป");

    setLoading(true);
    try {
      const uploadRes = await OrdersAPI.uploadSlip(slipFile);
      const slipUrl = uploadRes.url;

      const payload = {
        ...order,
        slip_url: slipUrl,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const createRes = await OrdersAPI.create(payload);
      const savedOrder = { ...payload, id: createRes.insertId };
      setOrder(savedOrder);
      saveOrder(savedOrder);

      setSlipUploaded(true);
      alert("อัปโหลดสลิปเรียบร้อยแล้ว กรุณากดยืนยันการชำระเงิน");
    } catch (e) {
      alert(`บันทึกคำสั่งซื้อไม่สำเร็จ: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const ensureOrderId = async () => {
    if (order?.id && Number.isFinite(+order.id)) return Number(order.id);
    try {
      const res = await OrdersAPI.byOrderNo(order.order_no);
      const dbOrder = res?.order;
      if (dbOrder?.id) {
        const merged = { ...order, id: dbOrder.id };
        setOrder(merged);
        saveOrder(merged);
        return Number(dbOrder.id);
      }
    } catch {}
    return NaN;
  };

  const handleConfirm = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const id = await ensureOrderId();
      if (!Number.isFinite(id)) {
        alert("ไม่พบรายการในระบบ โปรดอัปโหลดสลิปเพื่อบันทึกคำสั่งซื้อก่อน");
        return;
      }
      await OrdersAPI.setStatus(id, "CONFIRMED");
      clearOrder();
      router.push("/waiting");
    } catch (e) {
      alert(`ยืนยันไม่สำเร็จ: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const id = await ensureOrderId();
      if (!Number.isFinite(id)) {
        clearOrder();
        setOrder(null);
        setStage("form");
        alert("ยกเลิกคำสั่งซื้อแล้ว (ยังไม่บันทึกลงระบบ)");
        return;
      }
      await OrdersAPI.setStatus(id, "CANCELLED");
      clearOrder();
      setOrder(null);
      setStage("form");
      alert("ยกเลิกคำสั่งซื้อแล้ว");
    } catch (e) {
      alert(`ยกเลิกไม่สำเร็จ: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSlipChange = (e) => {
    const file = e.target.files?.[0];
    setSlipFile(file || null);
    setSlipPreview(file ? URL.createObjectURL(file) : null);
  };

  const qrRef = useRef(null);
  const handleDownloadQR = () => {
    try {
      const svg = qrRef.current?.querySelector("svg");
      if (!svg) return alert("ไม่พบภาพ QR");
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const serializer = new XMLSerializer();
      const source = serializer.serializeToString(svg);
      const img = new Image();
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(source)));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const jpgData = canvas.toDataURL("image/jpeg", 1.0);
        const a = document.createElement("a");
        a.href = jpgData;
        a.download = `${order?.order_no || "promptpay-qr"}.jpg`;
        a.click();
      };
    } catch {
      alert("ดาวน์โหลด QR ไม่สำเร็จ");
    }
  };

  if (status !== "authenticated") {
    return (
      <div className="container py-5">
        <div className="alert alert-info">กำลังตรวจสอบสิทธิ์การเข้าถึง…</div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h4 m-0">
          {stage === "form" ? "ยืนยันรายการสินค้า" : "ใบเสร็จ/ใบสรุปคำสั่งซื้อ"}
        </h1>
        <Link href="/" className="btn btn-outline-secondary btn-sm">
          กลับหน้าแรก
        </Link>
      </div>

      {!product ? (
        <div className="alert alert-warning">
          ไม่พบสินค้า กรุณาเลือกสินค้าใหม่ที่{" "}
          <Link href="/products" className="alert-link">
            หน้าแพ็กเกจ
          </Link>
        </div>
      ) : stage === "form" ? (
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card shadow-sm">
              <div className="card-body">
                <h2 className="h5 mb-1">{product.name}</h2>
                <p className="text-muted small mb-2">{product.summary}</p>
                <div className="fw-bold h5 mb-3">
                  {product.price.toLocaleString()} บาท / ชิ้น
                </div>

                <div className="row g-3 align-items-end">
                  <div className="col-7 col-sm-6">
                    <label className="form-label">จำนวนที่ต้องการ</label>
                    <div className="input-group qty-group">
                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => setQty((q) => Math.max(1, +q - 1))}
                        aria-label="ลดจำนวน"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="form-control text-center"
                        min={1}
                        step={1}
                        value={qty}
                        onChange={(e) =>
                          setQty(Math.max(1, parseInt(e.target.value || "1", 10)))
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => setQty((q) => Math.max(1, +q + 1))}
                        aria-label="เพิ่มจำนวน"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="col-5 col-sm-6">
                    <div className="text-muted small mb-1">ยอดรวมชั่วคราว</div>
                    <div className="h5 m-0">{total.toLocaleString()} บาท</div>
                  </div>
                </div>

                <hr className="my-4" />
                <div className="d-grid">
                  <button
                    type="button"
                    className="btn-buy-strong w-100"
                    onClick={handlePlaceOrder}
                    disabled={loading}
                  >
                    {loading ? "กำลังออกใบเสร็จ..." : "ยืนยันสั่งซื้อและออกใบเสร็จ"}
                    <span className="sub">ไปยังหน้าชำระเงิน</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card shadow-sm">
              <div className="card-body">
                <h3 className="h6">สรุปการชำระเงิน</h3>
                <div className="d-flex justify-content-between">
                  <span>ราคา/ชิ้น</span>
                  <span>{product.price.toLocaleString()} บาท</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>จำนวน</span>
                  <span>{qty} ชิ้น</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>ค่าธรรมเนียม</span>
                  <span>0 บาท</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between fw-bold">
                  <span>ยอดสุทธิ</span>
                  <span>{total.toLocaleString()} บาท</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h2 className="h5 mb-1">ใบเสร็จ/ใบสรุปคำสั่งซื้อ</h2>
                    <div className="text-muted small">
                      วันที่ออกใบเสร็จ:{" "}
                      {new Date(order.created_at || new Date()).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold">เลขที่คำสั่งซื้อ</div>
                    <div>{order.order_no}</div>
                  </div>
                </div>

                <hr />

                <div className="table-responsive">
                  <table className="table table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "60%" }}>สินค้า</th>
                        <th className="text-center">จำนวน (บัญชี)</th>
                        <th className="text-end">ราคา/ชิ้น (บาท)</th>
                        <th className="text-end">รวม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{order.product_name}</td>
                        <td className="text-center">{order.qty}</td>
                        <td className="text-end">
                          {Number(order.unit_price).toLocaleString()}
                        </td>
                        <td className="text-end">
                          {Number(order.total_price).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan={3} className="text-end">
                          ยอดรวมทั้งหมด
                        </th>
                        <th className="text-end">
                          {Number(order.total_price).toLocaleString()} บาท
                        </th>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {!slipUploaded && (
                  <div className="row g-4 mt-1">
                    <div className="col-md-6">
                      <div className="border rounded p-3 h-100">
                        <h3 className="h6 mb-3">รายละเอียดบัญชีสำหรับโอนเงิน</h3>
                        <div className="text-center">
                          <img src="/k.png" width="200" alt="ธนาคารกสิกรไทย" />
                        </div>
                        <ul className="list-unstyled bank-list mb-0 mt-2">
                          <li className="bank-item text-center">
                            <div>ธนาคารกสิกรไทย</div>
                            <div>ชื่อบัญชี:K. Penapa Chongngam</div>
                            <div>
                              เลขที่บัญชี <br />
                             099 14274 22
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="border rounded p-3 h-100 d-flex flex-column align-items-center justify-content-center">
                        <div className="small text-muted mb-2">สแกนชำระผ่าน PromptPay</div>
                        <div ref={qrRef} className="mb-2">
                          {ppPayload ? (
                            <QRCode value={ppPayload} size={220} />
                          ) : (
                            <div className="alert alert-warning py-2 px-3 m-0">
                              ไม่สามารถสร้าง QR ได้
                            </div>
                          )}
                        </div>
                        <div className="small text-muted">
                          ชื่อบัญชี: {PROMPTPAY_TARGET.merchantName}
                        </div>

                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm mt-3"
                          onClick={handleDownloadQR}
                          disabled={!ppPayload}
                        >
                          ดาวน์โหลด QR พร้อมเพย์ (JPG)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="row g-3 align-items-center mt-4">
                  {!slipUploaded && (
                    <>
                      <div className="col-md-7">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="form-control"
                          onChange={handleSlipChange}
                        />
                        <div className="form-text">
                          รองรับไฟล์รูปภาพหรือ PDF ขนาดไม่เกิน 10MB
                        </div>

                        {slipPreview ? (
                          <div className="mt-3">
                            <div className="small text-muted mb-2">
                              ตัวอย่างไฟล์สลิปที่เลือก:
                            </div>
                            <img
                              src={slipPreview}
                              alt="สลิปที่อัปโหลด"
                              className="slip-preview"
                              style={{ maxWidth: "200px", height: "auto" }}
                            />
                          </div>
                        ) : null}
                      </div>

                      <div className="col-md-5 d-grid gap-2">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleSubmitSlipAndSave}
                          disabled={!slipFile || loading}
                          title={!slipFile ? "กรุณาเลือกไฟล์สลิปก่อน" : ""}
                        >
                          {loading ? "กำลังอัปโหลด..." : "อัปโหลดสลิปและบันทึกคำสั่งซื้อ"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={handleCancel}
                          disabled={loading}
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </>
                  )}

                  {slipUploaded && (
                    <div className="col-12 d-grid">
                      <button
                        type="button"
                        className="btn btn-success btn-lg"
                        onClick={handleConfirm}
                        disabled={loading}
                      >
                        {loading ? "กำลังยืนยัน..." : "ยืนยันการชำระเงิน"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
