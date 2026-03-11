import { useState, useEffect, useMemo } from 'react';
import { collection, doc, updateDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, ROLES } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { deleteUserProfile } from '../services/authService';
import { Shield, Search, Users, RefreshCw, Trash2, Activity, List, Pencil, X } from 'lucide-react';
import { clsx } from 'clsx';

const COLL = 'CMG Tool Store Management';
const ROOT = 'root';
const usersCol = () => collection(db, COLL, ROOT, 'users');
const userDocRef = (uid) => doc(db, COLL, ROOT, 'users', uid);
const activityCol = () => collection(db, COLL, ROOT, 'activityLogs');

const ACTIVITY_LABEL = { LOGIN: 'เข้าสู่ระบบ', REGISTER: 'สมัครสมาชิก' };

export default function AdminPanel() {
  const { userProfile } = useAuth();
  const { projects } = useApp();
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(usersCol(), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(activityCol(), orderBy('timestamp', 'desc'), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const updateField = async (uid, field, value) => {
    setSaving(s => ({ ...s, [uid]: true }));
    try {
      await updateDoc(userDocRef(uid), { [field]: value });
    } finally {
      setSaving(s => ({ ...s, [uid]: false }));
    }
  };

  const toggleProject = async (uid, projectId, currentProjects) => {
    const next = currentProjects.includes(projectId)
      ? currentProjects.filter(p => p !== projectId)
      : [...currentProjects, projectId];
    await updateField(uid, 'assignedProjects', next);
  };

  const deleteUser = async (u) => {
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'ผู้ใช้นี้';
    if (!window.confirm(`ต้องการลบผู้ใช้ "${name}" ออกจากระบบใช่หรือไม่?\nผู้ใช้จะไม่สามารถเข้าใช้งานได้อีก`)) return;
    setSaving(s => ({ ...s, [u.uid]: true }));
    try {
      await deleteUserProfile(u.uid);
    } finally {
      setSaving(s => ({ ...s, [u.uid]: false }));
    }
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u => {
      const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const roles = Array.isArray(u.role) ? u.role.join(' ').toLowerCase() : (u.role || '').toLowerCase();
      return (
        name.includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.position || '').toLowerCase().includes(q) ||
        roles.includes(q)
      );
    });
  }, [users, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Admin Panel</h2>
            <p className="text-slate-500 text-sm">Manage users, roles, and view activity logs.</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{users.length}</p>
          <p className="text-xs text-slate-500 font-medium">Total Users</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl overflow-hidden border border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-colors',
            activeTab === 'users'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-500 hover:bg-slate-50'
          )}
        >
          <Users size={18} /> User Management
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-colors',
            activeTab === 'activity'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-500 hover:bg-slate-50'
          )}
        >
          <Activity size={18} /> Log การใช้งาน
        </button>
      </div>

      {activeTab === 'activity' ? (
        <ActivityLogSection activities={activities} />
      ) : (
        <>
          {/* Search */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700">ค้นหาผู้ใช้งาน</p>
              <p className="text-xs text-slate-400">แสดง {filtered.length} / {users.length} คน</p>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="พิมพ์ชื่อ, อีเมล, ตำแหน่ง หรือ Role..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-slate-400"
              />
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Users size={32} className="mb-3 opacity-40" />
                <p className="text-sm">ไม่พบผู้ใช้ที่ตรงกับการค้นหา</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Position</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map(u => (
                      <UserRow
                        key={u.id}
                        user={u}
                        isSelf={u.uid === userProfile?.uid}
                        isSaving={saving[u.uid]}
                        projects={projects}
                        onUpdateField={updateField}
                        onToggleProject={toggleProject}
                        onDelete={deleteUser}
                        onEdit={setEditingUser}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          projects={projects}
          onClose={() => setEditingUser(null)}
          onSave={async (uid, updates) => {
            setSaving(s => ({ ...s, [uid]: true }));
            try {
              await updateDoc(userDocRef(uid), updates);
            } finally {
              setSaving(s => ({ ...s, [uid]: false }));
            }
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}

function UserRow({ user: u, isSelf, isSaving, projects, onUpdateField, onToggleProject, onDelete, onEdit }) {
  const roles = Array.isArray(u.role) ? u.role : [u.role];
  const userProjects = Array.isArray(u.assignedProjects) ? u.assignedProjects : [];
  const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || '—';

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      {/* Name */}
      <td className="px-5 py-3.5">
        <span className="font-semibold text-slate-800">{fullName}</span>
      </td>

      {/* Email */}
      <td className="px-5 py-3.5 text-slate-500 text-xs">{u.email || '—'}</td>

      {/* Position */}
      <td className="px-5 py-3.5 text-slate-500">{u.position || '—'}</td>

      {/* Status — dropdown */}
      <td className="px-5 py-3.5">
        <select
          value={u.status || 'pending'}
          onChange={e => onUpdateField(u.uid, 'status', e.target.value)}
          disabled={isSelf || isSaving}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-auto',
            u.status === 'approved' && 'bg-green-100 text-green-700',
            u.status === 'pending' && 'bg-amber-100 text-amber-700',
            u.status === 'rejected' && 'bg-rose-100 text-rose-700',
            isSelf && 'opacity-60 cursor-not-allowed',
          )}
        >
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </td>

      {/* Role — dropdown */}
      <td className="px-5 py-3.5">
        <select
          value={roles[0] || 'Supervisor'}
          onChange={e => onUpdateField(u.uid, 'role', [e.target.value])}
          disabled={isSelf || isSaving}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400',
            isSelf && 'opacity-60 cursor-not-allowed',
          )}
        >
          {ROLES.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </td>

      {/* Projects — tags */}
      <td className="px-5 py-3.5">
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {userProjects.length === 0 ? (
            <span className="text-xs text-slate-300">—</span>
          ) : (
            userProjects.map(pid => {
              const p = projects.find(pr => pr.id === pid);
              return (
                <span key={pid} className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                  {p?.code || p?.name || pid}
                </span>
              );
            })
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5">
        {isSelf ? (
          <span className="text-xs text-slate-300">—</span>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(u)}
              disabled={isSaving}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              onClick={() => onDelete(u)}
              disabled={isSaving}
              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors disabled:opacity-50"
              title="ลบผู้ใช้"
            >
              <Trash2 size={14} />
            </button>
            {isSaving && <RefreshCw size={14} className="text-slate-400 animate-spin" />}
          </div>
        )}
      </td>
    </tr>
  );
}

function EditUserModal({ user, projects, onClose, onSave }) {
  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    position: user.position || '',
    status: user.status || 'pending',
    role: [...roles],
    assignedProjects: Array.isArray(user.assignedProjects) ? [...user.assignedProjects] : [],
  });
  const [submitting, setSubmitting] = useState(false);

  const toggleRole = (role) => {
    setForm(f => {
      const next = f.role.includes(role) ? f.role.filter(r => r !== role) : [...f.role, role];
      return { ...f, role: next.length > 0 ? next : f.role };
    });
  };

  const toggleProject = (pid) => {
    setForm(f => ({
      ...f,
      assignedProjects: f.assignedProjects.includes(pid)
        ? f.assignedProjects.filter(p => p !== pid)
        : [...f.assignedProjects, pid],
    }));
  };

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSave(user.uid, form);
    } finally {
      setSubmitting(false);
    }
  };

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">แก้ไขผู้ใช้งาน</h3>
            <p className="text-xs text-slate-400">{fullName} — {user.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">ชื่อ</label>
              <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">นามสกุล</label>
              <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">ตำแหน่ง</label>
            <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
              placeholder="เช่น วิศวกร, ช่างเทคนิค..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">สถานะ</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="approved">Approved (อนุมัติแล้ว)</option>
              <option value="pending">Pending (รออนุมัติ)</option>
              <option value="rejected">Rejected (ปฏิเสธ)</option>
            </select>
          </div>

          {/* Roles — multi-select */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">บทบาท (เลือกได้หลายบทบาท)</label>
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => toggleRole(r)}
                  className={clsx(
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
                    form.role.includes(r)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Projects — multi-select */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">โครงการ</label>
            {projects.filter(p => p.status === 'active').length === 0 ? (
              <p className="text-xs text-slate-400">ยังไม่มีโครงการ — ไปเพิ่มที่เมนูโครงการ</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {projects.filter(p => p.status === 'active').map(p => (
                  <button
                    key={p.id}
                    onClick={() => toggleProject(p.id)}
                    className={clsx(
                      'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
                      form.assignedProjects.includes(p.id)
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                    )}
                  >
                    {p.name}{p.code ? ` (${p.code})` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} disabled={submitting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50">
            ยกเลิก
          </button>
          <button onClick={handleSave} disabled={submitting}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">
            {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityLogSection({ activities }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
        <List size={18} className="text-slate-500" />
        <span className="font-medium text-slate-700">บันทึกการเข้าสู่ระบบและสมัครสมาชิก (ล่าสุด 200 รายการ)</span>
      </div>
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Activity size={32} className="mb-3 opacity-40" />
          <p className="text-sm">ยังไม่มีบันทึกกิจกรรม</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">วันเวลา</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">การกระทำ</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">อีเมล</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">วิธี / รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activities.map((a) => {
                const ts = a.timestamp?.toDate?.() ?? (a.timestamp?.seconds != null ? new Date(a.timestamp.seconds * 1000) : null);
                const timeStr = ts ? ts.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '—';
                const method = a.method ? (a.method === 'google' ? 'Google' : a.method === 'email' ? 'อีเมล' : a.method) : '—';
                const extra = a.isFirstUser ? ' (ผู้ใช้แรก)' : '';
                return (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{timeStr}</td>
                    <td className="px-5 py-3">
                      <span className={clsx(
                        'text-xs px-2.5 py-1 rounded-full font-medium',
                        a.action === 'LOGIN' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      )}>
                        {ACTIVITY_LABEL[a.action] ?? a.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{a.email || '—'}</td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-xs">{a.userId || '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{method}{extra}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
