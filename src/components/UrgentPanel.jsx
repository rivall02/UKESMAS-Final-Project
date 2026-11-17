import { useEffect, useState } from 'react';
import { AlertTriangle, Check, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { STATUS, mapsPointUrl } from '../constants';
import { subscribeActiveEmergencies, setEmergencyStatus } from '../services/emergencyStaff';
import { formatDate } from '../utils/date';

export default function UrgentPanel() {
  const { profile } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(
    () => subscribeActiveEmergencies(setItems, (err) => console.error('Gagal memuat darurat:', err)),
    [],
  );

  async function handle(a, status) {
    try {
      await setEmergencyStatus(a, status, profile);
    } catch (err) {
      alert('Gagal memperbarui status: ' + err.message);
    }
  }

  if (!items.length) return null;

  return (
    <div className="urgent-panel">
      <div className="urgent-panel-header">
        <div className="urgent-pulse">
          <AlertTriangle size={18} />
        </div>
        <div>
          <h3>Janji Temu Darurat ({items.length})</h3>
          <small>Mahasiswa memerlukan penanganan segera!</small>
        </div>
      </div>
      {items.map((a) => (
        <div className="urgent-item" key={a.id}>
          <div className="urgent-info">
            <b>{a.studentName}</b> <span className="badge-urgent">{a.status.toUpperCase()}</span>
            <small>{a.nim}</small>
            <div className="urgent-location">
              <MapPin size={12} /> {a.locationDetail || a.location?.text || 'Lokasi tidak tersedia'}
              {a.location?.lat && (
                <a href={mapsPointUrl(a.location)} target="_blank" rel="noreferrer">
                  Buka Maps
                </a>
              )}
            </div>
            {(a.emergencyNote || a.aiSummary) && (
              <p className="urgent-summary">{a.emergencyNote || a.aiSummary}</p>
            )}
            <small className="urgent-time">
              {a.time} · {formatDate(a.date)}
            </small>
          </div>
          <div className="actions">
            {a.status === STATUS.URGENT && (
              <button onClick={() => handle(a, STATUS.DITANGANI)} className="urgent-handle">
                <Check size={14} /> Tangani
              </button>
            )}
            <button onClick={() => handle(a, STATUS.SELESAI)}>Selesai</button>
          </div>
        </div>
      ))}
    </div>
  );
}
