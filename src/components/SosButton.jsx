import { NavLink } from 'react-router-dom';
import { Siren } from 'lucide-react';

export default function SosButton() {
  return (
    <NavLink to="/sos" className="sos-fab" title="SOS Darurat">
      <Siren size={20} />
      <span>SOS</span>
    </NavLink>
  );
}
