import { useState, useEffect } from 'react';
import { apiGet, apiPatch } from '../../lib/api';
import { Shield, Lock, Unlock, AlertTriangle } from 'lucide-react';

const FREEZE_ITEMS = [
  {
    key: 'allocation',
    label: 'Mentor Allocation',
    description: 'When frozen, students cannot send new mentor requests and mentors cannot accept/reject requests.',
    icon: Shield,
  },
  {
    key: 'internalMarks',
    label: 'Internal Marks',
    description: 'When frozen, mentors cannot submit or edit internal evaluation marks.',
    icon: Lock,
  },
  {
    key: 'presentations',
    label: 'Presentation Evaluation',
    description: 'When frozen, PBL faculty cannot submit or edit presentation evaluation scores.',
    icon: Lock,
  },
];

export default function FreezeControls() {
  const [freeze, setFreeze] = useState({ allocation: false, internalMarks: false, presentations: false });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    apiGet('/admin/freeze-settings')
      .then(setFreeze)
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key) => {
    setToggling(key);
    try {
      const res = await apiPatch('/admin/freeze', { [key]: !freeze[key] });
      setFreeze(res);
    } catch (e) {
      alert(e.message || 'Failed to toggle');
    } finally {
      setToggling(null);
    }
  };

  if (loading) return <div className="card p-12 text-center animate-pulse">Loading…</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Freeze Controls</h1>
        <p className="text-sm text-gray-500 mt-1">Toggle system-wide freezes to lock specific operations.</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-yellow-800">
          <strong>Caution:</strong> Freezing an operation blocks all users of the relevant role from performing that action. Make sure to unfreeze when the freeze period is over.
        </div>
      </div>

      <div className="space-y-4">
        {FREEZE_ITEMS.map((item) => {
          const Icon = item.icon;
          const frozen = freeze[item.key];
          return (
            <div key={item.key} className={`card p-6 border-l-4 ${frozen ? 'border-l-red-500' : 'border-l-green-500'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${frozen ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {frozen ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{item.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    <span className={`inline-block mt-2 badge ${frozen ? 'badge-red' : 'badge-green'}`}>
                      {frozen ? 'Frozen' : 'Active'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggle(item.key)}
                  disabled={toggling === item.key}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${
                    frozen
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  } disabled:opacity-50`}
                >
                  {toggling === item.key ? 'Updating…' : frozen ? 'Unfreeze' : 'Freeze'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
