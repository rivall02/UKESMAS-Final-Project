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
  Siren,
  UserCog,
  Settings,
} from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { ROLE_LABELS } from '../constants';
import BrandLogo from './BrandLogo';

const studentNav = [
  { label: 'Dashboard', icon: Activity, path: '/dashboard' },
  { label: 'Janji Temu', icon: CalendarDays, path: '/appointments' },
  { label: 'Rekam Medis', icon: ClipboardList, path: '/records' },
  { label: 'Kesehatan', icon: BookHeart, path: '/health' },
  { label: 'Konsultasi AI', icon: Sparkles, path: '/ai' },
  { label: 'SOS Darurat', icon: Siren, path: '/sos' },
  { label: 'Profil', icon: UserCircle, path: '/profile' },
  { label: 'Pengaturan', icon: Settings, path: '/settings' },
];

const staffNav = [
  { label: 'Dashboard', icon: Activity, path: '/dashboard' },
  { label: 'Janji Temu', icon: CalendarDays, path: '/appointments' },
  { label: 'Data Mahasiswa', icon: Users, path: '/students' },
  { label: 'Rekam Medis', icon: ClipboardList, path: '/records' },
  { label: 'Edukasi', icon: BookHeart, path: '/health' },
  { label: 'Profil', icon: UserCircle, path: '/profile' },
  { label: 'Pengaturan', icon: Settings, path: '/settings' },
];

const adminNav = [
  ...staffNav.slice(0, 5),
  { label: 'Kelola Staff', icon: UserCog, path: '/staff' },
  ...staffNav.slice(5),
];

export default function Sidebar({ open, onClose }) {
  const { role, isStudent, isAdmin } = useAuth();
  const nav = isAdmin ? adminNav : isStudent ? studentNav : staffNav;

  return (
    <aside className={open ? 'side open' : 'side'}>
      <div className="brand">
        <BrandLogo />
        <b>UKESMAS<small>UNIVERSITAS KLABAT</small></b>
        <button className="close" onClick={onClose}><X /></button>
      </div>
      <small className="caption">{isStudent ? 'MENU UTAMA' : ROLE_LABELS[role]?.toUpperCase()}</small>
      {nav.map(({ label, icon: Icon, path }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) => (isActive ? 'nav active' : 'nav')}
          onClick={onClose}
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
      <div className="help">
        <HeartPulse />
        <b>{isStudent ? 'Butuh bantuan?' : 'Panel petugas'}</b>
        <p>{isStudent ? 'Tim UKESMAS siap membantu kebutuhan kesehatanmu.' : 'Kelola layanan kesehatan mahasiswa.'}</p>
        <NavLink to={isStudent ? '/ai' : '/appointments'} className="link" onClick={onClose}>
          Buka layanan <ArrowUpRight size={14} />
        </NavLink>
      </div>
    </aside>
  );
}
