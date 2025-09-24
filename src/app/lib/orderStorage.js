// app/lib/orderStorage.js
const KEY = "checkout_order_state_v1";

export function saveOrder(o) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(o));
  } catch {}
}

export function loadOrder() {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearOrder() {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEY);
  } catch {}
}
