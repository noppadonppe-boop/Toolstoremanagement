import { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

import LoginPage            from './pages/LoginPage';
import RegisterPage         from './pages/RegisterPage';
import PendingApprovalPage  from './pages/PendingApprovalPage';
import DashboardPage        from './pages/DashboardPage';
import InventoryPage        from './pages/InventoryPage';
import RequisitionsPage     from './pages/RequisitionsPage';
import BookingPage          from './pages/BookingPage';
import BorrowPage           from './pages/BorrowPage';
import RepairsPage          from './pages/RepairsPage';
import WriteOffPage         from './pages/WriteOffPage';
import AdminPanel           from './pages/AdminPanel';
import ProjectsPage         from './pages/ProjectsPage';

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50">
        <div className="bg-white border border-red-200 rounded-xl p-8 max-w-lg text-center shadow-lg">
          <p className="text-red-600 font-semibold text-lg mb-2">เกิดข้อผิดพลาด</p>
          <p className="text-slate-500 text-sm mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            โหลดใหม่
          </button>
        </div>
      </div>
    );
  }
}

// ── Authenticated shell (wraps all protected pages) ───────────────────────────
function AppShell() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="inventory"    element={<InventoryPage />} />
          <Route path="requisitions" element={<RequisitionsPage />} />
          <Route path="booking"      element={<BookingPage />} />
          <Route path="borrow"       element={<BorrowPage />} />
          <Route path="repairs"      element={<RepairsPage />} />
          <Route path="writeoff"     element={<WriteOffPage />} />
          <Route
            path="projects"
            element={
              <ProtectedRoute requireRoles={['SuperAdmin', 'Admin']}>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute requireRoles={['SuperAdmin', 'Admin']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </AppProvider>
  );
}

// ── Route tree ────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { firebaseUser, userProfile, loading } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          !loading && firebaseUser && userProfile?.status === 'approved'
            ? <Navigate to="/" replace />
            : <LoginPage />
        }
      />
      <Route
        path="/register"
        element={
          !loading && firebaseUser && userProfile?.status === 'approved'
            ? <Navigate to="/" replace />
            : <RegisterPage />
        }
      />

      {/* Requires login (any status) */}
      <Route
        path="/pending"
        element={
          <ProtectedRoute requireApproved={false}>
            <PendingApprovalPage />
          </ProtectedRoute>
        }
      />

      {/* Protected — requires approved status */}
      <Route
        path="/*"
        element={
          <ProtectedRoute requireApproved={true}>
            <AppShell />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
