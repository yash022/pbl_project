import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPatch } from '../../lib/api';
import { CheckCircle2, Clock, Circle, AlertTriangle } from 'lucide-react';

const STATUS_ICON = {
  TODO: Circle,
  IN_PROGRESS: Clock,
  DONE: CheckCircle2,
};

const STATUS_STYLE = {
  TODO: 'badge-gray',
  IN_PROGRESS: 'badge-blue',
  DONE: 'badge-green',
};

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/projects').then((projs) => {
      setProjects(projs);
      if (projs.length > 0) {
        apiGet(`/projects/${projs[0].id}/tasks`).then(setTasks);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (taskId, status) => {
    try {
      await apiPatch(`/projects/tasks/${taskId}`, { status });
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status } : t));
    } catch {}
  };

  const filtered = filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);
  const myTasks = filtered.filter((t) => t.assigneeId === user.id);
  const otherTasks = filtered.filter((t) => t.assigneeId !== user.id);
  const overdue = tasks.filter((t) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date());

  if (loading) return <div className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-gray-500">{tasks.length} total tasks · {overdue.length} overdue</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['ALL', 'TODO', 'IN_PROGRESS', 'DONE'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
              filter === s ? 'bg-muj-orange text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-muj-orange'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {overdue.length > 0 && filter === 'ALL' && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4" />
          {overdue.length} overdue task(s)
        </div>
      )}

      {/* My Tasks */}
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Assigned to Me</h2>
      {myTasks.length === 0 ? (
        <p className="text-sm text-gray-400 mb-6">No tasks assigned to you</p>
      ) : (
        <div className="space-y-2 mb-8">
          {myTasks.map((task) => {
            const Icon = STATUS_ICON[task.status] || Circle;
            const isOverdue = task.status !== 'DONE' && task.dueDate && new Date(task.dueDate) < new Date();
            return (
              <div key={task.id} className={`card px-4 py-3 ${isOverdue ? 'border-red-300 bg-red-50/50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${task.status === 'DONE' ? 'text-green-500' : task.status === 'IN_PROGRESS' ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-sm font-semibold">{task.title}</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className={`badge text-[10px] ${task.priority === 'HIGH' ? 'badge-red' : task.priority === 'MEDIUM' ? 'badge-yellow' : 'badge-gray'}`}>
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className={`text-[10px] ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <select
                    value={task.status}
                    onChange={(e) => updateStatus(task.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1"
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="DONE">DONE</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Other Tasks */}
      {otherTasks.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Other Tasks</h2>
          <div className="space-y-2">
            {otherTasks.map((task) => {
              const Icon = STATUS_ICON[task.status] || Circle;
              return (
                <div key={task.id} className="card px-4 py-3 opacity-70">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${task.status === 'DONE' ? 'text-green-500' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <span className="text-[10px] text-gray-400">Assigned to: {task.assigneeName || 'Unassigned'}</span>
                    </div>
                    <span className={`ml-auto badge ${STATUS_STYLE[task.status]}`}>{task.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
