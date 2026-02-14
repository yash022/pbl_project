import { useState, useEffect } from 'react';
import { apiGet } from '../../lib/api';
import { MessageSquare } from 'lucide-react';

export default function StudentAnnouncements() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/projects').then((p) => {
      setProjects(p);
      if (p.length > 0) {
        setSelectedProject(p[0]);
        loadAnnouncements(p[0].id);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadAnnouncements = (id) => {
    apiGet(`/meetings/${id}/announcements`).then(setAnnouncements).catch(() => setAnnouncements([]));
  };

  if (loading) return <div className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-sm text-gray-500">{announcements.length} announcements from your mentor</p>
      </div>

      {projects.length > 1 && (
        <select
          className="input mb-6"
          value={selectedProject?.id || ''}
          onChange={(e) => {
            const p = projects.find((pr) => pr.id === e.target.value);
            setSelectedProject(p);
            loadAnnouncements(p.id);
          }}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      )}

      {announcements.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold">No announcements yet</p>
          <p className="text-sm mt-1">Your mentor will post announcements here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="card p-5">
              <h3 className="font-bold mb-1">{a.title}</h3>
              <p className="text-sm text-gray-600">{a.body}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(a.createdAt).toLocaleDateString()} · {a.mentorName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
