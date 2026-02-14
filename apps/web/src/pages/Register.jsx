import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', semester: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!form.email.endsWith('@jaipur.manipal.edu')) {
      setError('Only @jaipur.manipal.edu emails are allowed');
      setLoading(false);
      return;
    }

    try {
      const user = await register({
        ...form,
        semester: form.semester ? parseInt(form.semester) : null,
      });
      navigate('/student');
    } catch (err) {
      setError(err?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-muj-beige flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <GraduationCap className="w-8 h-8 text-muj-orange" />
            <span className="font-black text-xl">MPMS</span>
          </Link>
          <h2 className="text-2xl font-bold">Create Account</h2>
          <p className="text-sm text-gray-500 mt-1">Register with your MUJ email</p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="Yash Sehgal" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="label">MUJ Email</label>
              <input type="email" className="input" placeholder="name@jaipur.manipal.edu" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Department</label>
                <select className="input" value={form.department} onChange={set('department')}>
                  <option value="">Select</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                </select>
              </div>
              <div>
                <label className="label">Semester</label>
                <select className="input" value={form.semester} onChange={set('semester')}>
                  <option value="">Select</option>
                  {[3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login/student" className="text-muj-orange font-semibold hover:underline">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
