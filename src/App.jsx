import { useState } from 'react';
import { Routes, Route, Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { useAuth } from './contexts/auth';
import { ROLES } from './constants';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SosButton from './components/SosButton';
import EmergencyAlert from './components/EmergencyAlert';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Records from './pages/Records';
import Students from './pages/Students';
import Health from './pages/Health';
import AIConsultation from './pages/AIConsultation';
import Profile from './pages/Profile';
import Sos from './pages/Sos';
import ManageStaff from './pages/ManageStaff';

const Loading = () => <div className="empty" style={{ padding: 60 }}>Memuat...</div>;

function ProtectedLayout() {
  const { profile, loading, isStudent, isStaff } = useAuth();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState('');

  if (loading) return <Loading />;
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
      {isStudent && <SosButton />}
      {isStaff && <EmergencyAlert />}
    </div>
  );
}

function RequireRole({ allow }) {
  const { role } = useAuth();
  const context = useOutletContext();
  return allow.includes(role) ? <Outlet context={context} /> : <Navigate to="/dashboard" replace />;
}

function StudentsPage() {
  const { search } = useOutletContext();
  return <Students search={search} />;
}

export default function App() {
  const { profile, loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <Routes>
      <Route path="/" element={profile ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/login" element={profile ? <Navigate to="/dashboard" replace /> : <Auth />} />
      <Route path="/register" element={profile ? <Navigate to="/dashboard" replace /> : <Auth />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/records" element={<Records />} />
        <Route path="/health" element={<Health />} />
        <Route path="/profile" element={<Profile />} />

        <Route element={<RequireRole allow={[ROLES.STUDENT]} />}>
          <Route path="/ai" element={<AIConsultation />} />
          <Route path="/sos" element={<Sos />} />
        </Route>

        <Route element={<RequireRole allow={[ROLES.STAFF, ROLES.ADMIN]} />}>
          <Route path="/students" element={<StudentsPage />} />
        </Route>

        <Route element={<RequireRole allow={[ROLES.ADMIN]} />}>
          <Route path="/staff" element={<ManageStaff />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
