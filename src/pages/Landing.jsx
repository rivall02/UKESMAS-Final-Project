import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  CalendarDays,
  ClipboardList,
  BookHeart,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const goLogin = () => navigate('/login');
  const goRegister = () => navigate('/register');

  return (
    <div className="landing">
      <header className="landnav">
        <div className="brand">
          <i><HeartPulse /></i>
          <b>UKESMAS<small>UNIVERSITAS KLABAT</small></b>
        </div>
        <nav>
          <a href="#about">Tentang</a>
          <a href="#services">Layanan</a>
          <a href="#benefits">Manfaat</a>
        </nav>
        <div>
          <button className="textbutton" onClick={goLogin}>Masuk</button>
          <button className="primary" onClick={goRegister}>
            Daftar sekarang <ArrowUpRight size={15} />
          </button>
        </div>
      </header>

      <section className="landhero">
        <div>
          <small className="eyebrow">✦ STUDENT HEALTH & WELLNESS PLATFORM</small>
          <h1>Sehat, nyaman,<br />dan <em>siap berprestasi.</em></h1>
          <p>
            UKESMAS hadir untuk membantu mahasiswa Universitas Klabat menjaga
            kesehatan dengan akses layanan kampus yang lebih mudah, praktis, dan
            terintegrasi.
          </p>
          <button className="primary" onClick={goRegister}>
            Mulai sekarang <ArrowUpRight size={16} />
          </button>
          <button
            className="textbutton"
            onClick={() =>
              document.getElementById('services').scrollIntoView({ behavior: 'smooth' })
            }
          >
            Jelajahi layanan
          </button>
          <div className="trust">
            <span><ShieldCheck /> Layanan untuk mahasiswa</span>
            <span><HeartPulse /> Student wellness care</span>
          </div>
        </div>
        <div className="landart">
          <div className="orbit" />
          <div className="bigheart"><HeartPulse size={100} /></div>
          <span>♡ care for yourself</span>
          <b>✿</b>
        </div>
      </section>

      <section className="about" id="about">
        <div>
          <small className="eyebrow">KENALI UKESMAS</small>
          <h2>Perhatian kecil untuk<br /><em>kesehatan yang berarti.</em></h2>
        </div>
        <p>
          UKESMAS merupakan konsep platform layanan kesehatan mahasiswa
          Universitas Klabat. Satu tempat untuk mendapatkan informasi kesehatan,
          mengatur konsultasi, dan memantau riwayat layanan kesehatan.
        </p>
      </section>

      <section className="services" id="services">
        <small className="eyebrow">OUR SERVICES</small>
        <h2>Layanan yang mendukungmu ♡</h2>
        <div className="servicegrid">
          {[
            [CalendarDays, 'Janji Temu', 'Atur jadwal konsultasi kesehatan dengan lebih mudah.'],
            [ClipboardList, 'Rekam Medis', 'Lihat ringkasan riwayat pemeriksaan.'],
            [Sparkles, 'Konsultasi AI', 'Dapatkan informasi awal dan edukasi kesehatan.'],
            [BookHeart, 'Edukasi Kesehatan', 'Tips menjaga kesehatan fisik dan mental.'],
          ].map(([Icon, t, d]) => (
            <article key={t}>
              <Icon />
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta" id="benefits">
        <div>
          <small className="eyebrow">YOUR WELLNESS JOURNEY STARTS HERE</small>
          <h2>Jadikan kesehatan bagian<br />dari perjalanan kuliahmu.</h2>
          <p>Mulai kenali layanan UKESMAS dan rawat dirimu hari ini.</p>
        </div>
        <button className="white" onClick={goRegister}>
          Bergabung dengan UKESMAS <ArrowUpRight size={15} />
        </button>
      </section>

      <footer className="landfoot">
        UKESMAS ♡ <span>Universitas Klabat · Student Health & Wellness</span>
        <span>© 2026 UKESMAS Prototype</span>
      </footer>
    </div>
  );
}
