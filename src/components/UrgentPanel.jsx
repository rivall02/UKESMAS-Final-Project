import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { STATUS, HOSPITALS, mapsPointUrl } from '../constants';
import {
  subscribeActiveEmergencies,
  setEmergencyStatus,
  referEmergency,
} from '../services/emergencyStaff';
import { formatDate } from '../utils/date';
import Modal from './Modal';
import RecordModal from './RecordModal';
import '../styles/emergency.css';

const VICTIM_LABELS = {
  self: 'Diri sendiri',
  student: 'Mahasiswa lain',
  external: 'Bukan mahasiswa',
};

export default function UrgentPanel() {
  const { profile } = useAuth();
  const [items, setItems] = useState([]);
  const [referralAppt, setReferralAppt] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(HOSPITALS[0]?.name || '');
  const [referring, setReferring] = useState(false);
  const [recordAppt, setRecordAppt] = useState(null);

  useEffect(() => {
    return subscribeActiveEmergencies(setItems, (err) =>
      console.error('Gagal memuat darurat:', err),
    );
  }, []);

  async function handleStatus(appointment, status) {
    try {
      await setEmergencyStatus(appointment, status, profile);
    } catch (err) {
      console.error('Gagal memperbarui status:', err);
      alert('Gagal memperbarui status: ' + err.message);
    }
  }

  async function handleReferSubmit(e) {
    e.preventDefault();
    if (!referralAppt || !selectedHospital) return;
    setReferring(true);
    try {
      await referEmergency(referralAppt, selectedHospital, profile);
      setReferralAppt(null);
    } catch (err) {
      console.error('Gagal merujuk ke RS:', err);
      alert('Gagal merujuk ke rumah sakit: ' + err.message);
    } finally {
      setReferring(false);
    }
  }

  if (!items.length) return null;

  return (
    <>
      <div className="emg-panel">
        <div className="emg-panel-header">
          <div className="emg-panel-icon">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3>Janji Temu Darurat ({items.length})</h3>
            <small>Mahasiswa memerlukan penanganan medis segera!</small>
          </div>
        </div>

        {items.map((a) => (
          <div className="emg-panel-item" key={a.id}>
            <div className="emg-item-header">
              <div>
                <b>{a.studentName || 'Pasien Anonim'}</b>
                {a.nim && <small>NIM: {a.nim}</small>}
              </div>

              <div className="emg-tags">
                <span className={`status ${a.status === STATUS.URGENT ? 'urgent' : 'ditangani'}`}>
                  {a.status}
                </span>
                <span className="emg-badge-victim">
                  {VICTIM_LABELS[a.victimType] || a.victimType || 'Mahasiswa'}
                </span>
                {a.ambulanceRequested && (
                  <span className="emg-badge-ambulance">
                    <AlertTriangle size={11} /> Minta ambulans
                  </span>
                )}
              </div>
            </div>

            {a.reporterName && a.reporterId !== a.userId && (
              <div className="emg-reporter-info">
                Dilaporkan oleh: <strong>{a.reporterName}</strong>
              </div>
            )}

            {a.mergedFrom && (
              <div className="emg-merged-info">
                <CalendarDays size={12} />
                <span>
                  Digabung dari janji {a.mergedFrom.service || 'sebelumnya'} jam {a.mergedFrom.time || ''}
                </span>
              </div>
            )}

            <div className="emg-detail-row">
              <MapPin size={13} />
              <span>{a.locationDetail || a.location?.text || 'Lokasi tidak tersedia'}</span>
              {a.location?.lat && (
                <a
                  href={mapsPointUrl(a.location)}
                  target="_blank"
                  rel="noreferrer"
                  className="emg-maps-link"
                >
                  Buka Maps <ExternalLink size={10} />
                </a>
              )}
            </div>

            {(a.emergencyNote || a.aiSummary) && (
              <div className="emg-note-box">
                {a.emergencyNote || a.aiSummary}
              </div>
            )}

            <small className="urgent-time">
              Jam: {a.time} WITA · {formatDate(a.date)}
              {a.handledBy?.name && ` · Ditangani oleh: ${a.handledBy.name}`}
            </small>

            <div className="emg-panel-actions">
              {a.status === STATUS.URGENT && (
                <button
                  className="emg-btn-primary-action"
                  onClick={() => handleStatus(a, STATUS.DITANGANI)}
                >
                  <Check size={13} /> Tangani
                </button>
              )}

              <button
                className="emg-btn-referral"
                onClick={() => {
                  setReferralAppt(a);
                  setSelectedHospital(HOSPITALS[0]?.name || '');
                }}
              >
                <Building2 size={13} /> Rujuk ke RS
              </button>

              <button onClick={() => handleStatus(a, STATUS.SELESAI)}>
                <CheckCircle2 size={13} /> Selesai
              </button>

              {a.userId && (
                <button
                  className="emg-btn-record"
                  onClick={() => setRecordAppt(a)}
                >
                  <FileText size={13} /> Rekam Medis
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Referral to Hospital Modal */}
      {referralAppt && (
        <Modal
          title={`Rujuk ke RS — ${referralAppt.studentName || 'Pasien'}`}
          close={() => setReferralAppt(null)}
        >
          <form className="form" onSubmit={handleReferSubmit}>
            <label>
              Pilih Rumah Sakit Rujukan
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                required
              >
                {HOSPITALS.map((h) => (
                  <option key={h.name} value={h.name}>
                    {h.name} {h.main ? '(RS Rujukan Utama Advent)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <p style={{ fontSize: '10px', color: '#8c7783', margin: '4px 0' }}>
              Status darurat akan diubah menjadi <strong>Dirujuk</strong> dan mahasiswa bersangkutan
              akan menerima notifikasi arahan rumah sakit.
            </p>
            <button className="primary" disabled={referring}>
              {referring ? 'Menyimpan rujukan...' : 'Simpan & Rujuk ke RS'}
            </button>
          </form>
        </Modal>
      )}

      {/* Medical Record Modal */}
      {recordAppt && (
        <RecordModal
          appointment={recordAppt}
          onClose={() => setRecordAppt(null)}
        />
      )}
    </>
  );
}
