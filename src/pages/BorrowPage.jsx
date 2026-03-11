import { useState } from 'react';
import { Plus, ArrowLeftRight, CheckCircle, XCircle, ArrowRight, AlertTriangle, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table';
import { Select, Textarea } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { uniqueId } from '../utils/ids';

export default function BorrowPage() {
  const { currentUser, hasAnyRole } = useAuth();
  const { requests, tools, sites, repairs, approveRequest, rejectRequest, completeDispatch, returnBorrowedTool, addRequest } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [showReturn, setShowReturn] = useState(null); // { req }

  const canApprove = hasAnyRole(['PM', 'MD', 'Admin', 'StoreMain']);
  const canCreate = hasAnyRole(['PM', 'CM', 'MD', 'Admin', 'StoreSite', 'StoreMain']);

  const borrowRequests = requests.filter(r =>
    r.type === 'InterSiteBorrow' &&
    (hasAnyRole(['MD', 'Admin', 'StoreMain', 'ProcurementManager']) ||
      r.fromSiteId === currentUser.siteId || r.toSiteId === currentUser.siteId)
  );

  // Liability stats
  const liabilityRepairs = repairs.filter(r => r.isBorrowedBreakage);
  const liabilityBySite = sites.map(site => ({
    ...site,
    cost: liabilityRepairs.filter(r => r.responsibleSiteId === site.id).reduce((s, r) => s + (r.cost || 0), 0),
    count: liabilityRepairs.filter(r => r.responsibleSiteId === site.id).length,
  })).filter(s => s.count > 0);

  return (
    <div className="space-y-6">
      {/* Liability Banner */}
      {liabilityRepairs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-600" />
            <h3 className="font-semibold text-amber-800">Inter-Site Liability Breakdown</h3>
          </div>
          <p className="text-sm text-amber-700 mb-3">
            When a borrowed tool is damaged, the <strong>borrowing site</strong> bears the repair cost — not the owner.
          </p>
          <div className="flex flex-wrap gap-3">
            {liabilityBySite.map(s => (
              <div key={s.id} className="bg-white rounded-xl px-4 py-2 border border-amber-100">
                <p className="text-xs text-slate-500">{s.name}</p>
                <p className="font-bold text-rose-600">฿{s.cost.toLocaleString()}</p>
                <p className="text-xs text-slate-400">{s.count} incident{s.count > 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">Inter-Site Borrow Requests ({borrowRequests.length})</h3>
        {canCreate && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> New Borrow Request
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <Thead>
            <tr>
              <Th>ID</Th>
              <Th>Borrower → Owner</Th>
              <Th>Tools</Th>
              <Th>Requested By</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Liability</Th>
              <Th>Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {borrowRequests.length === 0 ? (
              <tr><td colSpan={8}><EmptyState title="No borrow requests" icon={ArrowLeftRight} /></td></tr>
            ) : borrowRequests.map(req => {
              const fromSite = sites.find(s => s.id === req.fromSiteId);
              const toSite = sites.find(s => s.id === req.toSiteId);
              const relatedRepairs = repairs.filter(r => req.items.some(i => i.toolId === r.toolId) && r.isBorrowedBreakage);
              const repairCost = relatedRepairs.reduce((s, r) => s + (r.cost || 0), 0);

              return (
                <Tr key={req.id}>
                  <Td><span className="font-mono text-xs font-bold text-blue-600">{req.id}</span></Td>
                  <Td>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="font-semibold text-blue-700">{fromSite?.name || req.fromSiteId}</span>
                      <ArrowRight size={10} className="text-slate-400" />
                      <span className="font-semibold text-slate-600">{toSite?.name || req.toSiteId}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {req.items.map(i => (
                        <span key={i.toolId} className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-full">{i.toolName}</span>
                      ))}
                    </div>
                  </Td>
                  <Td>{req.requestedByName}</Td>
                  <Td><span className="text-xs text-slate-400">{req.createdAt}</span></Td>
                  <Td><Badge status={req.status} /></Td>
                  <Td>
                    {repairCost > 0 ? (
                      <span className="text-xs font-bold text-rose-600">฿{repairCost.toLocaleString()}</span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </Td>
                  <Td>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      {req.status === 'Pending' && canApprove && (
                        <>
                          <Button variant="success" size="xs" onClick={() => approveRequest(req.id, currentUser.id, currentUser.name)}>
                            <CheckCircle size={12} /> Approve
                          </Button>
                          <Button variant="danger" size="xs" onClick={() => rejectRequest(req.id)}>
                            <XCircle size={12} />
                          </Button>
                        </>
                      )}
                      {req.status === 'Approved' && (
                        <Button variant="primary" size="xs" onClick={() => completeDispatch(req.id)}>
                          <Truck size={12} /> Send
                        </Button>
                      )}
                      {req.status === 'Active' && (
                        <Button variant="outline" size="xs" onClick={() => setShowReturn(req)}>
                          <ArrowRight size={12} /> Return
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

      {/* Liability Repair Details */}
      {liabilityRepairs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700">Borrowed-Tool Breakage Log</h3>
            <p className="text-xs text-slate-400 mt-0.5">Repair costs assigned to borrowing sites</p>
          </div>
          <Table>
            <Thead>
              <tr>
                <Th>Repair ID</Th>
                <Th>Tool</Th>
                <Th>Issue</Th>
                <Th>Owner Site</Th>
                <Th>Responsible (Borrower)</Th>
                <Th>Cost</Th>
                <Th>Status</Th>
              </tr>
            </Thead>
            <Tbody>
              {liabilityRepairs.map(r => (
                <Tr key={r.id}>
                  <Td><span className="font-mono text-xs font-bold text-rose-500">{r.id}</span></Td>
                  <Td><span className="font-medium text-sm">{r.toolName}</span></Td>
                  <Td><span className="text-xs text-slate-500">{r.issue}</span></Td>
                  <Td><span className="text-xs font-medium text-slate-600">{r.ownerSiteId}</span></Td>
                  <Td>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      ⚠️ {r.responsibleSiteId}
                    </span>
                  </Td>
                  <Td><span className="font-semibold text-rose-600">฿{r.cost.toLocaleString()}</span></Td>
                  <Td><Badge status={r.status} /></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      )}

      {/* Create Borrow Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Inter-Site Borrow Request" size="lg">
        <CreateBorrowModal onClose={() => setShowCreate(false)} />
      </Modal>

      {/* Return Modal */}
      <Modal open={!!showReturn} onClose={() => setShowReturn(null)} title="Return Borrowed Tools" size="sm">
        {showReturn && (
          <ReturnBorrowModal
            req={showReturn}
            onReturn={(condition) => {
              returnBorrowedTool(showReturn.id, condition, currentUser.id, currentUser.name);
              setShowReturn(null);
            }}
            onClose={() => setShowReturn(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function CreateBorrowModal({ onClose }) {
  const { currentUser, hasAnyRole } = useAuth();
  const { tools, sites, addRequest } = useApp();
  const [form, setForm] = useState({
    fromSiteId: currentUser?.siteId || 'HQ',
    toSiteId: 'SITE-B',
    selectedTools: [],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const lenderTools = tools.filter(t =>
    t.currentStoreId === form.toSiteId &&
    t.status === 'Available' &&
    form.toSiteId !== form.fromSiteId
  );

  const toggleTool = (id) => {
    setForm(f => ({
      ...f,
      selectedTools: f.selectedTools.includes(id)
        ? f.selectedTools.filter(x => x !== id)
        : [...f.selectedTools, id]
    }));
  };

  const handleSubmit = async () => {
    if (form.selectedTools.length === 0 || form.fromSiteId === form.toSiteId || submitting) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      const newReq = {
        id: uniqueId('REQ-'),
        type: 'InterSiteBorrow',
        fromSiteId: form.fromSiteId,
        toSiteId: form.toSiteId,
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
      console.error('[Borrow] addRequest failed:', err);
      setSubmitError(err?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800">
        <strong>Liability Notice:</strong> If any borrowed tool is damaged while in your site's possession, your site will bear the full repair cost.
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Borrowing Site (You)" value={form.fromSiteId} onChange={e => setForm(f => ({ ...f, fromSiteId: e.target.value, selectedTools: [] }))}>
          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select label="Lending Site (Has the tools)" value={form.toSiteId} onChange={e => setForm(f => ({ ...f, toSiteId: e.target.value, selectedTools: [] }))}>
          {sites.filter(s => s.id !== form.fromSiteId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 block mb-2">
          Available Tools at {form.toSiteId} ({lenderTools.length} available)
        </label>
        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
          {lenderTools.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No available tools at this site</p>
          ) : lenderTools.map(t => (
            <div
              key={t.id}
              onClick={() => toggleTool(t.id)}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-slate-50 last:border-0 transition-colors ${form.selectedTools.includes(t.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${form.selectedTools.includes(t.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                {form.selectedTools.includes(t.id) && <svg viewBox="0 0 12 12" className="w-3 h-3" fill="white"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">{t.name}</p>
                <p className="text-xs text-slate-400">{t.id} · ฿{t.unitValue.toLocaleString()}</p>
              </div>
              <Badge status={t.status} />
            </div>
          ))}
        </div>
      </div>

      <Textarea label="Purpose / Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Reason for borrowing..." rows={2} />

      {submitError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">{submitError}</div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={form.selectedTools.length === 0 || form.fromSiteId === form.toSiteId || submitting}>
          {submitting ? 'กำลังบันทึก...' : <><Plus size={16} /> Submit Borrow Request ({form.selectedTools.length} tools)</>}
        </Button>
      </div>
    </div>
  );
}

function ReturnBorrowModal({ req, onReturn, onClose }) {
  const [condition, setCondition] = useState(null);
  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <p className="text-xs text-slate-500 mb-1">Returning tools from borrow request {req.id}</p>
        {req.items.map(i => (
          <p key={i.toolId} className="text-sm font-medium text-slate-700">• {i.toolName}</p>
        ))}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-3">Return Condition:</p>
        <div className="space-y-2">
          {[
            { value: 'Good', label: '✅ Good Condition', desc: 'Tools returned in full working order', color: 'border-emerald-400 bg-emerald-50' },
            { value: 'Broken', label: '⚠️ Damaged / Broken', desc: 'Tool(s) damaged — your site will be charged for repairs', color: 'border-amber-400 bg-amber-50' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setCondition(opt.value)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${condition === opt.value ? opt.color : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <p className="font-semibold text-sm">{opt.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {condition === 'Broken' && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">
          ⚠️ Repair cost will be assigned to <strong>{req.fromSiteId}</strong> (borrower liability rule).
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button
          variant={condition === 'Good' ? 'success' : 'danger'}
          onClick={() => condition && onReturn(condition)}
          disabled={!condition}
          className="flex-1"
        >
          <CheckCircle size={16} /> Confirm Return
        </Button>
      </div>
    </div>
  );
}
