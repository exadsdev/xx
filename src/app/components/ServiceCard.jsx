export default function ServiceCard({ title, description, image }) {
  return (
    <div className="card h-100 shadow-sm">
      <img src={image} className="card-img-top" alt={title} />
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <p className="card-text">{description}</p>
        <a href="/contact" className="btn btn-primary">ติดต่อเรา</a>
      </div>
    </div>
  );
}
