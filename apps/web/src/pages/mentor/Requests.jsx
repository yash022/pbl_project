import { useState, useEffect } from 'react';
import { apiGet, apiPatch } from '../../lib/api';
import { Check, X, Clock, User } from 'lucide-react';

export default function MentorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const load = () => {
    apiGet('/mentors/requests').then(setRequests).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id, status) => {
    try {
      await apiPatch(`/mentors/requests/${id}`, { status });
      setToast(`Request ${status.toLowerCase()}`);
      load();
    } catch (err) {
      setToast(err?.error?.message || 'Action failed');
    }
    setTimeout(() => setToast(''), 3000);
  };

  const pending = requests.filter((r) => r.status === 'PENDING');
  const others = requests.filter((r) => r.status !== 'PENDING');

  if (loading) return <div className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Mentor Requests</h1>
      <p className="text-sm text-gray-500 mb-6">{pending.length} pending · {requests.length} total</p>

      {toast && <div className="fixed top-4 right-4 z-50 bg-muj-charcoal text-white px-4 py-3 rounded-lg shadow-lg text-sm">{toast}</div>}

      {/* Pending */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Pending Requests</h2>
          <div className="space-y-3">
            {pending.map((req) => (
              <div key={req.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-muj-orange/10 flex items-center justify-center mt-0.5">
                      <User className="w-5 h-5 text-muj-orange" />
                    </div>
                    <div>
                      <h3 className="font-bold">{req.studentName}</h3>
                      <p className="text-xs text-gray-500">{req.studentEmail}</p>
                      {req.message && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded px-3 py-2">"{req.message}"</p>}
                      <p className="text-[10px] text-gray-400 mt-2">Received: {new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(req.id, 'ACCEPTED')} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button onClick={() => handleAction(req.id, 'REJECTED')} className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {others.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">History</h2>
          <div className="space-y-2">
            {others.map((req) => (
              <div key={req.id} className="card px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{req.studentName}</p>
                  <p className="text-xs text-gray-500">{req.studentEmail}</p>
                </div>
                <span className={`badge ${
                  req.status === 'ACCEPTED' ? 'badge-green' :
                  req.status === 'REJECTED' ? 'badge-red' : 'badge-gray'
                }`}>{req.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="card p-8 text-center text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold">No requests yet</p>
        </div>
      )}
    </div>
  );
}
