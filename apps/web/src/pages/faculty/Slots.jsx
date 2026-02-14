import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPatch } from '../../lib/api';
import { Presentation, Plus, Settings } from 'lucide-react';

export default function FacultySlots() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetail, setEventDetail] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genForm, setGenForm] = useState({ startTime: '', endTime: '', venue: '', count: 10 });
  const [showGen, setShowGen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    Promise.all([
      apiGet('/presentations/events'),
      apiGet('/projects'),
    ]).then(([e, p]) => {
      setEvents(e);
      setProjects(p);
      if (e.length > 0) selectEvent(e[0]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const selectEvent = async (event) => {
    setSelectedEvent(event);
    try {
      const det = await apiGet(`/presentations/events/${event.id}`);
      setEventDetail(det);
    } catch {}
  };

  const generateSlots = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    try {
      const res = await apiPost(`/presentations/events/${selectedEvent.id}/slots/generate`, genForm);
      setToast(`${res.generated} slots generated!`);
      selectEvent(selectedEvent);
      setShowGen(false);
    } catch (err) {
      setToast(err?.error?.message || 'Failed');
    }
    setTimeout(() => setToast(''), 3000);
  };

  const assignSlot = async (slotId, projectId) => {
    try {
      await apiPatch(`/presentations/slots/${slotId}/assign`, { projectId });
      selectEvent(selectedEvent);
    } catch {}
  };

  if (loading) return <div className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Slot Management</h1>
      <p className="text-sm text-gray-500 mb-6">Generate and assign presentation slots</p>

      {toast && <div className="fixed top-4 right-4 z-50 bg-muj-charcoal text-white px-4 py-3 rounded-lg shadow-lg text-sm">{toast}</div>}

      {/* Event Selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {events.map((ev) => (
          <button key={ev.id} onClick={() => selectEvent(ev)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold ${selectedEvent?.id === ev.id ? 'bg-muj-orange text-white' : 'bg-white border border-gray-200'}`}>
            {ev.title}
          </button>
        ))}
        {events.length === 0 && <p className="text-sm text-gray-400">No events. Create one first.</p>}
      </div>

      {selectedEvent && (
        <div className="space-y-4">
          {/* Generate Slots */}
          <div className="flex gap-2">
            <button onClick={() => setShowGen(!showGen)} className="btn-primary text-xs flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Generate Slots
            </button>
          </div>

          {showGen && (
            <div className="card p-5">
              <h3 className="font-bold text-sm mb-3">Generate Time Slots</h3>
              <form onSubmit={generateSlots} className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="label">Start Time</label>
                    <input type="datetime-local" className="input" value={genForm.startTime}
                      onChange={(e) => setGenForm({ ...genForm, startTime: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label">End Time (optional)</label>
                    <input type="datetime-local" className="input" value={genForm.endTime}
                      onChange={(e) => setGenForm({ ...genForm, endTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Venue</label>
                    <input className="input" placeholder="Room 201" value={genForm.venue}
                      onChange={(e) => setGenForm({ ...genForm, venue: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Max Slots</label>
                    <input type="number" className="input" min="1" max="50" value={genForm.count}
                      onChange={(e) => setGenForm({ ...genForm, count: parseInt(e.target.value) })} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowGen(false)} className="btn-secondary text-xs">Cancel</button>
                  <button type="submit" className="btn-primary text-xs">Generate</button>
                </div>
              </form>
            </div>
          )}

          {/* Slots Table */}
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">#</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Time</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Venue</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Assigned Project</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Evaluations</th>
                </tr>
              </thead>
              <tbody>
                {eventDetail?.slots?.map((slot, i) => (
                  <tr key={slot.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm">{i + 1}</td>
                    <td className="px-3 py-3 text-sm">
                      {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — 
                      {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-3 text-sm">{slot.venue}</td>
                    <td className="px-3 py-3">
                      <select
                        className="input text-xs py-1"
                        value={slot.projectId || ''}
                        onChange={(e) => assignSlot(slot.id, e.target.value || null)}
                      >
                        <option value="">Unassigned</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-sm">
                      {slot.evaluations?.length > 0 ? (
                        <span className="badge-green">{slot.evaluations.length} done</span>
                      ) : (
                        <span className="badge-gray">None</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!eventDetail?.slots || eventDetail.slots.length === 0) && (
                  <tr><td colSpan={5} className="text-center py-6 text-sm text-gray-400">No slots generated yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
