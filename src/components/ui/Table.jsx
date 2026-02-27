import { clsx } from 'clsx';

export function Table({ children, className }) {
  return (
    <div className={clsx('w-full overflow-x-auto', className)}>
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  );
}

export function Thead({ children }) {
  return (
    <thead className="bg-slate-50 border-b border-slate-200">
      {children}
    </thead>
  );
}

export function Th({ children, className }) {
  return (
    <th className={clsx('px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap', className)}>
      {children}
    </th>
  );
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function Tr({ children, className, onClick }) {
  return (
    <tr
      className={clsx('hover:bg-slate-50 transition-colors', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className }) {
  return (
    <td className={clsx('px-4 py-3 text-slate-700 whitespace-nowrap', className)}>
      {children}
    </td>
  );
}
