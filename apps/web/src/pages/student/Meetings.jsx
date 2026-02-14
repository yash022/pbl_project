import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiGet } from '../../lib/api';
import { CalendarDays, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function StudentMeetings() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/projects')
      .then((p) => {
        setProjects(p);
        if (p.length > 0) {
          setSelectedProject(p[0]);
          loadMeetings(p[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadMeetings = (projectId) => {
    apiGet(`/meetings/${projectId}/meetings`)
      .then(setMeetings)
      .catch(() => setMeetings([]));
  };

  const getMyAttendance = (meeting) => {
    return meeting.attendance?.find((a) => a.studentId === user.id);
  };

  const statusBadge = (status) => {
    const map = {
      PRESENT: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Present' },
      LATE: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Late' },
      ABSENT: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Absent' },
    };
    const s = map[status];
    if (!s) return null;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>
        <Icon className="w-3 h-3" />
        {s.label}
      </span>
    );
  };

  const upcoming = meetings.filter((m) => new Date(m.startsAt) >= new Date());
  const past = meetings.filter((m) => new Date(m.startsAt) < new Date());

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Meetings</h1>
        <p className="text-sm text-gray-500">View your scheduled meetings & attendance</p>
      </div>

      {/* Project Selector */}
      {projects.length > 1 && (
        <div className="flex gap-2 mb-4">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedProject(p);
                loadMeetings(p.id);
              }}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                selectedProject?.id === p.id
                  ? 'bg-muj-orange text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      {meetings.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold">No meetings scheduled yet</p>
          <p className="text-xs mt-1">Your mentor will schedule meetings here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Meetings */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                Upcoming ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map((meeting) => (
                  <div key={meeting.id} className="card p-5 border-l-4 border-l-muj-orange">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CalendarDays className="w-4 h-4 text-muj-orange" />
                          <p className="font-bold text-sm">
                            {new Date(meeting.startsAt).toLocaleDateString('en-IN', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 ml-6">
                          {new Date(meeting.startsAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-muj-orange/10 text-muj-orange px-2 py-1 rounded-full uppercase">
                        Upcoming
                      </span>
                    </div>
                    <div className="mt-3 ml-6">
                      <p className="text-sm font-semibold text-gray-700">Agenda</p>
                      <p className="text-sm text-gray-600 mt-0.5">{meeting.agenda}</p>
                      {meeting.notes && (
                        <div className="mt-2 bg-gray-50 rounded px-3 py-2">
                          <p className="text-xs text-gray-500">{meeting.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Meetings */}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                Past Meetings ({past.length})
              </h2>
              <div className="space-y-3">
                {past.map((meeting) => {
                  const myAttendance = getMyAttendance(meeting);
                  return (
                    <div key={meeting.id} className="card p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarDays className="w-4 h-4 text-gray-400" />
                            <p className="font-bold text-sm text-gray-700">
                              {new Date(meeting.startsAt).toLocaleDateString('en-IN', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 ml-6">
                            {new Date(meeting.startsAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div>
                          {myAttendance ? (
                            statusBadge(myAttendance.status)
                          ) : (
                            <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                              Not Marked
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 ml-6">
                        <p className="text-sm text-gray-600">{meeting.agenda}</p>
                        {meeting.notes && (
                          <div className="mt-2 bg-gray-50 rounded px-3 py-2">
                            <p className="text-xs text-gray-500">{meeting.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
