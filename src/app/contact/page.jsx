export default function Contact() {
  return (
    <div className="container mt-5">
      <h2 className="mb-4">ติดต่อเรา</h2>
      <form>   <div className="text-center">
   <a href="https://lin.ee/Y78jomC"><img src="https://scdn.line-apps.com/n/line_add_friends/btn/th.png" alt="เพิ่มเพื่อน" height="36" border="0"/></a>
      </div>
        <div className="mb-3">
          <label className="form-label">ชื่อ</label>
          <input type="text" className="form-control" placeholder="ชื่อของคุณ" />
        </div>
        <div className="mb-3">
          <label className="form-label">อีเมล</label>
          <input type="email" className="form-control" placeholder="example@gmail.com" />
        </div>
        <div className="mb-3">
          <label className="form-label">ข้อความ</label>
          <textarea className="form-control" rows={5}></textarea>
        </div>
        <button className="btn btn-success">ส่งข้อความ</button>
      </form>
    </div>
  );
}
