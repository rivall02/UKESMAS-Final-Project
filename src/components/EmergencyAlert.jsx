import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, Check, ExternalLink, MapPin, Volume2, X } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { STATUS, mapsPointUrl } from '../constants';
import { subscribeActiveEmergencies, setEmergencyStatus } from '../services/emergencyStaff';
import '../styles/emergency.css';

const VICTIM_LABELS = {
  self: 'Diri sendiri',
  student: 'Mahasiswa lain',
  external: 'Bukan mahasiswa',
};

export default function EmergencyAlert() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => new Set());
  const [audioRunning, setAudioRunning] = useState(false);

  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const notifiedIdsRef = useRef(new Set());
  const originalTitleRef = useRef(document.title);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    return audioCtxRef.current;
  }, []);

  // Monitor AudioContext state and attach one-time unlock listener if previously enabled
  useEffect(() => {
    const ctx = getAudioContext();
    if (!ctx) return;

    setAudioRunning(ctx.state === 'running');

    const handleStateChange = () => {
      setAudioRunning(ctx.state === 'running');
    };
    ctx.addEventListener('statechange', handleStateChange);

    const isSoundStored = () => {
      try {
        return sessionStorage.getItem('ukesmas_alarm_sound') === 'enabled';
      } catch {
        return false;
      }
    };

    let removeUnlock = null;
    if (ctx.state !== 'running' && isSoundStored()) {
      const unlock = async () => {
        try {
          if (ctx.state !== 'running') {
            await ctx.resume();
          }
        } catch (err) {
          console.warn('Gagal resume AudioContext:', err);
        }
      };

      const opts = { once: true, passive: true };
      document.addEventListener('pointerdown', unlock, opts);
      document.addEventListener('keydown', unlock, opts);

      removeUnlock = () => {
        document.removeEventListener('pointerdown', unlock);
        document.removeEventListener('keydown', unlock);
      };
    }

    return () => {
      ctx.removeEventListener('statechange', handleStateChange);
      if (removeUnlock) removeUnlock();
    };
  }, [getAudioContext]);

  const stopAlarmSound = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch {
        // Safe disconnect
      }
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.disconnect();
      } catch {
        // Safe disconnect
      }
      gainNodeRef.current = null;
    }
  }, []);

  const startAlarmSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx || ctx.state !== 'running') return;
      if (alarmIntervalRef.current) return;

      const playBeep = () => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(580, ctx.currentTime + 0.3);

          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        } catch {
          // Ignore Web Audio execution errors
        }
      };

      playBeep();
      alarmIntervalRef.current = setInterval(playBeep, 800);
    } catch {
      // Audio autoplay policy catch
    }
  }, [getAudioContext]);

  // Subscribe to real-time active emergencies
  useEffect(() => {
    const unsubscribe = subscribeActiveEmergencies(
      (list) => {
        setActiveEmergencies(list);
      },
      (err) => console.error('Gagal berlangganan darurat:', err),
    );
    return () => {
      unsubscribe();
      stopAlarmSound();
    };
  }, [stopAlarmSound]);

  // Filter urgent items that have not been dismissed
  const visibleUrgentItems = activeEmergencies.filter(
    (item) => item.status === STATUS.URGENT && !dismissedIds.has(item.id),
  );

  const hasUrgent = visibleUrgentItems.length > 0;

  // Manage alarm sound based on presence of urgent alerts and audioRunning
  useEffect(() => {
    if (hasUrgent && audioRunning) {
      startAlarmSound();
    } else {
      stopAlarmSound();
    }
    return () => stopAlarmSound();
  }, [hasUrgent, audioRunning, startAlarmSound, stopAlarmSound]);

  // Handle document.hidden, title blinking and desktop Notification
  useEffect(() => {
    const originalTitle = originalTitleRef.current;
    let titleTimer = null;

    const handleVisibilityChange = () => {
      if (document.hidden && hasUrgent) {
        let isFlashing = false;
        titleTimer = setInterval(() => {
          document.title = isFlashing ? '🚨 DARURAT — UKESMAS' : originalTitle;
          isFlashing = !isFlashing;
        }, 1000);

        // Show Desktop Notification once per emergency ID if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          visibleUrgentItems.forEach((item) => {
            if (!notifiedIdsRef.current.has(item.id)) {
              notifiedIdsRef.current.add(item.id);
              try {
                new Notification('🚨 Peringatan Darurat UKESMAS', {
                  body: `${item.studentName || 'Pasien'} membutuhkan bantuan di ${item.locationDetail || 'kampus'}.`,
                });
              } catch {
                // Ignore notification constructor errors
              }
            }
          });
        }
      } else {
        if (titleTimer) clearInterval(titleTimer);
        document.title = originalTitle;
      }
    };

    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (titleTimer) clearInterval(titleTimer);
      document.title = originalTitle;
    };
  }, [hasUrgent, visibleUrgentItems]);

  // Enable alarm sound button click
  async function handleEnableSound() {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state !== 'running') {
        await ctx.resume();
      }
      try {
        sessionStorage.setItem('ukesmas_alarm_sound', 'enabled');
      } catch {
        // Safe sessionStorage catch
      }

      // Request browser notification permission if not yet decided
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch (err) {
      console.warn('Gagal mengaktifkan suara alarm:', err);
    }
  }

  function handleDismiss(id) {
    setDismissedIds((prev) => new Set([...prev, id]));
  }

  async function handleTakeAction(emergency) {
    try {
      await setEmergencyStatus(emergency, STATUS.DITANGANI, profile);
      handleDismiss(emergency.id);
    } catch (err) {
      console.error('Gagal menangani darurat:', err);
      alert('Gagal memperbarui status: ' + err.message);
    }
  }

  function handleViewDetails(id) {
    handleDismiss(id);
    navigate('/appointments');
  }

  return (
    <>
      {/* Autoplay sound activation pill: show whenever AudioContext is not running */}
      {!audioRunning && (
        <div className="emg-sound-bar">
          <Volume2 size={16} />
          <span>Suara alarm belum aktif</span>
          <button type="button" className="emg-sound-btn" onClick={handleEnableSound}>
            <Bell size={12} /> Aktifkan suara alarm
          </button>
        </div>
      )}

      {/* Emergency Overlay Popup */}
      {hasUrgent && (
        <div className="emg-overlay" role="dialog" aria-modal="true">
          <div className="emg-modal">
            <div className="emg-modal-header">
              <div className="emg-pulse-icon">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3>PANGGILAN DARURAT MASUK!</h3>
                <small>Ada {visibleUrgentItems.length} mahasiswa memerlukan bantuan segera</small>
              </div>
            </div>

            <div className="emg-modal-body">
              {visibleUrgentItems.map((item) => (
                <div className="emg-item-card" key={item.id}>
                  <div className="emg-patient-row">
                    <span className="emg-patient-name">{item.studentName || 'Pasien Anonim'}</span>
                    <span className="emg-badge-victim">
                      {VICTIM_LABELS[item.victimType] || item.victimType || 'Mahasiswa'}
                    </span>
                    {item.ambulanceRequested && (
                      <span className="emg-badge-ambulance">
                        <AlertTriangle size={12} /> Minta ambulans
                      </span>
                    )}
                  </div>

                  <div className="emg-detail-row">
                    <MapPin size={14} />
                    <span>
                      {item.locationDetail || item.location?.text || 'Lokasi tidak disertakan'}
                      {item.location?.lat && (
                        <a
                          href={mapsPointUrl(item.location)}
                          target="_blank"
                          rel="noreferrer"
                          className="emg-maps-link"
                        >
                          Buka Maps <ExternalLink size={10} />
                        </a>
                      )}
                    </span>
                  </div>

                  <div className="emg-detail-row">
                    <span>
                      Jam: <strong>{item.time || '-'} WITA</strong> · {item.date || ''}
                    </span>
                  </div>

                  {(item.emergencyNote || item.aiSummary) && (
                    <div className="emg-note-box">
                      {item.emergencyNote || item.aiSummary}
                    </div>
                  )}

                  <div className="emg-actions">
                    <button
                      className="emg-btn-handle"
                      onClick={() => handleTakeAction(item)}
                    >
                      <Check size={14} /> Tangani
                    </button>
                    <button
                      className="emg-btn-view"
                      onClick={() => handleViewDetails(item.id)}
                    >
                      Lihat
                    </button>
                    <button
                      className="emg-btn-close"
                      onClick={() => handleDismiss(item.id)}
                    >
                      <X size={14} /> Tutup
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
