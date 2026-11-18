import { useLocation } from 'react-router-dom';
import { Menu, Search, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import NotificationBell from './NotificationBell';

const pageNames = {
  '/dashboard': 'Dashboard',
  '/appointments': 'Janji Temu',
  '/records': 'Rekam Medis',
  '/students': 'Data Mahasiswa',
  '/health': 'Kesehatan',
  '/ai': 'Konsultasi AI',
  '/sos': 'SOS Darurat',
  '/profile': 'Profil',
  '/settings': 'Pengaturan',
  '/staff': 'Kelola Staff',
};

export default function Header({ onMenuOpen, search, onSearch }) {
  const { profile, isStudent, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <header className="top">
      <button className="hamb" onClick={onMenuOpen}><Menu /></button>
      <span>UKESMAS / <b>{pageNames[pathname] || 'Dashboard'}</b></span>
      <div className="topright">
        {pathname === '/students' && (
          <label className="search">
            <Search size={15} />
            <input
              placeholder="Cari nama / NIM..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
            />
          </label>
        )}
        {isStudent && <NotificationBell />}
        <span className="online">● Online</span>
        <b className="who">{profile?.name}</b>
        <button className="logout" onClick={logout} title="Keluar"><LogOut size={16} /></button>
      </div>
    </header>
  );
}
