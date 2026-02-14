import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

export default function Forbidden() {
  return (
    <div className="min-h-screen bg-muj-beige flex items-center justify-center">
      <div className="text-center">
        <ShieldX className="w-16 h-16 text-muj-orange mx-auto mb-4" />
        <h1 className="text-4xl font-black text-muj-charcoal mb-2">403</h1>
        <p className="text-gray-600 mb-6">You don't have permission to access this page</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  );
}
