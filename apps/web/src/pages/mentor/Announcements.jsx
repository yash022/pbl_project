import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { MessageSquare, Plus } from 'lucide-react';

export default function MentorAnnouncements() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [toast, setToast] = useState('');

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

  const create = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await apiPost(`/meetings/${selectedProject.id}/announcements`, form);
      loadAnnouncements(selectedProject.id);
      setShowForm(false);
      setForm({ title: '', body: '' });
      setToast('Announcement posted!');
    } catch (err) {
      setToast(err?.error?.message || 'Failed');
    }
    setTimeout(() => setToast(''), 3000);
  };

  if (loading) return <div className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-sm text-gray-500">{announcements.length} announcements</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Post Announcement
        </button>
      </div>

      {toast && <div className="fixed top-4 right-4 z-50 bg-muj-charcoal text-white px-4 py-3 rounded-lg shadow-lg text-sm">{toast}</div>}

      {showForm && (
        <div className="card p-5 mb-6">
          <form onSubmit={create} className="space-y-3">
            <input className="input" placeholder="Announcement title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea className="input min-h-[80px]" placeholder="Announcement body *" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Post</button>
            </div>
          </form>
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold">No announcements yet</p>
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
