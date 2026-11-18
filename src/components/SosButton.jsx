import { NavLink, useLocation } from 'react-router-dom';
import { Siren } from 'lucide-react';

export default function SosButton() {
  const location = useLocation();

  if (location.pathname === '/sos') {
    return null;
  }

  return (
    <NavLink to="/sos" className="sos-fab" title="SOS Darurat" aria-label="Buka Halaman SOS Darurat">
      <Siren size={20} />
      <span>SOS</span>
    </NavLink>
  );
}
