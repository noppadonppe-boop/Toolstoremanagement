import { useState } from 'react';
import { FolderKanban, Plus, Pencil, Trash2, Check, X, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input, { Textarea } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { uniqueId } from '../utils/ids';
import { clsx } from 'clsx';

const STATUS_OPTIONS = [
  { value: 'active', label: 'ใช้งาน', color: 'bg-green-100 text-green-700' },
  { value: 'completed', label: 'เสร็จสิ้น', color: 'bg-blue-100 text-blue-700' },
  { value: 'archived', label: 'เก็บถาวร', color: 'bg-slate-100 text-slate-600' },
];

export default function ProjectsPage() {
  const { projects, addProject, updateProject, deleteProject } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = filterStatus === 'all'
    ? projects
    : projects.filter(p => p.status === filterStatus);

  const sorted = [...filtered].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const handleDelete = async (project) => {
    if (!window.confirm(`ต้องการลบโครงการ "${project.name}" ใช่หรือไม่?\nข้อมูลที่ผูกกับโครงการนี้จะยังอยู่ แต่จะไม่มีโครงการอ้างอิง`)) return;
    await deleteProject(project.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <FolderKanban size={20} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">จัดการโครงการ</h2>
            <p className="text-slate-500 text-sm">เพิ่ม แก้ไข และจัดการโครงการทั้งหมด</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> เพิ่มโครงการ
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: 'all', label: 'ทั้งหมด' }, ...STATUS_OPTIONS].map(s => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(s.value)}
            className={clsx(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              filterStatus === s.value
                ? 'bg-violet-600 text-white shadow'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300'
            )}
          >
            {s.label}
            {s.value !== 'all' && (
              <span className="ml-1.5 opacity-70">
                {projects.filter(p => p.status === s.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'โครงการทั้งหมด', value: projects.length, bg: 'bg-violet-50', color: 'text-violet-600' },
          { label: 'ใช้งาน', value: projects.filter(p => p.status === 'active').length, bg: 'bg-green-50', color: 'text-green-600' },
          { label: 'เสร็จสิ้น', value: projects.filter(p => p.status === 'completed').length, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'เก็บถาวร', value: projects.filter(p => p.status === 'archived').length, bg: 'bg-slate-50', color: 'text-slate-600' },
        ].map(s => (
          <div key={s.label} className={clsx('rounded-xl p-4', s.bg)}>
            <p className={clsx('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-slate-600 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Project Cards */}
      {sorted.length === 0 ? (
        <EmptyState
          title="ยังไม่มีโครงการ"
          description="เพิ่มโครงการใหม่เพื่อเริ่มจัดการข้อมูลแยกตามโครงการ"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(project => {
            const statusObj = STATUS_OPTIONS.find(s => s.value === project.status) || STATUS_OPTIONS[0];
            return (
              <div key={project.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                      <FolderKanban size={16} className="text-violet-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800 line-clamp-1">{project.name}</h3>
                  </div>
                  <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap', statusObj.color)}>
                    {statusObj.label}
                  </span>
                </div>

                {project.description && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{project.description}</p>
                )}

                {project.code && (
                  <p className="text-xs text-slate-400 mb-3 font-mono">รหัส: {project.code}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                  <Calendar size={12} />
                  <span>สร้างเมื่อ {project.createdAt || '—'}</span>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setEditProject(project)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Pencil size={12} /> แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(project)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} /> ลบ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="เพิ่มโครงการใหม่" size="md">
        <ProjectForm
          onClose={() => setShowCreate(false)}
          onSave={async (data) => {
            await addProject({ ...data, id: uniqueId('PRJ-'), createdAt: new Date().toISOString().split('T')[0] });
            setShowCreate(false);
          }}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editProject} onClose={() => setEditProject(null)} title="แก้ไขโครงการ" size="md">
        {editProject && (
          <ProjectForm
            initial={editProject}
            onClose={() => setEditProject(null)}
            onSave={async (data) => {
              await updateProject(editProject.id, data);
              setEditProject(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function ProjectForm({ initial, onClose, onSave }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    code: initial?.code || '',
    description: initial?.description || '',
    status: initial?.status || 'active',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('กรุณาระบุชื่อโครงการ');
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="ชื่อโครงการ *"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        placeholder="เช่น โครงการก่อสร้างอาคาร A"
      />
      <Input
        label="รหัสโครงการ"
        value={form.code}
        onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
        placeholder="เช่น PRJ-001"
      />
      <Textarea
        label="รายละเอียด"
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        placeholder="รายละเอียดโครงการ..."
        rows={3}
      />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">สถานะ</label>
        <select
          value={form.status}
          onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">{error}</div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} disabled={submitting}>ยกเลิก</Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'กำลังบันทึก...' : <><Check size={16} /> {initial ? 'อัปเดต' : 'เพิ่มโครงการ'}</>}
        </Button>
      </div>
    </div>
  );
}
