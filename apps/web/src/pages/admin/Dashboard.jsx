import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiGet } from '../../lib/api';
import { Users, Shield, ClipboardCheck, LayoutDashboard, FolderKanban } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [freeze, setFreeze] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet('/admin/users').catch(() => []),
      apiGet('/admin/freeze-settings').catch(() => ({})),
    ]).then(([u, f]) => {
      setUsers(u);
      setFreeze(f);
    }).finally(() => setLoading(false));
  }, []);

  const counts = {
    students: users.filter((u) => u.role === 'STUDENT').length,
    mentors: users.filter((u) => u.role === 'MENTOR').length,
    faculty: users.filter((u) => u.role === 'PBL_FACULTY').length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>)}</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
        <p className="text-sm text-gray-500">Admin Dashboard — PBL HOD/Incharge</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Students', count: counts.students, color: 'bg-blue-50 text-blue-600', icon: Users },
          { label: 'Mentors', count: counts.mentors, color: 'bg-green-50 text-green-600', icon: Users },
          { label: 'Faculty', count: counts.faculty, color: 'bg-purple-50 text-purple-600', icon: Users },
          { label: 'Total Users', count: users.length, color: 'bg-muj-orange/10 text-muj-orange', icon: Users },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.count}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Freeze Status */}
      <h2 className="text-lg font-bold mb-3">System Freeze Status</h2>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Allocation', key: 'allocation' },
          { label: 'Internal Marks', key: 'internalMarks' },
          { label: 'Presentations', key: 'presentations' },
        ].map((f) => (
          <div key={f.key} className="card p-4 flex items-center justify-between">
            <span className="text-sm font-semibold">{f.label}</span>
            <span className={`badge ${freeze[f.key] ? 'badge-red' : 'badge-green'}`}>
              {freeze[f.key] ? 'Frozen' : 'Active'}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Manage Users', to: '/admin/users', icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Freeze Controls', to: '/admin/freeze', icon: Shield, color: 'bg-red-50 text-red-600' },
          { label: 'Exports', to: '/admin/exports', icon: ClipboardCheck, color: 'bg-green-50 text-green-600' },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.to} to={a.to} className="card p-4 hover:shadow-md transition-shadow flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${a.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold">{a.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
