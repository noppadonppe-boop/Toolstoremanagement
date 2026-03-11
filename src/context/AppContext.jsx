import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  collection, doc, onSnapshot, setDoc, updateDoc, writeBatch, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  SITES, USERS, CATEGORIES,
  INITIAL_TOOLS, INITIAL_REQUESTS, INITIAL_REPAIRS, INITIAL_WRITEOFF_REQUESTS,
} from './mockData';

// ── Firestore path helpers ────────────────────────────────────────────────────
const COLL = 'CMG Tool Store Management';
const ROOT = 'root';

const toolsCol    = () => collection(db, COLL, ROOT, 'tools');
const requestsCol = () => collection(db, COLL, ROOT, 'requests');
const repairsCol  = () => collection(db, COLL, ROOT, 'repairs');
const writeoffsCol = () => collection(db, COLL, ROOT, 'writeoffs');

const toolDoc     = (id) => doc(db, COLL, ROOT, 'tools', id);
const requestDoc  = (id) => doc(db, COLL, ROOT, 'requests', id);
const repairDoc   = (id) => doc(db, COLL, ROOT, 'repairs', id);
const writeoffDoc = (id) => doc(db, COLL, ROOT, 'writeoffs', id);

// ── Seed initial data if Firestore is empty ───────────────────────────────────
async function seedIfEmpty() {
  const snap = await getDocs(toolsCol());
  if (!snap.empty) return;

  console.log('[CMG] Seeding Firestore with initial data…');
  const batch = writeBatch(db);

  // root document (ensures parent document exists for sub-collections)
  batch.set(doc(db, COLL, ROOT), { initialized: true, createdAt: new Date().toISOString() }, { merge: true });

  INITIAL_TOOLS.forEach(t => batch.set(toolDoc(t.id), t));
  INITIAL_REQUESTS.forEach(r => batch.set(requestDoc(r.id), r));
  INITIAL_REPAIRS.forEach(r => batch.set(repairDoc(r.id), r));
  INITIAL_WRITEOFF_REQUESTS.forEach(w => batch.set(writeoffDoc(w.id), w));
  SITES.forEach(s => batch.set(doc(db, COLL, ROOT, 'sites', s.id), s));
  // Mock users สำหรับแสดงชื่อใน requests/repairs (ไม่เก็บ password)
  USERS.forEach(u => {
    const { password, ...rest } = u;
    batch.set(doc(db, COLL, ROOT, 'users', u.id), {
      ...rest,
      uid: u.id,
      status: 'approved',
      role: Array.isArray(u.role) ? u.role : [u.role],
    });
  });

  await batch.commit();
  console.log('[CMG] Seeding complete.');
}

// ── Context ───────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [tools, setTools]                   = useState([]);
  const [requests, setRequests]             = useState([]);
  const [repairs, setRepairs]               = useState([]);
  const [writeOffRequests, setWriteOffRequests] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [dbError, setDbError]               = useState(null);

  // Track which collections have delivered their first snapshot
  const firstLoaded = useRef({ tools: false, requests: false, repairs: false, writeoffs: false });
  const checkAllLoaded = () => {
    if (Object.values(firstLoaded.current).every(Boolean)) setLoading(false);
  };

  useEffect(() => {
    const unsubs = [];

    async function init() {
      try {
        await seedIfEmpty();

        unsubs.push(
          onSnapshot(toolsCol(), snap => {
            setTools(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            if (!firstLoaded.current.tools) { firstLoaded.current.tools = true; checkAllLoaded(); }
          }),
          onSnapshot(requestsCol(), snap => {
            setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            if (!firstLoaded.current.requests) { firstLoaded.current.requests = true; checkAllLoaded(); }
          }),
          onSnapshot(repairsCol(), snap => {
            setRepairs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            if (!firstLoaded.current.repairs) { firstLoaded.current.repairs = true; checkAllLoaded(); }
          }),
          onSnapshot(writeoffsCol(), snap => {
            setWriteOffRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            if (!firstLoaded.current.writeoffs) { firstLoaded.current.writeoffs = true; checkAllLoaded(); }
          }),
        );
      } catch (err) {
        console.error('[CMG] Firebase error:', err);
        setDbError(err.message);
        setLoading(false);
      }
    }

    init();
    return () => unsubs.forEach(u => u());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tool CRUD ───────────────────────────────────────────────────────────────
  const addTools = useCallback(async (newTools) => {
    const batch = writeBatch(db);
    newTools.forEach(t => batch.set(toolDoc(t.id), t));
    await batch.commit();
  }, []);

  const updateTool = useCallback(async (toolId, updates) => {
    await updateDoc(toolDoc(toolId), updates);
  }, []);

  // ── Requests ─────────────────────────────────────────────────────────────────
  const addRequest = useCallback(async (req) => {
    await setDoc(requestDoc(req.id), req);
  }, []);

  const updateRequest = useCallback(async (reqId, updates) => {
    await updateDoc(requestDoc(reqId), updates);
  }, []);

  const approveRequest = useCallback(async (reqId, approverId, approverName) => {
    await updateDoc(requestDoc(reqId), {
      status: 'Approved',
      approvedBy: approverId,
      approvedByName: approverName,
      approvedAt: new Date().toISOString().split('T')[0],
    });
  }, []);

  const rejectRequest = useCallback(async (reqId) => {
    await updateDoc(requestDoc(reqId), { status: 'Rejected' });
  }, []);

  const completeDispatch = useCallback(async (reqId) => {
    const req = requests.find(r => r.id === reqId);
    if (!req) return;

    const batch = writeBatch(db);
    req.items.forEach(({ toolId }) => {
      const tool = tools.find(t => t.id === toolId);
      if (!tool) return;
      batch.update(toolDoc(toolId), {
        currentStoreId: req.toSiteId,
        status: req.type === 'ProjectClosure'
          ? 'Available'
          : req.type === 'DailyBooking'
          ? 'In-Use'
          : tool.status,
        borrowedBySiteId: req.type === 'InterSiteBorrow' ? req.fromSiteId : (tool.borrowedBySiteId ?? null),
      });
    });
    batch.update(requestDoc(reqId), {
      status: req.type === 'InterSiteBorrow' ? 'Active' : 'Completed',
      completedAt: new Date().toISOString().split('T')[0],
    });
    await batch.commit();
  }, [requests, tools]);

  const returnTool = useCallback(async (toolId, condition, reportedBy, reportedByName, siteId) => {
    const tool = tools.find(t => t.id === toolId);
    const batch = writeBatch(db);

    if (condition === 'Good') {
      batch.update(toolDoc(toolId), { status: 'Available' });
    } else if (condition === 'Broken') {
      batch.update(toolDoc(toolId), { status: 'Broken' });
      const repairId = `REP-${Date.now()}`;
      batch.set(repairDoc(repairId), {
        id: repairId, toolId, toolName: tool?.name || toolId,
        issue: 'Reported broken on return',
        reportedBy, reportedByName,
        reportedAt: new Date().toISOString().split('T')[0],
        responsibleSiteId: tool?.borrowedBySiteId || siteId,
        ownerSiteId: tool?.ownerSiteId || 'HQ',
        cost: 0, technician: null, status: 'Pending',
        completedAt: null, notes: '', isBorrowedBreakage: !!tool?.borrowedBySiteId,
      });
    } else if (condition === 'Lost') {
      batch.update(toolDoc(toolId), { status: 'Lost' });
      const woId = `WO-${Date.now()}`;
      batch.set(writeoffDoc(woId), {
        id: woId, toolId, toolName: tool?.name || toolId,
        reason: `Reported Lost by ${reportedByName}`,
        reportedBy, reportedByName,
        reportedAt: new Date().toISOString().split('T')[0],
        status: 'Pending', approvedBy: null, approvedAt: null, siteId,
      });
    }

    await batch.commit();
  }, [tools]);

  // ── Repairs ──────────────────────────────────────────────────────────────────
  const addRepair = useCallback(async (repair) => {
    const batch = writeBatch(db);
    batch.set(repairDoc(repair.id), repair);
    batch.update(toolDoc(repair.toolId), { status: 'In-Repair' });
    await batch.commit();
  }, []);

  const updateRepair = useCallback(async (repairId, updates) => {
    await updateDoc(repairDoc(repairId), updates);
  }, []);

  const completeRepair = useCallback(async (repairId, finalCost, technician) => {
    const repair = repairs.find(r => r.id === repairId);
    if (!repair) return;

    const tool = tools.find(t => t.id === repair.toolId);
    const updatedHistory = [...(tool?.repairHistory || []), {
      id: repairId,
      date: new Date().toISOString().split('T')[0],
      issue: repair.issue, cost: finalCost, technician, status: 'Completed',
    }];

    const batch = writeBatch(db);
    batch.update(repairDoc(repairId), {
      status: 'Completed', cost: finalCost, technician,
      completedAt: new Date().toISOString().split('T')[0],
    });
    batch.update(toolDoc(repair.toolId), { status: 'Available', repairHistory: updatedHistory });
    await batch.commit();
  }, [repairs, tools]);

  // ── Write-off ─────────────────────────────────────────────────────────────────
  const approveWriteOff = useCallback(async (woId, approverId, approverName) => {
    const wo = writeOffRequests.find(w => w.id === woId);
    if (!wo) return;

    const batch = writeBatch(db);
    batch.update(writeoffDoc(woId), {
      status: 'Approved', approvedBy: approverId, approvedByName: approverName,
      approvedAt: new Date().toISOString().split('T')[0],
    });
    batch.update(toolDoc(wo.toolId), {
      status: 'Written-Off',
      writeOffDetails: {
        reason: wo.reason, approvedBy: approverName,
        date: new Date().toISOString().split('T')[0], approvedById: approverId,
      },
    });
    await batch.commit();
  }, [writeOffRequests]);

  const rejectWriteOff = useCallback(async (woId) => {
    await updateDoc(writeoffDoc(woId), { status: 'Rejected' });
  }, []);

  // ── Inter-Site Borrow Return ──────────────────────────────────────────────────
  const returnBorrowedTool = useCallback(async (reqId, condition, reportedBy, reportedByName) => {
    const req = requests.find(r => r.id === reqId);
    if (!req) return;

    const batch = writeBatch(db);
    const toolIds = req.items.map(i => i.toolId);

    if (condition === 'Good') {
      toolIds.forEach(toolId => {
        batch.update(toolDoc(toolId), { status: 'Available', currentStoreId: req.fromSiteId, borrowedBySiteId: null });
      });
      batch.update(requestDoc(reqId), { status: 'Returned', completedAt: new Date().toISOString().split('T')[0] });
    } else if (condition === 'Broken') {
      toolIds.forEach(toolId => {
        const tool = tools.find(t => t.id === toolId);
        const repairId = `REP-${Date.now()}-${toolId}`;
        batch.set(repairDoc(repairId), {
          id: repairId, toolId, toolName: tool?.name || toolId,
          issue: 'Broken during inter-site borrow',
          reportedBy, reportedByName,
          reportedAt: new Date().toISOString().split('T')[0],
          responsibleSiteId: req.fromSiteId, ownerSiteId: req.toSiteId,
          cost: 0, technician: null, status: 'Pending',
          completedAt: null, notes: `Liability: ${req.fromSiteId} (borrower)`,
          isBorrowedBreakage: true,
        });
        batch.update(toolDoc(toolId), { status: 'Broken', responsibleSiteId: req.fromSiteId });
      });
      batch.update(requestDoc(reqId), { status: 'Returned-Broken' });
    }

    await batch.commit();
  }, [requests, tools]);

  // ── Computed Stats ────────────────────────────────────────────────────────────
  const getStats = useCallback((siteId = null) => {
    const filtered = siteId ? tools.filter(t => t.currentStoreId === siteId) : tools;
    const active = filtered.filter(t => t.status !== 'Written-Off');
    return {
      total: active.length,
      available: active.filter(t => t.status === 'Available').length,
      inUse: active.filter(t => t.status === 'In-Use').length,
      broken: active.filter(t => t.status === 'Broken').length,
      inRepair: active.filter(t => t.status === 'In-Repair').length,
      lost: active.filter(t => t.status === 'Lost').length,
      writtenOff: filtered.filter(t => t.status === 'Written-Off').length,
      totalValue: active.reduce((s, t) => s + (t.unitValue || 0), 0),
    };
  }, [tools]);

  const getTotalRepairCost = useCallback((siteId = null) => {
    const filtered = siteId ? repairs.filter(r => r.responsibleSiteId === siteId) : repairs;
    return filtered.reduce((s, r) => s + (r.cost || 0), 0);
  }, [repairs]);

  // ── Loading / Error screen ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium text-sm">กำลังโหลดข้อมูลจาก Firebase…</p>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 z-50">
        <div className="bg-white border border-red-200 rounded-xl p-8 max-w-md text-center shadow">
          <p className="text-red-600 font-semibold mb-2">เชื่อมต่อ Firebase ไม่สำเร็จ</p>
          <p className="text-slate-500 text-sm">{dbError}</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      tools, requests, repairs, writeOffRequests,
      sites: SITES, users: USERS, categories: CATEGORIES,
      loading,
      addTools, updateTool,
      addRequest, updateRequest, approveRequest, rejectRequest, completeDispatch,
      returnTool, returnBorrowedTool,
      addRepair, updateRepair, completeRepair,
      approveWriteOff, rejectWriteOff,
      getStats, getTotalRepairCost,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
