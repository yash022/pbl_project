import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPost } from '../../lib/api';
import { BookOpen, CheckCircle2, Plus } from 'lucide-react';

export default function Diary() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    workDone: '', hoursSpent: '', blockers: '', nextPlan: '', date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    apiGet('/projects').then((projs) => {
      setProjects(projs);
      if (projs.length > 0) {
        apiGet(`/diary/${projs[0].id}/diary`).then(setEntries);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!projects.length) return;
    setSubmitting(true);
    try {
      const entry = await apiPost(`/diary/${projects[0].id}/diary`, {
        ...form,
        hoursSpent: parseFloat(form.hoursSpent) || 0,
      });
      setEntries((prev) => [entry, ...prev]);
      setShowForm(false);
      setForm({ workDone: '', hoursSpent: '', blockers: '', nextPlan: '', date: new Date().toISOString().split('T')[0] });
      setToast('Diary entry saved!');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err?.error?.message || 'Failed to save entry');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  if (loading) return <div className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Daily Diary</h1>
          <p className="text-sm text-gray-500">{entries.length} entries</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </div>

      {toast && <div className="fixed top-4 right-4 z-50 bg-muj-charcoal text-white px-4 py-3 rounded-lg shadow-lg text-sm">{toast}</div>}

      {/* Add Entry Form */}
      {showForm && (
        <div className="card p-5 mb-6">
          <h2 className="font-bold text-sm mb-4">Add Diary Entry</h2>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={form.date} onChange={set('date')} required />
              </div>
              <div>
                <label className="label">Hours Spent</label>
                <input type="number" className="input" placeholder="4" value={form.hoursSpent} onChange={set('hoursSpent')} min="0" max="24" step="0.5" />
              </div>
            </div>
            <div>
              <label className="label">Work Done *</label>
              <textarea className="input min-h-[80px]" placeholder="What did you work on today?" value={form.workDone} onChange={set('workDone')} required />
            </div>
            <div>
              <label className="label">Blockers</label>
              <textarea className="input min-h-[60px]" placeholder="Any blockers or challenges..." value={form.blockers} onChange={set('blockers')} />
            </div>
            <div>
              <label className="label">Next Plan</label>
              <textarea className="input min-h-[60px]" placeholder="What's the plan for tomorrow?" value={form.nextPlan} onChange={set('nextPlan')} />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : 'Save Entry'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold">No diary entries yet</p>
          <p className="text-sm mt-1">Start logging your daily progress.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-sm">{new Date(entry.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-xs text-gray-500">{entry.hoursSpent} hours spent</p>
                </div>
                {entry.verifiedByMentorId ? (
                  <span className="badge-green flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                ) : (
                  <span className="badge-yellow">Pending Review</span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-semibold text-xs text-gray-500 uppercase">Work Done</p>
                  <p className="text-gray-700">{entry.workDone}</p>
                </div>
                {entry.blockers && (
                  <div>
                    <p className="font-semibold text-xs text-gray-500 uppercase">Blockers</p>
                    <p className="text-gray-700">{entry.blockers}</p>
                  </div>
                )}
                {entry.nextPlan && (
                  <div>
                    <p className="font-semibold text-xs text-gray-500 uppercase">Next Plan</p>
                    <p className="text-gray-700">{entry.nextPlan}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
