import { useMemo } from 'react';
import {
  Package, Wrench, AlertTriangle, TrendingUp, MapPin,
  CheckCircle, Clock, XCircle, BarChart2, DollarSign, Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#f97316', '#94a3b8'];

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { tools, repairs, writeOffRequests, requests, sites, getStats, getTotalRepairCost } = useApp();

  const isGlobal = ['MD', 'Admin', 'ProcurementManager', 'StoreMain'].includes(currentUser.role);
  const siteId = isGlobal ? null : currentUser.siteId;

  const stats = useMemo(() => getStats(siteId), [tools, siteId]);
  const totalRepairCost = useMemo(() => getTotalRepairCost(siteId), [repairs, siteId]);

  const pieData = [
    { name: 'Available', value: stats.available },
    { name: 'In-Use', value: stats.inUse },
    { name: 'In-Repair', value: stats.inRepair },
    { name: 'Broken', value: stats.broken },
    { name: 'Lost', value: stats.lost },
    { name: 'Written-Off', value: stats.writtenOff },
  ].filter(d => d.value > 0);

  const siteBarData = useMemo(() => {
    return sites.map(site => {
      const s = getStats(site.id);
      const cost = getTotalRepairCost(site.id);
      return { name: site.name.replace('Site ', ''), available: s.available, inUse: s.inUse, broken: s.broken + s.inRepair, cost };
    });
  }, [tools, repairs]);

  const pendingWO = writeOffRequests.filter(w => w.status === 'Pending');
  const pendingReqs = requests.filter(r => r.status === 'Pending');
  const recentRepairs = repairs.slice(0, 5);

  const brokenPct = stats.total > 0 ? (((stats.broken + stats.inRepair) / stats.total) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {currentUser.name.split(' ')[0]} 👋</h2>
            <p className="text-blue-200 mt-1">
              {isGlobal ? 'Global overview across all sites' : `Site view: ${currentUser.siteId}`}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
            <Activity size={18} />
            <span className="text-sm font-medium">{currentUser.role}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-blue-200">Total Tools</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{stats.available}</div>
            <div className="text-xs text-blue-200">Available</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{brokenPct}%</div>
            <div className="text-xs text-blue-200">Broken/Repair Rate</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">฿{totalRepairCost.toLocaleString()}</div>
            <div className="text-xs text-blue-200">Total Repair Cost</div>
          </div>
        </div>
      </div>

      {/* Procurement Manager special view */}
      {currentUser.role === 'ProcurementManager' && pendingWO.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-orange-600" />
            <h3 className="font-semibold text-orange-800">Pending Write-off Approvals ({pendingWO.length})</h3>
          </div>
          <div className="space-y-2">
            {pendingWO.map(wo => (
              <div key={wo.id} className="bg-white rounded-xl p-3 flex items-center justify-between border border-orange-100">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{wo.toolName}</p>
                  <p className="text-xs text-slate-500">{wo.reason} · {wo.reportedAt}</p>
                </div>
                <Badge status="Pending" />
              </div>
            ))}
          </div>
          <p className="text-xs text-orange-600 mt-3">Go to Write-off Management to process these requests.</p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Available" value={stats.available} icon={CheckCircle} color="emerald"
          subtitle={`${stats.total > 0 ? ((stats.available / stats.total) * 100).toFixed(0) : 0}% of fleet`} />
        <StatCard title="In-Use" value={stats.inUse} icon={Activity} color="blue"
          subtitle="Currently deployed" />
        <StatCard title="Broken / In-Repair" value={stats.broken + stats.inRepair} icon={Wrench} color="rose"
          subtitle={`${brokenPct}% breakdown rate`} />
        <StatCard title="Repair Costs" value={`฿${totalRepairCost.toLocaleString()}`} icon={DollarSign} color="amber"
          subtitle={siteId ? 'This site' : 'All sites'} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><BarChart2 size={18} /> Tool Status Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-400 py-16">No data</p>}
        </div>

        {/* Bar Chart by site */}
        {isGlobal && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><MapPin size={18} /> Inventory by Site</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={siteBarData} barSize={20}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="available" fill="#10b981" name="Available" radius={[4,4,0,0]} />
                <Bar dataKey="inUse" fill="#3b82f6" name="In-Use" radius={[4,4,0,0]} />
                <Bar dataKey="broken" fill="#ef4444" name="Broken/Repair" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Repair Cost by Site (global) */}
        {isGlobal && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><TrendingUp size={18} /> Repair Cost by Responsible Site</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={siteBarData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `฿${v/1000}k`} />
                <Tooltip formatter={v => `฿${v.toLocaleString()}`} />
                <Bar dataKey="cost" fill="#f59e0b" name="Repair Cost (฿)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Repairs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><Wrench size={18} /> Recent Repairs</h3>
          {recentRepairs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No repairs logged</p>
          ) : (
            <div className="space-y-2">
              {recentRepairs.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{r.toolName}</p>
                    <p className="text-xs text-slate-400">{r.issue} · ⚠️ {r.responsibleSiteId}</p>
                  </div>
                  <div className="text-right">
                    <Badge status={r.status} />
                    {r.cost > 0 && <p className="text-xs text-amber-600 mt-1 font-medium">฿{r.cost.toLocaleString()}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Requests Summary */}
      {pendingReqs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-amber-500" /> Pending Requests ({pendingReqs.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingReqs.slice(0, 6).map(req => (
              <div key={req.id} className="border border-slate-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-blue-600">{req.id}</span>
                  <Badge status={req.status} />
                </div>
                <p className="text-sm font-medium text-slate-700">{req.type}</p>
                <p className="text-xs text-slate-400 mt-1">By {req.requestedByName} · {req.createdAt}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
