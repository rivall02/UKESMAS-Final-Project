import React, { useState } from 'react';
import { Sparkles, ShieldCheck, CheckCircle2, Loader } from 'lucide-react';
import { askGemini } from '../services/gemini';
import Title from '../components/Title';
import Modal from '../components/Modal';

export default function AIConsultation() {
  const [symptom, setSymptom] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!symptom.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
      const response = await askGemini(symptom);
      setAnswer(response);
    } catch (err) {
      console.error('Gemini error:', err);
      setAnswer(
        'Maaf, saat ini asisten AI sedang tidak tersedia. ' +
          'Silakan coba lagi nanti atau buat janji temu langsung dengan petugas UKESMAS.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Title
        title="Konsultasi AI ✦"
        desc="Asisten edukasi untuk informasi awal seputar kesehatan mahasiswa."
      />
      <div className="ai panel">
        <div className="aihead">
          <Sparkles />
          <div>
            <b>UKESMAS Health Buddy</b>
            <small>Asisten informasi kesehatan · Powered by Gemini AI</small>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Apa yang sedang kamu rasakan?</label>
          <textarea
            rows="5"
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            placeholder="Contoh: Saya merasa pusing sejak pagi..."
          />
          <small className="privacy">
            <ShieldCheck size={14} /> Hindari memasukkan data pribadi atau identitas sensitif.
          </small>
          <button className="primary" disabled={loading || !symptom.trim()}>
            {loading ? (
              <><Loader size={15} className="spin" /> Sedang memproses...</>
            ) : (
              <><Sparkles size={15} /> Dapatkan informasi awal</>
            )}
          </button>
        </form>

        {answer && (
          <div className="answer">
            <b>
              <CheckCircle2 /> Informasi awal untukmu
            </b>
            <div className="answer-text">{answer}</div>
            <aside>
              Ini bukan diagnosis medis. Jika gejala berat atau darurat, segera cari pertolongan
              medis.
            </aside>
            <button className="outline" onClick={() => setBooking(true)}>
              Buat janji dengan petugas UKESMAS
            </button>
          </div>
        )}

        <div className="suggestions">
          <b>Topik yang bisa ditanyakan</b>
          {[
            'Tips menjaga pola tidur',
            'Cara mengelola stres kuliah',
            'Pola makan sehat mahasiswa',
            'Kapan perlu konsultasi?',
          ].map((x) => (
            <button key={x} onClick={() => setSymptom(x)}>
              {x} →
            </button>
          ))}
        </div>
      </div>

      {booking && (
        <Modal title="Janji temu segera" close={() => setBooking(false)}>
          <p>Silakan gunakan menu Janji Temu untuk membuat jadwal konsultasi dengan petugas UKESMAS.</p>
        </Modal>
      )}
    </>
  );
}
