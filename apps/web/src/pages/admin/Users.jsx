import { useState, useEffect } from 'react';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { Search, UserCog, ChevronDown, ChevronUp, Pencil, Save, X } from 'lucide-react';

const ROLES = ['STUDENT', 'MENTOR', 'PBL_FACULTY', 'ADMIN'];
const ROLE_BADGE = {
  STUDENT: 'badge-blue',
  MENTOR: 'badge-green',
  PBL_FACULTY: 'badge-purple',
  ADMIN: 'badge-red',
};

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    apiGet('/admin/users')
      .then((data) => { setUsers(data); setFiltered(data); })
      .finally(() => setLoading(false));
  };
  useEffect(fetchUsers, []);

  useEffect(() => {
    let list = users;
    if (roleFilter !== 'ALL') list = list.filter((u) => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    setFiltered(list);
  }, [search, roleFilter, users]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await apiPatch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (e) {
      alert(e.message || 'Failed to update role');
    }
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditForm({
      specialization: u.specialization || '',
      maxCapacity: u.maxCapacity || 5,
      expertise: (u.expertise || []).join(', '),
    });
  };

  const saveEdit = async (userId) => {
    setSaving(true);
    try {
      await apiPatch(`/admin/mentor-profile/${userId}`, {
        specialization: editForm.specialization,
        maxCapacity: Number(editForm.maxCapacity),
        expertise: editForm.expertise.split(',').map((s) => s.trim()).filter(Boolean),
      });
      fetchUsers();
      setEditingId(null);
    } catch (e) {
      alert(e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card p-12 text-center animate-pulse">Loading users…</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <span className="text-sm text-gray-500">{users.length} total users</span>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10 w-full" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-full sm:w-auto" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="ALL">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-left font-semibold">Department</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    className="text-xs border rounded px-2 py-1"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.department || '—'}</td>
                <td className="px-4 py-3">
                  {u.role === 'MENTOR' && editingId !== u.id && (
                    <button onClick={() => startEdit(u)} className="text-muj-orange hover:underline text-xs flex items-center gap-1">
                      <Pencil className="w-3 h-3" /> Edit Profile
                    </button>
                  )}
                  {editingId === u.id && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => saveEdit(u.id)} disabled={saving} className="text-green-600 hover:underline text-xs flex items-center gap-1">
                        <Save className="w-3 h-3" /> Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:underline text-xs flex items-center gap-1">
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Inline edit row */}
      {editingId && (
        <div className="card p-4 mt-4">
          <h3 className="font-semibold mb-3 text-sm">Edit Mentor Profile — {users.find((u) => u.id === editingId)?.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Specialization</label>
              <input className="input w-full" value={editForm.specialization} onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })} />
            </div>
            <div>
              <label className="label">Max Capacity</label>
              <input className="input w-full" type="number" min={1} max={20} value={editForm.maxCapacity} onChange={(e) => setEditForm({ ...editForm, maxCapacity: e.target.value })} />
            </div>
            <div>
              <label className="label">Expertise (comma-sep)</label>
              <input className="input w-full" value={editForm.expertise} onChange={(e) => setEditForm({ ...editForm, expertise: e.target.value })} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
