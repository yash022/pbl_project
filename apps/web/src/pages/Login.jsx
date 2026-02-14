import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap } from 'lucide-react';

const ROLE_INFO = {
  student: { label: 'Student', color: 'text-blue-600' },
  mentor: { label: 'Mentor', color: 'text-green-600' },
  faculty: { label: 'PBL Faculty', color: 'text-purple-600' },
  admin: { label: 'Admin', color: 'text-muj-orange' },
};

const ROLE_REDIRECT = {
  STUDENT: '/student',
  MENTOR: '/mentor',
  PBL_FACULTY: '/faculty',
  ADMIN: '/admin',
};

export default function Login() {
  const { role } = useParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roleInfo = ROLE_INFO[role] || ROLE_INFO.student;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(ROLE_REDIRECT[user.role] || '/student');
    } catch (err) {
      setError(err?.error?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muj-beige flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <GraduationCap className="w-8 h-8 text-muj-orange" />
            <span className="font-black text-xl">MPMS</span>
          </Link>
          <h2 className="text-2xl font-bold">
            <span className={roleInfo.color}>{roleInfo.label}</span> Login
          </h2>
          <p className="text-sm text-gray-500 mt-1">Sign in with your MUJ email</p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="yourname@jaipur.manipal.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-muj-orange font-semibold hover:underline">Register</Link>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-3 text-xs">
          {Object.entries(ROLE_INFO).map(([key, val]) => (
            <Link
              key={key}
              to={`/login/${key}`}
              className={`px-3 py-1.5 rounded-full border transition-colors ${
                role === key ? 'bg-muj-orange text-white border-muj-orange' : 'border-gray-300 text-gray-500 hover:border-muj-orange hover:text-muj-orange'
              }`}
            >
              {val.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
