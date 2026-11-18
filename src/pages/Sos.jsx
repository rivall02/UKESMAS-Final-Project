import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Siren, User, Users, AlertCircle, Bot } from 'lucide-react';
import Title from '../components/Title';
import { useAuth } from '../contexts/auth';
import { ACTIVE_EMERGENCY_STATUSES } from '../constants';
import {
  createEmergency,
  getActiveEmergency,
  subscribeEmergency,
  getCurrentLocation,
} from '../services/emergency';
import { createSirenController } from '../components/sos/sirenAudio';
import ActiveSos from '../components/sos/ActiveSos';
import OtherPersonForm from '../components/sos/OtherPersonForm';
import '../styles/sos.css';

export default function Sos() {
  const { profile } = useAuth();
  const routeLocation = useLocation();
  const aiState = routeLocation.state;

  const [mode, setMode] = useState('self');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emergencyId, setEmergencyId] = useState(null);
  const [emergencyDoc, setEmergencyDoc] = useState(null);
  const [merged, setMerged] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [checking, setChecking] = useState(true);
  // Sirene, wake lock, dan peringatan tab hanya untuk SOS diri sendiri (korban bisa pingsan/tidak bisa bersuara).
  // Laporan untuk orang lain tidak perlu sirene karena pelapor sendiri yang menunjukkan lokasi korban.
  const [isSelfSos, setIsSelfSos] = useState(true);

  const sirenRef = useRef(null);

  // Selesai dan Dirujuk sama-sama akhir laporan: sirene, wake lock, dan peringatan tab dimatikan.
  const isCompleted = Boolean(emergencyDoc) && !ACTIVE_EMERGENCY_STATUSES.includes(emergencyDoc.status);

  useEffect(() => {
    return () => {
      sirenRef.current?.stop();
    };
  }, []);

  // Pulihkan SOS yang masih aktif setelah halaman di-refresh agar tidak terkirim dobel.
  useEffect(() => {
    let active = true;
    getActiveEmergency(profile.id)
      .then((found) => {
        if (active && found) {
          setEmergencyId(found.id);
          setEmergencyDoc(found);
          setIsSelfSos(found.victimType === 'self');
          // Browser tidak mengizinkan suara tanpa sentuhan, jadi sirene menunggu tombol "Bunyikan lagi".
          setIsMuted(true);
        }
      })
      .catch((err) => console.error('Gagal memeriksa SOS aktif:', err))
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [profile.id]);

  useEffect(() => {
    if (!emergencyId) return;

    const unsubscribe = subscribeEmergency(
      emergencyId,
      (data) => {
        setEmergencyDoc(data);
        if (!data || !ACTIVE_EMERGENCY_STATUSES.includes(data.status)) {
          sirenRef.current?.stop();
          sirenRef.current = null;
        }
      },
      (err) => {
        console.error('Gagal memantau status darurat:', err);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [emergencyId]);

  useEffect(() => {
    if (!emergencyId || isCompleted || !isSelfSos) return;

    let wakeLock = null;

    async function requestWakeLock() {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
        } catch {
          // Abaikan jika tidak didukung
        }
      }
    }

    requestWakeLock();

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [emergencyId, isCompleted, isSelfSos]);

  useEffect(() => {
    if (!emergencyId || isCompleted || !isSelfSos) return;

    function handleBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [emergencyId, isCompleted, isSelfSos]);

  function handleToggleSound() {
    if (isCompleted || !isSelfSos) return;
    if (!sirenRef.current) {
      // SOS hasil pemulihan setelah refresh: sirene baru dibuat saat tombol disentuh.
      const siren = createSirenController();
      sirenRef.current = siren;
      siren.start();
      setIsMuted(false);
      return;
    }
    if (isMuted) {
      sirenRef.current.unmute();
      setIsMuted(false);
    } else {
      sirenRef.current.mute();
      setIsMuted(true);
    }
  }

  async function handleSendSelf() {
    setError('');
    setLoading(true);
    setIsSelfSos(true);

    const siren = createSirenController();
    sirenRef.current = siren;
    siren.start();
    setIsMuted(false);

    try {
      const location = await getCurrentLocation();

      const res = await createEmergency({
        reporter: profile,
        victimType: 'self',
        location,
        source: aiState?.source || 'sos',
        description: aiState?.description || '',
        aiSummary: aiState?.aiSummary || '',
      });

      setEmergencyId(res.id);
      setMerged(Boolean(res.merged));
    } catch (err) {
      siren.stop();
      setError('Gagal mengirim sinyal darurat: ' + (err.message || 'Terjadi kesalahan sistem.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOther({
    victimType,
    victim,
    locationDetail,
    description,
    ambulanceRequested,
  }) {
    setError('');
    setLoading(true);
    setIsSelfSos(false);

    try {
      const location = await getCurrentLocation();

      const res = await createEmergency({
        reporter: profile,
        victimType,
        victim,
        location,
        locationDetail,
        description,
        ambulanceRequested,
        source: 'sos',
      });

      setEmergencyId(res.id);
      setMerged(Boolean(res.merged));
    } catch (err) {
      setError('Gagal mengirim sinyal darurat: ' + (err.message || 'Terjadi kesalahan sistem.'));
    } finally {
      setLoading(false);
    }
  }

  if (emergencyId) {
    return (
      <>
        <Title
          title="Sinyal Darurat Aktif"
          desc="Permintaan bantuan darurat telah dikirimkan ke petugas UKESMAS."
        />
        <ActiveSos
          emergencyDoc={emergencyDoc}
          merged={merged}
          isMuted={isMuted}
          withSiren={isSelfSos}
          onToggleSound={handleToggleSound}
        />
      </>
    );
  }

  return (
    <>
      <Title
        title="SOS Darurat"
        desc="Kirim permintaan bantuan darurat secepatnya ke petugas UKESMAS."
      />

      <div className="sos-container">
        {aiState?.source === 'ai' && (
          <div className="sos-ai-notice">
            <Bot size={20} style={{ flexShrink: 0 }} />
            <div>
              <b>Rujukan Darurat dari Konsultasi AI:</b>
              <p style={{ margin: '4px 0 0' }}>
                {aiState.aiSummary || aiState.description || 'Keluhanmu terdeteksi butuh penanganan segera.'}
              </p>
            </div>
          </div>
        )}

        <div className="sos-mode-selector">
          <button
            type="button"
            className={`sos-mode-btn ${mode === 'self' ? 'active' : ''}`}
            onClick={() => {
              setMode('self');
              setError('');
            }}
          >
            <User size={16} />
            Untuk diri sendiri
          </button>
          <button
            type="button"
            className={`sos-mode-btn ${mode === 'other' ? 'active' : ''}`}
            onClick={() => {
              setMode('other');
              setError('');
            }}
          >
            <Users size={16} />
            Untuk orang lain
          </button>
        </div>

        {error && (
          <div className="sos-error-box">
            <AlertCircle size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {error}
          </div>
        )}

        {mode === 'self' ? (
          <div className="sos-self-card">
            <p className="sos-self-desc">
              Tekan tombol di bawah untuk membunyikan sirene darurat dan langsung mengirimkan sinyal
              serta lokasi GPS kamu ke petugas UKESMAS.
            </p>

            <button
              type="button"
              className="sos-giant-btn"
              onClick={handleSendSelf}
              disabled={loading || checking}
              aria-label="Kirim SOS Darurat Sekarang"
            >
              <Siren size={54} />
              <span>{loading ? 'MENGIRIM...' : checking ? 'MEMERIKSA...' : 'KIRIM SOS'}</span>
              <span className="sos-giant-sub">Sentuh Sekali</span>
            </button>
          </div>
        ) : (
          <OtherPersonForm onSubmit={handleSendOther} loading={loading || checking} />
        )}
      </div>
    </>
  );
}
