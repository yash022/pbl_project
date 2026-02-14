import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { ClipboardCheck } from 'lucide-react';

const CRITERIA = ['attendance', 'diaryConsistency', 'progressShown', 'contribution'];

export default function MentorEvaluation() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetail, setProjectDetail] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    apiGet('/projects').then((p) => {
      setProjects(p);
      if (p.length > 0) selectProject(p[0]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const selectProject = async (p) => {
    setSelectedProject(p);
    try {
      const det = await apiGet(`/projects/${p.id}`);
      setProjectDetail(det);
      const evals = await apiGet(`/evaluations/${p.id}/internal-evaluations`);
      setEvaluations(evals);
    } catch {}
  };

  const startEval = (studentId, studentName) => {
    const existing = evaluations.find((e) => e.studentId === studentId);
    setForm({
      studentId,
      studentName,
      criteria: existing?.criteriaJson || { attendance: 0, diaryConsistency: 0, progressShown: 0, contribution: 0 },
      totalScore: existing?.totalScore || 0,
      remarks: existing?.remarks || '',
    });
  };

  const submitEval = async () => {
    if (!selectedProject || !form) return;
    try {
      const total = Object.values(form.criteria).reduce((a, b) => a + Number(b), 0);
      await apiPost(`/evaluations/${selectedProject.id}/internal-evaluations`, {
        studentId: form.studentId,
        criteria: form.criteria,
        totalScore: total,
        remarks: form.remarks,
      });
      setToast('Evaluation saved!');
      selectProject(selectedProject);
      setForm(null);
    } catch (err) {
      setToast(err?.error?.message || 'Failed');
    }
    setTimeout(() => setToast(''), 3000);
  };

  if (loading) return <div className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>;

  const students = projectDetail?.members?.filter((m) => m.role === 'STUDENT') || [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Internal Evaluation</h1>
      <p className="text-sm text-gray-500 mb-6">Enter internal marks for your students</p>

      {toast && <div className="fixed top-4 right-4 z-50 bg-muj-charcoal text-white px-4 py-3 rounded-lg shadow-lg text-sm">{toast}</div>}

      {/* Project Selector */}
      {projects.length > 1 && (
        <div className="flex gap-2 mb-6">
          {projects.map((p) => (
            <button key={p.id} onClick={() => selectProject(p)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold ${selectedProject?.id === p.id ? 'bg-muj-orange text-white' : 'bg-white border border-gray-200'}`}>
              {p.title}
            </button>
          ))}
        </div>
      )}

      {/* Evaluation Modal */}
      {form && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-1">Evaluate: {form.studentName}</h3>
            <p className="text-sm text-gray-500 mb-4">Score each criterion (0-25)</p>
            <div className="space-y-3 mb-4">
              {CRITERIA.map((c) => (
                <div key={c} className="flex items-center justify-between gap-4">
                  <label className="text-sm font-medium capitalize flex-1">{c.replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    type="number" min="0" max="25"
                    className="input w-24 text-center"
                    value={form.criteria[c]}
                    onChange={(e) => setForm({ ...form, criteria: { ...form.criteria, [c]: Number(e.target.value) } })}
                  />
                </div>
              ))}
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-bold">Total</span>
                <span className="text-lg font-bold text-muj-orange">{Object.values(form.criteria).reduce((a, b) => a + Number(b), 0)} / 100</span>
              </div>
            </div>
            <div className="mb-4">
              <label className="label">Remarks</label>
              <textarea className="input min-h-[60px]" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setForm(null)} className="btn-secondary">Cancel</button>
              <button onClick={submitEval} className="btn-primary">Save Evaluation</button>
            </div>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Student</th>
              {CRITERIA.map((c) => (
                <th key={c} className="text-center text-xs font-semibold text-gray-500 px-3 py-3 capitalize">{c.replace(/([A-Z])/g, ' $1')}</th>
              ))}
              <th className="text-center text-xs font-semibold text-gray-500 px-3 py-3">Total</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const ev = evaluations.find((e) => e.studentId === s.userId);
              return (
                <tr key={s.userId} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium">{s.name}</td>
                  {CRITERIA.map((c) => (
                    <td key={c} className="text-center text-sm px-3 py-3">{ev?.criteriaJson?.[c] ?? '-'}</td>
                  ))}
                  <td className="text-center text-sm font-bold px-3 py-3">{ev?.totalScore ?? '-'}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => startEval(s.userId, s.name)} className="btn-primary text-xs px-3 py-1">
                      {ev ? 'Edit' : 'Evaluate'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr><td colSpan={7} className="text-center py-6 text-sm text-gray-400">No students in this project</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
