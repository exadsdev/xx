// app/lib/externalApi.js
const BASE_URL = "https://accfbapi.accfb-ads.com";

export const OrdersAPI = {
  create: async (orderData) => {
    const res = await fetch(`${BASE_URL}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error(`Create order failed (${res.status})`);
    return res.json(); // { status: "OK", insertId: number }
  },

  getAll: async () => {
    const res = await fetch(`${BASE_URL}/get`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Load orders failed (${res.status})`);
    return res.json();
  },

  byOrderNo: async (orderNo) => {
    const res = await fetch(`${BASE_URL}/by-order-no/${encodeURIComponent(orderNo)}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Fetch order by no failed (${res.status})`);
    return res.json(); // { order: {...} | null }
  },

  setStatus: async (id, status) => {
    const res = await fetch(`${BASE_URL}/status/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`Set status failed (${res.status})`);
    return res.json(); // { status: "OK" }
  },

  updateDetels: async (id, detels) => {
    const res = await fetch(`${BASE_URL}/messages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ detels }),
    });
    if (!res.ok) throw new Error(`Update detels failed (${res.status})`);
    return res.json(); // { status: "OK" }
  },

  uploadSlip: async (file) => {
    const form = new FormData();
    form.append("slip", file);
    const res = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error(`Upload slip failed (${res.status})`);
    return res.json(); // { status: "OK", url: "http..." }
  },
};
