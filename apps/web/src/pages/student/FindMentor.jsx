import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPost, apiPatch } from '../../lib/api';
import { Users, Send, X, Check, Clock, Star, Lightbulb, FolderKanban } from 'lucide-react';

export default function FindMentor() {
  const { user } = useAuth();
  const [tab, setTab] = useState('mentors');
  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [projectIdeas, setProjectIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');

  const load = () => {
    Promise.all([
      apiGet('/mentors').catch(() => []),
      apiGet('/mentors/requests').catch(() => []),
      apiGet('/projects/ideas').catch(() => []),
    ]).then(([m, r, ideas]) => {
      setMentors(m);
      setRequests(r);
      setProjectIdeas(ideas);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const hasMentor = requests.some((r) => r.status === 'ACCEPTED');
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  const sendRequest = async () => {
    if (!selectedMentor) return;
    setSending(true);
    try {
      await apiPost('/mentors/requests', { mentorId: selectedMentor.id, message });
      setToast('Request sent successfully!');
      setSelectedMentor(null);
      setMessage('');
      load();
    } catch (err) {
      setToast(err?.error?.message || 'Failed to send request');
    } finally {
      setSending(false);
      setTimeout(() => setToast(''), 3000);
    }
  };

  const withdrawRequest = async (id) => {
    try {
      await apiPatch(`/mentors/requests/${id}`, { status: 'WITHDRAWN' });
      load();
    } catch {}
  };

  if (loading) return <div className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Find Mentor</h1>
      <p className="text-sm text-gray-500 mb-6">Browse mentors and project ideas</p>

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-muj-charcoal text-white px-4 py-3 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      {hasMentor && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-6 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> You already have a mentor assigned.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('mentors')}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${tab === 'mentors' ? 'bg-white shadow text-muj-charcoal' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users className="w-4 h-4 inline mr-1.5" />Mentors
        </button>
        <button
          onClick={() => setTab('projects')}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${tab === 'projects' ? 'bg-white shadow text-muj-charcoal' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Lightbulb className="w-4 h-4 inline mr-1.5" />Project Ideas ({projectIdeas.length})
        </button>
      </div>

      {/* My Requests */}
      {requests.length > 0 && tab === 'mentors' && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">My Requests</h2>
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req.id} className="card px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{req.mentorName}</p>
                  <p className="text-xs text-gray-500">{req.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${
                    req.status === 'PENDING' ? 'badge-yellow' :
                    req.status === 'ACCEPTED' ? 'badge-green' :
                    req.status === 'REJECTED' ? 'badge-red' : 'badge-gray'
                  }`}>{req.status}</span>
                  {req.status === 'PENDING' && (
                    <button onClick={() => withdrawRequest(req.id)} className="text-gray-400 hover:text-red-500" title="Withdraw">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-1">Request Mentor</h3>
            <p className="text-sm text-gray-500 mb-4">Sending request to {selectedMentor.name}</p>
            <div className="mb-4">
              <label className="label">Project Interest / Message</label>
              <textarea
                className="input min-h-[80px]"
                placeholder="Briefly describe your project idea or area of interest..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setSelectedMentor(null); setMessage(''); }} className="btn-secondary">Cancel</button>
              <button onClick={sendRequest} disabled={sending} className="btn-primary">
                {sending ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Mentors */}
      {tab === 'mentors' && (
        <>
          <h2 className="text-lg font-bold mb-3">Available Mentors</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {mentors.map((mentor) => {
              const alreadyRequested = requests.some((r) => r.mentorId === mentor.id && r.status === 'PENDING');
              return (
                <div key={mentor.id} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold">{mentor.name}</h3>
                      <p className="text-xs text-gray-500">{mentor.email}</p>
                      <p className="text-xs text-gray-500">{mentor.department}</p>
                    </div>
                    <div className={`badge ${mentor.acceptingRequests ? 'badge-green' : 'badge-red'}`}>
                      {mentor.acceptingRequests ? 'Accepting' : 'Not Accepting'}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {mentor.specialization?.map((tag) => (
                      <span key={tag} className="badge-orange text-[10px]">{tag}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Slots: <strong>{mentor.remainingSlots}</strong> / {mentor.capacity}
                    </span>
                    <button
                      onClick={() => setSelectedMentor(mentor)}
                      disabled={hasMentor || !mentor.acceptingRequests || mentor.remainingSlots <= 0 || alreadyRequested || pendingCount >= 3}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      {alreadyRequested ? 'Requested' : 'Send Request'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {pendingCount >= 3 && !hasMentor && (
            <p className="text-xs text-red-500 mt-4">You have reached the maximum of 3 pending requests.</p>
          )}
        </>
      )}

      {/* Tab: Project Ideas */}
      {tab === 'projects' && (
        <>
          <h2 className="text-lg font-bold mb-3">Project Ideas from Mentors</h2>
          {projectIdeas.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-semibold">No project ideas posted yet</p>
              <p className="text-xs mt-1">Check back later or browse available mentors</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {projectIdeas.map((project) => (
                <div key={project.id} className="card p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold">{project.title}</h3>
                      <p className="text-xs text-gray-500">by {project.mentorName} · {project.mentorEmail}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      project.status === 'IDEA' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">{project.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.techStack?.map((t) => (
                      <span key={t} className="badge-orange text-[10px]">{t}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="text-xs text-gray-500">
                      <span className="font-semibold">{project.studentCount}</span> / {project.maxTeamSize || 4} students
                      {project.slotsAvailable > 0 && (
                        <span className="ml-2 text-green-600 font-semibold">({project.slotsAvailable} slots open)</span>
                      )}
                      {project.slotsAvailable <= 0 && (
                        <span className="ml-2 text-red-500 font-semibold">(Full)</span>
                      )}
                    </div>
                  </div>

                  {/* Show current team */}
                  {project.members?.filter((m) => m.role === 'STUDENT').length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      Team: {project.members.filter((m) => m.role === 'STUDENT').map((m) => m.name).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
