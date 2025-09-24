"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";

/**
 * หน้ารอข้อความจากแอดมิน (ดึงจากคอลัมน์ detels)
 * เงื่อนไข: แสดงเฉพาะแถวที่ buyer_email ตรงกับอีเมลของผู้ที่ล็อกอิน
 *
 * แหล่งข้อมูล:
 *   GET https://accfbapi.accfb-ads.com/get  → คืนรายการ orders ทั้งหมด (เรียงใหม่สุดมาก่อน)
 *   เราจะ filter ฝั่ง client: buyer_email === session.user.email (lowercase)
 */

const BASE_URL = "https://accfbapi.accfb-ads.com";
const LINE_URL =
  process.env.NEXT_PUBLIC_LINE_URL ||
  "https://lin.ee/your-line-link"; // <- ใส่ลิงก์ LINE OA ที่ถูกต้อง

/** เรียก /get แล้วคืนเป็นอาเรย์ */
async function fetchAllOrders() {
  const res = await fetch(`${BASE_URL.replace(/\/+$/, "")}/get`, { cache: "no-store" });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${t ? `: ${t}` : ""}`);
  }
  return res.json(); // array of orders
}

/** ช่วยจัดข้อความ detels เป็นบล็อกให้อ่านง่าย (optional) */
function splitDetelsToBlocks(detels) {
  const raw = String(detels || "").trim();
  if (!raw) return [];
  // แยกด้วยบรรทัดว่าง >= 2 หรือเส้นคั่น (---)
  return raw
    .split(/\n\s*[-]{3,}.*\n|(?<=\S)\n{2,}/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

// แปลงวินาที -> mm:ss
function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function WaitingPage() {
  const router = useRouter();
  const { status, data: session } = useSession();

  const userEmail = (session?.user?.email || "").trim().toLowerCase();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [myOrders, setMyOrders] = useState([]); // orders ที่ email ตรงกับผู้ใช้
  const [lastUpdated, setLastUpdated] = useState("");

  // ===== Countdown 10 นาที (อัปเดตทุกวินาที) =====
  const [remaining, setRemaining] = useState(600); // 600s = 10 นาที
  const endAtRef = useRef(null); // ms timestamp
  useEffect(() => {
    // ใช้ sessionStorage ให้คงอยู่ระหว่างรีเฟรช/เปลี่ยนเส้นทางภายในแท็บเดียว
    const key = "waiting_countdown_endAt";
    let endAt = Number(sessionStorage.getItem(key) || 0);

    if (!endAt || endAt < Date.now()) {
      endAt = Date.now() + 10 * 60 * 1000; // เริ่มใหม่ 10 นาที
      sessionStorage.setItem(key, String(endAt));
    }
    endAtRef.current = endAt;

    const tick = () => {
      const left = (endAtRef.current - Date.now()) / 1000;
      setRemaining(left);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  // ==============================================

  // เลื่อนลงล่างเมื่อมีข้อความยาว
  const listRef = useRef(null);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [myOrders]);

  // Guard: ยังไม่ล็อกอิน → ส่งไป signin
  useEffect(() => {
    if (status === "unauthenticated") {
      const current = typeof window !== "undefined" ? window.location.href : "/waiting";
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(current)}`);
    }
  }, [status, router]);

  // โหลดคำสั่งซื้อทั้งหมด แล้ว filter ให้เหลือเฉพาะของอีเมลนี้
  const loadMine = async () => {
    if (!userEmail) return;
    setLoading(true);
    setErr("");
    try {
      const all = await fetchAllOrders();
      // API ฝั่งคุณ /get เรียง id DESC อยู่แล้ว → ใหม่สุดมาก่อน
      const mine = (Array.isArray(all) ? all : []).filter(
        (o) => String(o?.buyer_email || "").trim().toLowerCase() === userEmail
      );
      setMyOrders(mine);
      setLastUpdated(new Date().toLocaleString());
    } catch (e) {
      setErr(e.message || String(e));
      setMyOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // โหลดครั้งแรก + poll ทุก 10 วินาที
  useEffect(() => {
    if (status !== "authenticated") return;
    let timer;
    const run = async () => {
      await loadMine();
    };
    run();
    timer = setInterval(run, 10000);
    return () => {
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userEmail]);

  const isAuthLoading = status === "loading";
  const isAuthed = status === "authenticated";

  // สร้าง “รายการข้อความ” จาก detels ของทุกคำสั่งซื้อของผู้ใช้
  const messageItems = useMemo(() => {
    const items = [];
    for (const o of myOrders) {
      const blocks = splitDetelsToBlocks(o.detels);
      if (!blocks.length) continue;
      items.push({
        order_no: o.order_no,
        when: o.updated_at || o.created_at || null,
        blocks,
      });
    }
    return items;
  }, [myOrders]);

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h4 m-0">ข้อความจากแอดมิน</h1>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={loadMine}
            disabled={loading || !userEmail}
            title={!userEmail ? "ยังไม่ทราบอีเมลผู้ใช้ที่ล็อกอิน" : ""}
          >
            รีเฟรช
          </button>
          <Link href="/" className="btn btn-outline-secondary btn-sm">
            กลับหน้าแรก
          </Link>
        </div>
      </div>

      {isAuthLoading && <div className="alert alert-info">กำลังตรวจสอบสิทธิ์การเข้าถึง…</div>}
      {!isAuthLoading && !isAuthed && (
        <div className="alert alert-warning">กำลังนำคุณไปยังหน้าเข้าสู่ระบบ…</div>
      )}

      {isAuthed && (
        <div className="row g-4">
          {/* ซ้าย: ข้อมูลผู้ใช้/สถานะโหลด */}
          <div className="col-lg-5">
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h2 className="h6 mb-2">ข้อมูลผู้สั่งซื้อ</h2>
                <div className="text-muted small mb-2">
                  อีเมล: <span className="fw-semibold">{userEmail || "—"}</span>
                </div>
                <div className="small">
                  สถานะการดึงข้อมูล:{" "}
                  {loading ? (
                    <span className="text-warning">กำลังโหลด…</span>
                  ) : err ? (
                    <span className="text-danger">เกิดข้อผิดพลาด</span>
                  ) : (
                    <span className="text-success">อัปเดตล่าสุดแล้ว</span>
                  )}
                </div>
                {err ? <div className="alert alert-danger small mt-2 mb-0">{err}</div> : null}
                <div className="text-muted small mt-2">อัปเดตล่าสุด: {lastUpdated || "—"}</div>
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-body">
                <h2 className="h6 mb-2">รายการคำสั่งซื้อของคุณ</h2>
                {myOrders.length === 0 ? (
                  <div className="text-muted small">ยังไม่พบคำสั่งซื้อที่อีเมลนี้</div>
                ) : (
                  <ul className="small mb-0">
                    {myOrders.map((o) => (
                      <li key={o.id} className="mb-1">
                        <span className="fw-semibold">{o.order_no}</span>{" "}
                        <span className="text-muted">
                          ({o.status || "UNKNOWN"}
                          {o.updated_at ? ` • ${new Date(o.updated_at).toLocaleString()}` : ""})
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* ขวา: กล่องข้อความ + แถบแจ้ง (เขียว) + ตัวนับ (เหลือง) */}
          <div className="col-lg-7">
            <div className="card shadow-sm h-100">
              <div className="card-body d-flex flex-column" style={{ minHeight: 520 }}>
                {/* แถบสีเขียว: ข้อความ + ปุ่ม LINE ไอคอนเล็ก */}
                <div className="alert alert-success d-flex align-items-center justify-content-between mb-3">
                  <div className="me-3">
                    <div className="fw-semibold">🕒 กรุณารอ ปกติระบบทำรายการไม่เกิน 10 นาที</div>
                    <div>หากเกินเวลาดังกล่าวกรุณาติดต่อ Admin</div>
                  </div>
                  <a
                    href={LINE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-success btn-sm d-flex align-items-center"
                    title="ติดต่อ LINE"
                  >
                    {/* ไอคอน LINE แบบ SVG ขนาดเล็ก */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 36 36"
                      aria-hidden="true"
                    >
                      <path
                        d="M18 4C9.716 4 3 9.82 3 16.998c0 4.182 2.427 7.875 6.153 10.177-.208.778-1.34 5-1.386 5.345-.072.535.195.528.41.384.168-.111 3.721-2.509 5.221-3.524.465.066.94.102 1.429.102 8.284 0 15-5.82 15-12.998S26.284 4 18 4Z"
                        fill="currentColor"
                      />
                      <path
                        d="M10.5 15.25h2v6.5h-2zm4.5 0h2v6.5h-2zm4.5 0h2v6.5h-2zm4.5 0h2v6.5h-2z"
                        fill="#fff"
                      />
                    </svg>
                    <span className="ms-2">LINE</span>
                  </a>
                </div>

                {/* แถบสีเหลือง: นับถอยหลัง 10 นาที (อัปเดตทุกวินาที) */}
                <div className="alert alert-warning d-flex align-items-center justify-content-between">
                  <div className="fw-semibold">เวลาที่เหลือ</div>
                  <div className="fs-5 fw-bold">
                    {formatTime(remaining)}
                  </div>
                </div>

                {/* กล่องข้อความ detels */}
                <div
                  ref={listRef}
                  className="flex-grow-1 mb-3 border rounded p-3 bg-light"
                  style={{ overflowY: "auto" }}
                >
                  {messageItems.length === 0 ? (
                    <div className="text-muted small">
                      {loading
                        ? "กำลังโหลดข้อความ…"
                        : "ยังไม่มีข้อความจากแอดมินสำหรับอีเมลนี้"}
                    </div>
                  ) : (
                    messageItems.map((item) => (
                      <div key={item.order_no} className="mb-4">
                        <div className="d-flex align-items-center mb-2">
                          <div className="badge bg-secondary me-2">{item.order_no}</div>
                          {item.when ? (
                            <div className="small text-muted">
                              อัปเดตเมื่อ {new Date(item.when).toLocaleString()}
                            </div>
                          ) : null}
                        </div>

                        {item.blocks.map((text, idx) => (
                          <div key={idx} className="d-flex mb-2 justify-content-start">
                            <div className="p-2 rounded bg-white border" style={{ maxWidth: "85%" }}>
                              <div className="small fw-semibold mb-1">Admin</div>
                              <div style={{ whiteSpace: "pre-wrap" }}>{text}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>

                <div className="alert alert-info mb-0">
                  โหมดอ่านอย่างเดียว: ลูกค้าไม่สามารถส่งข้อความได้
                </div>
              </div>
            </div>

            <div className="text-end mt-3">
              <Link href="/" className="btn btn-outline-secondary btn-sm">
                กลับหน้าแรก
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
