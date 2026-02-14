import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiGet } from '../../lib/api';
import { FolderKanban, ListTodo, BookOpen, Users, AlertCircle, CheckCircle2, Clock, MessageSquare } from 'lucide-react';

export default function StudentDashboard() {
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

  const activeProject = projects.find((p) => p.status === 'ACTIVE');
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const acceptedRequest = requests.find((r) => r.status === 'ACCEPTED');

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3 mb-2" /><div className="h-3 bg-gray-100 rounded w-2/3" /></div>)}</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
        <p className="text-sm text-gray-500">Student Dashboard — Semester {user.semester || 'N/A'}</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Active Project</p>
              <p className="font-bold">{activeProject ? activeProject.title : 'None'}</p>
            </div>
          </div>
          {activeProject && (
            <Link to="/student/project" className="text-xs text-muj-orange font-semibold hover:underline">View Project →</Link>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending Requests</p>
              <p className="font-bold">{pendingRequests.length}</p>
            </div>
          </div>
          <Link to="/student/find-mentor" className="text-xs text-muj-orange font-semibold hover:underline">
            {activeProject ? 'View Requests →' : 'Find Mentor →'}
          </Link>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Mentor</p>
              <p className="font-bold">{acceptedRequest?.mentorName || activeProject?.mentorName || 'Not Assigned'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'My Tasks', to: '/student/tasks', icon: ListTodo, color: 'bg-blue-50 text-blue-600' },
          { label: 'Daily Diary', to: '/student/diary', icon: BookOpen, color: 'bg-green-50 text-green-600' },
          { label: 'Announcements', to: '/student/announcements', icon: MessageSquare, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Find Mentor', to: '/student/find-mentor', icon: Users, color: 'bg-purple-50 text-purple-600' },
          { label: 'My Project', to: '/student/project', icon: FolderKanban, color: 'bg-muj-orange/10 text-muj-orange' },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.to} to={action.to} className="card p-4 hover:shadow-md transition-shadow flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold">{action.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      {activeProject && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-3">Project: {activeProject.title}</h2>
          <div className="card p-5">
            <p className="text-sm text-gray-600 mb-3">{activeProject.description}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {activeProject.techStack?.map((tech) => (
                <span key={tech} className="badge-orange">{tech}</span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Mentor: <strong className="text-muj-charcoal">{activeProject.mentorName}</strong></span>
              <span>Tasks: <strong className="text-muj-charcoal">{activeProject.taskCount}</strong></span>
              <span>Members: <strong className="text-muj-charcoal">{activeProject.members?.length}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
