import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPatch } from '../../lib/api';
import { CalendarDays, Plus, Users, Check, X, Clock } from 'lucide-react';

export default function MentorMeetings() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ startsAt: '', agenda: '', notes: '' });
  const [toast, setToast] = useState('');

  useEffect(() => {
    apiGet('/projects').then((p) => {
      setProjects(p);
      if (p.length > 0) {
        setSelectedProject(p[0]);
        loadMeetings(p[0].id);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadMeetings = (projectId) => {
    apiGet(`/meetings/${projectId}/meetings`).then(setMeetings).catch(() => setMeetings([]));
  };

  const createMeeting = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await apiPost(`/meetings/${selectedProject.id}/meetings`, form);
      loadMeetings(selectedProject.id);
      setShowForm(false);
      setForm({ startsAt: '', agenda: '', notes: '' });
      setToast('Meeting created!');
    } catch (err) {
      setToast(err?.error?.message || 'Failed');
    }
    setTimeout(() => setToast(''), 3000);
  };

  const markAttendance = async (meetingId, studentId, status) => {
    try {
      await apiPatch(`/meetings/${meetingId}/attendance`, { attendance: [{ studentId, status }] });
      loadMeetings(selectedProject.id);
    } catch {}
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  if (loading) return <div className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Meetings</h1>
          <p className="text-sm text-gray-500">{meetings.length} meetings</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Schedule Meeting
        </button>
      </div>

      {toast && <div className="fixed top-4 right-4 z-50 bg-muj-charcoal text-white px-4 py-3 rounded-lg shadow-lg text-sm">{toast}</div>}

      {/* Project Selector */}
      {projects.length > 1 && (
        <div className="flex gap-2 mb-4">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedProject(p); loadMeetings(p.id); }}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                selectedProject?.id === p.id ? 'bg-muj-orange text-white' : 'bg-white border border-gray-200'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      {/* Create Meeting Form */}
      {showForm && (
        <div className="card p-5 mb-6">
          <h2 className="font-bold text-sm mb-4">Schedule New Meeting</h2>
          <form onSubmit={createMeeting} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date & Time</label>
                <input type="datetime-local" className="input" value={form.startsAt} onChange={set('startsAt')} required />
              </div>
            </div>
            <div>
              <label className="label">Agenda *</label>
              <textarea className="input min-h-[60px]" placeholder="Meeting agenda..." value={form.agenda} onChange={set('agenda')} required />
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <textarea className="input min-h-[40px]" placeholder="Pre-meeting notes..." value={form.notes} onChange={set('notes')} />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create</button>
            </div>
          </form>
        </div>
      )}

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold">No meetings scheduled</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold">{new Date(meeting.startsAt).toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-1">{meeting.agenda}</p>
                  {meeting.notes && <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded px-3 py-2">{meeting.notes}</p>}
                </div>
              </div>

              {/* Attendance */}
              <div className="border-t border-gray-100 pt-3 mt-3">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Attendance</p>
                <div className="space-y-2">
                  {selectedProject?.members?.filter((m) => m.role === 'STUDENT').map((member) => {
                    const att = meeting.attendance?.find((a) => a.studentId === member.userId);
                    return (
                      <div key={member.userId} className="flex items-center justify-between">
                        <span className="text-sm">{member.name}</span>
                        <div className="flex gap-1">
                          {['PRESENT', 'LATE', 'ABSENT'].map((s) => (
                            <button
                              key={s}
                              onClick={() => markAttendance(meeting.id, member.userId, s)}
                              className={`text-[10px] px-2 py-1 rounded font-semibold transition-colors ${
                                att?.status === s
                                  ? s === 'PRESENT' ? 'bg-green-500 text-white' : s === 'LATE' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
