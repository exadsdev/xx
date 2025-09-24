export const runtime = "nodejs";
import { NextResponse } from "next/server";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  MAIL_FROM,
} = process.env;

// 🔒 sanitize ENV
const SMTP_USER = (process.env.SMTP_USER || "").trim();
const SMTP_PASS = (process.env.SMTP_PASS || "").replace(/\s+/g, "").trim();

async function getTransporter() {
  const nodemailer = await import("nodemailer");

  const secure = String(SMTP_SECURE || "").toLowerCase() === "true" || String(SMTP_PORT) === "465";
  const port = Number(SMTP_PORT || (secure ? 465 : 587));

  // debug ชั่วคราว
  console.log("[SMTP] host:", SMTP_HOST);
  console.log("[SMTP] port:", port, "secure:", secure);
  console.log("[SMTP] user:", SMTP_USER);
  console.log("[SMTP] pass length:", SMTP_PASS.length); // ✅ ต้องเป็น 16

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST || "smtp.gmail.com",
    port,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    logger: true,
    debug: true,
  });

  await transporter.verify(); // เช็คให้ชัวร์ก่อนส่ง
  return transporter;
}

export async function POST(req) {
  try {
    const { to, subject, text, html } = await req.json();

    if (!to || !subject) {
      return NextResponse.json({ ok: false, error: "Missing 'to' or 'subject'" }, { status: 400 });
    }
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      return NextResponse.json({ ok: false, error: "SMTP env is not configured" }, { status: 500 });
    }

    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: MAIL_FROM || SMTP_USER,
      to,
      subject,
      text: text || "",
      html: html || undefined,
    });

    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
