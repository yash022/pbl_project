import { useState, useEffect } from 'react';
import { apiGet } from '../../lib/api';
import { Presentation, Calendar, MapPin } from 'lucide-react';

export default function StudentPresentations() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/presentations/my-slot').then(setSlots).catch(() => []).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">My Presentations</h1>
      <p className="text-sm text-gray-500 mb-6">View your assigned presentation slots</p>

      {slots.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <Presentation className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold">No presentation slots assigned yet</p>
          <p className="text-sm mt-1">Your PBL Faculty will assign you a slot when scheduled.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {slots.map((slot) => (
            <div key={slot.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`badge ${slot.eventType === 'MID_SEM' ? 'badge-blue' : 'badge-orange'} mb-2`}>
                    {slot.eventType === 'MID_SEM' ? 'Mid Semester' : 'End Semester'}
                  </span>
                  <h3 className="font-bold">{slot.eventTitle}</h3>
                  <p className="text-sm text-gray-500">{slot.projectTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(slot.startTime).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {slot.venue}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
