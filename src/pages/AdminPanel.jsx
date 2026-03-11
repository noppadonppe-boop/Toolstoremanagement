import { useState, useEffect } from 'react';
import { collection, doc, updateDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, ROLES } from '../context/AuthContext';
import { deleteUserProfile } from '../services/authService';
import { Shield, Check, X, Clock, Users, RefreshCw, ChevronDown, Trash2, Activity, List } from 'lucide-react';
import { clsx } from 'clsx';

const COLL = 'CMG Tool Store Management';
const ROOT = 'root';
const usersCol = () => collection(db, COLL, ROOT, 'users');
const userDocRef = (uid) => doc(db, COLL, ROOT, 'users', uid);
const activityCol = () => collection(db, COLL, ROOT, 'activityLogs');

const STATUS_BADGE = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-rose-100  text-rose-700',
};
const STATUS_LABEL = { pending: 'รอการอนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ' };

const ACTIVITY_LABEL = { LOGIN: 'เข้าสู่ระบบ', REGISTER: 'สมัครสมาชิก' };

export default function AdminPanel() {
  const { userProfile } = useAuth();
  const [users,       setUsers]       = useState([]);
  const [activities,  setActivities] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('all'); // all | pending | approved | rejected
  const [editingRoles, setEditingRoles] = useState({}); // uid → boolean (dropdown open)
  const [saving,      setSaving]      = useState({});
  const [activeTab,   setActiveTab]   = useState('users'); // 'users' | 'activity'

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

  const updateStatus = async (uid, status) => {
    setSaving(s => ({ ...s, [uid]: true }));
    try {
      await updateDoc(userDocRef(uid), { status });
    } finally {
      setSaving(s => ({ ...s, [uid]: false }));
    }
  };

  const toggleRole = async (uid, role, currentRoles) => {
    const next = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    if (next.length === 0) return; // must keep at least 1 role
    setSaving(s => ({ ...s, [uid]: true }));
    try {
      await updateDoc(userDocRef(uid), { role: next });
    } finally {
      setSaving(s => ({ ...s, [uid]: false }));
    }
  };

  const deleteUser = async (u) => {
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'ผู้ใช้นี้';
    if (!window.confirm(`ต้องการลบผู้ใช้ "${name}" ออกจากระบบใช่หรือไม่? ผู้ใช้จะไม่สามารถเข้าใช้งานได้อีก (บัญชีจะถูกลบจากรายการเท่านั้น)`)) return;
    setSaving(s => ({ ...s, [u.uid]: true }));
    try {
      await deleteUserProfile(u.uid);
    } finally {
      setSaving(s => ({ ...s, [u.uid]: false }));
    }
  };

  const filtered = filter === 'all' ? users : users.filter(u => u.status === filter);

  const stats = {
    total:    users.length,
    pending:  users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
    rejected: users.filter(u => u.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Shield size={20} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Admin Panel</h2>
          <p className="text-slate-500 text-sm">จัดการผู้ใช้งานและบันทึกกิจกรรม</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors -mb-px',
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          )}
        >
          <Users size={18} /> จัดการผู้ใช้
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors -mb-px',
            activeTab === 'activity'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          )}
        >
          <Activity size={18} /> Activity log
        </button>
      </div>

      {activeTab === 'activity' ? (
        /* Activity Log */
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
      ) : (
        <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ผู้ใช้ทั้งหมด', value: stats.total,    color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: 'รออนุมัติ',     value: stats.pending,  color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'อนุมัติแล้ว',   value: stats.approved, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'ปฏิเสธ',        value: stats.rejected, color: 'text-rose-600',  bg: 'bg-rose-50' },
        ].map(s => (
          <div key={s.label} className={clsx('rounded-xl p-4', s.bg)}>
            <p className={clsx('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-slate-600 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              filter === f
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
            )}
          >
            {f === 'all' ? 'ทั้งหมด' : STATUS_LABEL[f]}
            {f !== 'all' && <span className="ml-1.5 opacity-70">{stats[f]}</span>}
          </button>
        ))}
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users size={32} className="mb-3 opacity-40" />
            <p className="text-sm">ไม่มีผู้ใช้ในหมวดนี้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ผู้ใช้</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ตำแหน่ง</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">บทบาท</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">สถานะ</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(u => {
                  const roles = Array.isArray(u.role) ? u.role : [u.role];
                  const initials = [u.firstName?.[0], u.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
                  const isSelf = u.uid === userProfile?.uid;
                  const isSaving = saving[u.uid];
                  const isDropOpen = editingRoles[u.uid];

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-700">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                          {isSelf && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">คุณ</span>}
                        </div>
                      </td>

                      {/* Position */}
                      <td className="px-5 py-4 text-slate-500">{u.position || '—'}</td>

                      {/* Roles */}
                      <td className="px-5 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setEditingRoles(r => ({ ...r, [u.uid]: !r[u.uid] }))}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors text-xs text-slate-600"
                          >
                            <span>{roles.join(', ')}</span>
                            <ChevronDown size={12} />
                          </button>
                          {isDropOpen && (
                            <div className="absolute z-20 top-8 left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-2 w-48 space-y-0.5">
                              {ROLES.map(r => (
                                <label key={r} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={roles.includes(r)}
                                    onChange={() => toggleRole(u.uid, r, roles)}
                                    className="accent-blue-600"
                                  />
                                  <span className="text-xs text-slate-700">{r}</span>
                                </label>
                              ))}
                              <button
                                onClick={() => setEditingRoles(r => ({ ...r, [u.uid]: false }))}
                                className="w-full mt-1 text-xs text-center text-blue-600 hover:underline"
                              >
                                ปิด
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', STATUS_BADGE[u.status])}>
                          {u.status === 'pending' && <Clock size={10} className="inline mr-1" />}
                          {STATUS_LABEL[u.status]}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        {isSelf ? (
                          <span className="text-xs text-slate-400">ไม่สามารถแก้ไขตัวเองได้</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            {u.status !== 'approved' && (
                              <button
                                onClick={() => updateStatus(u.uid, 'approved')}
                                disabled={isSaving}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                              >
                                <Check size={12} /> อนุมัติ
                              </button>
                            )}
                            {u.status !== 'rejected' && (
                              <button
                                onClick={() => updateStatus(u.uid, 'rejected')}
                                disabled={isSaving}
                                className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                              >
                                <X size={12} /> ปฏิเสธ
                              </button>
                            )}
                            <button
                              onClick={() => deleteUser(u)}
                              disabled={isSaving}
                              className="flex items-center gap-1 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                              title="ลบผู้ใช้"
                            >
                              <Trash2 size={12} /> ลบ
                            </button>
                            {isSaving && <RefreshCw size={14} className="text-slate-400 animate-spin" />}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
