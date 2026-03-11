import { useState, useRef, useCallback } from 'react';
import { Plus, Search, Printer, QrCode, Filter, Eye, ChevronDown, Package, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table';
import Input, { Select } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import QRCodeBox from '../components/QRCodeBox';
import { uniqueId } from '../utils/ids';

const STATUS_OPTIONS = ['All', 'Available', 'In-Use', 'Broken', 'In-Repair', 'Lost', 'Written-Off'];

export default function InventoryPage() {
  const { currentUser, hasAnyRole } = useAuth();
  const { tools, sites, categories, addTools } = useApp();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSite, setFilterSite] = useState('All');
  const [selectedTool, setSelectedTool] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTools, setPrintTools] = useState([]);
  const printRef = useRef();

  const canAdd = hasAnyRole(['StoreMain', 'Admin', 'MD']);

  const filtered = tools.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.qrCode.toLowerCase().includes(search.toLowerCase()) ||
      t.serialNo?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchCat = filterCategory === 'All' || t.category === filterCategory;
    const matchSite = filterSite === 'All' || t.currentStoreId === filterSite;
    return matchSearch && matchStatus && matchCat && matchSite;
  });

  const handlePrint = () => {
    window.print();
  };

  const openPrintQR = (toolsList) => {
    setPrintTools(toolsList);
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, QR code, serial..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="All">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterSite} onChange={e => setFilterSite(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="All">All Sites</option>
          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={() => openPrintQR(filtered)}>
            <Printer size={15} /> Print QR ({filtered.length})
          </Button>
          {canAdd && (
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus size={15} /> Bulk Add Tools
            </Button>
          )}
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {['Available', 'In-Use', 'Broken', 'In-Repair', 'Lost'].map(s => {
          const count = tools.filter(t => t.status === s).length;
          return count > 0 ? <Badge key={s} status={s} label={`${s}: ${count}`} /> : null;
        })}
        <span className="text-xs text-slate-400 self-center ml-1">Showing {filtered.length} of {tools.length} tools</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <Thead>
            <tr>
              <Th>QR / ID</Th>
              <Th>Tool Name</Th>
              <Th>Category</Th>
              <Th>Serial No.</Th>
              <Th>Brand</Th>
              <Th>Location</Th>
              <Th>Status</Th>
              <Th>Value (฿)</Th>
              <Th>Repairs</Th>
              <Th></Th>
            </tr>
          </Thead>
          <Tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="py-8"><EmptyState title="No tools found" description="Try adjusting your filters" /></td></tr>
            ) : filtered.map(tool => {
              const site = sites.find(s => s.id === tool.currentStoreId);
              return (
                <Tr key={tool.id} onClick={() => setSelectedTool(tool)}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <QRCodeBox value={tool.qrCode} size={36} showLabel={false} />
                      <span className="text-xs font-mono text-slate-500">{tool.id}</span>
                    </div>
                  </Td>
                  <Td><span className="font-medium text-slate-800">{tool.name}</span></Td>
                  <Td><span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{tool.category}</span></Td>
                  <Td><span className="text-xs font-mono text-slate-500">{tool.serialNo}</span></Td>
                  <Td>{tool.brand}</Td>
                  <Td>
                    <div>
                      <p className="text-sm">{site?.name || tool.currentStoreId}</p>
                      {tool.borrowedBySiteId && (
                        <span className="text-xs text-blue-600">↔ Borrowed by {tool.borrowedBySiteId}</span>
                      )}
                    </div>
                  </Td>
                  <Td><Badge status={tool.status} /></Td>
                  <Td className="font-medium">฿{tool.unitValue.toLocaleString()}</Td>
                  <Td>{tool.repairHistory.length > 0 ? <span className="text-xs text-amber-600 font-medium">{tool.repairHistory.length}x</span> : <span className="text-xs text-slate-300">—</span>}</Td>
                  <Td>
                    <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); openPrintQR([tool]); }}>
                      <QrCode size={14} />
                    </Button>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </div>

      {/* Tool Detail Modal */}
      <Modal open={!!selectedTool} onClose={() => setSelectedTool(null)} title="Tool Details" size="lg">
        {selectedTool && <ToolDetailModal tool={selectedTool} sites={sites} onPrintQR={() => openPrintQR([selectedTool])} />}
      </Modal>

      {/* Bulk Add Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Bulk Add New Tools" size="lg">
        <BulkAddModal onClose={() => setShowAddModal(false)} onAdd={async (newTools) => { await addTools(newTools); setShowAddModal(false); openPrintQR(newTools); }} />
      </Modal>

      {/* QR Print Modal */}
      <Modal open={showPrintModal} onClose={() => setShowPrintModal(false)} title={`Print QR Stickers (${printTools.length} tools)`} size="xl">
        <QRPrintModal tools={printTools} onClose={() => setShowPrintModal(false)} />
      </Modal>
    </div>
  );
}

function ToolDetailModal({ tool, sites, onPrintQR }) {
  const site = sites.find(s => s.id === tool.currentStoreId);
  const ownerSite = sites.find(s => s.id === tool.ownerSiteId);
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <QRCodeBox value={tool.qrCode} size={100} label={tool.qrCode} />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{tool.name}</h3>
            <p className="text-slate-500">{tool.brand} · {tool.category}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-400">Serial No.</span><p className="font-mono font-medium">{tool.serialNo}</p></div>
            <div><span className="text-slate-400">QR Code</span><p className="font-mono font-medium">{tool.qrCode}</p></div>
            <div><span className="text-slate-400">Status</span><div className="mt-0.5"><Badge status={tool.status} /></div></div>
            <div><span className="text-slate-400">Unit Value</span><p className="font-semibold text-emerald-700">฿{tool.unitValue.toLocaleString()}</p></div>
            <div><span className="text-slate-400">Current Location</span><p className="font-medium">{site?.name || tool.currentStoreId}</p></div>
            <div><span className="text-slate-400">Owner</span><p className="font-medium">{ownerSite?.name || tool.ownerSiteId}</p></div>
          </div>
          {tool.borrowedBySiteId && (
            <div className="bg-blue-50 rounded-lg p-2 text-xs text-blue-700">
              ↔ Currently borrowed by: <strong>{tool.borrowedBySiteId}</strong>
            </div>
          )}
        </div>
      </div>

      {tool.writeOffDetails && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-600 mb-2">Write-off Details</h4>
          <p className="text-sm text-slate-700">{tool.writeOffDetails.reason}</p>
          <p className="text-xs text-slate-400 mt-1">Approved by {tool.writeOffDetails.approvedBy} on {tool.writeOffDetails.date}</p>
        </div>
      )}

      {tool.repairHistory.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-600 mb-3">Repair History ({tool.repairHistory.length})</h4>
          <div className="space-y-2">
            {tool.repairHistory.map((r, i) => (
              <div key={i} className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-sm">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-slate-700">{r.issue}</p>
                  <Badge status={r.status} />
                </div>
                <div className="flex gap-4 mt-1 text-xs text-slate-400">
                  <span>{r.date}</span>
                  <span>฿{r.cost?.toLocaleString()}</span>
                  {r.technician && <span>{r.technician}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onPrintQR}>
          <QrCode size={14} /> Print QR
        </Button>
      </div>
    </div>
  );
}

function BulkAddModal({ onClose, onAdd }) {
  const { categories, sites } = useApp();
  const [form, setForm] = useState({
    name: '', category: categories[0], brand: '', unitValue: '',
    quantity: 1, targetSiteId: 'HQ', serialPrefix: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.name) e.name = 'Name is required';
    if (!form.brand) e.brand = 'Brand is required';
    if (!form.unitValue || isNaN(form.unitValue)) e.unitValue = 'Valid value required';
    if (!form.quantity || form.quantity < 1 || form.quantity > 100) e.quantity = '1–100 tools';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    if (submitting) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      const baseId = uniqueId('T');
      const prefix = form.serialPrefix || form.name.replace(/\s+/g, '').toUpperCase().slice(0, 4);
      const year = new Date().getFullYear();
      const newTools = Array.from({ length: parseInt(form.quantity) }, (_, i) => {
        const id = `${baseId}-${i}`;
        return {
          id,
          name: form.name,
          category: form.category,
          qrCode: `QR-${id}`,
          currentStoreId: form.targetSiteId,
          ownerSiteId: form.targetSiteId,
          status: 'Available',
          serialNo: `${prefix}-${year}-${String(i).padStart(4, '0')}`,
          brand: form.brand,
          unitValue: parseInt(form.unitValue),
          repairHistory: [],
          writeOffDetails: null,
          borrowedBySiteId: null,
        };
      });
      await onAdd(newTools);
      onClose();
    } catch (err) {
      console.error('[Inventory] addTools failed:', err);
      setSubmitError(err?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 border border-blue-100">
        The system will auto-generate unique IDs, QR Codes, and Serial Numbers for all tools. After adding, you can print QR stickers immediately.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Tool Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Angle Grinder 4&quot;" error={errors.name} />
        <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </Select>
        <Input label="Brand *" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. Bosch" error={errors.brand} />
        <Input label="Unit Value (฿) *" type="number" value={form.unitValue} onChange={e => setForm(f => ({ ...f, unitValue: e.target.value }))} placeholder="3500" error={errors.unitValue} />
        <Input label="Quantity (1–100) *" type="number" min="1" max="100" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} error={errors.quantity} />
        <Select label="Assign to Site" value={form.targetSiteId} onChange={e => setForm(f => ({ ...f, targetSiteId: e.target.value }))}>
          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Input label="Serial Prefix (optional)" value={form.serialPrefix} onChange={e => setForm(f => ({ ...f, serialPrefix: e.target.value }))} placeholder="e.g. AG" className="sm:col-span-2" />
      </div>
      <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 border border-slate-200">
        <strong>Preview:</strong> Will create <strong>{form.quantity}</strong> tools named "<strong>{form.name || '...'}</strong>" assigned to <strong>{form.targetSiteId}</strong> with auto-generated QR codes.
      </div>
      {submitError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">{submitError}</div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'กำลังบันทึก...' : <><Plus size={16} /> Add {form.quantity} Tool{form.quantity > 1 ? 's' : ''} & Print QR</>}
        </Button>
      </div>
    </div>
  );
}

function QRPrintModal({ tools, onClose }) {
  const handlePrint = () => window.print();

  return (
    <div>
      {/* Screen View Controls */}
      <div className="flex items-center justify-between mb-4 no-print">
        <p className="text-sm text-slate-500">{tools.length} QR stickers ready to print. A4 format, 4 per row.</p>
        <Button onClick={handlePrint}>
          <Printer size={16} /> Print Stickers
        </Button>
      </div>

      {/* Print Preview Grid */}
      <div className="qr-sticker-grid grid grid-cols-2 sm:grid-cols-4 gap-3 border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50">
        {tools.map(tool => (
          <div key={tool.id} className="qr-sticker bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
            <QRCodeBox value={tool.qrCode} size={80} showLabel={false} />
            <div className="text-center">
              <p className="text-xs font-bold text-slate-800 leading-tight">{tool.name}</p>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">{tool.qrCode}</p>
              <p className="text-[10px] text-slate-500">{tool.serialNo}</p>
              <p className="text-[10px] font-medium text-blue-600">{tool.currentStoreId}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-3 no-print text-center">
        The print dialog will show only the QR sticker grid — navigation and sidebars are hidden automatically.
      </p>
    </div>
  );
}
