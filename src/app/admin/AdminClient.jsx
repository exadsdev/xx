/* app/admin/AdminClient.jsx */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";

/**
 * Admin Page
 * - Poll orders
 * - Send LINE Messaging API push when new orders arrive
 *
 * ENV:
 *   NEXT_PUBLIC_ORDERS_API=https://accfbapi.accfb-ads.com
 *   NEXT_PUBLIC_MESSAGES_API=https://accfbapi.accfb-ads.com
 *   LINE_CHANNEL_ID / LINE_CHANNEL_SECRET / LINE_CHANNEL_ACCESS_TOKEN
 *   LINE_ADMIN_USER_ID (optional)
 */

const ORDERS_API = (process.env.NEXT_PUBLIC_ORDERS_API || "https://accfbapi.accfb-ads.com").replace(/\/+$/, "");
const MESSAGES_API = (process.env.NEXT_PUBLIC_MESSAGES_API || ORDERS_API).replace(/\/+$/, "");
const POLL_MS = 10000;

/** ----------------- Helpers ----------------- */
async function toJsonOrThrow(res) {
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${t ? `: ${t}` : ""}`);
  }
  return res.json();
}

async function fetchOrdersRaw() {
  const res = await fetch(`${ORDERS_API}/get`, { cache: "no-store" });
  return toJsonOrThrow(res);
}

function filterVisibleOrders(list) {
  return (Array.isArray(list) ? list : []).filter(
    (o) => !["DELETED", "CANCELLED"].includes(String(o?.status || "").toUpperCase())
  );
}

async function saveDetels(orderId, text) {
  const res = await fetch(`${MESSAGES_API}/messages/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ detels: text }),
  });
  return toJsonOrThrow(res);
}

async function softDeleteOrder(id) {
  try {
    const r1 = await fetch(`${ORDERS_API}/orders/${id}`, { method: "DELETE" });
    if (r1.ok) return true;
  } catch {}
  try {
    const r2 = await fetch(`${ORDERS_API}/delete/${id}`, { method: "DELETE" });
    if (r2.ok) return true;
  } catch {}
  try {
    const r3 = await fetch(`${ORDERS_API}/delete?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (r3.ok) return true;
  } catch {}

  try {
    const r4 = await fetch(`${ORDERS_API}/status/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DELETED" }),
    });
    if (r4.ok) return true;
  } catch {}
  try {
    const r5 = await fetch(`${ORDERS_API}/status/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (r5.ok) return true;
  } catch {}

  throw new Error("ไม่พบ endpoint สำหรับลบ และไม่สามารถเปลี่ยนสถานะได้");
}

/** ----------------- LINE Messaging API ----------------- */
async function pushLine({ text, imageUrl, to, broadcast = false }) {
  const res = await fetch("/api/line/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, imageUrl, to, broadcast }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.warn("LINE push failed:", res.status, txt);
    return false;
  }
  return true;
}

function buildLineMessage(order) {
  const status = String(order?.status || "-").toUpperCase();
  const lines = [
    "🛎️ มีคำสั่งซื้อใหม่เข้ามา",
    `📦 สินค้า: ${order?.product_name || "-"}`,
    `🔢 จำนวน: ${order?.qty ?? "-"}`,
    `💰 รวม: ${Number(order?.total_price || 0).toLocaleString()} บาท`,
    `👤 ผู้สั่งซื้อ: ${order?.buyer_email || "-"}`,
    `🕒 เวลา: ${order?.created_at ? new Date(order.created_at).toLocaleString() : "-"}`,
    `🏷️ สถานะ: ${status}`,
    order?.order_no ? `#ออเดอร์: ${order.order_no}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

function diffNewOrders(prevList, nextList) {
  const prevIds = new Set(prevList.map((o) => o.id));
  const newly = [];
  for (const o of nextList) {
    if (!prevIds.has(o.id)) newly.push(o);
  }
  return newly;
}

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [errorOrders, setErrorOrders] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [targetOrder, setTargetOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const notifiedIdsRef = useRef(new Set());
  const lastOrdersRef = useRef([]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    setErrorOrders("");
    try {
      const data = await fetchOrdersRaw();
      const visible = filterVisibleOrders(data);
      setOrders(visible);
      lastOrdersRef.current = visible;
      for (const o of visible) notifiedIdsRef.current.add(o.id);
    } catch (e) {
      setErrorOrders(e.message || String(e));
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const data = await fetchOrdersRaw();
        const visible = filterVisibleOrders(data);
        const newly = diffNewOrders(lastOrdersRef.current, visible);

        setOrders(visible);
        lastOrdersRef.current = visible;

        for (const o of newly) {
          if (notifiedIdsRef.current.has(o.id)) continue;
          const msg = buildLineMessage(o);
          const img = o?.slip_url || undefined;
          await pushLine({ text: msg, imageUrl: img });
          notifiedIdsRef.current.add(o.id);
        }
      } catch (e) {
        console.warn("Polling error:", e?.message || e);
      }
    }, POLL_MS);

    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    const qlc = q.trim().toLowerCase();
    return orders.filter((o) => {
      const matchText =
        !qlc ||
        String(o.product_name || "").toLowerCase().includes(qlc) ||
        String(o.product_slug || "").toLowerCase().includes(qlc) ||
        String(o.buyer_email || "").toLowerCase().includes(qlc);

      const matchStatus =
        statusFilter === "ALL" ? true : String(o.status || "").toUpperCase() === statusFilter;

      return matchText && matchStatus;
    });
  }, [orders, q, statusFilter]);

  const openSend = (o) => {
    setTargetOrder(o);
    const preset = `[ORDER ${o.order_no || "-"}] ${o.product_name || "-"} • ${Number(
      o.total_price || 0
    ).toLocaleString()} บาท\nผู้รับ: ${o.buyer_email || "-"}\n\nข้อความจากแอดมิน:\n`;
    setMessage(preset);
    setShowModal(true);
  };

  const handleSaveMessage = async () => {
    const text = (message || "").trim();
    if (!text) return alert("กรุณากรอกข้อความ");
    if (!targetOrder?.id) return alert("ไม่พบรหัสคำสั่งซื้อ");
    setSaving(true);
    try {
      await saveDetels(targetOrder.id, text);
      setShowModal(false);
      setMessage("");
      alert("บันทึกข้อความเรียบร้อยแล้ว");
    } catch (e) {
      alert(`บันทึกข้อความไม่สำเร็จ: ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (o) => {
    if (!o?.id) return alert("ไม่พบรหัสรายการ");
    const ok = confirm(`ยืนยันลบรายการสินค้า "${o.product_name || "-"}" ?`);
    if (!ok) return;
    try {
      await softDeleteOrder(o.id);
      setOrders((prev) => prev.filter((x) => x.id !== o.id));
      alert("ลบรายการเรียบร้อยแล้ว");
    } catch (e) {
      alert(`ลบไม่สำเร็จ: ${e.message || e}`);
    }
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h4 m-0">แผงควบคุมแอดมิน</h1>
        <div className="d-flex gap-2">
          <Link href="/" className="btn btn-outline-secondary btn-sm">หน้าแรก</Link>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <input
              className="form-control form-control-sm"
              style={{ minWidth: 260 }}
              placeholder="ค้นหา: สินค้า / อีเมล"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value.toUpperCase())}
              style={{ width: 220 }}
            >
              <option value="ALL">สถานะทั้งหมด (ยกเว้นที่ถูกลบ/ยกเลิก)</option>
              <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
              <option value="CONFIRMED">CONFIRMED</option>
            </select>
            <button
              className="btn btn-sm btn-outline-primary ms-auto"
              onClick={loadOrders}
              disabled={loadingOrders}
            >
              รีเฟรช
            </button>
          </div>
          {errorOrders ? <div className="alert alert-danger mt-3 mb-0">{errorOrders}</div> : null}
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 70 }}>#</th>
                  <th style={{ width: 160 }}>สลิป</th>
                  <th>สินค้า</th>
                  <th className="text-center" style={{ width: 90 }}>จำนวน</th>
                  <th className="text-end" style={{ width: 140 }}>รวม (บาท)</th>
                  <th style={{ width: 150 }}>สถานะ</th>
                  <th style={{ width: 280 }}>ลูกค้า</th>
                  <th style={{ width: 220 }}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loadingOrders ? (
                  <tr><td colSpan={8} className="text-center py-4">กำลังโหลด...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-4">ไม่พบข้อมูล</td></tr>
                ) : (
                  filtered.map((o, idx) => (
                    <tr key={o.id}>
                      <td>{idx + 1}</td>
                      <td className="text-center">
                        {o.slip_url ? (
                          <a href={o.slip_url} target="_blank" rel="noreferrer" title="เปิดสลิป">
                            <img
                              src={o.slip_url}
                              alt="สลิปโอนเงิน"
                              style={{
                                maxWidth: 140,
                                maxHeight: 90,
                                objectFit: "cover",
                                borderRadius: 6,
                                border: "1px solid rgba(0,0,0,.1)",
                              }}
                            />
                          </a>
                        ) : (
                          <span className="text-muted small">ไม่มีสลิป</span>
                        )}
                      </td>
                      <td className="small">
                        <div className="fw-semibold">{o.product_name}</div>
                        <div className="text-muted">{o.product_slug}</div>
                      </td>
                      <td className="text-center">{o.qty}</td>
                      <td className="text-end">{Number(o.total_price || 0).toLocaleString()}</td>
                      <td>
                        {String(o.status || "").toUpperCase() === "CONFIRMED" ? (
                          <span className="badge bg-success">CONFIRMED</span>
                        ) : String(o.status || "").toUpperCase() === "PENDING_PAYMENT" ? (
                          <span className="badge bg-warning text-dark">PENDING_PAYMENT</span>
                        ) : (
                          <span className="badge bg-secondary">
                            {String(o.status || "").toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="small">
                        <div className="fw-semibold">{o.buyer_email || "-"}</div>
                        <div className="text-muted">
                          {o.created_at ? new Date(o.created_at).toLocaleString() : ""}
                        </div>
                      </td>
                      <td>
                        <div className="d-grid gap-2">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => openSend(o)}>
                            ส่งข้อความ
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(o)}>
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="text-muted small">
            แสดง {filtered.length} รายการ (ทั้งหมด {orders.length})
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,.3)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  ส่งข้อความถึงลูกค้า {targetOrder?.buyer_email ? `(${targetOrder.buyer_email})` : ""}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowModal(false);
                    setMessage("");
                    setTargetOrder(null);
                  }}
                />
              </div>
              <div className="modal-body">
                <div className="mb-2 small text-muted">
                  จะถูกบันทึกไปที่ <code>{MESSAGES_API}/messages/{targetOrder?.id ?? "ID"}</code> เป็นฟิลด์ <code>detels</code>
                </div>
                <textarea
                  className="form-control"
                  rows={10}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="พิมพ์ข้อความถึงลูกค้า ข้อมูลคำสั่งซื้อจะถูกแนบไว้ตอนเปิดหน้าต่างนี้แล้ว"
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setMessage("");
                    setTargetOrder(null);
                  }}
                  disabled={saving}
                >
                  ยกเลิก
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveMessage}
                  disabled={saving || !message.trim()}
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกข้อความ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
