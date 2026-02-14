import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { CalendarDays, Plus } from 'lucide-react';

export default function FacultyEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'MID_SEM', title: '', startDate: '', endDate: '', durationMinutes: 15 });
  const [toast, setToast] = useState('');

  const load = () => {
    apiGet('/presentations/events').then(setEvents).catch(() => []).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await apiPost('/presentations/events', form);
      setShowForm(false);
      setForm({ type: 'MID_SEM', title: '', startDate: '', endDate: '', durationMinutes: 15 });
      setToast('Event created!');
      load();
    } catch (err) {
      setToast(err?.error?.message || 'Failed');
    }
    setTimeout(() => setToast(''), 3000);
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  if (loading) return <div className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Presentation Events</h1>
          <p className="text-sm text-gray-500">{events.length} events</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Event
        </button>
      </div>

      {toast && <div className="fixed top-4 right-4 z-50 bg-muj-charcoal text-white px-4 py-3 rounded-lg shadow-lg text-sm">{toast}</div>}

      {showForm && (
        <div className="card p-5 mb-6">
          <h2 className="font-bold text-sm mb-4">Create Presentation Event</h2>
          <form onSubmit={create} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.type} onChange={set('type')}>
                  <option value="MID_SEM">Mid Semester</option>
                  <option value="END_SEM">End Semester</option>
                </select>
              </div>
              <div>
                <label className="label">Duration per slot (minutes)</label>
                <input type="number" className="input" value={form.durationMinutes} onChange={set('durationMinutes')} min="5" max="60" />
              </div>
            </div>
            <div>
              <label className="label">Title *</label>
              <input className="input" placeholder="e.g., Mid Semester Presentations - Sem 5" value={form.title} onChange={set('title')} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start Date</label>
                <input type="date" className="input" value={form.startDate} onChange={set('startDate')} required />
              </div>
              <div>
                <label className="label">End Date</label>
                <input type="date" className="input" value={form.endDate} onChange={set('endDate')} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create Event</button>
            </div>
          </form>
        </div>
      )}

      {events.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold">No events yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${event.type === 'MID_SEM' ? 'badge-blue' : 'badge-orange'}`}>{event.type === 'MID_SEM' ? 'Mid Semester' : 'End Semester'}</span>
                    {event.locked && <span className="badge-red">Locked</span>}
                  </div>
                  <h3 className="font-bold">{event.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(event.startDate).toLocaleDateString()} — {new Date(event.endDate).toLocaleDateString()} · 
                    {event.durationMinutes}min/slot · {event.slotCount} slots · Created by {event.createdByName}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
