import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HeartPulse,
  CalendarDays,
  ClipboardList,
  BookHeart,
  Sparkles,
  Users,
  Activity,
  ArrowUpRight,
  X,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const studentNav = [
  { label: 'Dashboard', icon: Activity, path: '/dashboard' },
  { label: 'Janji Temu', icon: CalendarDays, path: '/appointments' },
  { label: 'Rekam Medis', icon: ClipboardList, path: '/records' },
  { label: 'Kesehatan', icon: BookHeart, path: '/health' },
  { label: 'Konsultasi AI', icon: Sparkles, path: '/ai' },
  { label: 'Profil', icon: UserCircle, path: '/profile' },
];

const adminNav = [
  { label: 'Dashboard', icon: Activity, path: '/dashboard' },
  { label: 'Janji Temu', icon: CalendarDays, path: '/appointments' },
  { label: 'Data Mahasiswa', icon: Users, path: '/students' },
  { label: 'Rekam Medis', icon: ClipboardList, path: '/records' },
  { label: 'Edukasi', icon: BookHeart, path: '/health' },
];

export default function Sidebar({ open, onClose }) {
  const { isAdmin } = useAuth();
  const nav = isAdmin ? adminNav : studentNav;

  return (
    <aside className={open ? 'side open' : 'side'}>
      <div className="brand">
        <i><HeartPulse /></i>
        <b>UKESMAS<small>UNIVERSITAS KLABAT</small></b>
        <button className="close" onClick={onClose}><X /></button>
      </div>
      <small className="caption">{isAdmin ? 'ADMINISTRATOR' : 'MENU UTAMA'}</small>
      {nav.map(({ label, icon: Icon, path }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) => isActive ? 'nav active' : 'nav'}
          onClick={onClose}
        >
          <Icon size={18} />{label}
        </NavLink>
      ))}
      <div className="help">
        <HeartPulse />
        <b>{isAdmin ? 'Panel petugas' : 'Butuh bantuan?'}</b>
        <p>{isAdmin ? 'Kelola layanan kesehatan mahasiswa.' : 'Tim UKESMAS siap membantu kebutuhan kesehatanmu.'}</p>
        <NavLink to={isAdmin ? '/appointments' : '/ai'} className="link" onClick={onClose}>
          Buka layanan <ArrowUpRight size={14} />
        </NavLink>
      </div>
    </aside>
  );
}
