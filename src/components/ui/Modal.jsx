import { X } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * Modal ที่เมื่อ open แล้วจะไม่ unmount เนื้อหาเมื่อ parent re-render (เช่น ข้อมูลจาก Firestore อัปเดต)
 * จึงช่วยให้ state ในฟอร์ม (ที่กำลังกรอก) ไม่หายเมื่อมีคนอื่นบันทึกข้อมูล
 */
export default function Modal({ open, onClose, title, children, size = 'md', className }) {
  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={clsx('relative bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh]', widths[size], className)}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
