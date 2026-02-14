import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { ClipboardCheck } from 'lucide-react';

export default function FacultyEvaluation() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetail, setEventDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evalForm, setEvalForm] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    apiGet('/presentations/events').then((e) => {
      setEvents(e);
      if (e.length > 0) selectEvent(e[0]);
    }).catch(() => []).finally(() => setLoading(false));
  }, []);

  const selectEvent = async (event) => {
    setSelectedEvent(event);
    try {
      const det = await apiGet(`/presentations/events/${event.id}`);
      setEventDetail(det);
    } catch {}
  };

  const startEval = (slot) => {
    setEvalForm({
      slotId: slot.id,
      projectTitle: slot.projectTitle || 'N/A',
      attendance: 'PRESENT',
      rubric: { presentation: 0, content: 0, qa: 0, innovation: 0, teamwork: 0 },
      totalScore: 0,
      feedback: '',
    });
  };

  const submitEval = async () => {
    if (!evalForm) return;
    try {
      const total = Object.values(evalForm.rubric).reduce((a, b) => a + Number(b), 0);
      await apiPost(`/presentations/slots/${evalForm.slotId}/evaluation`, {
        attendance: evalForm.attendance,
        rubric: evalForm.rubric,
        totalScore: total,
        feedback: evalForm.feedback,
      });
      setToast('Evaluation saved!');
      selectEvent(selectedEvent);
      setEvalForm(null);
    } catch (err) {
      setToast(err?.error?.message || 'Failed');
    }
    setTimeout(() => setToast(''), 3000);
  };

  if (loading) return <div className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Presentation Evaluation</h1>
      <p className="text-sm text-gray-500 mb-6">Grade students on their presentations</p>

      {toast && <div className="fixed top-4 right-4 z-50 bg-muj-charcoal text-white px-4 py-3 rounded-lg shadow-lg text-sm">{toast}</div>}

      {/* Event Selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {events.map((ev) => (
          <button key={ev.id} onClick={() => selectEvent(ev)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold ${selectedEvent?.id === ev.id ? 'bg-muj-orange text-white' : 'bg-white border border-gray-200'}`}>
            {ev.title}
          </button>
        ))}
      </div>

      {/* Eval Modal */}
      {evalForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-1">Evaluate: {evalForm.projectTitle}</h3>
            <p className="text-sm text-gray-500 mb-4">Score each rubric criterion (0-20)</p>

            <div className="mb-4">
              <label className="label">Attendance</label>
              <select className="input" value={evalForm.attendance} onChange={(e) => setEvalForm({ ...evalForm, attendance: e.target.value })}>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>

            <div className="space-y-3 mb-4">
              {Object.keys(evalForm.rubric).map((key) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <label className="text-sm font-medium capitalize flex-1">{key.replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    type="number" min="0" max="20"
                    className="input w-24 text-center"
                    value={evalForm.rubric[key]}
                    onChange={(e) => setEvalForm({ ...evalForm, rubric: { ...evalForm.rubric, [key]: Number(e.target.value) } })}
                  />
                </div>
              ))}
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-bold">Total</span>
                <span className="text-lg font-bold text-muj-orange">{Object.values(evalForm.rubric).reduce((a, b) => a + Number(b), 0)} / 100</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="label">Feedback</label>
              <textarea className="input min-h-[60px]" value={evalForm.feedback} onChange={(e) => setEvalForm({ ...evalForm, feedback: e.target.value })} />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setEvalForm(null)} className="btn-secondary">Cancel</button>
              <button onClick={submitEval} className="btn-primary">Save Evaluation</button>
            </div>
          </div>
        </div>
      )}

      {/* Slots with eval status */}
      {eventDetail?.slots?.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">#</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Time</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Project</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {eventDetail.slots.map((slot, i) => (
                <tr key={slot.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm">{i + 1}</td>
                  <td className="px-3 py-3 text-sm">{new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-3 py-3 text-sm font-medium">{slot.projectTitle || 'Unassigned'}</td>
                  <td className="px-3 py-3">
                    {slot.evaluations?.length > 0 ? (
                      <span className="badge-green">Evaluated ({slot.evaluations[0].totalScore})</span>
                    ) : (
                      <span className="badge-yellow">Pending</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => startEval(slot)} className="btn-primary text-xs px-3 py-1"  disabled={!slot.projectId}>
                      {slot.evaluations?.length > 0 ? 'Re-evaluate' : 'Evaluate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-8 text-center text-gray-500">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold">No slots to evaluate</p>
          <p className="text-sm mt-1">Generate and assign slots first.</p>
        </div>
      )}
    </div>
  );
}
