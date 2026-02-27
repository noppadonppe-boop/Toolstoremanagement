import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import RequisitionsPage from './pages/RequisitionsPage';
import BookingPage from './pages/BookingPage';
import BorrowPage from './pages/BorrowPage';
import RepairsPage from './pages/RepairsPage';
import WriteOffPage from './pages/WriteOffPage';

function ProtectedRoutes() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return (
    <AppProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="requisitions" element={<RequisitionsPage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="borrow" element={<BorrowPage />} />
          <Route path="repairs" element={<RepairsPage />} />
          <Route path="writeoff" element={<WriteOffPage />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}

function AppRoutes() {
  const { currentUser } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
