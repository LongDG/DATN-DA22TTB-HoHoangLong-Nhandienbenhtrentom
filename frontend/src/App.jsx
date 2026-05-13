import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import OTPPage from './pages/OTPPage';
import UserDashboard from './pages/user/UserDashboard';
import AdminLayout from './layouts/AdminLayout';
import DashboardOverview from './pages/admin/DashboardOverview';
import DiagnosticLog from './pages/admin/DiagnosticLog';
import InventoryPage from './pages/admin/InventoryPage';
import OrdersPage from './pages/admin/OrdersPage';
import ConsultationPage from './pages/admin/ConsultationPage';

const API_URL = 'http://localhost:5000/api';

/** Giải mã JWT payload từ localStorage (không cần thư viện) */
function decodeToken(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join('')));
  } catch {
    return null;
  }
}

function isAdmin(user) {
  return user && (user.vaitro === 'admin' || user.role === 'admin');
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Bắt token từ Google OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('token');
    if (oauthToken) {
      localStorage.setItem('token', oauthToken);
      window.history.replaceState({}, document.title, '/');
    }

    const token = localStorage.getItem('token');
    if (token) {
      const payload = decodeToken(token);
      if (payload) setUser(payload);
      else localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleLogin = async (sodienthoai, matkhau) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sodienthoai, matkhau }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const handleRegister = async (formData) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="w-10 h-10 border-4 border-[#005d90] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth routes — redirect nếu đã đăng nhập */}
      <Route path="/login"           element={user ? <Navigate to="/" replace /> : <LoginPage onGoogleLogin={handleGoogleLogin} onLogin={handleLogin} />} />
      <Route path="/register"        element={user ? <Navigate to="/" replace /> : <RegisterPage onGoogleLogin={handleGoogleLogin} onRegister={handleRegister} />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
      <Route path="/otp"             element={user ? <Navigate to="/" replace /> : <OTPPage />} />

      {/* Root: điều hướng theo vai trò */}
      <Route path="/" element={
        !user
          ? <Navigate to="/login" replace />
          : isAdmin(user)
          ? <Navigate to="/admin" replace />
          : <UserDashboard user={user} onLogout={handleLogout} />
      } />

      {/* Admin routes với layout chung */}
      <Route
        path="/admin"
        element={
          isAdmin(user)
            ? <AdminLayout user={user} onLogout={handleLogout} />
            : <Navigate to="/" replace />
        }
      >
        <Route index             element={<DashboardOverview />} />
        <Route path="diagnostics" element={<DiagnosticLog />} />
        <Route path="inventory"   element={<InventoryPage />} />
        <Route path="orders"      element={<OrdersPage />} />
        <Route path="consult"     element={<ConsultationPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
