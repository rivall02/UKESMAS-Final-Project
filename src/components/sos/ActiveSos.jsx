import { useState } from 'react';
import {
  Volume2,
  VolumeX,
  AlertTriangle,
  Clock,
  Navigation,
  CheckCircle2,
  Share2,
  MapPin,
  Save,
} from 'lucide-react';
import { STATUS, mapsPointUrl } from '../../constants';
import { updateEmergencyDetails } from '../../services/emergency';

export default function ActiveSos({
  emergencyDoc,
  merged,
  isMuted,
  onToggleSound,
}) {
  const [note, setNote] = useState('');
  const [locDetail, setLocDetail] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const status = emergencyDoc?.status || STATUS.URGENT;
  const isUrgent = status === STATUS.URGENT;
  const isDitangani = status === STATUS.DITANGANI;
  const isDirujuk = status === STATUS.DIRUJUK;
  const isSelesai = status === STATUS.SELESAI;

  async function handleSaveDetails(e) {
    e.preventDefault();
    if (!emergencyDoc?.id) return;
    setErrorMsg('');
    setSavedSuccess(false);

    const payload = {};
    if (note.trim()) payload.emergencyNote = note.trim();
    if (locDetail.trim()) payload.locationDetail = locDetail.trim();

    if (Object.keys(payload).length === 0) return;

    setSaving(true);
    try {
      await updateEmergencyDetails(emergencyDoc.id, payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      setErrorMsg('Gagal memperbarui detail: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function renderStatusBadge() {
    if (isSelesai) {
      return (
        <span className="sos-status-badge-lg selesai">
          <CheckCircle2 size={16} /> Selesai Ditangani
        </span>
      );
    }
    if (isDirujuk) {
      return (
        <span className="sos-status-badge-lg dirujuk">
          <Share2 size={16} /> Dirujuk ke Rumah Sakit
        </span>
      );
    }
    if (isDitangani) {
      return (
        <span className="sos-status-badge-lg ditangani">
          <Navigation size={16} /> Petugas Sedang Menuju
        </span>
      );
    }
    return (
      <span className="sos-status-badge-lg urgent">
        <Clock size={16} /> Menunggu Petugas
      </span>
    );
  }

  function renderStatusExplanation() {
    if (isSelesai) {
      return (
        <p className="sos-status-desc">
          <b>Penanganan Selesai.</b> Petugas UKESMAS telah menyelesaikan penanganan darurat ini.
          Terima kasih atas kerja samanya.
        </p>
      );
    }
    if (isDirujuk) {
      return (
        <p className="sos-status-desc">
          <b>Pasien Telah Dirujuk.</b> Petugas merujuk pasien ke{' '}
          <b>{emergencyDoc?.referral?.hospital || 'Rumah Sakit Rujukan'}</b> untuk penanganan lebih
          lanjut.
        </p>
      );
    }
    if (isDitangani) {
      return (
        <p className="sos-status-desc">
          <b>Petugas Dalam Perjalanan!</b> Petugas UKESMAS sedang menuju ke lokasi kamu. Tetap
          tenang dan posisikan diri di tempat yang aman.
        </p>
      );
    }
    return (
      <p className="sos-status-desc">
        <b>Laporan Berhasil Terkirim.</b> Notifikasi darurat telah dikirim ke panel petugas UKESMAS.
        Mohon tunggu, petugas akan segera merespons dan menuju lokasimu.
      </p>
    );
  }

  return (
    <div className="sos-container">
      {!isSelesai && (
        <div className="sos-banner-alert">
          <div className="sos-banner-icon">
            <AlertTriangle size={24} color="#fff" />
          </div>
          <p>Jangan kunci layar atau keluar dari halaman ini agar petugas bisa menemukanmu lewat suara.</p>
        </div>
      )}

      {merged && (
        <div className="sos-merged-notice">
          <AlertTriangle size={16} />
          <span>Janji temu kamu hari ini ikut digabung menjadi laporan darurat.</span>
        </div>
      )}

      <div className="sos-active-card">
        <div className="sos-status-header">
          {renderStatusBadge()}

          {!isSelesai && (
            <button
              type="button"
              className={`sos-sound-toggle-btn ${isMuted ? 'muted' : 'active'}`}
              onClick={onToggleSound}
            >
              {isMuted ? (
                <>
                  <VolumeX size={15} /> Bunyikan lagi
                </>
              ) : (
                <>
                  <Volume2 size={15} /> Matikan suara
                </>
              )}
            </button>
          )}
        </div>

        {renderStatusExplanation()}

        <div className="sos-detail-box">
          <div className="sos-detail-row">
            <span className="sos-detail-label">Pasien:</span>
            <span className="sos-detail-val">
              {emergencyDoc?.studentName || 'Mahasiswa'} {emergencyDoc?.nim ? `(${emergencyDoc.nim})` : ''}
            </span>
          </div>

          <div className="sos-detail-row">
            <span className="sos-detail-label">Waktu Laporan:</span>
            <span className="sos-detail-val">
              {emergencyDoc?.time} WITA · {emergencyDoc?.date}
            </span>
          </div>

          {emergencyDoc?.location?.lat && (
            <div className="sos-detail-row">
              <span className="sos-detail-label">Koordinat GPS:</span>
              <span className="sos-detail-val">
                <a
                  href={mapsPointUrl(emergencyDoc.location)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#1890ff', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <MapPin size={12} /> Buka Maps
                </a>
              </span>
            </div>
          )}

          {emergencyDoc?.locationDetail && (
            <div className="sos-detail-row">
              <span className="sos-detail-label">Lokasi Pasti:</span>
              <span className="sos-detail-val">{emergencyDoc.locationDetail}</span>
            </div>
          )}

          {emergencyDoc?.emergencyNote && (
            <div className="sos-detail-row">
              <span className="sos-detail-label">Keterangan:</span>
              <span className="sos-detail-val">{emergencyDoc.emergencyNote}</span>
            </div>
          )}

          {emergencyDoc?.ambulanceRequested && (
            <div className="sos-detail-row">
              <span className="sos-detail-label">Ambulans Kampus:</span>
              <span className="sos-detail-val" style={{ color: '#ff4d4f' }}>
                Diminta
              </span>
            </div>
          )}
        </div>

        {isUrgent && (
          <form className="sos-update-panel" onSubmit={handleSaveDetails}>
            <h4>Lengkapi Catatan & Detail Lokasi (Opsional)</h4>
            <div className="form">
              <label>
                Detail Lokasi Tambahan
                <input
                  type="text"
                  value={locDetail}
                  onChange={(e) => setLocDetail(e.target.value)}
                  placeholder="Misal: Lantai 2, dekat tangga barat"
                />
              </label>
            </div>
            <div className="form">
              <label>
                Catatan Gejala / Tambahan
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Misal: Pasien sudah sadar namun masih pusing..."
                />
              </label>
            </div>

            {errorMsg && <div className="sos-error-box">{errorMsg}</div>}
            {savedSuccess && <div className="sos-success-text">Detail berhasil disimpan!</div>}

            <button
              type="submit"
              className="sos-save-btn"
              disabled={saving || (!note.trim() && !locDetail.trim())}
            >
              <Save size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

