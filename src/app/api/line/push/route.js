// app/api/line/push/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";

const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const ADMIN_IDS = (process.env.LINE_ADMIN_USER_ID || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function buildMessages({ text, imageUrl }) {
  const msgs = [];
  if (text) msgs.push({ type: "text", text: String(text).slice(0, 5000) });
  if (imageUrl) {
    msgs.push({
      type: "image",
      originalContentUrl: imageUrl,
      previewImageUrl: imageUrl,
    });
  }
  if (!msgs.length) msgs.push({ type: "text", text: "No content" });
  return msgs;
}

async function callLINE(path, payload) {
  const res = await fetch(`https://api.line.me${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const txt = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, body: txt };
}

/**
 * POST /api/line/push
 * body: { to?: string|string[], text?: string, imageUrl?: string, broadcast?: boolean }
 */
export async function POST(req) {
  try {
    const { to, text, imageUrl, broadcast } = await req.json();
    const messages = buildMessages({ text, imageUrl });

    if (broadcast === true) {
      const r = await callLINE("/v2/bot/message/broadcast", { messages });
      return NextResponse.json(r, { status: r.ok ? 200 : 500 });
    }

    let targets = [];
    if (typeof to === "string") targets = [to];
    else if (Array.isArray(to)) targets = to.filter(Boolean);
    else if (ADMIN_IDS.length) targets = ADMIN_IDS;

    if (!targets.length) {
      return NextResponse.json(
        { ok: false, error: "No destination and no LINE_ADMIN_USER_ID configured" },
        { status: 400 }
      );
    }

    if (targets.length > 1) {
      const r = await callLINE("/v2/bot/message/multicast", { to: targets, messages });
      return NextResponse.json(r, { status: r.ok ? 200 : 500 });
    }

    const r = await callLINE("/v2/bot/message/push", { to: targets[0], messages });
    return NextResponse.json(r, { status: r.ok ? 200 : 500 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
