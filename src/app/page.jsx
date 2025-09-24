// app/page.jsx
import Link from "next/link";
import JsonLd from "./components/JsonLd";
import { SITE, BRAND, DEFAULT_OG } from "./seo.config";
import "bootstrap/dist/css/bootstrap.min.css";
import "./home.css";
import PRODUCTS from "./data/products";
 

export const dynamic = "force-static";

export const metadata = {
  metadataBase: new URL(SITE),
  title: `${BRAND} | จำหน่ายบัญชีโฆษณา Facebook สำหรับธุรกิจ`,
  description: `${BRAND} จำหน่ายบัญชีโฆษณา Facebook พร้อมใช้งาน ตั้งค่าอย่างถูกต้อง โปร่งใส สอดคล้องนโยบาย พร้อมคู่มือและคำแนะนำ`,
  alternates: { canonical: SITE },
  openGraph: {
    type: "website",
    url: SITE,
    title: `${BRAND} | จำหน่ายบัญชีโฆษณา Facebook สำหรับธุรกิจ`,
    description: `${BRAND} จำหน่ายบัญชีโฆษณา Facebook พร้อมใช้งาน โปร่งใส สอดคล้องนโยบาย`,
    images: [{ url: DEFAULT_OG, width: 1200, height: 630 }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function HomePage() {
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: PRODUCTS.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/products/${p.slug}`,
      name: p.name,
      image: `${SITE}${p.image}`,
    })),
  };

  const webSiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: SITE,
    name: BRAND,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <JsonLd data={itemListLd} />
      <JsonLd data={webSiteLd} />
 
      <section className="hero py-5 border-bottom">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <span className="badge rounded-pill text-bg-light mb-3">
                พร้อมใช้งานทันที
              </span>
              <h1 className="title display-6 fw-bold">
                จำหน่ายบัญชีโฆษณา Facebook{" "}
                <span className="text-primary">สำหรับธุรกิจ</span>
              </h1>
              <p className="lead text-secondary mt-3">
                ตั้งค่าอย่างถูกต้อง โปร่งใส และสอดคล้องกับนโยบายแพลตฟอร์ม
                รูปภาพตัวอย่างรองรับการแสดงในผลการค้นหา
                (เปิดใช้ max-image-preview:large)
              </p>
              <div className="d-flex gap-3 mt-3">
              
                <a className="btn btn-outline-secondary btn-lg" href="/#faq">
                  ดูคำถามที่พบบ่อย
                </a>
              </div>
              <p className="small text-muted mt-3 mb-0">
              ขายบัญชีเฟสบุ๊ค เครื่องมือการตลาด ปี 2025
              </p>
            </div>

            <div className="col-lg-6">
              <img
                src="/images/1900.jpg"
                alt={`${BRAND} - ตัวอย่างภาพสำหรับผลการค้นหา`}
                className="hero-img"
              />
            </div>
          </div>
        </div>
      </section>

    
      <section className="container py-5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 className="h4 mb-0">แพ็กเกจยอดนิยม</h2>
        
        </div>
     {/* ----------------------------------------------------------------------------Card------------------------------------------------------------------------- */}






        <div className="row g-4"> 
          {PRODUCTS.map((p) => (

          
            <div className="boxcart col-12 col-sm-6 col-lg-4 shadow-lg p-3" key={p.id}>
              
          
           
              <div className="card h-100 product-card shadow-sm">
                <Link
                  href={`/products/${p.slug}`}
                  className="text-decoration-none"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="product-image"
                  />
                </Link> 
                
                <div className="text-center mx-auto small fw-medium py-2 border-bottom">
                  {p.description} 
                </div>


                <div className="card-body d-flex flex-column">
                  <h3 className="name h6 mb-2">{p.name}</h3>
                  <div className="text-muted small mb-3"> <div className="btncart"> {p.Accstatus} {p.name} </div>  <div className="tbtn"> {p.name}</div> </div>

                  


                  <div className="mt-auto d-flex align-items-center justify-content-between gap-2">
                    <span className="price h5 mb-0">
                        <div className="btncart">  {p.price.toLocaleString()} บาท </div>
                    </span>
                    
                    <Link
                      className="btn-accent btn-buy"
                      href={`/checkout?sku=${encodeURIComponent(p.slug)}`}
                    >
                     <div className="btncart"> 
                      <span className="btn-glow" aria-hidden="true"></span>
                      <span className="btn-shine" aria-hidden="true"></span>
                      <span className="btn-label">ซื้อเลย</span>
                      <span className="btn-sub">ชำระเงินภายใน 3 นาที</span>
                    </div>

                    <div className="tbtn">  {p.price.toLocaleString()}บาท</div>
                   
                    </Link>

                  </div>
                </div>
              </div>
        
            </div>
          ))} 
        </div>














            {/* ----------------------------------------------------------------------------Card------------------------------------------------------------------------- */}
        <div id="faq" className="mt-5">
          <h2 className="h4">คำถามที่พบบ่อย</h2>
          <div className="accordion" id="faqAcc">
            <div className="accordion-item">
              <h2 className="accordion-header" id="q1"> 
                <button
                  className="accordion-button"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#a1"
                >
                  นโยบายการใช้งานเป็นอย่างไร?
                </button>
              </h2>
              <div
                id="a1"
                className="accordion-collapse collapse show"
                data-bs-parent="#faqAcc"
              >
                <div className="accordion-body">
                  การใช้งานต้องสอดคล้องกับนโยบายของแพลตฟอร์มอย่างเคร่งครัด
                  เราให้คำแนะนำด้านความปลอดภัย
                  และการยืนยันตัวตนที่เหมาะสมสำหรับธุรกิจของคุณ
                </div>
              </div>
            </div>

            <div className="accordion-item">
              <h2 className="accordion-header" id="q2">
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#a2"
                >
                  ใช้เวลาจัดเตรียมบัญชีนานไหม?
                </button>
              </h2>
              <div
                id="a2"
                className="accordion-collapse collapse"
                data-bs-parent="#faqAcc"
              >
                <div className="accordion-body">
                  โดยทั่วไปพร้อมใช้งานภายในระยะเวลาที่ตกลง
                  และจะมีคู่มือเริ่มต้นใช้งานให้
                </div>
              </div>
            </div>
          </div>
        </div>

        <a href="https://lin.ee/fAKLljU" className="line">
          <img src="/images/line.webp" width="100%" alt="add line" />
        </a>

        <div id="contact" className="mt-5">
          <h2 className="h4">ติดต่อเรา</h2>
          <p className="text-muted">
            กรุณาระบุความต้องการของธุรกิจและวิธีติดต่อกลับ
          </p>
          <a
            className="btn btn-success"
            href="https://lin.ee/fAKLljU"
          >
            แชท LINE
          </a>
        </div>
      </section>
      
      <div className="text-center">
      <iframe
        className="vdos"
        width="560"
        height="315"
        src="https://www.youtube.com/embed/pK7YjnztQBQ?si=Em1bdDhIKX4b-v3x"
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      ></iframe>
    </div>
    
    </>
  );
}
