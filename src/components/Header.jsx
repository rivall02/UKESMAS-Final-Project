import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Search, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';

const pageNames = {
  '/dashboard': 'Dashboard',
  '/appointments': 'Janji Temu',
  '/records': 'Rekam Medis',
  '/students': 'Data Mahasiswa',
  '/health': 'Kesehatan',
  '/ai': 'Konsultasi AI',
  '/profile': 'Profil',
};

export default function Header({ onMenuOpen, search, onSearch }) {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const pageName = pageNames[location.pathname] || 'Dashboard';

  return (
    <header className="top">
      <button className="hamb" onClick={onMenuOpen}><Menu /></button>
      <span>UKESMAS / <b>{pageName}</b></span>
      <div className="topright">
        <label className="search">
          <Search size={15} />
          <input
            placeholder="Cari mahasiswa..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </label>
        <NotificationBell />
        <span className="online">● Online</span>
        <b className="who">{profile?.name}</b>
        <button className="logout" onClick={logout}><LogOut size={16} /></button>
      </div>
    </header>
  );
}
