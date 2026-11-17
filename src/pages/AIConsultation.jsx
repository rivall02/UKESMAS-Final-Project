import React, { useState } from 'react';
import { Sparkles, ShieldCheck, CheckCircle2, Loader, AlertTriangle, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { askAI } from '../services/ai';
import { createAppointment } from '../services/firestore';
import Title from '../components/Title';
import Modal from '../components/Modal';

export default function AIConsultation() {
  const { profile } = useAuth();
  const [symptom, setSymptom] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [urgentSent, setUrgentSent] = useState(false);
  const [location, setLocation] = useState('');
  const [sendingUrgent, setSendingUrgent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!symptom.trim()) return;
    setLoading(true);
    setAnswer(null);
    setUrgentSent(false);
    try {
      const response = await askAI(symptom);
      setAnswer(response);
    } catch (err) {
      console.error('AI error:', err);
      setAnswer({
        text: 'Maaf, saat ini asisten AI sedang tidak tersedia. Silakan coba lagi nanti atau buat janji temu langsung dengan petugas UKESMAS.',
        urgency: 'LOW',
        isUrgent: false,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUrgentAppointment(e) {
    e.preventDefault();
    if (!location.trim()) return;
    setSendingUrgent(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
      await createAppointment({
        userId: profile.id,
        studentName: profile.name || '',
        nim: profile.nim || '',
        service: 'Konsultasi Darurat',
        date: today,
        time: now,
        note: `[URGENT] Keluhan: ${symptom}\nLokasi: ${location}`,
        status: 'Urgent',
        priority: 'urgent',
        location,
        aiSummary: answer?.text?.slice(0, 200) || '',
      });
      setUrgentSent(true);
    } catch (err) {
      console.error('Gagal mengirim urgent:', err);
      alert('Gagal mengirim permintaan darurat: ' + err.message);
    } finally {
      setSendingUrgent(false);
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
            <small>Asisten informasi kesehatan · Powered by GPT-OSS</small>
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

        {answer && answer.isUrgent && !urgentSent && (
          <div className="urgent-alert">
            <div className="urgent-header">
              <AlertTriangle size={20} />
              <div>
                <b>Kondisi Darurat Terdeteksi</b>
                <small>AI mendeteksi bahwa kamu memerlukan penanganan segera.</small>
              </div>
            </div>
            <div className="answer-text">{answer.text}</div>
            <form className="urgent-form" onSubmit={handleUrgentAppointment}>
              <label>
                <MapPin size={14} /> Di mana lokasi kamu sekarang?
                <input
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Asrama Putra Lantai 2, Kamar 204"
                />
              </label>
              <button className="urgent-btn" disabled={sendingUrgent}>
                <AlertTriangle size={14} />
                {sendingUrgent ? 'Mengirim...' : 'Kirim Permintaan Darurat ke UKESMAS'}
              </button>
            </form>
            <aside>
              Jika ini keadaan darurat yang mengancam jiwa, segera hubungi 119 atau minta bantuan orang di sekitarmu.
            </aside>
          </div>
        )}

        {answer && answer.isUrgent && urgentSent && (
          <div className="urgent-sent">
            <CheckCircle2 size={20} />
            <div>
              <b>Permintaan darurat telah dikirim!</b>
              <p>Tim UKESMAS telah menerima notifikasi dan akan segera menuju ke lokasimu. Tetap tenang dan tunggu bantuan.</p>
            </div>
          </div>
        )}

        {answer && !answer.isUrgent && (
          <div className="answer">
            <b>
              <CheckCircle2 /> Informasi awal untukmu
            </b>
            <div className="answer-text">{answer.text}</div>
            <aside>
              Ini bukan diagnosis medis. Jika gejala berat atau darurat, segera cari pertolongan medis.
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
        <Modal title="Janji temu" close={() => setBooking(false)}>
          <p>Silakan gunakan menu Janji Temu untuk membuat jadwal konsultasi dengan petugas UKESMAS.</p>
        </Modal>
      )}
    </>
  );
}
