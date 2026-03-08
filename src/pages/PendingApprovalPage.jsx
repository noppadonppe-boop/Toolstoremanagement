import { Clock, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PendingApprovalPage() {
  const { userProfile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock size={40} className="text-amber-500" />
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">รอการอนุมัติ</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          บัญชีของคุณถูกสร้างแล้ว กำลังรอผู้ดูแลระบบอนุมัติสิทธิ์การเข้าถึง
        </p>

        {userProfile && (
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail size={14} className="text-slate-400 shrink-0" />
              <span className="font-medium">อีเมล:</span>
              <span className="text-slate-700">{userProfile.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium">ชื่อ:</span>
              <span className="text-slate-700">{userProfile.name}</span>
            </div>
            {userProfile.position && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="font-medium">ตำแหน่ง:</span>
                <span className="text-slate-700">{userProfile.position}</span>
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-blue-700 text-sm">
            กรุณารอให้ผู้ดูแลระบบ (Admin/SuperAdmin) อนุมัติบัญชีของคุณ หลังจากได้รับการอนุมัติจะสามารถเข้าใช้งานระบบได้ทันที
          </p>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <LogOut size={16} />
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
