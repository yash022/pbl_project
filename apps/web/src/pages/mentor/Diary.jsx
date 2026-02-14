import { useState, useEffect } from 'react';
import { apiGet, apiPatch } from '../../lib/api';
import { BookOpen, CheckCircle2, Clock, Filter } from 'lucide-react';

export default function MentorDiary() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState('all'); // all | pending | verified

  useEffect(() => {
    apiGet('/projects')
      .then((projs) => {
        setProjects(projs);
        if (projs.length > 0) setSelectedProject(projs[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    setLoading(true);
    apiGet(`/diary/${selectedProject}/diary`)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [selectedProject]);

  const verify = async (entryId) => {
    setVerifying(entryId);
    try {
      const updated = await apiPatch(`/diary/verify/${entryId}`);
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, verifiedByMentorId: updated.verifiedByMentorId, verifiedByMentorName: 'You' } : e))
      );
      setToast('Diary entry verified!');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err?.error?.message || 'Failed to verify');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setVerifying(null);
    }
  };

  const filtered = entries.filter((e) => {
    if (filter === 'pending') return !e.verifiedByMentorId;
    if (filter === 'verified') return !!e.verifiedByMentorId;
    return true;
  });

  const pendingCount = entries.filter((e) => !e.verifiedByMentorId).length;
  const verifiedCount = entries.filter((e) => !!e.verifiedByMentorId).length;

  if (loading && projects.length === 0) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Student Diary</h1>
          <p className="text-sm text-gray-500">Review and verify student diary entries</p>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-muj-charcoal text-white px-4 py-3 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{entries.length}</p>
              <p className="text-xs text-gray-500">Total Entries</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{pendingCount}</p>
              <p className="text-xs text-gray-500">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{verifiedCount}</p>
              <p className="text-xs text-gray-500">Verified</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Selector + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {projects.length > 1 && (
          <select
            className="input flex-1"
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        )}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'verified', label: 'Verified' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filter === f.key
                  ? 'bg-muj-orange text-white border-muj-orange'
                  : 'border-gray-300 text-gray-500 hover:border-muj-orange hover:text-muj-orange'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold">No diary entries found</p>
          <p className="text-sm mt-1">
            {filter !== 'all' ? 'Try changing the filter.' : "Students haven't submitted any entries yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <div key={entry.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-sm">
                    {entry.studentName}
                    <span className="text-gray-400 font-normal ml-2">
                      {new Date(entry.date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">{entry.hoursSpent} hours spent</p>
                </div>
                {entry.verifiedByMentorId ? (
                  <span className="badge-green flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <button
                    onClick={() => verify(entry.id)}
                    disabled={verifying === entry.id}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {verifying === entry.id ? 'Verifying...' : 'Verify'}
                  </button>
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
