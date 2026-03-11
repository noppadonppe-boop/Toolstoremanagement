import { useState } from 'react';
import { Plus, CheckCircle, XCircle, Truck, ArrowRight, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table';
import Input, { Select, Textarea } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { uniqueId } from '../utils/ids';

const TYPE_LABELS = {
  ProjectSetup: { label: 'Project Setup (HQ→Site)', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  ProjectClosure: { label: 'Project Closure (Site→HQ)', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  DailyBooking: { label: 'Daily Booking', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  InterSiteBorrow: { label: 'Inter-Site Borrow', color: 'bg-amber-50 text-amber-700 border-amber-100' },
};

export default function RequisitionsPage() {
  const { currentUser, hasAnyRole } = useAuth();
  const { requests, sites, tools, approveRequest, rejectRequest, completeDispatch, addRequest } = useApp();
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const canApprove = hasAnyRole(['PM', 'MD', 'Admin', 'StoreMain']);
  const canDispatch = hasAnyRole(['StoreMain', 'StoreSite', 'Admin', 'MD']);
  const canCreate = hasAnyRole(['CM', 'PM', 'StoreMain', 'StoreSite', 'Admin', 'MD']);

  const filtered = requests.filter(r => {
    const matchType = typeFilter === 'All' || r.type === typeFilter;
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    // Site-scoped visibility
    const isMine = hasAnyRole(['MD', 'Admin', 'StoreMain', 'ProcurementManager']) ||
      r.fromSiteId === currentUser.siteId || r.toSiteId === currentUser.siteId ||
      r.requestedBy === currentUser.id;
    return matchType && matchStatus && isMine;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="All">All Types</option>
          {Object.keys(TYPE_LABELS).map(t => <option key={t} value={t}>{TYPE_LABELS[t].label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          {['All', 'Pending', 'Approved', 'Active', 'Completed', 'Rejected'].map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-slate-400 ml-1">{filtered.length} requests</span>
        {canCreate && (
          <Button size="sm" className="ml-auto" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> New Requisition
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <Thead>
            <tr>
              <Th>Request ID</Th>
              <Th>Type</Th>
              <Th>Route</Th>
              <Th>Items</Th>
              <Th>Requested By</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8}><EmptyState title="No requisitions found" /></td></tr>
            ) : filtered.map(req => {
              const typeInfo = TYPE_LABELS[req.type] || { label: req.type, color: 'bg-slate-50 text-slate-600' };
              return (
                <Tr key={req.id} onClick={() => setSelected(req)}>
                  <Td><span className="font-mono text-xs font-bold text-blue-600">{req.id}</span></Td>
                  <Td>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <span className="font-medium">{req.fromSiteId || '—'}</span>
                      <ArrowRight size={12} className="text-slate-400" />
                      <span className="font-medium">{req.toSiteId}</span>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-xs">{req.items.length} tool{req.items.length > 1 ? 's' : ''}</span>
                  </Td>
                  <Td><span className="text-sm">{req.requestedByName}</span></Td>
                  <Td><span className="text-xs text-slate-400">{req.createdAt}</span></Td>
                  <Td><Badge status={req.status} /></Td>
                  <Td>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      {req.status === 'Pending' && canApprove && (
                        <>
                          <Button variant="success" size="xs" onClick={() => approveRequest(req.id, currentUser.id, currentUser.name)}>
                            <CheckCircle size={13} /> Approve
                          </Button>
                          <Button variant="danger" size="xs" onClick={() => rejectRequest(req.id)}>
                            <XCircle size={13} />
                          </Button>
                        </>
                      )}
                      {req.status === 'Approved' && canDispatch && (
                        <Button variant="primary" size="xs" onClick={() => completeDispatch(req.id)}>
                          <Truck size={13} /> Dispatch
                        </Button>
                      )}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </div>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Requisition ${selected?.id}`} size="lg">
        {selected && <RequisitionDetail req={selected} sites={sites} tools={tools} />}
      </Modal>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Requisition" size="lg">
        <CreateRequisitionModal onClose={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}

function RequisitionDetail({ req, sites, tools: allTools }) {
  const fromSite = sites.find(s => s.id === req.fromSiteId);
  const toSite = sites.find(s => s.id === req.toSiteId);
  const typeInfo = TYPE_LABELS[req.type] || { label: req.type, color: 'bg-slate-50' };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Request Info</h4>
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-slate-500">Type</span><span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${typeInfo.color}`}>{typeInfo.label}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Status</span><Badge status={req.status} /></div>
            <div className="flex justify-between"><span className="text-slate-500">Created</span><span>{req.createdAt}</span></div>
            {req.approvedAt && <div className="flex justify-between"><span className="text-slate-500">Approved</span><span>{req.approvedAt}</span></div>}
            {req.completedAt && <div className="flex justify-between"><span className="text-slate-500">Completed</span><span>{req.completedAt}</span></div>}
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Route</h4>
          <div className="flex items-center gap-2 mt-2">
            <div className="text-center">
              <div className="font-bold text-slate-700">{fromSite?.name || req.fromSiteId || 'N/A'}</div>
              <div className="text-xs text-slate-400">From</div>
            </div>
            <ArrowRight size={20} className="text-slate-400 flex-1" />
            <div className="text-center">
              <div className="font-bold text-slate-700">{toSite?.name || req.toSiteId}</div>
              <div className="text-xs text-slate-400">To</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Requested by: <strong>{req.requestedByName}</strong></p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-slate-700 mb-3 text-sm">Tools in Request ({req.items.length})</h4>
        <div className="space-y-2">
          {req.items.map(item => {
            const tool = allTools.find(t => t.id === item.toolId);
            return (
              <div key={item.toolId} className="flex items-center justify-between bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{item.toolName}</p>
                  <p className="text-xs text-slate-400 font-mono">{item.toolId}</p>
                </div>
                {tool && <Badge status={tool.status} />}
              </div>
            );
          })}
        </div>
      </div>

      {req.notes && (
        <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-800 border border-amber-100">
          <strong>Notes:</strong> {req.notes}
        </div>
      )}
    </div>
  );
}

function CreateRequisitionModal({ onClose }) {
  const { currentUser, hasAnyRole } = useAuth();
  const { tools, sites, addRequest } = useApp();
  const [form, setForm] = useState({
    type: 'ProjectSetup',
    fromSiteId: currentUser?.siteId || 'HQ',
    toSiteId: 'SITE-A',
    selectedTools: [],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const availableTools = tools.filter(t => {
    if (form.type === 'ProjectSetup') return t.currentStoreId === 'HQ' && t.status === 'Available';
    if (form.type === 'ProjectClosure') return t.currentStoreId === form.fromSiteId && t.status === 'Available';
    if (form.type === 'InterSiteBorrow') return t.currentStoreId === form.toSiteId && t.status === 'Available';
    if (form.type === 'DailyBooking') return t.currentStoreId === currentUser.siteId && t.status === 'Available';
    return false;
  });

  const toggleTool = (toolId) => {
    setForm(f => ({
      ...f,
      selectedTools: f.selectedTools.includes(toolId)
        ? f.selectedTools.filter(id => id !== toolId)
        : [...f.selectedTools, toolId]
    }));
  };

  const handleSubmit = async () => {
    if (form.selectedTools.length === 0 || submitting) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      const newReq = {
        id: uniqueId('REQ-'),
        type: form.type,
        fromSiteId: form.type === 'DailyBooking' ? null : form.fromSiteId,
        toSiteId: form.type === 'DailyBooking' ? (currentUser?.siteId || 'HQ') : form.toSiteId,
        items: form.selectedTools.map(id => {
          const t = tools.find(x => x.id === id);
          return { toolId: id, toolName: t?.name || id };
        }),
        requestedBy: currentUser?.uid || currentUser?.id || '',
        requestedByName: currentUser?.name || '',
        status: 'Pending',
        createdAt: new Date().toISOString().split('T')[0],
        approvedAt: null, approvedBy: null, completedAt: null,
        notes: form.notes,
      };
      await addRequest(newReq);
      onClose();
    } catch (err) {
      console.error('[Requisitions] addRequest failed:', err);
      setSubmitError(err?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Request Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, selectedTools: [] }))}>
          <option value="ProjectSetup">Project Setup (HQ → Site)</option>
          <option value="ProjectClosure">Project Closure (Site → HQ)</option>
          <option value="InterSiteBorrow">Inter-Site Borrow</option>
          <option value="DailyBooking">Daily Booking</option>
        </Select>
        {form.type !== 'DailyBooking' && (
          <>
            <Select label="From Site" value={form.fromSiteId} onChange={e => setForm(f => ({ ...f, fromSiteId: e.target.value, selectedTools: [] }))}>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select label="To Site" value={form.toSiteId} onChange={e => setForm(f => ({ ...f, toSiteId: e.target.value, selectedTools: [] }))}>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 block mb-2">
          Select Tools ({form.selectedTools.length} selected)
        </label>
        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
          {availableTools.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No available tools for this selection</p>
          ) : availableTools.map(t => (
            <div
              key={t.id}
              onClick={() => toggleTool(t.id)}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-slate-50 last:border-0 transition-colors ${form.selectedTools.includes(t.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${form.selectedTools.includes(t.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                {form.selectedTools.includes(t.id) && <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="currentColor"><path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{t.name}</p>
                <p className="text-xs text-slate-400">{t.id} · {t.category}</p>
              </div>
              <Badge status={t.status} className="ml-auto" />
            </div>
          ))}
        </div>
      </div>

      <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." rows={2} />

      {submitError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">{submitError}</div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={form.selectedTools.length === 0 || submitting}>
          {submitting ? 'กำลังบันทึก...' : <><Plus size={16} /> Submit Requisition ({form.selectedTools.length} tools)</>}
        </Button>
      </div>
    </div>
  );
}
