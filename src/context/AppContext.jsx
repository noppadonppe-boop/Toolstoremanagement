import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  INITIAL_TOOLS, INITIAL_REQUESTS, INITIAL_REPAIRS,
  INITIAL_WRITEOFF_REQUESTS, SITES, USERS, CATEGORIES
} from './mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [tools, setTools] = useState(INITIAL_TOOLS);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [repairs, setRepairs] = useState(INITIAL_REPAIRS);
  const [writeOffRequests, setWriteOffRequests] = useState(INITIAL_WRITEOFF_REQUESTS);

  // ── Tool CRUD ──────────────────────────────────────────────────────────────
  const addTools = useCallback((newTools) => {
    setTools(prev => [...prev, ...newTools]);
  }, []);

  const updateTool = useCallback((toolId, updates) => {
    setTools(prev => prev.map(t => t.id === toolId ? { ...t, ...updates } : t));
  }, []);

  // ── Requests ──────────────────────────────────────────────────────────────
  const addRequest = useCallback((req) => {
    setRequests(prev => [...prev, req]);
  }, []);

  const updateRequest = useCallback((reqId, updates) => {
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, ...updates } : r));
  }, []);

  // Approve a requisition (PM/CM action)
  const approveRequest = useCallback((reqId, approverId, approverName) => {
    setRequests(prev => prev.map(r =>
      r.id === reqId ? { ...r, status: 'Approved', approvedBy: approverId, approvedByName: approverName, approvedAt: new Date().toISOString().split('T')[0] } : r
    ));
  }, []);

  // Reject a request
  const rejectRequest = useCallback((reqId) => {
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Rejected' } : r));
  }, []);

  // Complete dispatch (StoreMain/StoreSite scans and sends)
  const completeDispatch = useCallback((reqId) => {
    const req = requests.find(r => r.id === reqId);
    if (!req) return;
    const toolIds = req.items.map(i => i.toolId);
    setTools(prev => prev.map(t =>
      toolIds.includes(t.id)
        ? { ...t, currentStoreId: req.toSiteId, status: req.type === 'ProjectClosure' ? 'Available' : (req.type === 'DailyBooking' ? 'In-Use' : t.status), borrowedBySiteId: req.type === 'InterSiteBorrow' ? req.fromSiteId : t.borrowedBySiteId }
        : t
    ));
    setRequests(prev => prev.map(r =>
      r.id === reqId ? { ...r, status: req.type === 'InterSiteBorrow' ? 'Active' : 'Completed', completedAt: new Date().toISOString().split('T')[0] } : r
    ));
  }, [requests]);

  // Return tool (from daily booking return)
  const returnTool = useCallback((toolId, condition, reportedBy, reportedByName, siteId) => {
    if (condition === 'Good') {
      setTools(prev => prev.map(t => t.id === toolId ? { ...t, status: 'Available' } : t));
    } else if (condition === 'Broken') {
      setTools(prev => prev.map(t => t.id === toolId ? { ...t, status: 'Broken' } : t));
      const tool = tools.find(t => t.id === toolId);
      const newRepair = {
        id: `REP-${Date.now()}`,
        toolId,
        toolName: tool?.name || toolId,
        issue: 'Reported broken on return',
        reportedBy,
        reportedByName,
        reportedAt: new Date().toISOString().split('T')[0],
        responsibleSiteId: tool?.borrowedBySiteId || siteId,
        ownerSiteId: tool?.ownerSiteId || 'HQ',
        cost: 0,
        technician: null,
        status: 'Pending',
        completedAt: null,
        notes: '',
        isBorrowedBreakage: !!tool?.borrowedBySiteId,
      };
      setRepairs(prev => [...prev, newRepair]);
    } else if (condition === 'Lost') {
      setTools(prev => prev.map(t => t.id === toolId ? { ...t, status: 'Lost' } : t));
      const tool = tools.find(t => t.id === toolId);
      const newWO = {
        id: `WO-${Date.now()}`,
        toolId,
        toolName: tool?.name || toolId,
        reason: `Reported Lost by ${reportedByName}`,
        reportedBy,
        reportedByName,
        reportedAt: new Date().toISOString().split('T')[0],
        status: 'Pending',
        approvedBy: null,
        approvedAt: null,
        siteId,
      };
      setWriteOffRequests(prev => [...prev, newWO]);
    }
  }, [tools]);

  // ── Repairs ──────────────────────────────────────────────────────────────
  const addRepair = useCallback((repair) => {
    setRepairs(prev => [...prev, repair]);
    setTools(prev => prev.map(t => t.id === repair.toolId ? { ...t, status: 'In-Repair' } : t));
  }, []);

  const updateRepair = useCallback((repairId, updates) => {
    setRepairs(prev => prev.map(r => r.id === repairId ? { ...r, ...updates } : r));
  }, []);

  const completeRepair = useCallback((repairId, finalCost, technician) => {
    const repair = repairs.find(r => r.id === repairId);
    if (!repair) return;
    setRepairs(prev => prev.map(r =>
      r.id === repairId ? { ...r, status: 'Completed', cost: finalCost, technician, completedAt: new Date().toISOString().split('T')[0] } : r
    ));
    setTools(prev => prev.map(t => {
      if (t.id === repair.toolId) {
        const updatedHistory = [...t.repairHistory, {
          id: repairId, date: new Date().toISOString().split('T')[0],
          issue: repair.issue, cost: finalCost, technician, status: 'Completed'
        }];
        return { ...t, status: 'Available', repairHistory: updatedHistory };
      }
      return t;
    }));
  }, [repairs]);

  // ── Write-off ─────────────────────────────────────────────────────────────
  const approveWriteOff = useCallback((woId, approverId, approverName) => {
    const wo = writeOffRequests.find(w => w.id === woId);
    if (!wo) return;
    setWriteOffRequests(prev => prev.map(w =>
      w.id === woId ? { ...w, status: 'Approved', approvedBy: approverId, approvedByName: approverName, approvedAt: new Date().toISOString().split('T')[0] } : w
    ));
    setTools(prev => prev.map(t =>
      t.id === wo.toolId ? { ...t, status: 'Written-Off', writeOffDetails: { reason: wo.reason, approvedBy: approverName, date: new Date().toISOString().split('T')[0], approvedById: approverId } } : t
    ));
  }, [writeOffRequests]);

  const rejectWriteOff = useCallback((woId) => {
    setWriteOffRequests(prev => prev.map(w => w.id === woId ? { ...w, status: 'Rejected' } : w));
  }, []);

  // ── Inter-Site Borrow Return ───────────────────────────────────────────────
  const returnBorrowedTool = useCallback((reqId, condition, reportedBy, reportedByName) => {
    const req = requests.find(r => r.id === reqId);
    if (!req) return;
    const toolIds = req.items.map(i => i.toolId);
    if (condition === 'Good') {
      setTools(prev => prev.map(t =>
        toolIds.includes(t.id) ? { ...t, status: 'Available', currentStoreId: req.fromSiteId, borrowedBySiteId: null } : t
      ));
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Returned', completedAt: new Date().toISOString().split('T')[0] } : r));
    } else if (condition === 'Broken') {
      toolIds.forEach(toolId => {
        const tool = tools.find(t => t.id === toolId);
        const newRepair = {
          id: `REP-${Date.now()}-${toolId}`,
          toolId, toolName: tool?.name || toolId,
          issue: 'Broken during inter-site borrow',
          reportedBy, reportedByName,
          reportedAt: new Date().toISOString().split('T')[0],
          responsibleSiteId: req.fromSiteId,
          ownerSiteId: req.toSiteId,
          cost: 0, technician: null, status: 'Pending',
          completedAt: null, notes: `Liability: ${req.fromSiteId} (borrower)`,
          isBorrowedBreakage: true,
        };
        setRepairs(prev => [...prev, newRepair]);
        setTools(prev => prev.map(t => t.id === toolId ? { ...t, status: 'Broken', responsibleSiteId: req.fromSiteId } : t));
      });
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Returned-Broken' } : r));
    }
  }, [requests, tools]);

  // ── Computed Stats ────────────────────────────────────────────────────────
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
      totalValue: active.reduce((s, t) => s + t.unitValue, 0),
    };
  }, [tools]);

  const getTotalRepairCost = useCallback((siteId = null) => {
    const filtered = siteId ? repairs.filter(r => r.responsibleSiteId === siteId) : repairs;
    return filtered.reduce((s, r) => s + (r.cost || 0), 0);
  }, [repairs]);

  return (
    <AppContext.Provider value={{
      tools, requests, repairs, writeOffRequests,
      sites: SITES, users: USERS, categories: CATEGORIES,
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
