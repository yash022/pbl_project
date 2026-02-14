import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiGet } from '../../lib/api';
import { CalendarDays, Presentation, ClipboardCheck, LayoutDashboard } from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/presentations/events').then(setEvents).catch(() => []).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>)}</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
        <p className="text-sm text-gray-500">PBL Faculty Dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{events.length}</p>
              <p className="text-xs text-gray-500">Events Created</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Presentation className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{events.reduce((acc, e) => acc + (e.slotCount || 0), 0)}</p>
              <p className="text-xs text-gray-500">Total Slots</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{events.filter(e => e.locked).length}</p>
              <p className="text-xs text-gray-500">Locked Events</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Create Event', to: '/faculty/events', icon: CalendarDays, color: 'bg-purple-50 text-purple-600' },
          { label: 'Manage Slots', to: '/faculty/slots', icon: Presentation, color: 'bg-blue-50 text-blue-600' },
          { label: 'Evaluation', to: '/faculty/evaluation', icon: ClipboardCheck, color: 'bg-green-50 text-green-600' },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.to} to={a.to} className="card p-4 hover:shadow-md transition-shadow flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${a.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold">{a.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Recent Events */}
      <h2 className="text-lg font-bold mb-3">Recent Events</h2>
      {events.length === 0 ? (
        <div className="card p-6 text-center text-gray-500 text-sm">No events created yet. Go to Events to create one.</div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${event.type === 'MID_SEM' ? 'badge-blue' : 'badge-orange'}`}>{event.type}</span>
                    {event.locked && <span className="badge-red">Locked</span>}
                  </div>
                  <h3 className="font-bold">{event.title}</h3>
                  <p className="text-xs text-gray-500">{new Date(event.startDate).toLocaleDateString()} · {event.slotCount} slots · {event.durationMinutes}min each</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
