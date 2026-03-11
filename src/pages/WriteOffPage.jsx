import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Eye, FileX, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useProjectFilter } from '../hooks/useProjectFilter';
import { ProjectFilterDropdown } from '../components/ProjectSelector';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';

export default function WriteOffPage() {
  const { currentUser, hasAnyRole } = useAuth();
  const { writeOffRequests, tools, sites, approveWriteOff, rejectWriteOff } = useApp();
  const { availableProjects, filterByProject } = useProjectFilter();
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [filterProject, setFilterProject] = useState('all');

  const isProcurement = hasAnyRole(['ProcurementManager']);
  const canApprove = hasAnyRole(['ProcurementManager', 'Admin', 'MD']);

  const visible = filterByProject(writeOffRequests, filterProject).filter(w => {
    const matchStatus = statusFilter === 'All' || w.status === statusFilter;
    const isMine = canApprove || w.siteId === currentUser.siteId || w.reportedBy === currentUser.id;
    return matchStatus && isMine;
  });

  const pending = writeOffRequests.filter(w => w.status === 'Pending').length;
  const approved = writeOffRequests.filter(w => w.status === 'Approved').length;
  const rejected = writeOffRequests.filter(w => w.status === 'Rejected').length;

  const writtenOffValue = tools
    .filter(t => t.status === 'Written-Off')
    .reduce((s, t) => s + t.unitValue, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-rose-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <FileX size={28} />
          <div>
            <h2 className="text-xl font-bold">Write-off Management (แทงจำหน่าย)</h2>
            <p className="text-orange-100 text-sm">Review and approve tool write-off requests</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{pending}</div>
            <div className="text-xs text-orange-100">Pending Review</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{approved}</div>
            <div className="text-xs text-orange-100">Approved</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{rejected}</div>
            <div className="text-xs text-orange-100">Rejected</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">฿{writtenOffValue.toLocaleString()}</div>
            <div className="text-xs text-orange-100">Total Written-Off Value</div>
          </div>
        </div>
      </div>

      {/* Procurement Manager urgent notice */}
      {isProcurement && pending > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-400 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">
              {pending} write-off request{pending > 1 ? 's' : ''} awaiting your approval
            </p>
          </div>
          <p className="text-xs text-amber-600 mt-1">
            Review each request carefully. Approved write-offs remove the tool from active inventory metrics.
          </p>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-white rounded-xl border border-slate-200 p-1 gap-1">
          {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-orange-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <ProjectFilterDropdown projects={availableProjects} value={filterProject} onChange={setFilterProject} />
        <span className="text-sm text-slate-400">{visible.length} records</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <Thead>
            <tr>
              <Th>WO ID</Th>
              <Th>Tool Name</Th>
              <Th>Reason</Th>
              <Th>Reported By</Th>
              <Th>Site</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Approved By</Th>
              <Th>Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={9}><EmptyState title="No write-off requests" icon={FileX} description="Requests are created when a tool is marked as Lost" /></td></tr>
            ) : visible.map(wo => {
              const tool = tools.find(t => t.id === wo.toolId);
              return (
                <Tr key={wo.id} onClick={() => setSelected({ wo, tool })}>
                  <Td><span className="font-mono text-xs font-bold text-orange-600">{wo.id}</span></Td>
                  <Td>
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{wo.toolName}</p>
                      <p className="text-xs text-slate-400 font-mono">{wo.toolId}</p>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-500 max-w-40 truncate block">{wo.reason}</span>
                  </Td>
                  <Td>{wo.reportedByName}</Td>
                  <Td>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-medium">{wo.siteId}</span>
                  </Td>
                  <Td><span className="text-xs text-slate-400">{wo.reportedAt}</span></Td>
                  <Td><Badge status={wo.status} /></Td>
                  <Td>
                    {wo.approvedByName ? (
                      <div>
                        <p className="text-xs font-medium text-slate-600">{wo.approvedByName}</p>
                        <p className="text-xs text-slate-400">{wo.approvedAt}</p>
                      </div>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="xs" onClick={() => setSelected({ wo, tool })}>
                        <Eye size={13} />
                      </Button>
                      {wo.status === 'Pending' && canApprove && (
                        <>
                          <Button variant="success" size="xs" onClick={() => approveWriteOff(wo.id, currentUser.id, currentUser.name)}>
                            <CheckCircle size={13} /> Approve
                          </Button>
                          <Button variant="danger" size="xs" onClick={() => rejectWriteOff(wo.id)}>
                            <XCircle size={13} /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </div>

      {/* Written-Off Tools Summary */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700">Written-Off Asset Registry</h3>
          <p className="text-xs text-slate-400 mt-0.5">These tools are excluded from active inventory metrics and valuations</p>
        </div>
        <div className="p-4">
          {tools.filter(t => t.status === 'Written-Off').length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No tools written off yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tools.filter(t => t.status === 'Written-Off').map(t => (
                <div key={t.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-700 text-sm">{t.name}</p>
                      <p className="text-xs font-mono text-slate-400">{t.id}</p>
                    </div>
                    <Badge status="Written-Off" />
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>Brand: {t.brand}</p>
                    <p className="line-through text-rose-400 font-medium">฿{t.unitValue.toLocaleString()}</p>
                    {t.writeOffDetails && (
                      <>
                        <p className="text-slate-400 italic">{t.writeOffDetails.reason}</p>
                        <p>Approved by: {t.writeOffDetails.approvedBy}</p>
                        <p>Date: {t.writeOffDetails.date}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Write-off Request: ${selected?.wo?.id}`} size="md">
        {selected && <WriteOffDetailModal wo={selected.wo} tool={selected.tool} canApprove={canApprove} onApprove={(id) => { approveWriteOff(id, currentUser.id, currentUser.name); setSelected(null); }} onReject={(id) => { rejectWriteOff(id); setSelected(null); }} />}
      </Modal>
    </div>
  );
}

function WriteOffDetailModal({ wo, tool, canApprove, onApprove, onReject }) {
  return (
    <div className="space-y-5">
      {/* Tool Info */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">{wo.toolName}</h3>
            <p className="text-sm font-mono text-slate-500">{wo.toolId}</p>
          </div>
          <Badge status={wo.status} />
        </div>
        <p className="text-sm text-orange-800 bg-orange-100 rounded-lg p-2">{wo.reason}</p>
      </div>

      {/* Tool Financial Impact */}
      {tool && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">Tool Value</p>
            <p className="text-xl font-bold text-rose-600">฿{tool.unitValue.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Will be removed from assets</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">Category / Brand</p>
            <p className="font-semibold text-slate-700">{tool.category}</p>
            <p className="text-xs text-slate-500">{tool.brand}</p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-2 text-sm">
        <h4 className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Timeline</h4>
        <div className="space-y-2">
          <div className="flex gap-3 items-start">
            <div className="w-2 h-2 bg-rose-400 rounded-full mt-1.5 shrink-0" />
            <div>
              <p className="font-medium text-slate-700">Reported as Lost</p>
              <p className="text-xs text-slate-400">By {wo.reportedByName} · {wo.reportedAt} · {wo.siteId}</p>
            </div>
          </div>
          {wo.status === 'Approved' && (
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 bg-emerald-400 rounded-full mt-1.5 shrink-0" />
              <div>
                <p className="font-medium text-slate-700">Write-off Approved</p>
                <p className="text-xs text-slate-400">By {wo.approvedByName} · {wo.approvedAt}</p>
              </div>
            </div>
          )}
          {wo.status === 'Rejected' && (
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 bg-slate-300 rounded-full mt-1.5 shrink-0" />
              <div>
                <p className="font-medium text-slate-700">Write-off Rejected</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {wo.status === 'Pending' && canApprove && (
        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-600 mb-3">
            Approving will permanently change this tool's status to <strong>Written-Off</strong> and remove it from active inventory value calculations.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1" onClick={() => onReject(wo.id)}>
              <XCircle size={16} /> Reject Write-off
            </Button>
            <Button variant="success" className="flex-1" onClick={() => onApprove(wo.id)}>
              <CheckCircle size={16} /> Approve Write-off
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
