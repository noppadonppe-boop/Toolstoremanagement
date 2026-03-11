import { FolderKanban } from 'lucide-react';

/**
 * Reusable project filter dropdown for page toolbars.
 * Shows "ทุกโครงการ" (All) option + list of available projects.
 */
export function ProjectFilterDropdown({ projects, value, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <FolderKanban size={14} className="text-violet-500 shrink-0" />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
      >
        <option value="all">ทุกโครงการ</option>
        {(!projects || projects.length === 0) ? (
          <option disabled>— ยังไม่มีโครงการ —</option>
        ) : projects.map(p => (
          <option key={p.id} value={p.id}>{p.name}{p.code ? ` (${p.code})` : ''}</option>
        ))}
      </select>
    </div>
  );
}

/**
 * Project selector for creation/edit forms.
 * If only one project, auto-selects it.
 */
export function ProjectFormSelect({ projects, value, onChange, required = false, label = 'โครงการ' }) {
  if (!projects || projects.length === 0) {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <p className="text-xs text-slate-400 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
          ยังไม่มีโครงการ — ให้ Admin เพิ่มโครงการก่อน
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && '*'}
      </label>
      <div className="relative">
        <FolderKanban size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-500" />
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
        >
          <option value="">— เลือกโครงการ —</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}{p.code ? ` (${p.code})` : ''}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
