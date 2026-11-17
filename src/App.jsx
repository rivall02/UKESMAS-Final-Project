import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Records from './pages/Records';
import Students from './pages/Students';
import Health from './pages/Health';
import AIConsultation from './pages/AIConsultation';
import Profile from './pages/Profile';

function ProtectedLayout() {
  const { profile, loading } = useAuth();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState('');

  if (loading) return <div className="empty" style={{ padding: 60 }}>Memuat...</div>;
  if (!profile) return <Navigate to="/login" replace />;

  return (
    <div className="shell">
      <Sidebar open={menu} onClose={() => setMenu(false)} />
      <main>
        <Header onMenuOpen={() => setMenu(true)} search={search} onSearch={setSearch} />
        <div className="content">
          <Outlet context={{ search }} />
        </div>
        <footer>
          © 2026 UKESMAS · Universitas Klabat <span>Made with care ♡</span>
        </footer>
      </main>
    </div>
  );
}

function StudentsPage() {
  const { search } = useOutletContext();
  return <Students search={search} />;
}

export default function App() {
  const { profile, loading } = useAuth();

  if (loading) return <div className="empty" style={{ padding: 60 }}>Memuat...</div>;

  return (
    <Routes>
      <Route path="/" element={profile ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/login" element={profile ? <Navigate to="/dashboard" replace /> : <Auth />} />
      <Route path="/register" element={profile ? <Navigate to="/dashboard" replace /> : <Auth />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/records" element={<Records />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/health" element={<Health />} />
        <Route path="/ai" element={<AIConsultation />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
