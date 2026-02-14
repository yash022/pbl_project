import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../lib/api';
import { FolderKanban, Plus, ListTodo, MessageSquare, Users, UserPlus, UserMinus, Lightbulb, CheckCircle2 } from 'lucide-react';

export default function MentorProjects() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [projectForm, setProjectForm] = useState({ title: '', description: '', techStack: '', maxTeamSize: 4 });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
  const [toast, setToast] = useState('');

  const loadProjects = () => {
    apiGet('/projects').then((p) => {
      setProjects(p);
      if (p.length > 0 && !selected) selectProject(p[0]);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadProjects(); }, []);

  const selectProject = async (p) => {
    setSelected(p);
    setShowAddStudent(false);
    try {
      const det = await apiGet(`/projects/${p.id}`);
      setSelected(det);
      const t = await apiGet(`/projects/${p.id}/tasks`);
      setTasks(t);
    } catch {}
  };

  const createProject = async (e) => {
    e.preventDefault();
    try {
      const newProject = await apiPost('/projects', {
        title: projectForm.title,
        description: projectForm.description,
        techStack: projectForm.techStack.split(',').map((s) => s.trim()).filter(Boolean),
        maxTeamSize: parseInt(projectForm.maxTeamSize) || 4,
      });
      setShowProjectForm(false);
      setProjectForm({ title: '', description: '', techStack: '', maxTeamSize: 4 });
      setToast('Project idea created!');
      loadProjects();
      // Select the new project
      selectProject(newProject);
    } catch (err) {
      setToast(err?.error?.message || 'Failed to create project');
    }
    setTimeout(() => setToast(''), 3000);
  };

  const loadAvailableStudents = async () => {
    try {
      const students = await apiGet('/projects/available-students');
      setAvailableStudents(students);
      setShowAddStudent(true);
    } catch {}
  };

  const addStudent = async (studentId) => {
    if (!selected) return;
    try {
      await apiPost(`/projects/${selected.id}/add-student`, { studentId });
      setToast('Student added!');
      setShowAddStudent(false);
      // Refresh project
      const det = await apiGet(`/projects/${selected.id}`);
      setSelected(det);
      loadProjects();
    } catch (err) {
      setToast(err?.error?.message || 'Failed to add student');
    }
    setTimeout(() => setToast(''), 3000);
  };

  const removeStudent = async (studentId) => {
    if (!selected) return;
    if (!confirm('Remove this student from the project?')) return;
    try {
      await apiDelete(`/projects/${selected.id}/remove-student/${studentId}`);
      setToast('Student removed');
      const det = await apiGet(`/projects/${selected.id}`);
      setSelected(det);
      loadProjects();
    } catch (err) {
      setToast(err?.error?.message || 'Failed');
    }
    setTimeout(() => setToast(''), 3000);
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!selected) return;
    try {
      const task = await apiPost(`/projects/${selected.id}/tasks`, {
        ...taskForm,
        assigneeId: taskForm.assigneeId || null,
      });
      setTasks((prev) => [...prev, task]);
      setShowTaskForm(false);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
      setToast('Task created!');
    } catch (err) {
      setToast(err?.error?.message || 'Failed to create task');
    }
    setTimeout(() => setToast(''), 3000);
  };

  const updateTask = async (taskId, updates) => {
    try {
      await apiPatch(`/projects/tasks/${taskId}`, updates);
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, ...updates } : t));
    } catch {}
  };

  const set = (f) => (e) => setTaskForm({ ...taskForm, [f]: e.target.value });
  const setP = (f) => (e) => setProjectForm({ ...projectForm, [f]: e.target.value });

  if (loading) return <div className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-sm text-gray-500">{projects.length} projects</p>
        </div>
        <button onClick={() => setShowProjectForm(!showProjectForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Project Idea
        </button>
      </div>

      {toast && <div className="fixed top-4 right-4 z-50 bg-muj-charcoal text-white px-4 py-3 rounded-lg shadow-lg text-sm">{toast}</div>}

      {/* Create Project Form */}
      {showProjectForm && (
        <div className="card p-5 mb-6 border-l-4 border-l-muj-orange">
          <h2 className="font-bold text-sm mb-4 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-muj-orange" /> Create New Project Idea</h2>
          <form onSubmit={createProject} className="space-y-3">
            <div>
              <label className="label">Project Title *</label>
              <input className="input" placeholder="e.g., AI-Powered Attendance System" value={projectForm.title} onChange={setP('title')} required />
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea className="input min-h-[80px]" placeholder="Describe the project idea, objectives, expected outcomes..." value={projectForm.description} onChange={setP('description')} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Tech Stack (comma-separated)</label>
                <input className="input" placeholder="React, Node.js, MongoDB" value={projectForm.techStack} onChange={setP('techStack')} />
              </div>
              <div>
                <label className="label">Max Team Size</label>
                <input type="number" className="input" min="1" max="10" value={projectForm.maxTeamSize} onChange={setP('maxTeamSize')} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowProjectForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create Project</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Project List */}
        <div className="space-y-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProject(p)}
              className={`w-full text-left card p-3 transition-all ${selected?.id === p.id ? 'border-muj-orange shadow-md' : 'hover:shadow'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold truncate flex-1">{p.title}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.status === 'IDEA' ? 'bg-purple-100 text-purple-700' : p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">{p.members?.filter((m) => m.role === 'STUDENT').length || 0} students · {p.taskCount} tasks</p>
            </button>
          ))}
          {projects.length === 0 && (
            <div className="text-center py-6 text-gray-400">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No projects yet</p>
              <p className="text-xs">Create your first project idea!</p>
            </div>
          )}
        </div>

        {/* Project Detail */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="card p-8 text-center text-gray-500">Select a project</div>
          ) : (
            <div className="space-y-4">
              <div className="card p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-lg font-bold">{selected.title}</h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selected.status === 'IDEA' ? 'bg-purple-100 text-purple-700' : selected.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {selected.status}
                    </span>
                  </div>
                  {selected.maxTeamSize && (
                    <span className="text-xs text-gray-500">
                      Max Team: {selected.maxTeamSize}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{selected.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selected.techStack?.map((t) => <span key={t} className="badge-orange">{t}</span>)}
                </div>

                {/* Team Members */}
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold flex items-center gap-1"><Users className="w-4 h-4" /> Team Members</h3>
                    <button onClick={loadAvailableStudents} className="text-xs text-muj-orange hover:underline flex items-center gap-1">
                      <UserPlus className="w-3.5 h-3.5" /> Add Student
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {selected.members?.map((m) => (
                      <div key={m.userId} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{m.name}</span>
                          <span className="badge-gray text-[9px]">{m.role}</span>
                        </div>
                        {m.role === 'STUDENT' && (
                          <button onClick={() => removeStudent(m.userId)} className="text-gray-400 hover:text-red-500" title="Remove student">
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {(!selected.members || selected.members.filter((m) => m.role === 'STUDENT').length === 0) && (
                      <p className="text-xs text-gray-400 py-1">No students assigned yet. Click "Add Student" to assign.</p>
                    )}
                  </div>
                </div>

                {/* Add Student Panel */}
                {showAddStudent && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Available Students</h4>
                    {availableStudents.length === 0 ? (
                      <p className="text-xs text-gray-400">No unassigned students found</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {availableStudents.map((s) => (
                          <div key={s.id} className="flex items-center justify-between bg-white rounded px-3 py-2">
                            <div>
                              <p className="text-sm font-medium">{s.name}</p>
                              <p className="text-xs text-gray-500">{s.email} · Sem {s.semester}</p>
                            </div>
                            <button onClick={() => addStudent(s.id)} className="btn-primary text-xs px-2.5 py-1">
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setShowAddStudent(false)} className="text-xs text-gray-500 hover:text-gray-700 mt-2">Close</button>
                  </div>
                )}
              </div>

              {/* Tasks */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Tasks ({tasks.length})</h3>
                  <button onClick={() => setShowTaskForm(!showTaskForm)} className="btn-primary text-xs flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Task
                  </button>
                </div>

                {showTaskForm && (
                  <form onSubmit={createTask} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                    <input className="input" placeholder="Task title *" value={taskForm.title} onChange={set('title')} required />
                    <textarea className="input min-h-[60px]" placeholder="Description" value={taskForm.description} onChange={set('description')} />
                    <div className="grid grid-cols-3 gap-2">
                      <select className="input" value={taskForm.priority} onChange={set('priority')}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                      <input type="date" className="input" value={taskForm.dueDate} onChange={set('dueDate')} />
                      <select className="input" value={taskForm.assigneeId} onChange={set('assigneeId')}>
                        <option value="">Unassigned</option>
                        {selected.members?.filter((m) => m.role === 'STUDENT').map((m) => (
                          <option key={m.userId} value={m.userId}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setShowTaskForm(false)} className="btn-secondary text-xs">Cancel</button>
                      <button type="submit" className="btn-primary text-xs">Create Task</button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <div className="flex gap-2 mt-0.5">
                          <span className={`badge text-[10px] ${task.priority === 'HIGH' ? 'badge-red' : task.priority === 'MEDIUM' ? 'badge-yellow' : 'badge-gray'}`}>{task.priority}</span>
                          <span className="text-[10px] text-gray-400">{task.assigneeName || 'Unassigned'}</span>
                        </div>
                      </div>
                      <select
                        value={task.status}
                        onChange={(e) => updateTask(task.id, { status: e.target.value })}
                        className="text-xs border border-gray-200 rounded px-2 py-1"
                      >
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="DONE">DONE</option>
                      </select>
                    </div>
                  ))}
                  {tasks.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No tasks yet</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
