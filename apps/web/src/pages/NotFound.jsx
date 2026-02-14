import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-muj-beige flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-black text-muj-orange mb-2">404</h1>
        <p className="text-gray-600 mb-6">Page not found</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  );
}
