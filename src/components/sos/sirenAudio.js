export function createSirenController() {
  let audioCtx = null;
  let carrier = null;
  let modulator = null;
  let modGain = null;
  let masterGain = null;
  let vibrateInterval = null;
  let isMuted = false;

  function startVibrate() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([500, 250, 500, 250]);
        if (!vibrateInterval) {
          vibrateInterval = setInterval(() => {
            if (!isMuted) {
              navigator.vibrate([500, 250, 500, 250]);
            }
          }, 1500);
        }
      } catch {
        // Abaikan jika getaran diblokir
      }
    }
  }

  function stopVibrate() {
    if (vibrateInterval) {
      clearInterval(vibrateInterval);
      vibrateInterval = null;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {
        // Abaikan
      }
    }
  }

  function start() {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        carrier = audioCtx.createOscillator();
        carrier.type = 'sawtooth';
        carrier.frequency.setValueAtTime(950, audioCtx.currentTime);

        modulator = audioCtx.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.setValueAtTime(1.2, audioCtx.currentTime);

        modGain = audioCtx.createGain();
        modGain.gain.setValueAtTime(250, audioCtx.currentTime);

        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.3, audioCtx.currentTime);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        carrier.connect(masterGain);
        masterGain.connect(audioCtx.destination);

        carrier.start();
        modulator.start();
      }
    } catch (err) {
      console.warn('Audio sirene tidak dapat dimulai:', err);
    }

    startVibrate();
  }

  function mute() {
    isMuted = true;
    if (masterGain && audioCtx) {
      try {
        masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
      } catch {
        // Abaikan
      }
    }
    stopVibrate();
  }

  function unmute() {
    isMuted = false;
    if (masterGain && audioCtx) {
      try {
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        masterGain.gain.setTargetAtTime(0.3, audioCtx.currentTime, 0.05);
      } catch {
        // Abaikan
      }
    }
    startVibrate();
  }

  function stop() {
    mute();
    stopVibrate();
    try {
      if (carrier) {
        carrier.stop();
        carrier.disconnect();
      }
      if (modulator) {
        modulator.stop();
        modulator.disconnect();
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    } catch {
      // Abaikan
    }
    carrier = null;
    modulator = null;
    masterGain = null;
    modGain = null;
    audioCtx = null;
  }

  return {
    start,
    mute,
    unmute,
    stop,
    getIsMuted: () => isMuted,
  };
}

