import { useState, useEffect } from 'react';
import { apiGet, apiPatch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { FolderKanban, Users, Tag } from 'lucide-react';

export default function MyProject() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/projects').then((data) => {
      setProjects(data);
      if (data.length > 0) {
        apiGet(`/projects/${data[0].id}`).then(setSelected);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>;

  if (!selected) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">My Project</h1>
        <div className="card p-8 text-center text-gray-500">
          <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold">No project assigned yet</p>
          <p className="text-sm mt-1">Get allocated to a mentor first to start your project.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{selected.title}</h1>
      <p className="text-sm text-gray-500 mb-6">{selected.status}</p>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Project Info */}
        <div className="md:col-span-2 space-y-4">
          <div className="card p-5">
            <h2 className="font-bold text-sm mb-2">Description</h2>
            <p className="text-sm text-gray-600">{selected.description}</p>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-sm mb-3">Tech Stack</h2>
            <div className="flex flex-wrap gap-2">
              {selected.techStack?.map((t) => (
                <span key={t} className="badge-orange">{t}</span>
              ))}
              {(!selected.techStack || selected.techStack.length === 0) && (
                <p className="text-xs text-gray-400">No tech stack defined yet</p>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-sm mb-3">Tasks Overview</h2>
            {selected.tasks?.length > 0 ? (
              <div className="space-y-2">
                {selected.tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.priority} priority</p>
                    </div>
                    <span className={`badge ${
                      task.status === 'DONE' ? 'badge-green' :
                      task.status === 'IN_PROGRESS' ? 'badge-blue' : 'badge-gray'
                    }`}>{task.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No tasks yet</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-bold text-sm mb-3">Mentor</h2>
            <p className="text-sm">{selected.mentorName}</p>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-sm mb-3">Team Members</h2>
            <div className="space-y-2">
              {selected.members?.map((m) => (
                <div key={m.userId} className="flex items-center justify-between">
                  <span className="text-sm">{m.name}</span>
                  <span className="badge-gray text-[10px]">{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
