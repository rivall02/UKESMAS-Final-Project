import { NavLink } from 'react-router-dom';
import { Siren } from 'lucide-react';
import Title from '../components/Title';

export default function Sos() {
  return (
    <>
      <Title title="SOS Darurat" desc="Kirim permintaan bantuan darurat ke petugas UKESMAS." />
      <div className="panel empty">
        <Siren />
        <p>Fitur SOS sedang dikembangkan.</p>
        <p>
          Untuk sementara, ceritakan keluhanmu di <NavLink to="/ai" className="link">Konsultasi AI</NavLink>. Jika
          terdeteksi darurat, permintaan bantuan akan dikirim ke petugas.
        </p>
      </div>
    </>
  );
}
