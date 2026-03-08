import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-medium">กำลังโหลด...</p>
      </div>
    </div>
  );
}

/**
 * @param {{ requireApproved?: boolean, requireRoles?: string[], children: React.ReactNode }} props
 */
export default function ProtectedRoute({ requireApproved = true, requireRoles = null, children }) {
  const { firebaseUser, userProfile, loading } = useAuth();
  const location = useLocation();

  // 1. Auth state still loading
  if (loading || firebaseUser === undefined) return <LoadingScreen />;

  // 2. Not logged in
  if (!firebaseUser) return <Navigate to="/login" state={{ from: location }} replace />;

  // 3. Logged in but profile not yet loaded
  if (!userProfile) return <LoadingScreen />;

  // 4. Account status checks
  if (requireApproved) {
    if (userProfile.status === 'pending')  return <Navigate to="/pending"  replace />;
    if (userProfile.status === 'rejected') return <Navigate to="/login"    replace />;
  }

  // 5. Role check
  if (requireRoles) {
    const userRoles = userProfile.roles || [userProfile.role];
    const allowed   = requireRoles.some(r => userRoles.includes(r));
    if (!allowed) return <Navigate to="/" replace />;
  }

  return children;
}
