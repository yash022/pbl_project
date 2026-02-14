import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiGet } from '../../lib/api';
import { FolderKanban, Users, Bell, CalendarDays, ClipboardCheck, MessageSquare, BookOpen } from 'lucide-react';

export default function MentorDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet('/projects').catch(() => []),
      apiGet('/mentors/requests').catch(() => []),
    ]).then(([p, r]) => {
      setProjects(p);
      setRequests(r);
    }).finally(() => setLoading(false));
  }, []);

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE');

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>)}</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
        <p className="text-sm text-gray-500">Mentor Dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingRequests.length}</p>
              <p className="text-xs text-gray-500">Pending Requests</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeProjects.length}</p>
              <p className="text-xs text-gray-500">Active Projects</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeProjects.reduce((acc, p) => acc + (p.members?.filter(m => m.role === 'STUDENT').length || 0), 0)}</p>
              <p className="text-xs text-gray-500">Students</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{requests.filter(r => r.status === 'ACCEPTED').length}</p>
              <p className="text-xs text-gray-500">Accepted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Requests', to: '/mentor/requests', icon: Bell, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Projects', to: '/mentor/projects', icon: FolderKanban, color: 'bg-blue-50 text-blue-600' },
          { label: 'Meetings', to: '/mentor/meetings', icon: CalendarDays, color: 'bg-green-50 text-green-600' },
          { label: 'Daily Diary', to: '/mentor/diary', icon: BookOpen, color: 'bg-orange-50 text-orange-600' },
          { label: 'Evaluation', to: '/mentor/evaluation', icon: ClipboardCheck, color: 'bg-purple-50 text-purple-600' },
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

      {/* Active Projects */}
      <h2 className="text-lg font-bold mb-3">Active Projects</h2>
      {activeProjects.length === 0 ? (
        <div className="card p-6 text-center text-gray-500 text-sm">No active projects yet</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {activeProjects.map((p) => (
            <Link to="/mentor/projects" key={p.id} className="card p-5 hover:shadow-md transition-shadow">
              <h3 className="font-bold mb-1">{p.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{p.members?.filter((m) => m.role === 'STUDENT').length || 0} students</span>
                <span>{p.taskCount} tasks</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
