import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Siren, User, Users, AlertCircle, Bot } from 'lucide-react';
import Title from '../components/Title';
import { useAuth } from '../contexts/auth';
import { STATUS } from '../constants';
import {
  createEmergency,
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

  const sirenRef = useRef(null);

  const isCompleted = emergencyDoc?.status === STATUS.SELESAI;

  useEffect(() => {
    return () => {
      sirenRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!emergencyId) return;

    const unsubscribe = subscribeEmergency(
      emergencyId,
      (data) => {
        setEmergencyDoc(data);
        if (data?.status === STATUS.SELESAI) {
          sirenRef.current?.stop();
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
    if (!emergencyId || isCompleted) return;

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
  }, [emergencyId, isCompleted]);

  useEffect(() => {
    if (!emergencyId || isCompleted) return;

    function handleBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [emergencyId, isCompleted]);

  function handleToggleSound() {
    if (!sirenRef.current) return;
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

    const siren = createSirenController();
    sirenRef.current = siren;
    siren.start();
    setIsMuted(false);

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
      siren.stop();
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
              disabled={loading}
              aria-label="Kirim SOS Darurat Sekarang"
            >
              <Siren size={54} />
              <span>{loading ? 'MENGIRIM...' : 'KIRIM SOS'}</span>
              <span className="sos-giant-sub">Sentuh Sekali</span>
            </button>
          </div>
        ) : (
          <OtherPersonForm onSubmit={handleSendOther} loading={loading} />
        )}
      </div>
    </>
  );
}
