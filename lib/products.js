export const products = [
  {
    id: "bm-verify-50",
    slug: "bm-verify-50",
    name: "บัญชีโฆษณา Facebookสำหรับยิงแอดโฆษณา ",
    Country: "ประเทศไทย",
    Limit: "Limit $50",
    price: 550,
    currency: "THB",
    image: "/images/products/bm-verify-50.webp",
    description:
      "บัญชีโฆษณา Facebook BM Verify พร้อมวงเงินเริ่มต้น Daily Limit ประมาณ $50 เหมาะสำหรับเริ่มต้นทดสอบแคมเปญ",
    inStock: true,
    brand: "FB Ad Accounts",
    category: "Facebook Ad Accounts",
    gtin: "000000000050",
  },
  {
    id: "bm-verify-250",
    slug: "bm-verify-250",
    name: "บัญชีโฆษณา Facebookสำหรับยิงแอดโฆษณา",
      Country: "ประเทศไทย",
    Limit: "Limit $250",
    price: 1000,
    currency: "THB",
    image: "/images/products/bm-verify-250.webp",
    description:
      "BM Verify วงเงิน Daily Limit ประมาณ $250 สำหรับรันแคมเปญจริงจัง พร้อมคำแนะนำการตั้งค่าความปลอดภัยของบัญชี",
    inStock: true,
    brand: "FB Ad Accounts",
    category: "Facebook Ad Accounts",
    gtin: "000000000250",
  },
  {
    id: "agency-account",
    slug: "agency-account",
    name: "บัญชีโฆษณา Facebookสำหรับยิงแอดโฆษณา",
          Country: "ประเทศไทย",
    Limit: "Limit no",
    price: 2000,
    currency: "THB",
    image: "/images/products/agency-account.webp",
    description:
      "บัญชีโฆษณาแบบ Agency สำหรับองค์กร ออกใบแจ้งหนี้รายเดือน จัดการหลายแคมเปญได้ในที่เดียว (ต้องส่งเอกสารยืนยัน)",
    inStock: true,
    brand: "FB Ad Accounts",
    category: "Facebook Ad Accounts",
    gtin: "000000000999",
  },
];

export const productMap = Object.fromEntries(products.map((p) => [p.slug, p]));
