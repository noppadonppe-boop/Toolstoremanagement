import { useState } from 'react';
import { CalendarCheck, QrCode, CheckCircle, AlertTriangle, PackageX, Scan, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';

export default function BookingPage() {
  const { currentUser, hasAnyRole } = useAuth();
  const { requests, tools, sites, approveRequest, completeDispatch, returnTool } = useApp();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [returnModal, setReturnModal] = useState(null); // { tool }
  const [scanMode, setScanMode] = useState('dispatch'); // 'dispatch' | 'return'

  const isSupervisor = hasAnyRole(['Supervisor']);
  const isStoreSite = hasAnyRole(['StoreSite']);
  const canDispense = hasAnyRole(['StoreSite', 'StoreMain', 'Admin', 'MD']);

  const siteId = currentUser.siteId;

  const bookingRequests = requests.filter(r =>
    r.type === 'DailyBooking' &&
    (r.toSiteId === siteId || hasAnyRole(['Admin', 'MD', 'StoreMain']))
  );

  const inUseTools = tools.filter(t =>
    t.status === 'In-Use' &&
    (t.currentStoreId === siteId || hasAnyRole(['Admin', 'MD', 'StoreMain']))
  );

  return (
    <div className="space-y-6">
      {/* Mobile-optimized header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg"><CalendarCheck size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Pending Bookings</p>
              <p className="text-2xl font-bold text-slate-800">{bookingRequests.filter(r => r.status === 'Pending').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle size={20} className="text-emerald-600" /></div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Tools Out Today</p>
              <p className="text-2xl font-bold text-slate-800">{inUseTools.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg"><Clock size={20} className="text-amber-600" /></div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Awaiting Return</p>
              <p className="text-2xl font-bold text-slate-800">{inUseTools.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {canDispense && (
          <Button onClick={() => { setScanMode('dispatch'); setShowQRScanner(true); }}>
            <Scan size={16} /> Scan QR to Dispatch
          </Button>
        )}
        <Button variant="outline" onClick={() => { setScanMode('return'); setShowQRScanner(true); }}>
          <QrCode size={16} /> Scan QR to Return
        </Button>
      </div>

      {/* Booking Requests */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700">Daily Booking Requests</h3>
          <span className="text-xs text-slate-400">{bookingRequests.length} total</span>
        </div>
        <Table>
          <Thead>
            <tr>
              <Th>ID</Th>
              <Th>Requested By</Th>
              <Th>Tools</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {bookingRequests.length === 0 ? (
              <tr><td colSpan={6}><EmptyState title="No booking requests" icon={CalendarCheck} /></td></tr>
            ) : bookingRequests.map(req => (
              <Tr key={req.id}>
                <Td><span className="font-mono text-xs font-bold text-blue-600">{req.id}</span></Td>
                <Td>{req.requestedByName}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {req.items.map(item => (
                      <span key={item.toolId} className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{item.toolName}</span>
                    ))}
                  </div>
                </Td>
                <Td><span className="text-xs text-slate-400">{req.createdAt}</span></Td>
                <Td><Badge status={req.status} /></Td>
                <Td>
                  <div className="flex gap-1">
                    {req.status === 'Pending' && canDispense && (
                      <Button variant="success" size="xs" onClick={() => approveRequest(req.id, currentUser.id, currentUser.name)}>
                        <CheckCircle size={13} /> Approve
                      </Button>
                    )}
                    {req.status === 'Approved' && canDispense && (
                      <Button variant="primary" size="xs" onClick={() => completeDispatch(req.id)}>
                        <ArrowRight size={13} /> Dispatch
                      </Button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      {/* Tools Currently Out */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700">Tools Currently Out (In-Use)</h3>
          <p className="text-xs text-slate-400 mt-0.5">Tap "Return" to scan and return a tool, then report its condition</p>
        </div>
        <Table>
          <Thead>
            <tr>
              <Th>Tool</Th>
              <Th>QR Code</Th>
              <Th>Category</Th>
              <Th>Since</Th>
              <Th>Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {inUseTools.length === 0 ? (
              <tr><td colSpan={5}><EmptyState title="No tools currently out" icon={CheckCircle} description="All tools have been returned" /></td></tr>
            ) : inUseTools.map(tool => (
              <Tr key={tool.id}>
                <Td>
                  <div>
                    <p className="font-medium text-slate-700">{tool.name}</p>
                    <p className="text-xs text-slate-400">{tool.id}</p>
                  </div>
                </Td>
                <Td><span className="font-mono text-xs text-slate-500">{tool.qrCode}</span></Td>
                <Td><span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{tool.category}</span></Td>
                <Td><span className="text-xs text-slate-400">—</span></Td>
                <Td>
                  <Button variant="outline" size="xs" onClick={() => setReturnModal(tool)}>
                    <ArrowRight size={13} /> Return
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      {/* QR Scanner Modal */}
      <Modal open={showQRScanner} onClose={() => setShowQRScanner(false)} title={scanMode === 'dispatch' ? 'Scan QR to Dispatch' : 'Scan QR to Return Tool'} size="sm">
        <MockQRScanner
          mode={scanMode}
          tools={tools}
          siteId={siteId}
          onDispatch={(tool) => { completeDispatch(tool.id); setShowQRScanner(false); }}
          onReturn={(tool) => { setShowQRScanner(false); setReturnModal(tool); }}
          onClose={() => setShowQRScanner(false)}
        />
      </Modal>

      {/* Return Condition Modal */}
      <Modal open={!!returnModal} onClose={() => setReturnModal(null)} title="Return Tool — Condition Check" size="sm">
        {returnModal && (
          <ReturnConditionModal
            tool={returnModal}
            currentUser={currentUser}
            onReturn={(toolId, condition) => {
              returnTool(toolId, condition, currentUser.id, currentUser.name, siteId);
              setReturnModal(null);
            }}
            onClose={() => setReturnModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function MockQRScanner({ mode, tools, siteId, onDispatch, onReturn, onClose }) {
  const [inputVal, setInputVal] = useState('');
  const [found, setFound] = useState(null);
  const [error, setError] = useState('');

  const scanQR = (val) => {
    const tool = tools.find(t => t.qrCode === val || t.id === val);
    if (!tool) { setError('Tool not found. Try: QR-T003 or T003'); setFound(null); return; }
    if (mode === 'dispatch' && tool.status !== 'Available') { setError(`Cannot dispatch: Tool is "${tool.status}"`); setFound(null); return; }
    if (mode === 'return' && tool.status !== 'In-Use') { setError(`Cannot return: Tool is "${tool.status}"`); setFound(null); return; }
    setFound(tool);
    setError('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-2xl p-6 flex flex-col items-center gap-4">
        <div className="w-48 h-48 border-4 border-blue-400 rounded-2xl flex items-center justify-center relative">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-xl" />
          <div className="text-center">
            <Scan size={32} className="text-blue-400 mx-auto mb-2" />
            <p className="text-white text-xs">Camera scanning active</p>
            <p className="text-slate-400 text-[10px] mt-1">(Demo: type QR code below)</p>
          </div>
        </div>
        <div className="w-full">
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Type QR code (e.g. QR-T003)"
            className="w-full px-3 py-2 rounded-xl bg-slate-800 text-white text-sm border border-slate-700 focus:outline-none focus:border-blue-400 placeholder-slate-500"
            onKeyDown={e => e.key === 'Enter' && scanQR(inputVal)}
          />
          <button onClick={() => scanQR(inputVal)} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-xl transition-colors">
            Scan / Confirm
          </button>
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">{error}</div>}

      {found && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-emerald-600" />
            <p className="font-semibold text-emerald-700">Tool Found!</p>
          </div>
          <p className="text-sm font-medium text-slate-700">{found.name}</p>
          <p className="text-xs text-slate-500">{found.id} · {found.serialNo}</p>
          <div className="flex gap-2 mt-3">
            <Button variant="success" size="sm" onClick={() => mode === 'dispatch' ? onDispatch(found) : onReturn(found)} className="flex-1">
              {mode === 'dispatch' ? <><ArrowRight size={14} /> Confirm Dispatch</> : <><CheckCircle size={14} /> Proceed to Return</>}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFound(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-400 font-medium mb-2">Quick test — click to simulate scan:</p>
        <div className="flex flex-wrap gap-1.5">
          {tools.filter(t => mode === 'dispatch' ? t.status === 'Available' : t.status === 'In-Use').slice(0, 6).map(t => (
            <button key={t.id} onClick={() => { setInputVal(t.qrCode); scanQR(t.qrCode); }}
              className="text-xs bg-slate-100 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors font-mono">
              {t.qrCode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReturnConditionModal({ tool, currentUser, onReturn, onClose }) {
  const [condition, setCondition] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const options = [
    { value: 'Good', icon: CheckCircle, label: 'Good Condition', desc: 'Tool is clean, functional, and ready for reuse.', color: 'border-emerald-400 bg-emerald-50', iconColor: 'text-emerald-600' },
    { value: 'Broken', icon: AlertTriangle, label: 'Broken / Damaged', desc: 'Tool has damage or malfunction. Will trigger a repair workflow.', color: 'border-amber-400 bg-amber-50', iconColor: 'text-amber-600' },
    { value: 'Lost', icon: PackageX, label: 'Lost / Missing', desc: 'Tool cannot be located. Will trigger a write-off request.', color: 'border-rose-400 bg-rose-50', iconColor: 'text-rose-600' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <p className="text-xs text-slate-500">Returning tool:</p>
        <p className="font-bold text-slate-800 text-base">{tool.name}</p>
        <p className="text-xs font-mono text-slate-400">{tool.qrCode} · {tool.serialNo}</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-3">What is the condition of this tool?</p>
        <div className="space-y-2">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => setCondition(opt.value)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${condition === opt.value ? opt.color + ' border-2' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <opt.icon size={24} className={condition === opt.value ? opt.iconColor : 'text-slate-400'} />
              <div>
                <p className={`font-semibold text-sm ${condition === opt.value ? 'text-slate-800' : 'text-slate-600'}`}>{opt.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {condition === 'Lost' && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">
          ⚠️ Marking as <strong>Lost</strong> will notify the Procurement Manager for write-off approval.
        </div>
      )}
      {condition === 'Broken' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
          🔧 Marking as <strong>Broken</strong> will create a repair order. Site liability will be assigned.
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button
          variant={condition === 'Good' ? 'success' : condition === 'Broken' ? 'warning' : condition === 'Lost' ? 'danger' : 'primary'}
          onClick={() => condition && onReturn(tool.id, condition)}
          disabled={!condition}
          className="flex-1"
        >
          <CheckCircle size={16} /> Confirm Return
        </Button>
      </div>
    </div>
  );
}
