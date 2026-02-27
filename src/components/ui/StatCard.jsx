import { clsx } from 'clsx';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue:    'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose:    'bg-rose-50 text-rose-600 border-rose-100',
    amber:   'bg-amber-50 text-amber-600 border-amber-100',
    slate:   'bg-slate-50 text-slate-600 border-slate-100',
    orange:  'bg-orange-50 text-orange-600 border-orange-100',
    purple:  'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      {Icon && (
        <div className={clsx('p-3 rounded-xl border', colors[color])}>
          <Icon size={22} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 font-medium truncate">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {trend && (
        <span className={clsx('text-xs font-medium px-2 py-1 rounded-full', trend > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600')}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
  );
}
