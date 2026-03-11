import { useState } from 'react';
import { Wrench, Plus, CheckCircle, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useProjectFilter } from '../hooks/useProjectFilter';
import { ProjectFilterDropdown, ProjectFormSelect } from '../components/ProjectSelector';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table';
import Input, { Select, Textarea } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { uniqueId } from '../utils/ids';

const KANBAN_COLS = [
  { key: 'Pending',     label: 'Pending',     color: 'border-t-amber-400',   bg: 'bg-amber-50' },
  { key: 'In-Progress', label: 'In Progress', color: 'border-t-blue-400',    bg: 'bg-blue-50' },
  { key: 'Completed',   label: 'Completed',   color: 'border-t-emerald-400', bg: 'bg-emerald-50' },
];

export default function RepairsPage() {
  const { currentUser, hasAnyRole } = useAuth();
  const { repairs, tools, sites, addRepair, updateRepair, completeRepair } = useApp();
  const { availableProjects, filterByProject } = useProjectFilter();
  const [view, setView] = useState('kanban');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [completeModal, setCompleteModal] = useState(null);
  const [filterProject, setFilterProject] = useState('all');

  const canManage = hasAnyRole(['StoreSite', 'StoreMain', 'Admin', 'MD']);

  const visibleRepairs = filterByProject(repairs, filterProject).filter(r =>
    hasAnyRole(['Admin', 'MD', 'StoreMain', 'ProcurementManager']) ||
    r.responsibleSiteId === currentUser.siteId || r.ownerSiteId === currentUser.siteId
  );

  const totalCost = visibleRepairs.reduce((s, r) => s + (r.cost || 0), 0);
  const pending = visibleRepairs.filter(r => r.status === 'Pending').length;
  const inProg = visibleRepairs.filter(r => r.status === 'In-Progress').length;
  const done = visibleRepairs.filter(r => r.status === 'Completed').length;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending', val: pending, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'In Progress', val: inProg, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed', val: done, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Cost', val: `฿${totalCost.toLocaleString()}`, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 gap-1">
            {['kanban', 'table'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${view === v ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {v === 'kanban' ? '📋 Kanban' : '📊 Table'}
              </button>
            ))}
          </div>
          <ProjectFilterDropdown projects={availableProjects} value={filterProject} onChange={setFilterProject} />
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Log New Repair
          </Button>
        )}
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {KANBAN_COLS.map(col => {
            const colRepairs = visibleRepairs.filter(r => r.status === col.key);
            return (
              <div key={col.key} className={`bg-white rounded-2xl border-t-4 ${col.color} shadow-sm overflow-hidden`}>
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-700 text-sm">{col.label}</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{colRepairs.length}</span>
                </div>
                <div className="p-3 space-y-3 min-h-48">
                  {colRepairs.length === 0 ? (
                    <div className="text-center py-8 text-slate-300">
                      <Wrench size={24} className="mx-auto mb-2" />
                      <p className="text-xs">No repairs</p>
                    </div>
                  ) : colRepairs.map(r => (
                    <div
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className="bg-slate-50 rounded-xl p-3 border border-slate-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{r.toolName}</p>
                        {r.isBorrowedBreakage && (
                          <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-bold shrink-0">BORROW</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-2 line-clamp-2">{r.issue}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-600">
                          {r.cost > 0 ? `฿${r.cost.toLocaleString()}` : 'Cost TBD'}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.responsibleSiteId === 'HQ' ? 'bg-slate-100 text-slate-600' : 'bg-orange-100 text-orange-700'}`}>
                          ⚠ {r.responsibleSiteId}
                        </span>
                      </div>
                      {r.status !== 'Completed' && canManage && (
                        <div className="mt-2 flex gap-1.5" onClick={e => e.stopPropagation()}>
                          {r.status === 'Pending' && (
                            <Button variant="outline" size="xs" className="flex-1" onClick={() => updateRepair(r.id, { status: 'In-Progress' })}>
                              <Clock size={11} /> Start
                            </Button>
                          )}
                          {r.status === 'In-Progress' && (
                            <Button variant="success" size="xs" className="flex-1" onClick={() => setCompleteModal(r)}>
                              <CheckCircle size={11} /> Complete
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <Table>
            <Thead>
              <tr>
                <Th>Repair ID</Th>
                <Th>Tool</Th>
                <Th>Issue</Th>
                <Th>Reported By</Th>
                <Th>Owner Site</Th>
                <Th>Responsible</Th>
                <Th>Cost</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {visibleRepairs.length === 0 ? (
                <tr><td colSpan={9}><EmptyState title="No repairs logged" icon={Wrench} /></td></tr>
              ) : visibleRepairs.map(r => (
                <Tr key={r.id} onClick={() => setSelected(r)}>
                  <Td><span className="font-mono text-xs font-bold text-amber-600">{r.id}</span></Td>
                  <Td><span className="font-medium text-sm">{r.toolName}</span></Td>
                  <Td><span className="text-xs text-slate-500 max-w-32 truncate block">{r.issue}</span></Td>
                  <Td>{r.reportedByName}</Td>
                  <Td><span className="text-xs font-medium">{r.ownerSiteId}</span></Td>
                  <Td>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.isBorrowedBreakage ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                      {r.isBorrowedBreakage && '⚠️ '}{r.responsibleSiteId}
                    </span>
                  </Td>
                  <Td>
                    <span className={r.cost > 0 ? 'font-bold text-rose-600' : 'text-slate-300'}>
                      {r.cost > 0 ? `฿${r.cost.toLocaleString()}` : 'TBD'}
                    </span>
                  </Td>
                  <Td><Badge status={r.status} /></Td>
                  <Td>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      {r.status === 'Pending' && canManage && (
                        <Button variant="outline" size="xs" onClick={() => updateRepair(r.id, { status: 'In-Progress' })}>
                          <Clock size={12} /> Start
                        </Button>
                      )}
                      {r.status === 'In-Progress' && canManage && (
                        <Button variant="success" size="xs" onClick={() => setCompleteModal(r)}>
                          <CheckCircle size={12} /> Complete
                        </Button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Repair: ${selected?.id}`} size="md">
        {selected && <RepairDetailModal repair={selected} sites={sites} />}
      </Modal>

      {/* Create Repair Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Log New Repair" size="md">
        <CreateRepairModal onClose={() => setShowCreate(false)} />
      </Modal>

      {/* Complete Repair Modal */}
      <Modal open={!!completeModal} onClose={() => setCompleteModal(null)} title="Complete Repair" size="sm">
        {completeModal && (
          <CompleteRepairModal
            repair={completeModal}
            onComplete={(cost, tech) => { completeRepair(completeModal.id, cost, tech); setCompleteModal(null); }}
            onClose={() => setCompleteModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function RepairDetailModal({ repair, sites }) {
  const ownerSite = sites.find(s => s.id === repair.ownerSiteId);
  const respSite = sites.find(s => s.id === repair.responsibleSiteId);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tool Info</p>
          <p className="font-bold text-slate-800">{repair.toolName}</p>
          <p className="text-slate-500">{repair.issue}</p>
          <Badge status={repair.status} />
        </div>
        <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Financial</p>
          <p className="text-2xl font-bold text-rose-600">฿{repair.cost.toLocaleString()}</p>
          {repair.technician && <p className="text-xs text-slate-500">Technician: {repair.technician}</p>}
          <p className="text-xs text-slate-500">Reported: {repair.reportedAt}</p>
          {repair.completedAt && <p className="text-xs text-slate-500">Completed: {repair.completedAt}</p>}
        </div>
      </div>

      <div className={`rounded-xl p-4 border ${repair.isBorrowedBreakage ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-2 text-slate-500">Liability Assignment</p>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400">Tool Owner</p>
            <p className="font-semibold">{ownerSite?.name || repair.ownerSiteId}</p>
          </div>
          <div className="text-slate-300">→</div>
          <div>
            <p className="text-xs text-slate-400">Responsible (Paying)</p>
            <p className={`font-bold ${repair.isBorrowedBreakage ? 'text-rose-600' : 'text-slate-700'}`}>
              {respSite?.name || repair.responsibleSiteId}
              {repair.isBorrowedBreakage && ' (Borrower ⚠️)'}
            </p>
          </div>
        </div>
        {repair.notes && <p className="text-xs text-slate-500 mt-2 italic">{repair.notes}</p>}
      </div>
    </div>
  );
}

function CreateRepairModal({ onClose }) {
  const { currentUser } = useAuth();
  const { tools, sites, addRepair } = useApp();
  const { availableProjects, defaultProjectId } = useProjectFilter();
  const [form, setForm] = useState({ toolId: '', issue: '', responsibleSiteId: currentUser.siteId || 'HQ', cost: '', technician: '', notes: '', projectId: defaultProjectId || '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const brokenTools = tools.filter(t => ['Broken', 'In-Use'].includes(t.status));
  const uid = currentUser?.uid || currentUser?.id;
  const displayName = currentUser?.name || currentUser?.email || '';

  const handleSubmit = async () => {
    if (!form.toolId || !form.issue) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      const tool = tools.find(t => t.id === form.toolId);
      await addRepair({
        id: uniqueId('REP-'),
        toolId: form.toolId,
        toolName: tool?.name || form.toolId,
        issue: form.issue,
        reportedBy: uid || '',
        reportedByName: displayName,
        reportedAt: new Date().toISOString().split('T')[0],
        responsibleSiteId: form.responsibleSiteId || currentUser?.siteId || 'HQ',
        ownerSiteId: tool?.ownerSiteId || 'HQ',
        cost: parseFloat(form.cost) || 0,
        technician: form.technician || null,
        status: 'Pending',
        completedAt: null,
        notes: form.notes || '',
        isBorrowedBreakage: tool?.borrowedBySiteId ? true : false,
        projectId: form.projectId || null,
      });
      onClose();
    } catch (err) {
      console.error('[Repairs] addRepair failed:', err);
      setSubmitError(err?.message || 'บันทึกไม่สำเร็จ กรุณาตรวจสอบสิทธิ์หรือเครือข่าย');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Select label="Tool *" value={form.toolId} onChange={e => setForm(f => ({ ...f, toolId: e.target.value }))}>
        <option value="">Select a tool...</option>
        {brokenTools.map(t => <option key={t.id} value={t.id}>{t.name} ({t.id})</option>)}
      </Select>
      <Input label="Issue Description *" value={form.issue} onChange={e => setForm(f => ({ ...f, issue: e.target.value }))} placeholder="Describe the problem..." />
      <Select label="Responsible Site" value={form.responsibleSiteId} onChange={e => setForm(f => ({ ...f, responsibleSiteId: e.target.value }))}>
        {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Estimated Cost (฿)" type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="0" />
        <Input label="Technician / Vendor" value={form.technician} onChange={e => setForm(f => ({ ...f, technician: e.target.value }))} placeholder="Name or company" />
      </div>
      <ProjectFormSelect projects={availableProjects} value={form.projectId} onChange={v => setForm(f => ({ ...f, projectId: v }))} label="โครงการ" />
      <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
      {submitError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">
          {submitError}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!form.toolId || !form.issue || submitting}>
          {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={15} />}
          {submitting ? 'กำลังบันทึก...' : 'Log Repair'}
        </Button>
      </div>
    </div>
  );
}

function CompleteRepairModal({ repair, onComplete, onClose }) {
  const [cost, setCost] = useState(repair.cost || '');
  const [tech, setTech] = useState(repair.technician || '');
  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
        <p className="text-sm font-semibold text-emerald-700">Completing repair for: {repair.toolName}</p>
        <p className="text-xs text-slate-500 mt-0.5">{repair.issue}</p>
      </div>
      <Input label="Final Cost (฿) *" type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="Enter final repair cost" />
      <Input label="Technician / Vendor *" value={tech} onChange={e => setTech(e.target.value)} placeholder="Who performed the repair?" />
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
        On completion, the tool status will return to <strong>Available</strong> and the repair cost will be logged against <strong>{repair.responsibleSiteId}</strong>.
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button variant="success" onClick={() => onComplete(parseFloat(cost) || 0, tech)} disabled={!cost || !tech} className="flex-1">
          <CheckCircle size={15} /> Mark as Repaired
        </Button>
      </div>
    </div>
  );
}
