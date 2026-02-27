import { clsx } from 'clsx';

const variants = {
  'Available':    'bg-emerald-100 text-emerald-800 border-emerald-200',
  'In-Use':       'bg-blue-100 text-blue-800 border-blue-200',
  'Broken':       'bg-rose-100 text-rose-800 border-rose-200',
  'In-Repair':    'bg-amber-100 text-amber-800 border-amber-200',
  'Lost':         'bg-orange-100 text-orange-800 border-orange-200',
  'Written-Off':  'bg-slate-100 text-slate-600 border-slate-200',
  'Pending':      'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Approved':     'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Completed':    'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Rejected':     'bg-rose-100 text-rose-800 border-rose-200',
  'Active':       'bg-blue-100 text-blue-800 border-blue-200',
  'Returned':     'bg-slate-100 text-slate-600 border-slate-200',
  'Returned-Broken': 'bg-rose-100 text-rose-800 border-rose-200',
  'In-Progress':  'bg-purple-100 text-purple-800 border-purple-200',
  default:        'bg-slate-100 text-slate-600 border-slate-200',
};

export default function Badge({ status, label, className }) {
  const text = label ?? status;
  const style = variants[status] ?? variants.default;
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', style, className)}>
      {text}
    </span>
  );
}
