// app/api/line/webhook/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "node:crypto";

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

async function replyMessage(replyToken, messages) {
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ replyToken, messages }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.warn("LINE reply error:", res.status, t);
  }
}

export async function POST(req) {
  try {
    const signature = req.headers.get("x-line-signature") || "";
    const bodyText = await req.text();

    const calcSig = crypto
      .createHmac("sha256", CHANNEL_SECRET)
      .update(bodyText)
      .digest("base64");

    if (signature !== calcSig) {
      return NextResponse.json({ ok: false, error: "Bad signature" }, { status: 401 });
    }

    const body = JSON.parse(bodyText);

    for (const ev of body.events || []) {
      const sourceType = ev?.source?.type;
      const userId = ev?.source?.userId;
      const groupId = ev?.source?.groupId;
      const roomId = ev?.source?.roomId;

      console.log("[LINE] event:", {
        type: ev.type,
        sourceType,
        userId,
        groupId,
        roomId,
      });

      if (ev.type === "message" && ev.message?.type === "text" && ev.replyToken) {
        const text = (ev.message.text || "").trim().toLowerCase();
        if (text === "register" || text === "ลงทะเบียน") {
          await replyMessage(ev.replyToken, [
            {
              type: "text",
              text:
                "บันทึก ID นี้ไว้ใช้ push:\n" +
                (userId ? `userId: ${userId}\n` : "") +
                (groupId ? `groupId: ${groupId}\n` : "") +
                (roomId ? `roomId: ${roomId}\n` : ""),
            },
          ]);
        } else {
          await replyMessage(ev.replyToken, [
            { type: "text", text: "พิมพ์ register เพื่อรับ userId/groupId สำหรับตั้งค่า" },
          ]);
        }
      }

      if (ev.type === "join" && sourceType === "group") {
        console.log("[LINE] joined group:", groupId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
